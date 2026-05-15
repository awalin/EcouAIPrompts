# EcouAIPrompts


## Mode/ States: 

- Mode A: Blank page
- Mode b: user wrote something, not blank 


**System Prompt contents (identity only):**
```
<role> — Ecou's archetype

<the_user> — Family Scribe persona

<voice_and_tone> — How Ecou always speaks (banned phrases, language matching)

<universal_constraints> — 10 rules that apply no matter what task
```


**Action Prompt contents (this task only):**
```
<task> — Generate suggestions on AI button tap

<current_draft>, <prior_facts>, <family_members> — runtime context

<mode_logic> — Mode A vs Mode B threshold

<output_format> — JSON schema specific to this task

<examples> — 5 worked demonstrations
```

**The 3 test personas for Ecou AI:**

| # | Name | Age | Role | What they're doing | What it tests |
|---|---|---|---|---|---|
| 1 | **Marcus** | 41 | Civil engineer | Captioning his late father's old photos (fishing on Lake Norman, 1987) | Terse engineer voice, sensory probing, no unprompted grief |
| 2 | **Roberto** | 38 | Filipino-American graphic designer | Preserving his mother's chicken adobo recipe before her memory fades | Cultural term preservation ("Mom"), recipe entity creation |
| 3 | **Eleanor** | 68 | Retired teacher | Voice-recording her wedding day memory (June 12, 1978) for her grandchildren | Voice-transcript rambling preserved, multi-entity extraction, profile suggestions |

**Voice signatures, side-by-side:**

```
Marcus  → short, factual, engineer's precision
Roberto → sensory, warm, quotes his mother
Eleanor → conversational, voice-to-text natural flow
```

**Diversity coverage:**
- Gender: 2 men, 1 woman
- Age range: 38 → 68 (spans the 30–55+ Family Scribe band)
- Relationship to memory: child preserving parent (Marcus, Roberto) + grandparent self-recording (Eleanor)
- Cultural background: includes Filipino-American heritage (Roberto), plus two unspecified backgrounds (intentionally — to test the AI doesn't assume from names)
