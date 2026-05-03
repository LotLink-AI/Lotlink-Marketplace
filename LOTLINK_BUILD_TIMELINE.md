# LotLink Build Timeline

**Apr 12 – Apr 21, 2026 · 108 commits · 10 days**

From an empty Express server to a live multi-tenant SaaS running real dealer traffic — here's how it came together, day by day. Dates reflect the commit history of the LotLink AI BDC repo.

---

## April 12 — Foundation (Day 1)

Initial commit of the LotLink AI BDC. Stood up the Express server, wired Postgres, got the live dashboard bundling with esbuild and serving from the same Node process. Pinned React 18 / Recharts 2 / Lucide 0.383 to stop version drift. First-day deploy fights with Node 18 vs. 20, `uuid` vs. `crypto.randomUUID`, and DATABASE_URL handling in production.

## April 13 — Compliance groundwork

Privacy Policy and Terms pages went live (prerequisites for A2P 10DLC filings). First SMS reliability pass — Claude API retry, sentiment crash fix, reminder column drift.

## April 14 — Jordan gets a voice

Vapi webhook integration for inbound voice calls. First day a customer could actually talk to Jordan through a phone number.

## April 15 — Inventory + voice tools

Inventory scraper landed, using `sitemap.xml` to discover all vehicle detail pages with a strict dealer-CDN photo allow-list. Voice tools added — `check-hours`, `take-message`, and a fuzzy-matching `/api/inventory/search` that normalizes hyphens (F150 ↔ F-150) and handles make aliases (Dodge ↔ Ram). Post-call SMS follow-up service and a stale-lead sweeper.

## April 16 — The commercial platform, built in a single day

The largest single day in the project. Dealer portal with JWT login, contacts, team management, admin controls, and self-service onboarding. Stripe billing at $799/mo with checkout, webhooks, and customer portal. Auto-running migrations on boot. Campaign engine for automated outbound calls, SMS, and email. ProMax lead import that pulled 219 House of Carz leads on first run. Real-time analytics dashboard. Vapi outbound calling endpoints.

## April 17 — A2P & outbound script

A2P 10DLC compliance: SMS consent capture, HELP keyword handling, privacy updates. Outbound call overrides so Jordan speaks a proper outgoing script instead of his inbound opener. Admin tools — password reset, dealership delete, cross-dealership user move.

## April 18 — The ingestion and rescue layer

ADF/XML lead ingestion covering CarGurus, AutoTrader, Facebook, Google Ads, and website forms. Missed-call-to-text recovery (industry data: 30–40% callback conversion lift). Speed-to-Lead SLA tile on the portal overview. Embeddable web chat widget. AI guardrails to block unsafe replies before they're sent. Staff alerts via SMS + email on hot leads and appointment requests. Unified Inbox — one screen for every contact's full history across SMS, email, voice, and web chat. ProMax CRM integration via email.

## April 19 — Marketplace ↔ BDC hook-up

`lotlinkin.com` marketplace lead forms started posting directly into the BDC. Unified Inbox tab plus public endpoints exposed for the dashboard. Jordan started auto-replying to first-touch leads. Email infrastructure migrated from `lotlink.ai` to `lotlinkin.com` (SendGrid domain auth + Google Workspace on the same domain, no DKIM conflict).

## April 20 — Polish and monetization

Appointments tab shipped with filter pills (Needs Confirm / Upcoming / Today / Past / All). Inbox sort toggle added (Recent Activity vs. New Leads First) with a NEW pill. Campaigns page overhauled — safe bulk enroll, auto-enroll of marketplace leads, and a beta test-enroll feature so you can fire any campaign against just your own phone. Dashboard polish across Team, Contacts, Overview, and Billing pages. Vapi outbound calls started carrying real lead context (inventory + contact summary). Tier + pricing implementation plan committed: plan column, entitlements map, `requireFeature` middleware, lead quota service, and `/api/me` exposing plan + usage. Multiple Vapi 400 / 500 fixes around overrides and the Campaign detail modal. Stopped overwriting contact names from AI call analysis.

## April 21 — Context + oversight

Vehicle-of-interest now flows from the marketplace all the way into Jordan's outbound call prompt. He opens with *"I'm following up about the 2019 Silverado you were looking at…"* instead of a generic greeting, and the vehicle is shown as a chip wherever the contact appears on the dashboard. Conversations tab launched — a dealer-facing feed of every message Jordan has sent, with filter chips (All / SMS / Email / Calls / Web) and an Open Thread shortcut so dealers can catch hallucinations or misquoted inventory and step in. Appointments notes cell is now expandable with a View Conversation button that jumps into the customer's full thread.

---

## Where it stands today

Ten days ago this was an Express server with a hello-world dashboard. Today it is:

A live multi-tenant SaaS with inbound and outbound voice, SMS, email, web chat, and marketplace ingestion. Appointment system. Campaign engine. Unified inbox with reply composer. Dealer-facing oversight feed. Inventory scraping. Stripe billing with tier-enforcement plumbing. A2P 10DLC compliance. Staff alerts. One running customer — House of Carz — with 219 real leads imported and active AI follow-up.

The platform is positioned for the next phase: a second paying dealership, A2P campaign approval, and the pricing tiers ($499 / $999 / $1,999+) going live.
