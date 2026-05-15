# Ecou AI Assistant — Action Prompt v2: Generate Suggestions

**Owner:** Awalin Sopan
**Pairs with:** `Ecou_SystemPrompt_v2_Identity.md`
**Action:** `generate_suggestions` — triggered when user taps the AI button on a post

---

## What this prompt does

| Concern | Owner |
|---|---|
| Who Ecou is, how it speaks, universal rules | System prompt (already loaded) |
| **What task to perform right now** | **This action prompt** |
| **Runtime user context** | **This action prompt** |
| **Output JSON schema for this task** | **This action prompt** |
| **Task-specific examples** | **This action prompt** |

This action prompt is sent as the user-message payload on every AI button tap. The system prompt is already loaded in `system_instruction` and provides character/constraints.

---

## The prompt

Send the rendered template below as the `contents` field (Vertex SDK) or `messages[0].content` (REST API) on every AI button tap. Variables in `{{double_braces}}` are filled by the backend before sending.

```text
<task>
Generate writing assistance suggestions for the user's current post. The user just tapped the AI assistance button. They are either staring at a blank field or partway through a draft. Help them move forward.
</task>

<current_draft>
{{CURRENT_DRAFT}}
</current_draft>

<prior_facts>
{{PRIOR_FACTS}}
</prior_facts>

<family_members>
{{FAMILY_MEMBERS}}
</family_members>

<mode_logic>
If <current_draft> contains fewer than 15 characters → Mode A (empty_field):
  Offer 2–3 specific things the user could write about.
  Draw from <prior_facts> and <family_members> when available.
  If neither is available, offer gentle universal entry points.

If <current_draft> contains 15 or more characters → Mode B (draft_review):
  Ask 2–3 probing questions that help the user add depth, people, place, or sensory texture to what they wrote.
  Build questions around details already in the draft. Never rewrite the draft.
</mode_logic>

<output_format>
Return only a JSON object. No prose before or after.

{
  "mode": "empty_field" | "draft_review",
  "suggestions": [
    {
      "text": "One short sentence — a suggestion (Mode A) or question (Mode B).",
      "intent": "person" | "place" | "time" | "sensory" | "relationship" | "object" | "entity_creation"
    }
  ]
}

Rules for this task:
- Return exactly 2 or 3 suggestions. Never 1, never 4+.
- Each "text" ends with a question mark (open-ended).
- "intent" tags the dominant theme of each suggestion.
- "entity_creation" = suggesting the user start a Profile, Recipe, or similar structured entry based on something they mentioned.
- Do not present the user with a forced choice of categories.
</output_format>

<examples>

Example 1 — Empty field, no prior context
Input: current_draft="", prior_facts=none yet, family_members=none yet
Output: {"mode": "empty_field", "suggestions": [
  {"text": "Is there a person you'd like your family to know about?", "intent": "person"},
  {"text": "Would you like to start with a place that mattered to you growing up?", "intent": "place"},
  {"text": "Is there a day from your life worth remembering today?", "intent": "time"}
]}

Example 2 — Empty field, with prior context
Input: current_draft="", prior_facts="mentioned Uncle Ray drove up from Texas for the 1978 wedding", family_members="Bob (husband), Ray (brother-in-law)"
Output: {"mode": "empty_field", "suggestions": [
  {"text": "Last time you mentioned Uncle Ray driving up from Texas — would you like to write more about him?", "intent": "person"},
  {"text": "Would you like to add a memory from the early days of your marriage to Bob?", "intent": "relationship"}
]}

Example 3 — Draft review, no entity creation
Input: current_draft="This is Dad on Lake Norman in 1987. He caught a 6-pound bass. He loved fishing.", prior_facts=none yet, family_members=none yet
Output: {"mode": "draft_review", "suggestions": [
  {"text": "Who else was in the boat with him that day?", "intent": "person"},
  {"text": "What happened to the fish — was it dinner that night?", "intent": "object"},
  {"text": "Was there a smell or sound from the lake you still remember?", "intent": "sensory"}
]}

Example 4 — Draft review, recipe with entity creation
Input: current_draft="Mom's chicken adobo. She never measured anything. Just soy sauce, vinegar, garlic, bay leaves, black pepper.", prior_facts=none yet, family_members=none yet
Output: {"mode": "draft_review", "suggestions": [
  {"text": "Did she learn this from her own mother, or somewhere else?", "intent": "person"},
  {"text": "Is there someone in the family she always made this for?", "intent": "relationship"},
  {"text": "Would you like to save this as a recipe in your family cookbook?", "intent": "entity_creation"}
]}

Example 5 — Draft review, multiple entities with profile creation
Input: current_draft="Oh, I remember our wedding day, it was June 12, 1978, and it rained. Bob's brother Ray drove up from Texas, and we hadn't seen him in three years.", prior_facts=none yet, family_members="Bob (husband)"
Output: {"mode": "draft_review", "suggestions": [
  {"text": "It sounds like Ray showing up was a big deal — would you like to say more about that reunion?", "intent": "person"},
  {"text": "What did the backyard look like once the rain started?", "intent": "sensory"},
  {"text": "Would you like to start a profile for Ray?", "intent": "entity_creation"}
]}

</examples>
```

---

## Variable substitution rules

| Variable | Source | If absent, substitute |
|---|---|---|
| `{{CURRENT_DRAFT}}` | Frontend, on button tap | Empty string `""` |
| `{{PRIOR_FACTS}}` | Backend extraction service | Literal text `none yet` |
| `{{FAMILY_MEMBERS}}` | Backend family tree | Literal text `none yet` |

**Implementation note:** for empty `prior_facts` and `family_members`, substitute the literal string `none yet` rather than `[]` or empty XML. Gemini handles natural language inside XML tags more reliably than empty structures.

---

## Implementation

### Python (Vertex AI SDK)

```python
import json
from string import Template
from vertexai.generative_models import GenerativeModel, GenerationConfig

# Loaded once at app boot
SYSTEM_PROMPT = open("ecou_system_prompt_v2.txt").read()
ACTION_PROMPT_TEMPLATE = Template(open("ecou_action_generate_suggestions_v2.txt").read())

model = GenerativeModel(
    "gemini-2.5-flash",
    system_instruction=SYSTEM_PROMPT,
)

GENERATE_CONFIG = GenerationConfig(
    temperature=0.6,
    max_output_tokens=400,
    response_mime_type="application/json",
    response_schema=ECOU_SUGGESTION_SCHEMA,  # Defined per output_format
)

def render_action(current_draft: str, prior_facts: list[str], family_members: list[str]) -> str:
    return ACTION_PROMPT_TEMPLATE.substitute(
        CURRENT_DRAFT=current_draft or "",
        PRIOR_FACTS="\n".join(prior_facts) if prior_facts else "none yet",
        FAMILY_MEMBERS="\n".join(family_members) if family_members else "none yet",
    )

def generate_suggestions(current_draft, prior_facts, family_members) -> dict:
    action_prompt = render_action(current_draft, prior_facts, family_members)
    response = model.generate_content(action_prompt, generation_config=GENERATE_CONFIG)
    return json.loads(response.text)
```

Notice: `generation_config` lives at the call site, not at model init. Different actions (future: summarize, auto-tag) will use different configs and schemas while reusing the same model instance and system prompt.

---

## Pattern for future actions

When Ecou adds a new AI feature, follow this template:

1. **Reuse** `Ecou_SystemPrompt_v2_Identity.md` — no changes needed
2. **Create** `Ecou_Action_<TaskName>_v1.md` with:
   - `<task>` description
   - `<context>` variables specific to this task
   - `<output_format>` JSON schema for this task
   - 3–5 worked examples
3. **Implement** a per-task function with its own `generation_config` and `response_schema`

Example next actions worth scoping:
- `Action_AutoTag` — extract topics from a post for Tier-1 Smart Labeling
- `Action_ExtractEntities` — pull people/places/dates for the family tree
- `Action_SummarizePost` — generate a short caption for long entries
- `Action_DetectRecipe` — flag posts that mention a famous family dish

Each is a new action prompt. The system prompt does not change.
