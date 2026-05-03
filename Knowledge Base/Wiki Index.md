# LotLink AI BDC — Knowledge Base Wiki Index

This is the master index of all research and reference materials for the LotLink AI BDC project. Use this as a starting point to find any article, document, or reference we've accumulated.

**Last updated:** 2026-04-30

---

## 1. Foundational Research

### Industry Overview
- **AI BDC Industry Research - April 2026** (`AI BDC Industry Research - April 2026.md` / `.docx`)
  - Original industry scan from early April 2026.
  - Covers market size, key players, adoption trends.

### Article Summaries
- **Article Summaries - April 2026** (`Article Summaries - April 2026.md`)
  - Earlier round of article digests — BDC.AI playbook, Traver Connect, Lotlinx, etc.

---

## 2. Platform / Product Documentation

### Jordan (Vapi Voice Assistant)
- **Jordan Vapi Setup Guide** (`Jordan Vapi Setup Guide.md`)
  - How Jordan is configured, tool setup, phone/voice settings.
  - **Step 7.5 (Voicemail Detection)** is mandatory — without it, voicemail-bound calls get treated as real conversations.
- **Jordan - Vapi System Prompt** (`Jordan - Vapi System Prompt.txt`)
  - The actual system prompt powering Jordan's behavior.
- **Vapi Webhook Handler - Voicemail Patch** (`Vapi Webhook Handler - Voicemail Patch.md`)
  - Backend patch (endedReason short-circuit + name-recovery guard + backfill SQL). Apply alongside Setup Guide Step 7.5.

---

## 3. Competitive Research — April 18 2026 (NEW)

Located in: `Articles - April 18 2026/`

### Competitor Deep-Dives
1. **Best AI BDC Alternatives for Car Dealerships In 2026 (Virtual BDC)** — Roundup of Podium, Numa, Toma, STELLA pricing and features.
2. **Top 7 AI BDC Solutions (Numa)** — Numa's own competitive comparison.
3. **2026 Modern Dealership Communication Stack (Matador)** — Matador's omnichannel architecture + pricing tiers.
4. **Toma AI Operating System for Dealerships** — Voice-first AI with 100+ dealerships; a16z-backed.
5. **Year of Always-On Dealership (STELLA)** — STELLA's always-on thesis and Whisper Technology.
14. **Numa Missed Call Recovery Case Study** — Real dealer results: Riverdale CDJR, Ray Skillman Kia, Roush Honda.
15. **STELLA Catalyst Outbound Campaigns** — 36% outbound callback rate; outbound use cases.

### Industry Benchmarks & Metrics
6. **Speed to Lead Automotive 2026 (Flai)** — 5-min response = 900% more closes; 78% buy from first responder.
7. **12 BDC Metrics That Drive Revenue (Flai)** — ASR, show rate, close rate, CSI, missed call rate with benchmarks.

### Compliance & Legal
8. **2026 Guide to AI Compliance TCPA FCC (Apten)** — TCPA, one-to-one consent status, AI voice rules.
9. **A2P 10DLC Compliance 2026 (Apten)** — Registration requirements, throughput tiers, AI-specific rules.

### CRM Integration — The ADF/XML Path
10. **Google Ads Leads to Dealer CRM ADF XML (LeadSync)** — The standard every dealer CRM speaks.
11. **ADF XML Format Example (GitHub)** — Sample XML structure + implementation plan for LotLink.

### AI Safety & Guardrails
13. **Chevy for $1 Chatbot Incident (VentureBeat)** — The cautionary tale + required guardrails.

### Lower-Tier Competitors
12. **Best AI Chatbots for Car Dealerships 2026 (CARVID)** — Our closest price-point competitor ($199-$599).

---

## 4. LotLink Strategic Documents

- **LotLink-Deployment-Roadmap.docx** (in root `LOTLINK AI BDC DEPT/` folder) — 8-phase build plan agreed 2026-04-11.

---

## 5. Key Findings & Action Items (From April 18 2026 Research)

### Top 3 Improvements Identified
1. **Build ADF/XML email ingestion** — Makes us compatible with ALL dealer CRMs AND all major lead sources (CarGurus, AutoTrader, Facebook, Google Ads) via one parser. See Articles #10 and #11.
2. **Missed-call-to-text recovery** — 70% of voicemail callers call a competitor within 30 minutes. See Articles #6 and #14.
3. **AI guardrails / price-lock rules** — Prevent a "Chevy for $1" incident. See Article #13.

### Other High-Value Additions
4. Speed-to-lead timer + SLA dashboard (Article #6).
5. Web chat widget for dealer websites (Articles #3, #12).
6. Staff push/email alerts for hot leads.
7. CSI tracking module (Article #14 — Numa's key differentiator).
8. Tiered pricing: $299 Basic / $399-499 Pro (Articles #1, #12).
9. Full consent audit log for TCPA compliance (Articles #8, #9).
10. Unified inbox merging SMS/voice/email/voicemail (Article #3).

### Key Statistics Worth Memorizing for Pitches
- **76%** of U.S. dealerships are increasing AI budgets in 2026.
- **70%** of voicemail callers call a competitor within 30 minutes.
- **78%** of customers buy from the first dealer to respond.
- **50% more** closes with 15-minute response vs. slower.
- **900%** closing rate boost at sub-5-minute response.
- **$1M+/year** lost revenue from missed calls at avg dealership.
- **56-60%** of leads arrive after business hours.
- **36%** callback rate on AI outbound campaigns (STELLA benchmark).
- **$6.5M/year** potential recovery from missed service calls (Numa).
- **91%** of calls handled successfully by AI (STELLA benchmark).

### Pricing Competitive Landscape
| Platform | Entry Price | Pro/Enterprise | Notes |
|----------|-------------|----------------|-------|
| CARVID | $199/mo | $599/mo | SMS + web chat + voice |
| Podium | $399/mo | $2,000+/mo | Full suite, franchise focus |
| Matador | $300/mo | $1,000/mo | Unified inbox, franchise focus |
| Numa | Enterprise | Enterprise | 1,200+ dealers, service-focused |
| Toma | Enterprise | Enterprise | 100+ dealers, voice-focused |
| STELLA | Enterprise | Enterprise | Large franchise |
| **LotLink (current)** | **$799/mo** | — | Should tier to $299/$399 |
| **LotLink (proposed)** | **$299/mo Basic** | **$499/mo Pro** | Aligns with target segment |

---

## 6. How to Use This Wiki

- **Starting a sales conversation?** Review the "Key Statistics" section above.
- **Building a new feature?** Check the relevant article for benchmarks and competitor approaches.
- **Planning the roadmap?** The "Top 3 Improvements" section is current priority.
- **Compliance question?** See Articles #8 and #9.
- **Pricing discussion?** See the pricing table above.
- **AI safety question?** See Article #13.

## 7. Update Log

- **2026-04-30** — Added Step 7.5 (Voicemail Detection) to Jordan Vapi Setup Guide and new `Vapi Webhook Handler - Voicemail Patch.md`. Diagnosed from production logs: outbound voicemails were being treated as real conversations, scheduling unwanted follow-ups and extracting names like "Sorry" and "Temporarily Unavailable" from voicemail greetings.
- **2026-04-18** — Added "Articles - April 18 2026" folder with 15 new research articles. Created this index file.
- **2026-04-14** — Jordan Vapi Setup Guide added.
- **2026-04-13** — AI BDC Industry Research docx finalized.
- **2026-04-12** — Initial article summaries compiled.
