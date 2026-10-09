# Contributing

This is a small personal project. Contributions are welcome, but there's no formal
process beyond what's below.

## Setup

```bash
git clone https://github.com/jimmyjames177414/claude-memory-atlas.git
cd claude-memory-atlas
npm install
npm run build
npm test
```

Node 20 or 22 to run the full test suite (`npm test`) - vitest's own tooling needs
20+ to even start. The built CLI itself still supports Node 18 (see the CI workflow
for how that's verified separately). `.nvmrc` points at 20.

## Before opening a PR

- `npm test` passes.
- `npm run build` succeeds.
- New behavior gets a test - see `test/*.test.ts` for the existing style. Fixture
  memory files under `test/fixtures/` must stay fictional (no real names, companies,
  or projects) - they're also what this repo's own README screenshot is generated from.

## Reporting bugs / security issues

Regular bugs: open an issue. Anything security-related, including anything touching
the unsanitized-HTML trust note in the README: see [SECURITY.md](./SECURITY.md) instead.
