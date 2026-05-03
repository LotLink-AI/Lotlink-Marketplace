# LotLink Readiness Audit — 2026-04-22

Straight read: **the engine is good; the ops and legal wrapper aren't.** Architecture is sound (clean multi-tenancy, real Stripe + entitlements plumbing, working pilot). What separates you from a sellable SaaS is roughly three weeks of work plus one trip to a lawyer. Details below, sorted by severity, verified against the actual code.

---

## Verified up front

One of the audit agents claimed your `.env` (Twilio/SendGrid/Anthropic keys) was committed to git. **That is wrong.** I verified: `.env` is in `.gitignore` and `git ls-files` returns nothing. Your secrets are not exposed. Do not rotate keys on that basis.

Everything else below, I verified against the actual code before writing it down.

---

## CRITICAL — fix this week, before any sales outreach

### 1. Admin routes fall back to a hardcoded key
`src/routes/admin.js:27` and three places in `src/routes/onboarding.js` read the admin key as `process.env.ADMIN_KEY || 'lotlink-admin-2026'`. If Railway doesn't have `ADMIN_KEY` set — **or if it does but someone learns the fallback via your repo** — an attacker can `curl ?key=lotlink-admin-2026` and delete dealerships, move users, wipe data. Even if the env var is set, the string literally lives in your source code. Replace the fallback with a startup assertion: if `ADMIN_KEY` is missing, throw and refuse to boot.

### 2. JWT secret has an insecure default
`src/middleware/auth.js:6` — `const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'`. Same class of problem. If the env var is ever unset on Railway (misconfiguration, restart into a new service, etc.), anyone who can read your public GitHub can forge a valid JWT for any dealership. Replace with `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET required')`.

### 3. Stripe webhook skips signature verification when the secret isn't set
`src/routes/billing.js:168` — `if (webhookSecret) { event = stripe.webhooks.constructEvent(...) }`. When `STRIPE_WEBHOOK_SECRET` is absent, the code parses the body without verifying the signature. A bad actor can POST fake `invoice.payment_succeeded` events and mark themselves as paid, or fake `customer.subscription.deleted` and delete a paying dealer's access. Before flipping Stripe to production, either require the secret or — safer — refuse to process webhooks without it in production.

### 4. `/api/analytics/public/*` and `/api/inbox/public/*` are fully unauthenticated
Both route files expose `/public/dashboard`, `/public/calls`, `/public/reply`, `/public/missed-transfers`, and a few more. The only check is a `dealership_id` query param. Anyone who guesses or enumerates a dealership UUID can read the inbox, fire replies, pull call logs, see KPIs. You've tracked this as an open item for a while (see `project_open_items.md` #8) — it goes from "technical debt" to "full-stop blocker" the moment a second paying dealer is on the platform. A curious competitor paying $799/mo for their own dealership can brute-force UUIDs to read everyone else's inbox. Gate these behind `authenticate, tenantGuard` before dealer #2 onboards.

### 5. No per-endpoint rate limiting on cost-amplifying routes
Global limit is 200 req/min per IP (`src/server.js:78`). That's fine for typical abuse but does not protect you from: (a) scripted `POST /api/web-chat/message` to burn your Anthropic budget — 200 msgs/min × 60 min = 12K messages/hour × ~$0.003 each = ~$36/hour bleed per IP, trivially bypassed with IP rotation; (b) `/api/auth/login` brute-force (no per-user lockout). Add per-session limits on web-chat (e.g. 60 msgs/session/hour) and per-email limits on login (e.g. 10 attempts/15min). Redis makes this cleaner if you move beyond one dyno.

---

## HIGH — 30-day list, before second paying dealer

6. **Stripe is still in test mode.** Flip to live keys and do one real end-to-end transaction with your own card before sending an invoice. The webhook plumbing works, but has never processed real money.

7. **No error tracking anywhere.** Zero Sentry, Rollbar, Datadog. Right now Anthropic could 500 for an hour and you'd hear about it from John @ House of Carz. Sentry free tier, 30-minute install, single most leveraged thing you can do.

8. **No cron heartbeat / dead-man monitoring.** You have 8+ background workers (follow-ups, CRM sync, inventory scrape, scheduled callbacks, etc.). If one silently dies on process restart or a bad deploy, you find out when a dealer asks "why didn't my follow-ups send?" Add a `cron_heartbeats` table and a `/api/health/crons` check.

9. **No automated tests.** `package.json` has `"test": "echo 'Error: no test specified' && exit 1"`. At minimum: Stripe webhook signature verification, Twilio SMS inbound → conversation creation, auth tenantGuard (no cross-tenant read). These are the three paths where a silent regression = a legal incident.

10. **Trial expiration degrades silently.** When a dealer's trial ends and payment fails, `billing_status` becomes `past_due` but the API still serves every request. Free rides until you notice. Gate `requireFeature` on `billing_status ∈ {active, trialing}` and fire an email at day 11/13 of trial.

11. **TCPA opt-in is stored but not universally enforced.** `src/routes/sms.js` checks `opted_in_sms` on direct sends, but campaign enrollment in `campaignService.js` does not filter out opted-out contacts at dequeue time. Stop that before you send the first mass SMS for a real customer — TCPA penalties are $500–1500 per message, and the dealer will blame you.

12. **SendGrid is on Trial (100 emails/day).** Fine for pilot, immediately insufficient for dealer #2 + House of Carz. Upgrade before onboarding, not during.

13. **DNS for `app.lotlinkin.com` still not live.** Marketplace `lead-submit.js` hardcodes `lotlink-api-production.up.railway.app`. Looks amateur on dealer screens and makes future URL changes painful. Resolve the CNAME + SSL.

14. **No database backup SLA.** Railway does snapshots, but you don't have a documented retention, restore time, or verification that restores actually work. Set up a weekly `pg_dump` to S3/Backblaze as a belt-and-suspenders. Dealers will ask about this during procurement and you need a 30-second answer.

15. **Campaign + appointment writes aren't transactional.** Multi-step inserts can half-apply if Railway restarts mid-request. Wrap campaign enrollment and appointment booking in `db.transaction()`.

16. **Inventory scraper has no rate limiting / backoff.** If ProMax or a dealer's CMS flags you as a bot, that dealer loses inventory sync silently. Add random delays, rotating UA, and circuit-breaker on 429/403.

17. **Marketplace widget hardcodes House of Carz dealership ID.** Already tracked as open item #11 — before dealer #2, stand up a `LotLink Concierge` dealership and point the widget at it, so marketplace traffic doesn't pollute HoC's inbox.

18. **Call recording / AI disclosure missing from Privacy Policy.** Your `privacy.html` says you collect contact info but doesn't mention: (a) calls may be transcribed by third parties (Vapi/Anthropic), (b) chat messages are processed by Anthropic, (c) lenders receive pre-approval data. One lawsuit and you're defending against "I didn't consent to Anthropic seeing my data." Five-minute policy update, significant liability reduction.

---

## STRATEGIC — matters at 10+ dealers, not urgent at 2

Anthropic rate-limit queue (429 handling exists for retry but no token-bucket on ingress). Vapi per-dealership concurrency caps. pgvector-based inventory retrieval instead of stuffing all 500 cars into every system prompt. Distributed rate limiting (Redis). Proper observability stack. Automated Vapi assistant + Twilio number provisioning in onboarding. None of these will bite at 2 dealers; all of them will bite at 20.

---

## LLC + legal — what to actually do this week

You said "it's about time to LLC." It was time to LLC the day House of Carz paid you a dollar. Sequence:

1. **Form "LotLink Indiana LLC"** with the Indiana Secretary of State. Online filing, ~$100, about 10 minutes. Single-member LLC with default tax treatment (pass-through) is fine for now; elect S-corp once revenue > ~$60K/yr.
2. **EIN from the IRS** — free, online, issued same day.
3. **Business bank account** — Mercury, Relay, or your local bank. Critical for the corporate veil; co-mingling kills the LLC protection.
4. **Assign existing IP and the auto-broker license to the LLC** in writing. The license currently reads "PENDING" in your footer — call the Indiana Secretary of State's Auto Dealer Services division and get the path for transferring / re-issuing to the LLC. Operating an unlicensed brokerage is the single regulatory issue that could end the business on day one.
5. **E&O + cyber liability insurance.** Two separate policies, together ~$2–4K/yr for a $2M limit. You are transmitting PII, generating AI output on customers' behalf, and recording calls. The first dealer who gets a TCPA complaint will look at you. Hiscox, Coalition, or an Indiana commercial broker.
6. **Get a SaaS Master Services Agreement drafted** — not pulled off LegalZoom. Budget $1.5–3K for an Indiana business attorney to draft + review. Must include: SLA (start with 99% monthly uptime), data processing addendum, limitation of liability, indemnification (they indemnify you for TCPA violations caused by their lists), termination + data deletion, dispute resolution (arbitration in Fulton County IN). This is the document every future dealer will sign.
7. **Privacy policy update** covering AI/LLM processing (Anthropic, Vapi), call recording disclosure, lender data sharing.

None of this is optional. All of it is ~$3–5K and 2–3 weeks of calendar time, most of which runs in parallel with code fixes.

---

## What's actually good

Confidence calibration, because fear-setting a founder into paralysis doesn't help:

- **Multi-tenancy isolation is architecturally correct.** Every authenticated query scopes by `dealership_id` via `tenantGuard`. The `/public/*` gap is a specific, localized hole — not a symptom of a broken pattern.
- **Entitlements + Stripe + plan tiers are real code**, not a stub. Once Stripe goes live and the past-due gate is added, billing is production-quality.
- **Compliance scaffolding exists** — TCPA consent, opt-in/out fields, opted_in_sms_at timestamp, opt-out handling. Needs enforcement tightening, but the schema is there.
- **The aiEngine + Vapi + Twilio + SMS + web-chat integration is live and working** with real customers. Most early-stage SaaS is a landing page and an Airtable; you have actual plumbing.
- **Cost discipline is baked in.** You catch Anthropic errors, retry, degrade to human handoff. That's mature thinking for a one-person team.

---

## Bottom line

You are **3 weeks of focused work** from being safe to sell:

Week 1 — Fix the 5 criticals (admin key, JWT default, Stripe webhook gate, public route auth, rate limits). Flip Stripe to live. File the LLC. Get SendGrid upgraded. Start conversations with an Indiana business attorney and an insurance broker.

Week 2 — Error tracking (Sentry), cron heartbeats, trial expiration gating, TCPA campaign-send filter, basic test suite on the three critical paths, DNS for `app.lotlinkin.com`.

Week 3 — MSA + SLA + updated Privacy Policy in hand. Insurance in force. Dealer #2 demo video recorded. ProMax Phase 2 proven at HoC. Then start outreach.

You're not close to "this is a product I can sell." You're close to "this is a product I can sell **safely**." The engine works. Tighten the wrapper.
