# CLAUDE.md

## Stack

- Node 20, TypeScript strict, Prisma ORM

- Tests: Vitest, no Jest

## Constraints

- Never use `any`. Use `unknown` + type guards.

- Controllers call services. Services call DB. Never bypass.

## Naming

- Files: kebab-case. Classes: PascalCase. Hooks: use* prefix.
