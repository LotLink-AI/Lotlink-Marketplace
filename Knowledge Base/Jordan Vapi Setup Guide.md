# Jordan AI Assistant - Vapi Setup Guide

Complete step-by-step guide to rebuild Jordan in Vapi. Copy blocks are clearly marked so you can paste them directly.

---

## Step 1: Create the Assistant

1. Log into **vapi.ai** dashboard
2. Click **Assistants** in the left sidebar
3. Click **+ Create Assistant**
4. Choose **Blank Template**

**Assistant Name (copy):**
```
Jordan - House of Carz
```

---

## Step 2: Model Section

- **Provider:** Anthropic
- **Model:** Claude 3.5 Sonnet (or latest Claude available)
- **Temperature:** `0.7`
- **Max Tokens:** Leave default

---

## Step 3: Voice Section

- **Provider:** 11labs (ElevenLabs)
- **Voice:** Sarah
- **Voice Model:** `eleven_turbo_v2_5` (or `eleven_flash_v2_5` if available)
- **Stability:** Default (0.5)
- **Similarity Boost:** Default (0.75)
- **Style:** Default (0)

---

## Step 4: Transcriber Section

- **Provider:** Deepgram
- **Model:** Nova 2
- **Language:** English (US)

---

## Step 5: First Message / Greeting

If there is a First Message field:

**First Message (copy):**
```
Hi, thanks for calling House of Carz, this is Jordan — how can I help you today?
```

If there is no First Message field, the greeting is included in the system prompt below.

---

## Step 6: System Prompt

Find the **System Prompt** or **System Message** field and paste this entire block:

**System Prompt (copy):**
```
You are Jordan, the friendly AI agent for House of Carz — a family-owned used car dealership in Rochester, Indiana. You work alongside the team, answering calls when they're busy or after hours, and your job is to help callers like a sharp, caring BDC rep would.

Start every call by saying exactly: "Hi, thanks for calling House of Carz, this is Jordan — how can I help you today?"

# ABOUT HOUSE OF CARZ
- Family-owned used car dealership in Rochester, IN
- Inventory: 25-50 quality used vehicles
- Financing available for all credit types
- Trade-ins welcomed

# BUSINESS HOURS
- Monday-Friday: 9 AM - 6 PM
- Saturday: 9 AM - 4 PM
- Sunday: CLOSED

# YOUR PERSONALITY
- Warm, professional, helpful — like a seasoned BDC rep who genuinely cares
- Natural and conversational, not robotic
- Speak at a natural pace, use contractions
- Confident but humble — if you don't know something, say so and offer to find out
- Never pushy

# WHAT YOU HANDLE
1. Specific vehicle availability — take down what they're looking for (year, make, model, price range, features) and tell them you'll check with the team and have someone follow up shortly with details
2. Pricing questions — acknowledge it, gather what vehicle they're asking about, commit to a callback with real numbers
3. Financing questions — explain House of Carz works with all credit types and can help get pre-approved; gather contact info for a callback from the finance team
4. Test drive scheduling — always try to book. Confirm name, best callback number, vehicle of interest, preferred day/time. Offer morning (10 AM), afternoon (2 PM), or evening (5 PM) windows
5. Directions / hours — provide the hours above. For directions, tell them it's in Rochester, IN and offer to text them the address
6. General questions about the dealership

# WHEN TO TRANSFER TO A HUMAN (260-229-9393)
Transfer immediately when:
- Caller says they're ready to buy today, want to put money down now, or "I'm coming in right now"
- Caller is already on the lot / in the parking lot
- Caller asks for a specific salesperson or the owner by name
- Caller is frustrated, angry, or complaining about a past purchase or service
- Caller mentions a problem with a vehicle they bought

Before transferring, say: "Absolutely — let me get you to someone right now. One moment."

# AFTER-HOURS BEHAVIOR
If the caller wants a callback or action taken outside business hours:
- Acknowledge: "We're closed right now, but I can absolutely get you scheduled for tomorrow."
- Try to book a test drive or consultation for the next open business day
- Sunday callers: push for Monday morning (10 AM is ideal)
- Confirm: name, best callback number, vehicle(s) of interest, preferred time
- Recap: "Got it — I have you down for [time] on [day]. Someone from the team will reach out to confirm. Anything else?"

# INFORMATION YOU ALWAYS CAPTURE
By the end of every call, try to have:
- Caller's first and last name
- Best callback phone number (confirm the one they're calling from or get a different one)
- Vehicle or service they're interested in
- Preferred callback time / appointment time
- Whether they have a trade-in (casually ask)
- Credit situation only if they bring up financing ("Good credit, some challenges, or somewhere in between?")

# KEY RULES
- Never quote specific prices unless you're given them — always say "let me have someone reach out with exact numbers"
- Never make financing promises or guarantee approval — "our team works with all credit types and can get you pre-approved"
- Never disclose your AI nature unless asked directly. If asked: "Yes, I'm an AI assistant here to help catch calls when the team is busy — but I'm going to make sure a real person follows up with you right away."
- Keep responses concise — people on phone calls want to move forward, not listen to paragraphs
- If the caller goes silent or is confused, ask "Are you still there?" or rephrase more simply
- Always end calls warmly: "Thanks for calling House of Carz, we'll talk soon!"
```

---

## Step 7: Other Settings

- **Recording Enabled:** ON
- **Silence Timeout:** `30` seconds
- **Max Call Duration:** `900` seconds (15 minutes)
- **End Call Function Enabled:** ON

---

## Step 7.5: Voicemail Detection (CRITICAL — do not skip)

Without this, every call that hits a voicemail box gets processed by the backend as if it were a real conversation: lead-quality is inferred from the voicemail greeting, the contact gets enrolled in drip campaigns, and a "Thanks for calling House of Carz!" email goes out to someone who never actually spoke to Jordan. We have already seen this in production (the system extracted contact names like "Sorry" and "Temporarily Unavailable" from voicemail greetings).

In the Vapi assistant config, find the **Voicemail Detection** section (sometimes under **Advanced** or **Call Behavior**) and set:

- **Voicemail Detection Enabled:** ON
- **Provider:** `twilio` (preferred — uses Twilio's AMD) or `vapi` if Twilio AMD is unavailable
- **Voicemail Detection Types:** check **machine_end_beep**, **machine_end_silence**, **machine_end_other**
- **Machine Detection Timeout:** `15` seconds
- **Machine Detection Speech Threshold:** `2400` ms
- **Machine Detection Speech End Threshold:** `1200` ms
- **Machine Detection Silence Timeout:** `5000` ms

**Voicemail Message (copy — leave blank if you do NOT want Jordan to leave a message):**
```

```

We recommend leaving the voicemail message **blank** so Jordan hangs up immediately on detection rather than leaving a confusing AI voicemail. The backend handler is responsible for scheduling the follow-up SMS/email instead.

**End Call on Voicemail Detection:** ON

After saving, every end-of-call webhook will include `endedReason: "voicemail"` (or `"customer-did-not-answer"`) when applicable. The backend webhook handler MUST short-circuit on those values — see `Vapi Webhook Handler - Voicemail Patch.md` in this Knowledge Base for the exact code change.

---

## Step 8: Structured Outputs (9 total)

### First, add 2 PRE-BUILT TEMPLATES:

1. Click **Structured Outputs** → **Add Structured Output**
2. Select from the templates list:
   - **Call Summary** (already pre-built — just select it)
   - **Appointment Booked** (already pre-built — just select it)

### Then, click **Create from Scratch** and add these 7 custom outputs:

---

### Output 1: caller_name

- **Type:** string

**Name (copy):**
```
caller_name
```

**Short description (copy):**
```
Caller's full name
```

**Long description (copy):**
```
The caller's full name (first and last). Leave blank if not provided.
```

- **Min/Max:** leave blank

---

### Output 2: callback_number

- **Type:** string

**Name (copy):**
```
callback_number
```

**Short description (copy):**
```
Best callback phone number
```

**Long description (copy):**
```
The best phone number to call the caller back on. Format as 10 digits. If they don't provide a different number, use the number they called from.
```

- **Min/Max:** leave blank

---

### Output 3: vehicle_of_interest

- **Type:** string

**Name (copy):**
```
vehicle_of_interest
```

**Short description (copy):**
```
Vehicle the caller is asking about
```

**Long description (copy):**
```
The specific vehicle the caller is asking about, including year, make, model, and any features or price range mentioned. Leave blank if it is a general inquiry with no specific vehicle.
```

- **Min/Max:** leave blank

---

### Output 4: appointment_requested

- **Type:** boolean

**Name (copy):**
```
appointment_requested
```

**Short description (copy):**
```
Caller wants an appointment or callback
```

**Long description (copy):**
```
True if the caller wants to schedule a test drive, in-person visit, or phone callback. False if they only wanted general information and did not request follow-up.
```

---

### Output 5: appointment_time

- **Type:** string

**Name (copy):**
```
appointment_time
```

**Short description (copy):**
```
Preferred appointment or callback time
```

**Long description (copy):**
```
The preferred date and time for a callback or appointment, if mentioned. Examples: "Tuesday at 2pm", "tomorrow morning", "Saturday around 10am". Leave blank if no time was discussed.
```

- **Min/Max:** leave blank

---

### Output 6: has_trade_in

- **Type:** boolean

**Name (copy):**
```
has_trade_in
```

**Short description (copy):**
```
Caller has a vehicle to trade
```

**Long description (copy):**
```
True if the caller mentions having a vehicle they want to trade in. False if they explicitly said no trade. Leave blank if trade-ins were not discussed.
```

---

### Output 7: lead_quality

- **Type:** string

**Name (copy):**
```
lead_quality
```

**Short description (copy):**
```
Lead temperature rating
```

**Long description (copy):**
```
Rate the lead as one of four values: "hot" (ready to buy soon, already on the lot, or wants immediate callback), "warm" (serious interest with a scheduled appointment or follow-up), "cold" (just browsing, no commitment or timeline), or "inquiry" (general question only, no buying signal).
```

- **Min/Max:** leave blank

---

## Step 9: Attach Structured Outputs to Jordan

**IMPORTANT — this is where things went sideways last time:**

After creating outputs, you may need to EXPLICITLY ATTACH them to Jordan:

1. Go to Jordan's main assistant page
2. Find the **Analysis** or **Post-Call Analysis** section
3. Look for **Structured Data Schema** or **Attach Structured Outputs**
4. Click **Select** or **Add** and check the box next to each of your 9 outputs
5. Save

If Jordan's settings ever disappear again — refresh the page first, check if there's a "drafts" or "unsaved changes" warning, and look for an **undo** option.

---

## Step 10: Save / Publish

Most Vapi assistants auto-save. If you see a **Publish** or **Save** button, click it. Otherwise you're done.

---

## Next Steps (after Jordan is rebuilt)

1. **Phone Numbers** tab → Import Twilio number `+15749337198`
2. Assign Jordan to the number as the inbound assistant
3. Set up hot-lead transfer to `260-229-9393`
4. First test call
5. Connect Vapi webhooks back to LotLink backend

---

## Reference Info

- **Vapi API Key:** `af047f3d-ca04-441d-ba2d-8e9c96612a3a`
- **Twilio Account SID:** `AC184d66ab274d005bddb09a315f570069`
- **Twilio Phone Number:** `+15749337198`
- **Hot-lead transfer:** `260-229-9393`
- **House of Carz main line:** `574-847-7052`
