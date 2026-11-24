---
name: write-a-prompt
description: Write, edit, review, and fix system prompts for LLMs (Claude, GPT, Gemini) using Anthropic's and other providers' prompting best practices, including diagnosing why a prompt fails. Use when the user asks to write/draft/improve/review a system prompt, agent or tool instructions, or a prompt template, or when LLM output has the wrong format, drifts in scope/tone, invents structure, or breaks on edge cases.
argument-hint: "[write | edit | fix] <prompt file or description of the task>"
---

# Write a Prompt

Three modes. Pick from the request; if unclear, infer: no prompt exists → **write**; prompt exists and no failure is reported → **edit**; failing outputs are reported → **fix**.

References (read the one the mode needs):
- [BEST_PRACTICES.md](references/BEST_PRACTICES.md): structure, clarity, examples, format, agent/tool prompts, anti-patterns
- [TEMPLATE.md](references/TEMPLATE.md): section skeleton plus a vague→structured worked example
- [DIAGNOSIS.md](references/DIAGNOSIS.md): symptom → missing technique, and structured outputs

## Write (new prompt)

1. **Gather the contract.** Ask only what you can't infer from the code or context:
   - Task and audience. Where does the output go (human, UI, parser, tool)?
   - Target model/provider, and whether tools are involved
   - Hard constraints, out-of-scope behavior, what to do when info is missing
   - 2–3 real sample inputs, including one awkward edge case
2. **Pick the minimum technique set.** A simple task gets role + instructions + format. Add few-shot only when format or tone must be exact. Add a schema (API structured outputs) only when a program parses the output.
3. **Draft from [TEMPLATE.md](references/TEMPLATE.md)**, stable content first and dynamic content last. Give every rule its *reason*.
4. **Self-review** against the checklist below.
5. **Hand over test cases.** Give the user 3–5 inputs (happy path + edge cases) to run, with the expected output for each.

## Edit (improve existing prompt)

1. Read the whole prompt. Identify its sections, rules, and examples.
2. Run the checklist. For each finding, quote the line, name the problem, and propose the fix.
3. Prefer **deleting and sharpening** over adding. Merge duplicates, resolve contradictions, turn vague bars into concrete ones.
4. Show a diff or the rewritten prompt, plus a short changelog explaining *why* each change was made.

## Fix (prompt produces bad output)

Follow [DIAGNOSIS.md](references/DIAGNOSIS.md). Don't reword or add text before diagnosing.

1. Get the **actual failing outputs** and their inputs. If none are available, ask for them or reproduce the failure.
2. Classify each failure:

   | Symptom | Missing |
   |---|---|
   | Wrong shape (prose vs. label/JSON) | Output constraint |
   | Scope/tone drift, worse over turns | Specific system prompt |
   | Right task, invented structure | Few-shot examples |
   | Works on tested inputs, breaks on a variant | Constraint or example for that variant |

3. Add **only** the technique that the classification calls for. If a program parses the output, recommend API structured outputs (JSON schema / strict tools) over more prompt text.
4. Re-run on the failing inputs **and** the previously passing ones. If it still fails, diagnose again rather than piling on words.

## Checklist

- [ ] Role and objective in the first 1–2 sentences
- [ ] A new colleague with zero context could follow it
- [ ] Each non-obvious rule states *why*
- [ ] Says what to do, not only what not to do
- [ ] Scope explicit ("every item", not implied); thresholds concrete, not "important"/"concise"
- [ ] No contradictory rules
- [ ] Instructions, data, and examples separated by tags/headers; untrusted content isolated
- [ ] Output contract: shape, length, preamble, missing-data fallback
- [ ] Examples (if any): 3–5, diverse, canonical, each behavior also stated as a rule
- [ ] Caps/"CRITICAL"/"MUST" only for true hard constraints, with reasons
- [ ] Stable content before dynamic (date, user data), which keeps the prompt cache-friendly
- [ ] Agents: tool when/when-not, action default, confirmation for risky actions
- [ ] No more technique than the task needs

## Output

Deliver the prompt in a fenced block (or edit the file in place), followed by:
- **Why:** 3–6 bullets tying key choices to practices
- **Test inputs:** cases to run, with expected outputs
- **Open questions:** assumptions the user should confirm
