/**
 * LotLink — Marketplace Lead Submit Helper
 *
 * One function, used by every form on lotlinkin.com (inventory inquiry,
 * concierge, contact, financing, dealer partnership):
 *
 *   window.LotLinkLead.submit(leadType, formEl, opts)
 *
 * Behaviour:
 *   1. POST form data as JSON to the BDC API at
 *      `${window.LOTLINK_API_BASE}/api/public-leads/<leadType>`.
 *      If that succeeds (2xx), resolve with { ok:true, via:'api' }.
 *   2. If the API call fails (network error, timeout, non-2xx, CORS),
 *      fall back to the legacy Formspree endpoint so a lead is never
 *      dropped. Resolve with { ok:true, via:'formspree' }.
 *   3. If BOTH fail, reject so the page can show a "call us" error.
 *
 * The API is the primary path because it lands the lead directly in
 * the BDC — Jordan and the dealership inbox see it immediately.
 * Formspree is the bridge until DNS/SSL on app.lotlinkin.com settles.
 */

(function (window) {
  'use strict';

  // Allow the page to override. Defaults to the BDC's production domain.
  // If you're testing against localhost, set:
  //   <script>window.LOTLINK_API_BASE = 'http://localhost:3000';</script>
  // BEFORE this file loads.
  //
  // TEMPORARY: pointing directly at Railway's default host until the
  // app.lotlinkin.com CNAME propagates and Railway issues the SSL cert.
  // Flip back to 'https://app.lotlinkin.com' once DNS resolves.
  var DEFAULT_API_BASE = 'https://lotlink-api-production.up.railway.app';
  var FORMSPREE_URL = 'https://formspree.io/f/xgonwnea';
  var API_TIMEOUT_MS = 6000;

  var VALID_TYPES = {
    inquiry: 'inquiry',
    concierge: 'concierge',
    financing: 'financing',
    contact: 'inquiry', // the generic contact.html form routes through the inquiry endpoint
    dealer_partnership: 'dealer-partnership',
    demo_call: 'demo-call', // "Have Jordan call you" live voice demo (places a real call)
    demo_sms: 'demo-text',  // "Get a text from Jordan" live SMS demo (sends a real text)
  };

  /** Collect a form's fields into a plain JSON object. */
  function formToObject(formEl) {
    var obj = {};
    if (!formEl || typeof formEl.elements === 'undefined') return obj;
    var fd = new FormData(formEl);
    fd.forEach(function (val, key) {
      // Checkbox unchecked => field absent. Convert 'on' → true for consent.
      if (val === 'on') obj[key] = true;
      else if (obj[key] !== undefined) {
        // Repeated key — keep as array.
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(val);
      } else {
        obj[key] = val;
      }
    });
    // Attach page URL for audit context.
    obj._page_url = window.location.href;
    return obj;
  }

  /** Fetch with a timeout. */
  function fetchWithTimeout(url, opts, timeoutMs) {
    if (typeof AbortController === 'undefined') {
      // Older browsers: no timeout, just fire.
      return window.fetch(url, opts);
    }
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, timeoutMs);
    return window.fetch(url, Object.assign({}, opts, { signal: ctrl.signal }))
      .finally(function () { clearTimeout(t); });
  }

  /** Primary path — POST JSON to lotlink-api. */
  function submitToApi(leadType, payload) {
    var base = (window.LOTLINK_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
    var path = VALID_TYPES[leadType];
    if (!path) return Promise.reject(new Error('invalid_lead_type'));
    var url = base + '/api/public-leads/' + path;
    return fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    }, API_TIMEOUT_MS).then(function (res) {
      if (!res.ok) throw new Error('api_status_' + res.status);
      return res.json().catch(function () { return {}; });
    });
  }

  /** Fallback path — POST form-encoded to Formspree so no lead is dropped. */
  function submitToFormspree(formEl) {
    return window.fetch(FORMSPREE_URL, {
      method: 'POST',
      body: new FormData(formEl),
      headers: { 'Accept': 'application/json' },
    }).then(function (res) {
      if (!res.ok) throw new Error('formspree_status_' + res.status);
      return res.json().catch(function () { return {}; });
    });
  }

  /**
   * Main entry point. Tries the API first, then Formspree.
   * Resolves with { ok:true, via:'api'|'formspree' } on success.
   * Rejects with the second failure if both paths fail.
   */
  function submit(leadType, formEl) {
    if (!VALID_TYPES[leadType]) {
      return Promise.reject(new Error('invalid_lead_type:' + leadType));
    }
    if (!formEl) {
      return Promise.reject(new Error('form_required'));
    }
    var payload = formToObject(formEl);
    return submitToApi(leadType, payload)
      .then(function () { return { ok: true, via: 'api' }; })
      .catch(function (apiErr) {
        // API path failed — try Formspree so the lead isn't lost.
        try { console.warn('[LotLinkLead] API path failed, falling back to Formspree:', apiErr && apiErr.message); } catch (_) {}
        return submitToFormspree(formEl)
          .then(function () { return { ok: true, via: 'formspree' }; });
      });
  }

  window.LotLinkLead = {
    submit: submit,
    // exposed for rare cases (e.g. if a page only wants Formspree):
    _submitToApi: submitToApi,
    _submitToFormspree: submitToFormspree,
    _formToObject: formToObject,
  };
})(window);
