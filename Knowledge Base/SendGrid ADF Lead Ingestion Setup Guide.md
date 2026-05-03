# SendGrid ADF Lead Ingestion — Setup Guide

Complete step-by-step guide to route every inbound lead (CarGurus, AutoTrader, Cars.com, Facebook, Google Ads, dealer website forms) into LotLink automatically, regardless of which CRM the dealership uses.

**Why this matters:** Every major lead provider speaks the same language — ADF/XML delivered by email. One inbox per dealership, one parser, one workflow. No per-CRM integration ever needed.

---

## How it works (plain English)

1. A shopper fills out a form on CarGurus (or any lead site).
2. CarGurus emails a formatted "ADF/XML" lead to the dealership's lead inbox — e.g. `leads-houseofcarz@lotlinkin.com`.
3. SendGrid receives that email and forwards it to LotLink's API.
4. LotLink parses the XML, creates the contact, kicks off Jordan's instant text/call follow-up, and forwards the original email to the dealer's ProMax/VinSolutions/eLeads inbox so the old workflow keeps working.

You only set this up **once per dealership**. It takes about 15 minutes.

---

## Step 1: Add MX records at GoDaddy (one time)

You need to tell the world that mail for `lotlinkin.com` should go to SendGrid.

1. Log into **godaddy.com**
2. Go to **My Products** → **Domains** → **lotlinkin.com** → **Manage DNS**
3. Under the **DNS Records** section, click **Add New Record**

**Add these two MX records:**

| Type | Name  | Value            | Priority | TTL    |
|------|-------|------------------|----------|--------|
| MX   | @     | mx.sendgrid.net  | 10       | 1 Hour |

> **Important:** If you already have Google Workspace MX records on the root domain (`@`), do NOT delete them — Google mail for `john@lotlinkin.com` needs those. Instead, use a subdomain like `leads.lotlinkin.com` (see Step 1b below).

### Step 1b (RECOMMENDED) — Use a subdomain so Google Workspace keeps working

This is the path you should take since `john@lotlinkin.com` already runs through Google Workspace.

Add ONE MX record:

| Type | Name   | Value            | Priority | TTL    |
|------|--------|------------------|----------|--------|
| MX   | leads  | mx.sendgrid.net  | 10       | 1 Hour |

That tells the world: "any email to `anything@leads.lotlinkin.com` goes to SendGrid."

Dealership inboxes become `leads-houseofcarz@leads.lotlinkin.com`, `leads-bobsmotors@leads.lotlinkin.com`, etc.

4. Click **Save**.

DNS propagation usually takes 5–30 minutes. You can check with:
```
dig MX leads.lotlinkin.com
```

---

## Step 2: Configure SendGrid Inbound Parse

1. Log into **sendgrid.com**
2. Click **Settings** (gear icon, bottom left) → **Inbound Parse**
3. Click **Add Host & URL**

**Fill in:**

- **Receiving Domain:** `leads.lotlinkin.com`
- **Destination URL (copy):**
  ```
  https://lotlink-api-production.up.railway.app/webhooks/sendgrid/adf-lead
  ```
- **Check:** ✅ **POST the raw, full MIME message** — leave UNCHECKED
- **Check:** ✅ **Check incoming emails for spam** — leave UNCHECKED (optional — lead emails occasionally get flagged)

4. Click **Add**.

That's it. SendGrid will now forward every email sent to `*@leads.lotlinkin.com` to LotLink.

---

## Step 3: Set up the dealership in LotLink

For each dealership, you need to record two things in the `dealerships` table:

- `adf_lead_email` — the LotLink inbox this dealership will use.
- `crm_forward_email` — the dealer's existing CRM intake email (ProMax, eLeads, VinSolutions).

**For House of Carz:**

- `adf_lead_email` = `leads-houseofcarz@leads.lotlinkin.com`
- `crm_forward_email` = whatever ProMax inbox the dealership currently uses (ask John)

You can set these either through the admin UI (once it's built) or with a one-time SQL update:

```sql
UPDATE dealerships
SET adf_lead_email = 'leads-houseofcarz@leads.lotlinkin.com',
    crm_forward_email = 'houseofcarz@promaxleads.com'
WHERE slug = 'houseofcarz';
```

---

## Step 4: Point lead sources at the new inbox

This is the part the dealership itself has to do. For each lead source they use, log into that provider and change the "email leads to" address.

**CarGurus:**
Dealer Dashboard → Account Settings → Lead Delivery → replace old email with `leads-houseofcarz@leads.lotlinkin.com`.

**AutoTrader:**
Admin → Lead Management → Email Delivery → update address.

**Cars.com:**
Dealer Admin → Lead Settings → update email.

**Facebook Marketplace:**
Commerce Manager → Lead Ads settings → change lead email delivery.

**Dealer website forms:**
Have the website vendor update the "form submits to" email.

**Google Ads lead forms:**
Google Ads → Lead form extension → Webhook/Email delivery → update email.

> **Important:** Don't tell the dealership to *remove* their current CRM's email — LotLink will automatically forward a copy to that inbox so nothing changes for them day-to-day.

---

## Step 5: Test it

1. From any email account, send a test email to `leads-houseofcarz@leads.lotlinkin.com` with this in the body (copy/paste):

```xml
<?adf version="1.0"?>
<adf>
  <prospect>
    <requestdate>2026-04-18T10:30:00-05:00</requestdate>
    <vehicle interest="buy" status="used">
      <year>2024</year>
      <make>Chevrolet</make>
      <model>Tahoe</model>
      <vin>1GNSKCKC7RR123456</vin>
    </vehicle>
    <customer>
      <contact>
        <name part="first">Test</name>
        <name part="last">Lead</name>
        <email>test+lotlink@example.com</email>
        <phone type="voice">(555) 123-4567</phone>
      </contact>
      <comments>This is a test lead from LotLink setup.</comments>
    </customer>
    <provider>
      <name part="full">CarGurus</name>
    </provider>
  </prospect>
</adf>
```

2. Within ~30 seconds, you should see:
   - A new contact in the LotLink dashboard named "Test Lead"
   - Jordan's new-lead SMS has fired (or at least shows queued in campaigns)
   - An email has hit the dealer's `crm_forward_email` with the original ADF

3. Check Railway logs for any `[ADF]` lines. Healthy output looks like:
   ```
   [ADF] Inbound lead email | from=test@example.com to=leads-houseofcarz@leads.lotlinkin.com
   [ADF] Created new contact 137 (CarGurus)
   [ADF] Forwarded ADF to CRM (houseofcarz@promaxleads.com)
   [ADF] Lead ingested in 420ms — contact=137 source=CarGurus
   ```

---

## Troubleshooting

**"No dealership matches to=..."**
The `adf_lead_email` in the `dealerships` table doesn't match what CarGurus is sending. Check case and typos. The lookup also falls back to matching `leads-{slug}@...` patterns, so a dealership with `slug = 'houseofcarz'` will match any inbox shaped `leads-houseofcarz@...` automatically.

**"No `<adf>` element found"**
The lead source isn't actually sending ADF XML (some cheaper providers send plain text). In that case, either ask the provider to enable ADF delivery (they all support it) or add a plain-text parser as a fallback.

**Jordan didn't text the lead**
Check Railway logs for `[ADF] Campaign enroll failed`. Usually means the new-lead campaign isn't activated for that dealership, or the contact has no phone number.

**CRM forward didn't arrive**
Check the dealer's spam folder first. If still missing, verify `dealerships.crm_forward_email` is set and that `SENDGRID_FROM_EMAIL` env var is a verified sender in SendGrid.

---

## What the dealer sees

**Nothing changes for them visually.** Leads still land in their ProMax/eLeads/VinSolutions inbox exactly like before. LotLink just fires faster than they can react, so by the time they open the lead in their CRM, Jordan has already texted the customer and booked them for a test drive.

That's the pitch.

---

*Setup guide written: April 18, 2026*
