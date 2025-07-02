## 🤖 LLM Contribution Guidelines

These rules must be followed to ensure generated code is **easy to review**, **safe to merge**, and **ready for CI/CD pipelines**.

---

### 📏 1. Pull Request Size

* **🚫 PRs must not exceed 500 lines changed** (additions + deletions).
* Break into multiple PRs if needed.
* Files in `*.lock`, `*.snap`, `yarn.lock`, `package-lock.json` are **excluded from the count**.

---

### 🎯 2. Linter & Formatter

* Use **[ESLint](https://eslint.org/)** with the **Airbnb config**.
* Run `npm run lint` before pushing.

```bash
# install
npm install eslint eslint-config-airbnb-base eslint-plugin-import --save-dev

# run
npm run lint
```

* **Code must be auto-formatted** using [Prettier](https://prettier.io/).

---

### 🧪 3. Testing Rules

* All business logic must be covered by **unit tests** using [Jest](https://jestjs.io/).
* Add **integration tests** if PR affects app behavior or APIs.
* Add tests in `__tests__/` or next to the source files.

✅ Always include:

```bash
npm run test
```

---

### 📈 4. Code Coverage

* Minimum **80% coverage** required on new code.
* Coverage reports must be visible in PR.
* Add `jest.config.js` with:

```js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

---

### 📝 5. Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>
```

Examples:

```bash
feat(pr-check): add threshold logic for LOC check
fix(webhook): handle malformed PR payloads gracefully
chore(ci): add render.yaml for deployment
```

Use `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, etc.

---

### 🔖 6. Git Tagging (Releases)

* Tag all stable PRs after merge using **semantic versioning**:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

* Use `vX.Y.Z` format only.

---

### ✅ Summary Checklist

Before pushing code, **you must ensure**:

* [ ] PR changes ≤ 500 LOC (excluding ignored files)
* [ ] Lint passes (`npm run lint`)
* [ ] Tests exist for all logic
* [ ] Code coverage ≥ 80%
* [ ] Commit messages follow Conventional Commits
* [ ] Tagged appropriately if publishing
