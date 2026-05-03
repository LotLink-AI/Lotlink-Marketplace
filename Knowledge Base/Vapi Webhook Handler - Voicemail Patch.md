# Vapi Webhook Handler — Voicemail Detection Patch

**Status:** Required fix. As of 2026-04-30 production logs, the webhook handler is treating voicemail-bound outbound calls as real conversations. Symptoms: 9–30s call durations, `[VAPI] Name recovered from transcript: "Sorry"` / `"Temporarily Unavailable"`, and follow-up emails going out to people who never spoke to Jordan.

**Companion doc:** `Jordan Vapi Setup Guide.md` Step 7.5 must be completed first so Vapi actually labels these calls as voicemail.

---

## What to change

In the backend service handling `POST /webhooks/vapi` — specifically the branch that runs on `event === "end-of-call-report"` — add an early return when the call ended in voicemail or no-answer.

Search the codebase for the log line that exists today:

```
[VAPI] end-of-call outbound — from: ...
```

That log statement marks the function we need to patch. The current flow runs:

1. Log `end-of-call outbound`
2. Try to recover a contact name from the transcript
3. Infer lead quality from transcript
4. Log the call to the DB
5. Schedule a follow-up SMS (`[FOLLOW-UP] Scheduled inventory_no_transfer …`)
6. Schedule a follow-up email (`[EMAIL-FOLLOWUP] Scheduled …`)
7. Enroll the contact in the `Post-Call Interest` drip

Steps 2–7 must all be skipped when the call hit voicemail.

---

## The patch (Node/TypeScript — adapt to your stack)

Insert this block immediately after the `[VAPI] end-of-call outbound` log line and before any name-recovery / lead-quality / follow-up logic:

```ts
// ---- Voicemail / no-answer short-circuit -------------------------------
// Vapi reports endedReason on the call object in end-of-call-report.
// Treat any non-conversation outcome as a non-event for follow-up purposes.
const endedReason: string = (
  payload?.message?.call?.endedReason ??
  payload?.call?.endedReason ??
  ""
).toLowerCase();

const VOICEMAIL_OR_NO_ANSWER = new Set([
  "voicemail",
  "customer-did-not-answer",
  "customer-busy",
  "no-answer",
  "twilio-failed-to-connect-call",
  "pipeline-error-twilio-failed-to-connect-call",
  "assistant-ended-call-after-message-spoken",  // common when Vapi hangs up on detected machine
]);

// Belt-and-suspenders: also treat very short outbound calls with no human
// turns in the transcript as voicemail. This catches cases where Vapi did
// NOT label endedReason but the call clearly never connected to a person.
const durationSec: number = Number(payload?.message?.call?.duration ?? 0);
const transcript: string = (payload?.message?.transcript ?? "").toString();
const userTurnCount = (transcript.match(/^\s*user:/gim) ?? []).length;
const looksLikeVoicemail =
  durationSec > 0 && durationSec < 12 && userTurnCount <= 1;

if (VOICEMAIL_OR_NO_ANSWER.has(endedReason) || looksLikeVoicemail) {
  logger.info(
    `[VAPI] Skipping post-call pipeline — endedReason="${endedReason}", ` +
    `duration=${durationSec}s, userTurns=${userTurnCount} (voicemail/no-answer)`
  );

  // Still log the call to the DB so it shows in the dashboard, but mark it
  // as voicemail and DO NOT infer lead quality, schedule follow-ups, or
  // enroll in drips.
  await logCall({
    callId: payload?.message?.call?.id,
    dealershipId,
    durationSec,
    leadQuality: "voicemail",
    outcome: "voicemail",
    endedReason,
  });

  return res.status(200).json({ ok: true, skipped: "voicemail" });
}
// -------------------------------------------------------------------------
```

---

## Name-recovery guard (defense in depth)

Even with the above in place, harden the name-recovery step so it never overwrites a real contact name with a voicemail phrase. Find the block that emits:

```
[VAPI] Name recovered from transcript: ...
```

and add this filter just before the recovered name is stored or compared:

```ts
const VOICEMAIL_PHRASES = [
  "sorry",
  "temporarily unavailable",
  "the person you",
  "the number you",
  "leave a message",
  "after the tone",
  "after the beep",
  "voicemail box",
  "is not available",
  "please record",
  "google voice",
  "google subscriber",
  "verizon",
  "at&t",
  "t-mobile subscriber",
];

const lowered = recoveredName.trim().toLowerCase();
const isVoicemailPhrase = VOICEMAIL_PHRASES.some((p) => lowered.includes(p));

if (isVoicemailPhrase) {
  logger.info(
    `[VAPI] Ignoring transcript-recovered name "${recoveredName}" — matches voicemail phrase`
  );
  // do not call setContactName / do not log "recovered name"
  return;
}
```

This is what would have caught the `"Sorry"` and `"Temporarily Unavailable"` cases in the existing logs.

---

## Backfill cleanup (one-time)

After deploying, unenroll the contacts that were incorrectly added to drip campaigns from voicemail-only calls. From the 2026-04-30 logs:

| Contact ID | Phone | Issue |
|---|---|---|
| `d40db814-ad5d-4511-a38b-2ce49bf07f25` | +17652022314 (Brady) | 9s call, voicemail; enrolled in Post-Call Interest |
| `0acd2891-0f7b-42ba-9cdd-0ad48a0826f5` | +15742052037 (April) | 10s call, voicemail; enrolled in Post-Call Interest |
| `79ce4581-e008-44f4-8672-d82b4942730f` | +15742010217 (Madison) | 30s call, voicemail; enrolled in Post-Call Interest |
| `dcb15c4a-aa25-430d-96fd-87a0de6fdb83` | +12602299393 (test) | 11s + 29s test calls, voicemail; enrolled in Post-Call Interest |

SQL (adapt table/column names):

```sql
UPDATE drip_enrollments
   SET status = 'cancelled',
       cancelled_reason = 'voicemail_backfill_2026_04_30'
 WHERE contact_id IN (
   'd40db814-ad5d-4511-a38b-2ce49bf07f25',
   '0acd2891-0f7b-42ba-9cdd-0ad48a0826f5',
   '79ce4581-e008-44f4-8672-d82b4942730f',
   'dcb15c4a-aa25-430d-96fd-87a0de6fdb83'
 )
   AND campaign_key = 'post_call_interest'
   AND status = 'active';

-- Also cancel any pending follow-up rows that haven't fired yet:
UPDATE follow_ups
   SET status = 'cancelled'
 WHERE contact_id IN (
   'd40db814-ad5d-4511-a38b-2ce49bf07f25',
   '0acd2891-0f7b-42ba-9cdd-0ad48a0826f5',
   '79ce4581-e008-44f4-8672-d82b4942730f',
   'dcb15c4a-aa25-430d-96fd-87a0de6fdb83'
 )
   AND status IN ('scheduled', 'pending');
```

---

## Verification

After deploying the patch, place a test call from a number that goes straight to voicemail. The logs should show:

```
[VAPI] end-of-call outbound — from: ...
[VAPI] Skipping post-call pipeline — endedReason="voicemail", duration=8s, userTurns=0 (voicemail/no-answer)
```

And you should NOT see any of:

- `[VAPI] Name recovered from transcript: ...`
- `[VAPI] Lead quality inferred from transcript: inquiry`
- `[FOLLOW-UP] Scheduled inventory_no_transfer ...`
- `[EMAIL-FOLLOWUP] Scheduled inventory_no_transfer email ...`
- `[DRIP] Enrolled contact ... in "Post-Call Interest"`
