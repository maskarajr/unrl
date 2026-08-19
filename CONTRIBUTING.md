# Contributing

## Setup

```bash
npm ci
npm test
npm run build
```

`npm run test:live` hits public RPCs (flaky). Do not add secrets to git. Lab under `test/` is local-only (gitignored).

## Branches

**Maintainers** push to `main`. That is the production branch and the release source.

**Everyone else:** work on a **feature branch**, then open a PR **into `main`**. Do not push to `main`.

```bash
git checkout -b feat/your-change
# commit
git push -u origin HEAD
gh pr create --base main
```

## Test a PR without merging

CI already runs on the PR. Locally:

```bash
gh pr checkout 12
npm ci
npm test
npm run lab   # optional
```

Switch back with `git checkout main`.

## PR rules

- Keep the SDK thin: TLD routing, not profiles/avatars/L2 pickers
- Offline tests in `src/**/*.test.ts` for behavior changes
- Add a `CHANGELOG.md` entry under **Unreleased** when the PR changes shipped behavior
- Do not commit `.env`, `dist/`, or `test/`
