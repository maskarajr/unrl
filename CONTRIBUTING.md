# Contributing

## Setup

```bash
npm ci
npm test
npm run build
```

`npm run test:live` hits public RPCs (flaky). Do not add secrets to git. Lab under `test/` is local-only (gitignored).

## PRs

- Target `main`
- Keep the SDK thin: TLD routing, not profiles/avatars/L2 pickers
- Offline tests in `src/**/*.test.ts` for behavior changes
- Do not commit `.env`, `dist/`, or `test/`

## Release

1. Bump `package.json` version and add a `CHANGELOG.md` entry
2. Push `main`, then GitHub **Release** tag `vX.Y.Z`
3. `Publish` workflow runs `npm publish` via npm Trusted Publishing (OIDC)

One-time npm setup: package → **Trusted Publisher** → GitHub Actions:

- Organization or user: `maskarajr`
- Repository: `unrl`
- Workflow filename: `publish.yml`
