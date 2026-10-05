# Posty5 n8n Nodes - Claude Entry Point

> **Read [`../AI_RULES.md`](../AI_RULES.md) first.** It holds the workspace-wide
> rules (i18n key registration, interfaces in their own file, helpers instead of
> on-the-fly functions, config files, SASS variables, naming, module structure,
> and Angular and service rules) and outranks everything in this project when
> the two disagree.

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

Use `AI.md` as the canonical instructions. Then read `AI_CONTEXT/00_START_HERE.md`, `AI_CONTEXT/14_AI_TASK_ROUTING.md`, and the relevant indexes before editing. Keep project documentation synchronized with architectural changes.
