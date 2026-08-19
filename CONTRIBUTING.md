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

One manual workflow publishes **both** npmjs and GitHub Packages. No separate npm CLI / GitHub Packages steps.

1. Merge `develop` → `main` after you have tested
2. Actions → **Publish** → Run workflow
   - `bump`: `patch` / `minor` / `major`
   - `branch`: `main`
   - `dry_run`: tick to rehearse without pushing or publishing
3. The job bumps semver, cuts `CHANGELOG.md`, tags `vX.Y.Z`, opens the GitHub Release, then `npm publish` to npmjs **and** GitHub Packages

Do not create GitHub Releases by hand — that used to be a second publish path.

### npm Trusted Publisher (once)

On https://www.npmjs.com/package/@maskarajr/unrl/access :

- Publisher: **GitHub Actions**
- Organization or user: `maskarajr`
- Repository: `unrl`
- Workflow filename: `publish.yml`
- Environment: leave empty

OIDC is compatible with 2FA. Do not add `NPM_TOKEN`.
