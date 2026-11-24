# Diagnosing a Failing Prompt (Anthropic method)

Source: Anthropic guidance, "System prompts, XML, few-shot, and output constraints".

Core rule: **name the failure, add the one technique that matches it, re-run. If it still fails, diagnose again.** The fix is structural, not a matter of phrasing. Rewording changes how something is said; it does not add the missing piece. If the LLM crosses the boundary between instructions and input data, clearer phrasing won't fix it. If the format keeps drifting, "please format this correctly" won't fix it.

A prompt that grows longer with every pass (instead of more precise) is the sign the diagnosis step is being skipped.

## The four techniques

| Technique              | What it does                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **System prompt**      | Behavioral contract (role, scope, format) that holds for every response regardless of the user turn.                                                                             |
| **XML tags**           | Mark boundaries: instructions vs. data vs. examples, so one isn't read as the other.                                                                                             |
| **Few-shot examples**  | _Show_ the exact pattern instead of describing it. One correct input→output pair pins down shape better than prose.                                                              |
| **Output constraints** | Control form independent of content: field names, types, length limits, preamble or not, stopping point, what to do when data is absent. Last line of defense before the parser. |

## Symptom → missing piece

| What you observed                                                                                                      | What the prompt is missing                                                                       | Why this is the fix                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Wrong shape**: a sentence where you expected a label, prose where you expected JSON.                                 | **Output constraint.** Form, field names, or stopping point never specified.                     | Controls form independent of content. Without it the LLM returns plausible text the parser wasn't built to accept.            |
| **Content off**: scope drifts, tone shifts, answers a wider question than asked; worsens deeper into the conversation. | **A system prompt, or a more specific one.** Behavioral contract too vague to hold across turns. | Sets rules for every response. When underspecified, nothing holds role, scope, and format steady as the conversation runs on. |
| **Right task, invented structure**: understood what to do, produced a shape you never asked for.                       | **Few-shot examples.** the LLM can't infer an exact structure from description alone.            | Examples show the pattern. One correct pair gives the exact shape to match.                                                   |
| **Clean on tested inputs, breaks on a variant**: edge case, unusual field, unanticipated input.                        | **A constraint covering the variant.** Prompt handles the happy path only.                       | Naming the variant in a constraint, or adding an example that covers it, closes the gap the test inputs never exposed.        |

## How much to apply

| Situation                                                          | Action                                |
| ------------------------------------------------------------------ | ------------------------------------- |
| Well-specified output contract, edge cases coverable by examples   | **Stack all four** techniques.        |
| Simple task that only needs one (e.g. "summarize this paragraph")  | **Simplify.** No few-shot, no schema. |
| Prompt growing longer each iteration; 5 re-prompts and still wrong | **Diagnose before adding more text.** |

## Worked example: classifier with wrong output shape

Before:

```
System: You are a support classifier. Classify the ticket.
User: <ticket>I was charged twice for the same month.</ticket>
```

Returns "Billing", "billing", or "This looks like a billing issue." Router expecting a fixed label set breaks.

Diagnosis: row 1 (wrong shape) → missing output constraint. Locking the label set and showing the format pulls in few-shot + XML.

After:

```
System: You are a support classifier. Classify each ticket into exactly one of:
BILLING, TECHNICAL, ESCALATION. Return only the label. No other text.

<sample_input>My account shows two charges for April.</sample_input>
<ideal_output>BILLING</ideal_output>

<sample_input>The API keeps returning a 429 error.</sample_input>
<ideal_output>TECHNICAL</ideal_output>

User: <ticket>I was charged twice for the same month.</ticket>
```

- System prompt sets the output contract: one label from a fixed set, nothing else.
- XML tags mark where each example ends, so examples aren't read as instruction.
- Few-shot pairs show exact casing and format.

## When the prompt isn't enough: structured outputs (API-level)

A prompt is a request; the model can still emit a stray sentence, wrong field name, or malformed JSON. For machine-readable output in production, move the constraint into the API — constrained decoding only allows tokens that keep output valid against a JSON schema.

- **JSON outputs** — `output_config.format` with `type: "json_schema"` + schema. Constrains the final response. Use when the model _is_ producing the payload your code consumes (extraction, API responses). Removes parse-and-retry code.
- **Strict tool use** — `strict: true` on a tool definition. Constrains tool _arguments_ to the input schema. Use in agentic loops where a malformed argument would crash or trigger a wrong action.

Costs — weigh, don't enable by default:

- **First request on a new schema is slower** (grammar compilation). Cached 24h from last use; constantly-changing schemas pay repeatedly.
- **Input tokens rise** — API injects a format-describing system prompt, billed normally.
- **Schema guaranteed ≠ success guaranteed.** Still check `stop_reason`: `refusal` (safety decline) and `max_tokens` (truncated mid-structure) return non-matching output.
- **Incompatible with prefilling** the assistant message. Pick one.

## Diagnosis checklist

- [ ] Collected actual failing outputs (not a guess at what went wrong)
- [ ] Classified each failure into one of the four rows
- [ ] Added only the technique(s) that row calls for
- [ ] Re-ran on the original failing inputs **and** the previously passing ones
- [ ] If machine-parsed: considered structured outputs instead of more prompt text
- [ ] Prompt got more precise, not just longer
