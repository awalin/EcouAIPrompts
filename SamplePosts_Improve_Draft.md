# Ecou AI Assistant — Sample First Posts (State B: Partial Drafts)

**Purpose:** Realistic first-post drafts for each test persona. These represent what the user has typed before tapping the AI button in State B (Draft Review mode). Use these as inputs for Stage 1 prompt testing.

---

## Sample Post 1 — Marcus (The Inheriting Son)

**Context:** Marcus, 41, civil engineer. Uploaded a photo of his late father holding a bass on a boat.

**What Marcus typed:**

```
This is Dad on Lake Norman in 1987. He caught a 6-pound bass. He loved fishing.
```

**Metadata (for backend testing):**
- `current_draft`: "This is Dad on Lake Norman in 1987. He caught a 6-pound bass. He loved fishing."
- `prior_facts`: [] (first post, no history)
- `family_members`: [] (first post, tree not populated yet)
- `attached_media`: fishing_photo_1987.jpg

**What the AI should do:**
Ask 2–3 probing questions to help Marcus add sensory detail, people, or context. Should NOT assume father is deceased from the draft alone (even though test case notes it). Should NOT rewrite the draft.

**Expected good output:**
- "Who else was in the boat with him that day?"
- "What happened to the fish — was it dinner that night?"
- "Was there a smell or sound from the lake you still remember?"

---

## Sample Post 2 — Roberto (The Recipe Keeper)

**Context:** Roberto, 38, Filipino-American graphic designer. Uploaded a photo of his mother's hands stirring a pot.

**What Roberto typed:**

```
Mom's chicken adobo. She never measured anything. Just soy sauce, vinegar, garlic, bay leaves, black pepper. She told me you have to smell it to know when it's done.
```

**Metadata (for backend testing):**
- `current_draft`: "Mom's chicken adobo. She never measured anything. Just soy sauce, vinegar, garlic, bay leaves, black pepper. She told me you have to smell it to know when it's done."
- `prior_facts`: [] (first post)
- `family_members`: [] (first post)
- `attached_media`: mothers_hands_cooking.jpg

**What the AI should do:**
Recognize recipe context. Ask questions about origin, relationship, or cultural transmission. Suggest (but don't force) saving to Recipes collection. Preserve "Mom" exactly (do NOT normalize to "mother" or "Nanay Rosa").

**Expected good output:**
- "Did she learn this from her own mother, or somewhere else?"
- "Is there someone in the family she always made this for?"
- "Would you like to save this as a recipe in your family cookbook?"

---

## Sample Post 3 — Eleanor (The Self-Recording Grandmother)

**Context:** Eleanor, 68, retired teacher. Using voice transcription to record memories for grandchildren. Recording a wedding-day memory.

**What Eleanor spoke (transcribed by the app):**

```
Oh, I remember our wedding day, it was June 12, 1978, and it rained. My mother was so upset because we had the reception in the backyard. Bob's brother Ray drove up from Texas, and we hadn't seen him in three years. The cake was lemon — I picked lemon because Bob's mother said chocolate would melt in the heat.
```

**Metadata (for backend testing):**
- `current_draft`: "Oh, I remember our wedding day, it was June 12, 1978, and it rained. My mother was so upset because we had the reception in the backyard. Bob's brother Ray drove up from Texas, and we hadn't seen him in three years. The cake was lemon — I picked lemon because Bob's mother said chocolate would melt in the heat."
- `prior_facts`: [] (first post)
- `family_members`: ["Bob (husband)"] (she may have created his profile already)
- `attached_media`: null (voice recording, no photo)
- `input_method`: voice_transcript

**What the AI should do:**
Detect multiple named entities (Bob, Ray, Bob's mother, Eleanor's mother). Suggest entity/profile creation for Ray or Bob's mother. Ask about one of the story threads (the rain, Ray's arrival, the cake decision). Preserve Eleanor's natural, slightly rambling voice — do NOT suggest tightening or editing.

**Expected good output:**
- "It sounds like Ray showing up was a big deal — would you like to say more about that reunion?"
- "What did the backyard look like once the rain started? Did people stay?"
- "You mentioned Bob's mother — would you like to start a profile for her?"

---

## Testing Notes

### Voice & Authenticity
These drafts reflect three different writing styles:
- **Marcus:** Terse, factual, engineer's precision. Short sentences.
- **Roberto:** Casual, sensory, slightly poetic. Preserves his mother's voice through quoted speech.
- **Eleanor:** Conversational, voice-to-text natural flow. Light filler ("Oh"), long compound sentences, shifts focus mid-thought.

The AI should **match the cadence of each voice** in its questions. Marcus gets direct questions. Roberto gets warmth. Eleanor gets patience.

### Cultural Term Preservation Test
Roberto's draft includes "Mom" (not "Nanay"). The AI must preserve this exactly. If Roberto had written "Nanay's chicken adobo" instead, the AI must preserve "Nanay" exactly and never normalize to "grandmother" or "your mother."

The test case notes mention "Lola" as an example cultural term, but Roberto's actual draft uses "Mom" — both are valid tests of the preservation rule.

### Entity Detection Expectations
- **Marcus draft:** 2 entities detected (Dad, Lake Norman)
- **Roberto draft:** 2 entities detected (Mom, chicken adobo as potential Recipe)
- **Eleanor draft:** 5+ entities detected (Bob, Ray, Bob's mother, Eleanor's mother, the wedding, the backyard, the cake, Texas, June 12 1978)

Eleanor's draft is the hardest entity-extraction test. The AI should focus on 1–2 most salient entities in its questions, not try to address all five.

### Markdown Formatting in Drafts
The code blocks above show what the user typed. In actual backend calls, strip the markdown fences and pass the raw text string to the `{{CURRENT_DRAFT}}` variable.

### Re-using These for Stage 2 QA Testing
After Stage 1 generates suggestions for each draft, pipe the output + the original draft into Stage 2 QA. The QA prompt should validate:
- No rewrites of Marcus's/Roberto's/Eleanor's words
- Cultural term "Mom" preserved in Roberto case
- No grief probing in Marcus case (even though we know his father passed)
- No grammar "corrections" to Eleanor's conversational flow

---

## Suggested Eval Process

1. **Run all 3 drafts through Stage 1** with empty `prior_facts` and `family_members` (simulating first-time users)
2. **Log the JSON output** for each
3. **Human eval:** Do the suggestions feel like they came from a wise relative, or from a startup?
4. **Pass to Stage 2 QA:** Does it catch violations?
5. **Iterate system prompt** based on failures

Target: 3/3 pass before launch.
