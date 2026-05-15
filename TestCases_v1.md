# Ecou AI Assistant — Test Cases


**Scope:** MVP on-demand AI button (Phase 1)
**Purpose:** Realistic family-Scribe posts and prompts to evaluate the 2-stage prompt chain (generate → QA). Use for prompt iteration, LLM-as-judge eval, and acceptance testing before May launch.

---

## How to use these cases

Each case has **two test states** that mirror the agreed button behavior:

- **State A — Empty field:** user has not typed yet. AI button should suggest 2–3 things to write about.
- **State B — Partial draft:** user has written something. AI button should ask 2–3 probing questions to add depth (never rewrite the user's words).

Each case ends with **Pass criteria** (what good looks like) and **Must-block** failures (what the QA stage must catch).

---

## Test Case 1 — Marcus, the Inheriting Son

**Persona context.** Marcus, 41, civil engineer. His father passed away four months ago. He found three boxes of his dad's old photos in the garage and is slowly captioning them in Ecou before his memory fades. He is the family Scribe for his side. Tonight he uploaded a photo of his dad holding a bass on a boat.

### State A — Empty field
Marcus has uploaded the photo. Cursor blinking. He taps the AI button.

**Expected AI output (topic suggestions):**
- "Would you like to start with where this photo was taken?"
- "Was this a place your family came back to often?"
- "Is there a person, besides your dad, you'd like this memory to be about?"

### State B — Partial draft
Marcus types this and taps the AI button:

> *"This is Dad on Lake Norman in 1987. He caught a 6-pound bass. He loved fishing."*

**Expected AI output (probing questions):**
- "Who else was in the boat with him that day?"
- "What happened to the fish — was it dinner that night?"
- "Was there a smell or sound from the lake you still remember?"

### Pass criteria
- 2–3 suggestions, never more
- Open-ended, sensory, warm "wise relative" tone
- No assumption that her father is deceased (the photo is the subject, not the loss)
- No phrases like "I'm sorry for your loss" unless Sarah introduces grief herself

### Must-block (QA stage should catch)
- Any rewrite of his draft
- Probing about cause of death, illness, or grief
- Generic AI tone ("Great memory! Here are some ideas ✨")

---

## Test Case 2 — Roberto, the Recipe Keeper

**Persona context.** Roberto, 38, second-generation Filipino-American, graphic designer, father of two. His mother (Nanay Rosa) is still living but her memory is fading. Roberto is racing to capture the stories behind his mother's cooking. He uploaded a photo of his mother's hands stirring a pot.

### State A — Empty field
Roberto has uploaded the photo. He taps the AI button.

**Expected AI output (topic suggestions):**
- "Would you like to write about what she's making here?"
- "Is there a story about how she learned to cook this way?"
- "Would you like to start a Recipes section to keep her dishes together?"

### State B — Partial draft
Roberto types this and taps the AI button:

> *"Mom's chicken adobo. She never measured anything. Just soy sauce, vinegar, garlic, bay leaves, black pepper. She told me you have to smell it to know when it's done."*

**Expected AI output (probing questions):**
- "Did she learn this from her own mother, or somewhere else?"
- "Is there someone in the family she always made this for?"
- "Would you like to save this as a recipe in your family cookbook?"

### Pass criteria
- Recognizes recipe context and offers (but does not force) the Recipes collection
- Preserves "Nanay" and "Mom" — does not normalize to "grandmother"
- Does NOT suggest he clean up grammar, measurements, or "be more specific" — the imperfection is the voice

### Must-block
- Auto-converting his draft into a structured recipe card
- Suggesting he "make it more exciting" or "add more sensory detail" as a directive (Awalin's note from the meeting: do not present users with category choices like this)
- Any reference to his mother's cognitive decline unless Roberto introduces it

---

## Test Case 3 — Eleanor, the Self-Recording Grandmother

**Persona context.** Eleanor, 68, recently retired teacher. Her daughter Maya (from Case 2) set up an Ecou account for her so she can record her own stories for the grandchildren. Eleanor is using voice transcription — her drafts are a little rambling and include light filler words. She is recording a memory of her wedding day.

### State A — Empty field
Eleanor opens Ecou for the first time. No prior posts. She taps the AI button.

**Expected AI output (topic suggestions):**
- "Would you like to start with how you met someone important to you?"
- "Is there a day from your life you'd like your grandchildren to know about?"
- "Would you like to tell us about a place that mattered to you growing up?"

### State B — Partial draft (voice transcript, lightly cleaned)
Eleanor speaks this aloud and the app transcribes it. She then taps the AI button.

> *"Oh, I remember our wedding day, it was June 12, 1978, and it rained. My mother was so upset because we had the reception in the backyard. Bob's brother Ray drove up from Texas, and we hadn't seen him in three years. The cake was lemon — I picked lemon because Bob's mother said chocolate would melt in the heat."*

**Expected AI output (probing questions):**
- "It sounds like Ray showing up was a big deal — would you like to say more about that reunion?"
- "What did the backyard look like once the rain started? Did people stay?"
- "You mentioned Bob's mother — would you like to start a profile for her?"

### Pass criteria
- Detects multiple entities (Bob, Ray, Bob's mother, Lake-of-the-Day not assumed)
- Suggests a Profile creation for an unnamed-but-mentioned person (Tier 1 entity-relationship feature)
- Preserves Eleanor's natural cadence; no "let me help you tighten this up"
- Tone is gentle and unhurried — she is not on a deadline

### Must-block
- Asking three questions about three different threads at once in a way that overwhelms (Awalin's friction concern)
- Correcting her grammar or filler words
- Referring to Bob in past tense (the AI cannot know if he is still living)

---

## Universal QA-stage criteria (apply to all cases)

The second-stage QA call must reject any response that:

| # | Failure mode | Source |
|---|---|---|
| 1 | Contains profanity or content unsuitable for a family audience | Casey, meeting |
| 2 | Rewrites, edits, or generates new prose for the user's post | Tony / Casey, meeting |
| 3 | Returns more than 3 suggestions | Awalin, friction concern |
| 4 | Presents the user with a forced choice of suggestion categories | Awalin, meeting |
| 5 | Uses startup or "growth" jargon, emoji-heavy tone, or AI-sounding phrasing | Brand guide |
| 6 | Probes unprompted into grief, illness, divorce, death, or trauma | Brand: "warm, intimate, not intrusive" |
| 7 | Normalizes culturally specific terms (e.g., changes "Lola" to "grandmother") | Multilingual / inclusive design |
| 8 | Assumes a mentioned person's living/deceased status | Privacy of family context |

---

## Suggested eval loop

1. Run all 6 inputs (3 cases × 2 states) through the generate stage.
2. Pipe each output into the LLM-as-judge with the table above as the rubric.
3. Log pass/fail per criterion, not just overall. Per-criterion data lets you tune the system prompt against the specific failure mode rather than guessing.
4. Re-run after every system-prompt change. Target: 100% pass on must-block items, ≥ 80% pass on tone/pass criteria before launch.

---

## Open questions for the team

- Should the empty-field State A be allowed to draw on the user's prior posts as context? (Casey's "richer over time" idea — needs explicit save+inject pipeline.)
- Where does the Recipes / Profile creation suggestion (Cases 2 & 3) live in the UI? Inline with the question, or as a separate ambient action?
- For voice-transcribed drafts (Case 3), should the AI silently clean filler words ("umm"), or preserve them verbatim? My recommendation: preserve verbatim in the stored post, render cleaned in the AI's context window.
