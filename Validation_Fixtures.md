# Ecou AI Assistant — Validation Test Fixtures

**For:** Backend / AI engineers implementing Stage 1 prompt validation
**Companion docs:** `Ecou_SystemPrompt_v1_Stage1_Generate.md`, `Ecou_AI_TestCases_v1.md`

---

## Quick reference

| Test ID | Persona | State 1 (Blank) | State 2 (Draft) |
|---|---|---|---|
| `TC-01` | Marcus, 41, engineer (son) | ✅ | ✅ |
| `TC-02` | Roberto, 38, designer (son) | ✅ | ✅ |
| `TC-03` | Eleanor, 68, retired teacher | ✅ | ✅ |

**6 total test cases (3 personas × 2 states).** Each case is a self-contained JSON fixture: paste `input` into your Vertex call, validate the model's response against `expected_output`.

---

## Schema reminder

**Input variables** (substituted into the system prompt before the API call):

```json
{
  "current_draft": "string — what the user has typed",
  "prior_facts": ["array of strings — facts extracted from previous posts"],
  "family_members": ["array of strings — 'Name (relationship)' format"]
}
```

**Expected output** (Stage 1 returns this JSON, enforced by Vertex `responseSchema`):

```json
{
  "mode": "empty_field | draft_review",
  "suggestions": [
    {
      "text": "string — one short sentence",
      "intent": "person | place | time | sensory | relationship | object | entity_creation"
    }
  ]
}
```

**Mode trigger:** `current_draft.length < 15` → `empty_field`; otherwise → `draft_review`.

---

## TC-01 — Marcus (Inheriting Son)

**Context:** Engineer, terse style, captioning late father's photos.

### TC-01-A · Blank screen (State 1)

```json
{
  "test_id": "TC-01-A",
  "persona": "Marcus",
  "state": "empty_field",
  "input": {
    "current_draft": "",
    "prior_facts": [],
    "family_members": []
  },
  "expected_output": {
    "mode": "empty_field",
    "suggestions_count": [2, 3],
    "example_acceptable": {
      "mode": "empty_field",
      "suggestions": [
        {"text": "Is there a person you'd like your family to know about?", "intent": "person"},
        {"text": "Would you like to start with a place that mattered to you growing up?", "intent": "place"},
        {"text": "Is there a day from your life worth remembering today?", "intent": "time"}
      ]
    }
  },
  "must_pass": [
    "mode == 'empty_field'",
    "2 <= len(suggestions) <= 3",
    "no emojis in any suggestion.text",
    "no banned phrases: 'Great memory', 'I love that', 'happy memory'",
    "all suggestions end with '?' (open-ended)"
  ],
  "must_block": [
    "any reference to grief, loss, or sympathy",
    "more than 3 suggestions",
    "categorical forcing ('Pick one: person, place, or time')"
  ]
}
```

### TC-01-B · Draft state (State 2)

```json
{
  "test_id": "TC-01-B",
  "persona": "Marcus",
  "state": "draft_review",
  "input": {
    "current_draft": "This is Dad on Lake Norman in 1987. He caught a 6-pound bass. He loved fishing.",
    "prior_facts": [],
    "family_members": []
  },
  "expected_output": {
    "mode": "draft_review",
    "suggestions_count": [2, 3],
    "example_acceptable": {
      "mode": "draft_review",
      "suggestions": [
        {"text": "Who else was in the boat with him that day?", "intent": "person"},
        {"text": "What happened to the fish — was it dinner that night?", "intent": "object"},
        {"text": "Was there a smell or sound from the lake you still remember?", "intent": "sensory"}
      ]
    }
  },
  "must_pass": [
    "mode == 'draft_review'",
    "questions probe details in or adjacent to the draft (Dad, lake, bass, fishing)",
    "preserves 'Dad' — does not say 'your father' or 'your late father'",
    "Marcus's prose is not echoed back, rewritten, or summarized"
  ],
  "must_block": [
    "rewriting the draft",
    "'Sorry for your loss' or any grief assumption",
    "asking about cause of death",
    "directive phrasing: 'You should add...', 'Try to include...'"
  ]
}
```

---

## TC-02 — Roberto (Recipe Keeper)

**Context:** Filipino-American designer, sensory voice, preserving mother's cooking.

### TC-02-A · Blank screen (State 1)

```json
{
  "test_id": "TC-02-A",
  "persona": "Roberto",
  "state": "empty_field",
  "input": {
    "current_draft": "",
    "prior_facts": [],
    "family_members": []
  },
  "expected_output": {
    "mode": "empty_field",
    "suggestions_count": [2, 3],
    "example_acceptable": {
      "mode": "empty_field",
      "suggestions": [
        {"text": "Would you like to write about a meal that always reminds you of home?", "intent": "sensory"},
        {"text": "Is there a person whose voice you can still hear in your head?", "intent": "person"},
        {"text": "Would you like to start with a tradition your family keeps?", "intent": "time"}
      ]
    }
  },
  "must_pass": [
    "mode == 'empty_field'",
    "no assumption of ethnicity, language, or cultural background (he hasn't typed anything yet)",
    "no emojis, no banned phrases"
  ],
  "must_block": [
    "assuming Roberto's heritage from his name",
    "asking 'What's your favorite recipe?' (too narrow for a blank screen)"
  ]
}
```

### TC-02-B · Draft state (State 2)

```json
{
  "test_id": "TC-02-B",
  "persona": "Roberto",
  "state": "draft_review",
  "input": {
    "current_draft": "Mom's chicken adobo. She never measured anything. Just soy sauce, vinegar, garlic, bay leaves, black pepper. She told me you have to smell it to know when it's done.",
    "prior_facts": [],
    "family_members": []
  },
  "expected_output": {
    "mode": "draft_review",
    "suggestions_count": [2, 3],
    "example_acceptable": {
      "mode": "draft_review",
      "suggestions": [
        {"text": "Did she learn this from her own mother, or somewhere else?", "intent": "person"},
        {"text": "Is there someone in the family she always made this for?", "intent": "relationship"},
        {"text": "Would you like to save this as a recipe in your family cookbook?", "intent": "entity_creation"}
      ]
    }
  },
  "must_pass": [
    "mode == 'draft_review'",
    "exactly one suggestion has intent == 'entity_creation' offering the Recipe option",
    "'Mom' preserved exactly — not normalized to 'mother', 'your mom', or 'Nanay'",
    "at least one question explores origin or transmission of the recipe"
  ],
  "must_block": [
    "auto-converting the draft into a structured recipe card",
    "suggesting Roberto add measurements ('How much soy sauce?')",
    "correcting grammar ('Mom's' → 'Mom is')",
    "assuming cognitive decline in his mother"
  ]
}
```

---

## TC-03 — Eleanor (Self-Recording Grandmother)

**Context:** Retired teacher, voice-transcript input, recording for grandchildren. Family tree partially populated.

### TC-03-A · Blank screen (State 1)

```json
{
  "test_id": "TC-03-A",
  "persona": "Eleanor",
  "state": "empty_field",
  "input": {
    "current_draft": "",
    "prior_facts": [],
    "family_members": ["Bob (husband)"]
  },
  "expected_output": {
    "mode": "empty_field",
    "suggestions_count": [2, 3],
    "example_acceptable": {
      "mode": "empty_field",
      "suggestions": [
        {"text": "Would you like to write about how you and Bob met?", "intent": "relationship"},
        {"text": "Is there a day from your life you'd like your grandchildren to know about?", "intent": "time"},
        {"text": "Would you like to tell us about the home you grew up in?", "intent": "place"}
      ]
    }
  },
  "must_pass": [
    "mode == 'empty_field'",
    "at least one suggestion uses 'Bob' by name (drawing from family_members)",
    "tone is unhurried and warm — no exclamation points, no 'Let's get started!'"
  ],
  "must_block": [
    "ignoring the family_members context (generic suggestions only)",
    "asking about Bob in past tense"
  ]
}
```

### TC-03-B · Draft state (State 2)

```json
{
  "test_id": "TC-03-B",
  "persona": "Eleanor",
  "state": "draft_review",
  "input": {
    "current_draft": "Oh, I remember our wedding day, it was June 12, 1978, and it rained. My mother was so upset because we had the reception in the backyard. Bob's brother Ray drove up from Texas, and we hadn't seen him in three years. The cake was lemon — I picked lemon because Bob's mother said chocolate would melt in the heat.",
    "prior_facts": [],
    "family_members": ["Bob (husband)"]
  },
  "expected_output": {
    "mode": "draft_review",
    "suggestions_count": [2, 3],
    "example_acceptable": {
      "mode": "draft_review",
      "suggestions": [
        {"text": "It sounds like Ray showing up was a big deal — would you like to say more about that reunion?", "intent": "person"},
        {"text": "What did the backyard look like once the rain started?", "intent": "sensory"},
        {"text": "Would you like to start a profile for Ray?", "intent": "entity_creation"}
      ]
    }
  },
  "must_pass": [
    "mode == 'draft_review'",
    "exactly one suggestion has intent == 'entity_creation' offering a Profile for a new family member (Ray, Bob's mother, or Eleanor's mother)",
    "questions focus on 1–2 threads, not all 5+ entities at once",
    "filler words ('Oh') and voice-transcript cadence are not flagged or corrected"
  ],
  "must_block": [
    "asking 5 questions about 5 different entities (overwhelm)",
    "'tightening' or 'cleaning up' her draft",
    "any reference to Bob in past tense",
    "auto-creating a Profile without asking"
  ]
}
```

---

## Implementation: validation harness

### Python pseudocode

```python
import json
from vertexai.generative_models import GenerativeModel

# Load system prompt from Ecou_SystemPrompt_v1_Stage1_Generate.md
SYSTEM_PROMPT = open("system_prompt_v1.txt").read()

# Load all 6 fixtures
fixtures = json.load(open("ecou_test_fixtures.json"))

model = GenerativeModel(
    "gemini-2.5-flash",
    system_instruction=SYSTEM_PROMPT,
    generation_config={
        "temperature": 0.6,
        "max_output_tokens": 400,
        "response_mime_type": "application/json"
    }
)

results = []
for fx in fixtures:
    # Substitute runtime variables into the prompt
    user_message = json.dumps(fx["input"])
    response = model.generate_content(user_message)
    output = json.loads(response.text)

    # Run validators
    passed_checks = run_must_pass(output, fx["must_pass"])
    blocked_violations = run_must_block(output, fx["must_block"])

    results.append({
        "test_id": fx["test_id"],
        "output": output,
        "passed": all(passed_checks) and not blocked_violations,
        "details": {"passed_checks": passed_checks, "violations": blocked_violations}
    })

# Pass criteria: 6/6 must_pass, 0 must_block violations
print(f"Pass rate: {sum(r['passed'] for r in results)}/6")
```

### Validator implementation hints

| Check type | How to validate |
|---|---|
| `mode == 'empty_field'` | Direct JSON field comparison |
| `2 <= len(suggestions) <= 3` | `len(output['suggestions'])` |
| `no emojis` | Regex: `r'[\U0001F300-\U0001FAFF\u2600-\u27BF]'` |
| `no banned phrases` | Substring match against banlist |
| `preserves 'Mom'` | Check that no suggestion contains 'mother', 'your mom', 'Nanay' when input has 'Mom' |
| `at least one entity_creation` | `any(s['intent'] == 'entity_creation' for s in output['suggestions'])` |
| `'Bob' by name` | `any('Bob' in s['text'] for s in output['suggestions'])` |
| `all end with '?'` | `all(s['text'].rstrip().endswith('?') for s in output['suggestions'])` |

Subjective checks (tone, grief assumption, directive phrasing) are harder to regex. **Recommendation:** route them through the Stage 2 QA prompt with the rubric as input, not into deterministic code.

---

## CI / pre-launch gate

Suggested merge-blocking criteria before May launch:

| Metric | Target | Notes |
|---|---|---|
| Deterministic checks pass rate | 6/6 (100%) | Mode, count, format, banned phrases |
| Stage 2 QA pass rate | ≥ 5/6 (83%) | Subjective tone/grief/directive checks |
| Per-criterion logging | Required | So regressions tell you which constraint failed |
| Human spot-check | 6/6 reviewed | At least once per system-prompt change |

Re-run on every system-prompt change. Per-criterion logging is the key signal — overall pass rate hides which constraint regressed.

---

## Two things to discuss with the team

1. **Family tree state at first post.** TC-03-A assumes Eleanor already has Bob in `family_members` when she opens to a blank screen. Is that realistic for a first post, or does the tree only populate after the first save? This affects whether the AI can personalize on Day 1 or only on Day 2+.
2. **Entity_creation intent — UI design.** TC-02-B and TC-03-B both suggest "save as recipe" or "start a profile." Dean needs to confirm how these render in the UI. Are they distinct affordances (separate button), or another question card that opens a modal? This shapes whether the AI should generate them at all in Phase 1.
