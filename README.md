## `pr-size-enforcer`

GitHub App that fails a pull request check when a PR is too large.

The app does not close pull requests. It creates a check run on the PR head commit so you can wire it into branch protection and block merges until the PR is split down.

### What It Does

* Counts changed lines as `additions + deletions`
* Ignores generated, lock, snapshot, and build artifacts by default
* Supports repository-level overrides for ignored files and glob patterns
* Can count only selected languages, or ignore specific languages
* Supports bypass labels for exceptional cases

### Default Behavior

* Threshold: `500` changed lines
* Check name: `PR Size Enforcer`
* Bypass labels: `pr-size:ignore`, `no-auto-close`
* Default ignored files come from `ignore-config.json`

### Repository Config

Create `.github/pr-size-enforcer.yml` in any repository where the app is installed.

```yaml
max_changed_lines: 500
check_name: PR Size Enforcer

bypass_labels:
  - pr-size:ignore

only_languages:
  - javascript
  - typescript
  - go

ignore_languages:
  - markdown

ignored_files:
  - package-lock.json
  - docs/generated.md

ignored_patterns:
  - "**/dist/**"
  - "**/coverage/**"
  - "**/vendor/**"

ignored_suffixes:
  - .snap
  - .min.js
```

Notes:

* `max_loc` is still accepted as a legacy alias for `max_changed_lines`.
* `languages` is accepted as a legacy alias for `only_languages`.
* The repo config adds to the built-in ignore list; it does not remove the defaults.

### GitHub App Permissions

The app manifest needs:

* `checks: write`
* `pull_requests: read`
* `contents: read`

### Local Development

1. Copy values from `.env.example` into a local `.env`.
2. Provide your GitHub App private key at `PRIVATE_KEY_PATH`.
3. Start the app:

```bash
npm start
```

### Tests

```bash
npm test
```
