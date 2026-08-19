# Contributing

## Setup

```bash
npm ci
npm test
npm run build
```

`npm run test:live` hits public RPCs (flaky). Do not add secrets to git. Lab under `test/` is local-only (gitignored).

## Branches

| Branch | Role |
|--------|------|
| `develop` | Integration. **Open PRs here.** |
| `main` | Production. Only fast-forward from `develop` after you have tested. |

Do not PR straight to `main`.

## Test a PR without merging

CI already runs on the PR. To run it locally (no merge, `main` untouched):

```bash
gh pr checkout 12
npm ci
npm test
npm run lab   # optional
```

Switch back with `git checkout develop`.

After you are happy: merge the PR into `develop`, live-test that branch, then open `develop` → `main`. Tag a GitHub Release on `main` to publish.

## PR rules

- Keep the SDK thin: TLD routing, not profiles/avatars/L2 pickers
- Offline tests in `src/**/*.test.ts` for behavior changes
- Add a `CHANGELOG.md` entry under **Unreleased** when the PR changes shipped behavior
- Do not commit `.env`, `dist/`, or `test/`

## Release

Each GitHub Release is the source of truth for that version (notes = changelog section).

1. On `develop`: bump `package.json` version, move **Unreleased** into `CHANGELOG.md` as `## x.y.z`
2. PR `develop` → `main` and merge
3. GitHub → **Releases** → tag `vX.Y.Z` on `main`, paste that changelog section
4. `Publish` workflow:
   - npmjs (`@maskarajr/unrl`) via Trusted Publishing
   - GitHub Packages (sidebar **Packages**)

One-time npm setup: package → **Trusted Publisher** → GitHub Actions:

- Organization or user: `maskarajr`
- Repository: `unrl`
- Workflow filename: `publish.yml`
