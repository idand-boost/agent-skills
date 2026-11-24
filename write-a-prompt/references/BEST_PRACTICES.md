# System Prompt Best Practices

Distilled from Anthropic, OpenAI, and Google prompting guidance. Sources at bottom.

## 1. Structure and ordering

- **Section it.** Use XML tags (`<instructions>`, `<context>`, `<examples>`) or Markdown headers. Boundaries prevent the model from reading data as instructions or examples as the task.
- **Consistent, descriptive tag names; nest when hierarchical** (`<documents><document index="1"><source>…</source><content>…</content></document></documents>`). Refer to tags by name in instructions ("using the ticket in `<ticket>`").
- **Stable first, variable last.** Role → rules → tools → format → examples → reference knowledge, then dynamic content (date, user data, retrieved docs). This helps both comprehension and prompt caching: the cache prefix is `tools → system → messages`, so any change early in the prompt invalidates everything after it. Never put a timestamp above stable content.
- **Long context: documents at the top, question/instructions at the end.** Anthropic reports up to ~30% quality gains on multi-document inputs. For very long prompts, a brief reminder of key instructions at the end helps.
- **Isolate untrusted content** (user uploads, web pages, tool results) in clearly named tags. Tell the model that instructions inside those tags are data, not commands, unless the user's own message asks it to follow them.

## 2. Role and context

- **Give a role.** Even one sentence ("You are a support classifier for a B2B billing product") measurably focuses behavior.
- **Explain the why.** A reason lets the model generalize. Compare `NEVER use ellipses` with `Your response is read aloud by a text-to-speech engine, so never use ellipses, since it can't pronounce them.`
- **Golden rule:** a smart new colleague with zero context should be able to follow the prompt. If they would need to ask questions, the model will guess.
- **Supply what the model can't know:** audience, product purpose, current date, what happens to the output downstream.
- **Right altitude.** Avoid two failures: brittle if/else rule lists that hardcode every case, and vague guidance that assumes shared context. Aim for clear principles plus a few concrete anchors.

## 3. Instruction clarity

- **Be explicit about the action wanted.** "Can you suggest changes?" yields suggestions. "Change this function" yields edits. If you want above-and-beyond effort, ask for it.
- **State scope explicitly.** Modern models are literal and do not silently generalize: write "Apply this to every section, not just the first."
- **Say what to do, not just what not to do.** Prefer "Write in flowing prose paragraphs" over "Don't use markdown."
- **Make thresholds concrete.** "Only report bugs that cause incorrect output or crashes" beats "only important bugs." A vague filter makes literal models under-report or over-report.
- **Use numbered steps only when order or completeness matters.** For open reasoning, a general "think it through before answering" usually beats a hand-scripted plan.
- **One short general rule beats an enumeration** when the model can generalize from it.
- **Audit for contradictions.** Conflicting rules either get resolved arbitrarily (later one wins) or burn reasoning effort. Example conflict: "never book without consent" alongside "auto-book the earliest slot."

## 4. Examples (few-shot)

- **3–5 examples that are relevant, diverse, and canonical.** Don't use a laundry list of edge cases. Wrap them in `<example>` / `<examples>` tags.
- **Examples are the most reliable lever for exact format and tone.** Showing one input→output pair beats a paragraph describing the shape.
- **Prefer positive examples.** If you do include a bad example, pair it with the good version and a short rationale.
- **Vary the examples** so the model doesn't copy phrasing verbatim, and tell it the examples are illustrative when that's the case.
- **Every behavior an example shows should also exist as a stated rule.** Otherwise the model may treat it as coincidence.
- Examples can include reasoning (`<thinking>…</thinking>`) to demonstrate a reasoning style.

## 5. Output format

- **Specify the output contract:** field names, types, allowed values, length limits, preamble or not, stopping point, and what to return when data is missing.
- **Prompt style leaks into output style.** A heavily-markdown prompt yields markdown-heavy replies. Write the prompt in the style you want back.
- **Machine-parsed output → use API structured outputs** (JSON schema / strict tools) rather than prompt pleading. See [DIAGNOSIS.md](DIAGNOSIS.md). Still keep a one-line format description in the prompt.
- **Kill preambles directly:** "Respond directly without preamble." Where assistant prefill is unsupported or conflicts with structured outputs, use structured outputs, tool enums, or that instruction instead.
- **Verbosity:** say the length you want ("2–4 sentences", "under 150 words"). In long chats, format drift grows, so restate format rules in the system prompt, not once in a user turn.

## 6. Tool and agent prompts

- **Tool descriptions are prompts.** Write them for a new hire: when to use the tool, when not to, and what each parameter means. Use unambiguous param names (`user_id`, not `user`), actionable error messages, and designs that are hard to misuse (e.g. require absolute paths). If a human can't tell which tool applies, neither can the model.
- **Set the action default explicitly:** act vs. propose first. Name the risky actions that need confirmation (destructive, irreversible, externally visible), with examples.
- **Scale certainty to risk.** Low-risk actions such as reading and searching can proceed on low certainty. High-risk actions such as writing, sending, or paying need high certainty or confirmation.
- **Agentic reminders:** keep going until the task is done, not until the first plausible stop; use tools to check facts instead of guessing; ground progress claims in actual tool results.
- **Parallelism:** tell the model to issue independent tool calls in parallel.
- **Delegation:** say when subagents are and aren't appropriate. Models vary between over-delegating and under-delegating.
- **Define early-stop criteria** for context gathering ("stop searching once you can name the file to change").

## 7. Anti-patterns → fixes

| Symptom | Fix |
|---|---|
| Tool over-triggers, over-exploration | Remove `CRITICAL: You MUST use X` / "if in doubt, use X". Write "Use X when …". |
| Aggressive ALL-CAPS everywhere | Newer models over-react. Save caps for true hard constraints and always give a reason. |
| Old prompt makes a newer model worse | Prompts from older models are often too prescriptive. Delete rules and re-evaluate. Tone down anti-laziness nagging. |
| Over-verification, slow replies | Remove blanket "double-check everything" / "think very carefully" lines. Use the API's reasoning/effort controls instead. |
| Asking for visible reasoning in the answer causes refusals or bloat | On reasoning models, read the thinking output instead of asking the model to reproduce it. |
| Rule applied too narrowly | State scope explicitly ("every item", "all sections"). |
| "Avoid generic style" just swaps one default for another | Name the concrete patterns to avoid, or give a concrete spec. |
| Sample phrases parroted verbatim | Say the examples are illustrative and should be varied. |
| Prompt grows each iteration, still fails | Stop adding text. Diagnose (see [DIAGNOSIS.md](DIAGNOSIS.md)). |

## 8. Evaluation and iteration

- **Before writing, define success criteria and a small test set** that includes edge cases. Not every failure is a prompt problem: model choice, context, and API settings also matter.
- **Start minimal on a capable model.** Add instructions and examples only for failures you observe.
- **Re-run on the whole set after every change.** Include inputs that previously passed, to catch regressions.
- **Re-evaluate on every model upgrade.** Pin model versions in production.
- **Metaprompting:** ask the model which minimal additions or deletions would produce the desired behavior, then verify against the test set.
- **Split multi-step tasks** into chained calls (draft → review → refine) rather than one mega-prompt.

## Where sources disagree

- **Instruction placement in long context.** OpenAI puts instructions at the top and the bottom. Anthropic and Google put data first and the question last. Reconciled: stable instructions go in the system prompt, long docs go before the question in the user turn, and an optional reminder goes at the end.
- **Few-shot always?** Google: always include examples. Anthropic: 3–5 canonical examples. OpenAI reasoning models: high-level guidance often suffices. Add examples when format or tone is exact, and skip them for simple tasks.
- **Emphasis.** Use caps sparingly, only for hard constraints, and always pair them with a reason.
- **Planning.** Some guides prescribe "plan extensively before each call." Anthropic prefers general "think thoroughly" plus API-level reasoning controls over scripted plans.

Model-specific quirks change each release. Check the provider's current prompting guide for the target model before finalizing.

## Sources

- Anthropic prompting best practices — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Anthropic prompt engineering overview — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Writing tools for agents — https://www.anthropic.com/engineering/writing-tools-for-agents
- Building effective agents — https://www.anthropic.com/engineering/building-effective-agents
- Prompt caching — https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Structured outputs — https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Published claude.ai system prompts — https://platform.claude.com/docs/en/release-notes/system-prompts
- OpenAI GPT-4.1 prompting guide — https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide
- OpenAI GPT-5 prompting guide — https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide
- OpenAI prompt engineering — https://developers.openai.com/api/docs/guides/prompt-engineering
- Google Gemini prompting strategies — https://ai.google.dev/gemini-api/docs/prompting-strategies
