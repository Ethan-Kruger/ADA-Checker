# Command definition

name: test-and-fix

description: Run full test suite, fix TypeScript errors, lint

steps:

- run: npx vitest run --reporter=verbose

- fix: all TypeScript errors in changed files

- run: npx eslint src --fix

- summarise: what broke, what was fixed, remaining issues
