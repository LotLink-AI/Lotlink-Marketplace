# LotLink — Context Handoff

This doc is a handoff from a prior Cowork conversation. Paste it into a new conversation where both the LotLink website folder AND the BDC AI folder are mounted. The goal of the next conversation is for Claude to review both projects side by side and propose an integration plan.

---

## Who the user is

**John Roberts** — founder of **LotLink Indiana**, an auto brokerage serving Northern Indiana. Based in Rochester, IN. Phone 260-229-9393, email john@lotlinkin.com. Indiana-licensed auto broker (license # still pending, currently shows "PENDING" in the site footer).

## The two projects

### 1. LotLink Indiana (the marketplace website) — `LOTLINK_SITE_FINAL/`

A static HTML/CSS/JS site deployed via Netlify. Purpose: post inventory from multiple Northern Indiana dealerships, sell those vehicles to LotLink customers, offer a concierge buying service. Charges dealers to list, charges buyers a concierge fee.

**Pages:** `index.html` (home + search), `inventory.html` (50-vehicle grid with filters + modal inquiry), `vehicle.html` (dynamic detail page reading `?stock=XXXX`), `dealers.html` (dealer partnership pitch + FAQ), `concierge.html` ($299 concierge sell page + booking form), `contact.html` (contact + financing interest form + About John block), `privacy.html`, `terms.html`.

**Shared assets:** `assets/site.js` (mobile nav handler), `assets/inventory.js` (single source of truth — window.LOTLINK_INVENTORY array of 50 vehicles), `assets/favicon.svg`, `style.css`, `robots.txt`, `sitemap.xml`.

**Images:** `images/*.webp` (41 vehicle photos, converted from JPEG — 78% size reduction).

**Form backend:** Formspree endpoint `xgonwnea` for every form.

**What was just completed in the prior conversation** (all 12 tasks done):
1. Fixed copyright years and nav inconsistencies
2. Created shared site.js for mobile nav
3. Fixed home→inventory search URL param handoff
4. Added Indiana broker license disclosure to every footer
5. Created privacy.html and terms.html
6. Hardened the credit application (removed DOB, full address, SSN-collection risk — now a "financing interest" inquiry that routes to a secure lender portal)
7. Created vehicle.html detail page template with dynamic JSON-LD schema
8. Added SEO basics (robots.txt, sitemap.xml, Open Graph meta, AutoDealer + Vehicle JSON-LD)
9. Accessibility pass (skip-links, `<main id="main">`, aria-hidden on decorative icons, focus trap in modal, proper button element on dealer FAQ)
10. Added favicon, SMS `sms:+12602299393` links, "About John" trust block on contact page
11. Optimized inventory images (JPEG → WebP at 640px, quality 82)
12. Verification pass — all pages consistent, all internal links work

**Launch-gating items not yet done** (outside code):
- Real Indiana dealer/broker license number to replace "PENDING" in the `license-placeholder` spans across all pages
- `assets/og-default.jpg` social-share image (currently referenced but doesn't exist)
- Real photo of John to replace the "JR" initials avatar on contact.html

### 2. BDC AI — the other project (in a separate folder)

This is the user's other product. He described it as a "BDC AI" — in the auto-dealer world a BDC is the Business Development Center (inbound lead response, appointment setting, follow-up). **Claude has not yet reviewed this folder.** Folder name appears to be `LOTLINK AI BDC DEPT` or similar based on what John saw in the Cowork UI.

## The strategic question John is asking

John wants to **combine LotLink (the marketplace) with the BDC AI into one product**. The prior conversation surfaced three business-model layers that fit on the same tech stack:

1. **LotLink-branded concierge** — the AI is invisible infrastructure; customers think they're getting exceptionally fast service from John.
2. **BDC-as-a-service for partner dealers** — every dealer listing on LotLink can turn on AI lead response for their own website too (monthly fee or per-engaged-lead).
3. **Standalone white-label BDC** — sold to dealers who aren't on LotLink, with the marketplace as the entry point to the relationship.

The strategic case: a standalone BDC AI competes against Impel, Gubagoo, CarNow, Podium, AutoLeap in a crowded field. A BDC AI bundled with a regional inventory marketplace ("list with us and every lead gets AI-worked instantly") is a differentiated offer no national competitor can match in Northern Indiana. It also makes the $299 concierge fee easier to deliver profitably because the AI does the repeatable portion of the work.

**Technical integration points** the next Claude should look for:
- Shared lead record — every inquiry from any surface (LotLink forms, BDC AI intake, dealer website widgets) lands in one system with vehicle/stock number attached
- Shared inventory context — BDC AI needs to know what's in stock to answer "is it still there?" and upsell similar units
- Unified conversation log per customer so John can pick up any thread mid-conversation
- Handoff rules — when the AI escalates to a human (hot buyers, financing edge cases, complaints, uncertainty)

## Related question John also raised: inventory ingestion

Separately, John asked whether LotLink could ingest inventory from any dealer site (scraping). Claude's recommendation was: **don't default to scraping.** The industry-standard path is inventory feeds (Dealer.com, DealerCenter, vAuto, HomeNet, etc. all auto-generate standard inventory exports — XML/JSON/CSV). Onboarded dealer partners should point their existing feed at a URL LotLink controls and LotLink polls every few hours. Scraping is a cold-start tool for pitching a dealer, not a permanent source. Paid aggregators (Marketcheck, HomeNet, iSeeCars) are an alternative shortcut.

The ingestion pipeline concept: poll a list of `feeds.json` every N hours → normalize into LotLink's `inventory.js` format (or a small JSON DB) → regenerate thumbnails → write back to the site.

## What John wants from the next conversation

Review both folders (LotLink + BDC AI) side by side and return a **specific integration plan** — not a generic one. Before diving deep, questions worth asking John up front:

- What channels does the BDC AI currently work on (SMS, email, voice, chat widget)?
- Is it already deployed with any real dealers, or still pre-launch?
- What's the tech stack (own build, or Twilio + OpenAI + something)?
- Is it multi-tenant already, or single-tenant?
- Does he want one merged product on one domain, or two products sharing a backend?

After review, come back with:
1. Where the two codebases naturally meet (shared data model, webhook contracts)
2. A recommended ordering (what to wire together first, what to leave alone)
3. An opinion on whether to merge under one brand or keep two brands with a shared backend
4. What to build vs. buy (e.g., should the BDC AI stay custom, or does bundling with a vendor like Twilio make sense for speed?)

## Style/collaboration notes

- John is direct and strategic — he's moving fast and appreciates concrete, opinionated recommendations over "here are five options, you decide"
- Keep prose natural; avoid heavy bulleted formatting unless it's essential
- Share files via `computer://` links when producing deliverables
- The workspace output folder is the LotLink folder itself when work applies to that project
