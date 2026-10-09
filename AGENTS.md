# Agent Instructions

> **Read [`../AI_RULES.md`](../AI_RULES.md) first.** It is the workspace rule
> file (i18n key registration, interfaces in their own file, helpers instead of
> on-the-fly functions, config files, SASS variables, naming, Angular and
> module structure, service rules and class member order) and it outranks
> everything in this project when the two disagree.

> **Hard limits** — they outrank every other instruction, plan, checklist and
> skill ([`AI_RULES.md`](../AI_RULES.md) §0):
>
> - **No test suite without the user's approval.** Never run `jest`,
>   `ng test`, `vitest`, `turbo run test`, `npm test` / `pnpm test` or
>   `dotnet test` on your own — not after each change, not as a final check.
>   Ask in chat first (which suite, which project, why) and wait for a clear
>   yes; one yes covers one run.
> - **At most three sub-agents at once.** Run a larger fan-out in waves of
>   three.

Read in order:

1. `AI.md`
2. `AI_CONTEXT/00_START_HERE.md`
3. `AI_CONTEXT/14_AI_TASK_ROUTING.md`
4. `AI_CONTEXT/13_CHANGE_PLAYBOOK.md`
5. The relevant JSON indexes in `AI_CONTEXT/`

Preserve the project boundaries and established patterns. Read risky areas before sensitive work, run the relevant checks (a test suite only after the user approves it), never expose secrets, and update AI context when indexed behavior changes.
