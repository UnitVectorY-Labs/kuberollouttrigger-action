---
name: github-release
description: Release a new version of kuberollouttrigger-action to GitHub. Use when the user asks to cut, publish, or tag a new release/version. Bumps the npm package and lockfile versions, validates and bundles the JavaScript action, commits and pushes to main, tags the release, and creates a GitHub release with generated notes.
---

# GitHub Release

Cut a new version of this project and publish it on GitHub.

Versioning is strict: the new version must be **exactly one segment** bumped from the current version, with all lower segments reset to `0`.

## Procedure

Work through these steps in order. Stop and report to the user if any step fails.

### 1. Verify preconditions

All of the following must be true, otherwise stop and tell the user what is wrong:

- Working tree is clean: `git status --porcelain` returns nothing.
- On the `main` branch: `git branch --show-current` prints `main`.
- Up to date with remote: run `git fetch origin`, then confirm local `main` matches `origin/main` (e.g. `git rev-list --left-right --count main...origin/main` prints `0 0`).

### 2. Determine the target version

Read the current version from the top-level `version` field in `package.json`. Confirm it matches the top-level version and root package version (`packages[""].version`) in `package-lock.json`.

- **If the user's prompt already specifies a version**, use it, but validate it (step 3).
- **If no version was provided**, ask the user which of the three valid next versions to release. Present exactly the three options computed in step 3 (e.g. for current `1.1.1`: `1.1.2` (patch), `1.2.0` (minor), `2.0.0` (major)) and wait for their choice.

### 3. Validate the version is a strict single-segment bump

Given current version `X.Y.Z`, the only valid next versions are:

- patch: `X.Y.(Z+1)`
- minor: `X.(Y+1).0`
- major: `(X+1).0.0`

If the target version is not exactly one of these, stop and tell the user it is not a valid next version, listing the three valid options. Do not proceed.

### 4. Bump the version and validate the JavaScript action

Use Node.js 24, matching `action.yml`. Update both npm manifests without creating a commit or tag:

```sh
npm version <NEW_VERSION> --no-git-tag-version
npm ci
npm run lint
npm run bundle
```

This repository has no test script. The lint command checks source syntax, and the bundle command builds the committed `dist/` files used by `action.yml`, matching `.github/workflows/check-dist.yml`.

Confirm `package.json`, the top-level version in `package-lock.json`, and `packages[""].version` all equal the target version. Verify `dist/index.js` exists, review the diff, and ensure only the two manifests and expected generated `dist/` files changed. Re-run `npm run bundle` and confirm it produces no additional changes to `dist/`.

If validation or bundling fails, stop and report the failure. Do not release.

### 5. Commit and push to main

Commit the version changes and all generated bundle changes together:

```sh
git add package.json package-lock.json dist/
git diff --cached --check
git commit -m "bump: version <NEW_VERSION>"
git push origin main
```

Use the exact commit-message format `bump: version <NEW_VERSION>`. Confirm the check-dist workflow succeeds for this commit before tagging.

### 6. Tag the release

Create a **lightweight** tag (no `-a`/`-m`, matching existing tags) on the new commit and push it:

```
git tag v<NEW_VERSION>
git push origin v<NEW_VERSION>
```

Only create the full `vX.Y.Z` tag. This repository has no `release.yml` workflow to manage moving tags; do not create or move `vX.Y` or `vX` tags unless the user explicitly requests them.

### 7. Create the GitHub release

Create a published (not draft) release with GitHub-generated notes:

```
gh release create v<NEW_VERSION> --generate-notes
```

Do not pass `--draft`. This publishes the release immediately.

### 8. Verify the published release

Confirm the remote version tag points at the release commit and inspect the published release:

```sh
git rev-parse HEAD
git ls-remote origin refs/tags/v<NEW_VERSION>
gh release view v<NEW_VERSION> --json url,tagName,isDraft,targetCommitish
```

The remote tag SHA must match the release commit, and `isDraft` must be `false`.

## Done

Report the new version, release URL, release commit SHA, and successful validation and bundle checks.
