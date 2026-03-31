## Contribution Guidelines

Keep this project aligned with the actual product: a GitHub App that publishes a required PR check instead of mutating pull requests directly.

### Product Constraints

* The app must evaluate pull requests on `opened`, `reopened`, `ready_for_review`, `synchronize`, `labeled`, and `unlabeled`.
* Enforcement happens through a GitHub check run. Do not auto-close PRs.
* Repository owners must be able to tune thresholds, languages, bypass labels, and ignored files through `.github/pr-size-enforcer.yml`.

### Engineering Rules

* Keep the default ignore list conservative and additive. Repo config should extend it, not replace it silently.
* Preserve backward compatibility for existing config fields such as `max_loc`, `ignored_suffixes`, `ignored_files`, `ignored_patterns`, and `no-auto-close`.
* Add tests for every behavior change in counting logic, config loading, or check-run output.

### Verification

Run these before you consider work complete:

```bash
npm test
```

If you touch linting or formatting, also run:

```bash
npm run lint
```
