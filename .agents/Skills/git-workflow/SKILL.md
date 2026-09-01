---
name: git-workflow
description: >-
  Provides standard procedures for git version control, branch management,
  conventional commits, resolving merge conflicts, and creating pull requests.
  Use when the user asks for help with git operations, commit messages, branching strategies, or PR preparation.
---

# Git Workflow & Best Practices

This skill guides the agent through structured, safe, and professional Git operations.

---

## 1. Branching Strategy

Follow a feature-branch workflow:
- **`main` / `master`**: Production-ready code. Never commit directly to `main` without review or testing.
- **`develop`**: Integration branch for features (if using GitFlow).
- **Feature Branches**: `feat/<short-description>` (e.g., `feat/auth-jwt-login`).
- **Bug Fix Branches**: `fix/<short-description>` (e.g., `fix/null-pointer-user-service`).
- **Chore / Refactor Branches**: `chore/<short-description>` or `refactor/<short-description>`.

---

## 2. Conventional Commits Standard

Format commit messages using the **Conventional Commits** specification:

```text
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: A new feature for the user or system.
- `fix`: A bug fix.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect code meaning (white-space, formatting, semicolons).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to build process, auxiliary tools, or dependencies.

### Commit Examples:
- `feat(auth): implement JWT token generation and refresh endpoint`
- `fix(user-service): handle empty email during user registration`
- `refactor(database): optimize JPA query with Join Fetch to avoid N+1`
- `docs(readme): add setup and environment variables guide`

---

## 3. Standard Git Operational Workflows

### A. Creating and Switching to a Feature Branch
```bash
git checkout -b feat/my-new-feature
```

### B. Staging and Committing Changes
1. Check status:
   ```bash
   git status
   ```
2. Inspect exact diff before staging:
   ```bash
   git diff
   ```
3. Stage intended files:
   ```bash
   git add <file1> <file2>
   ```
4. Commit with descriptive conventional message:
   ```bash
   git commit -m "feat(module): descriptive message"
   ```

### C. Syncing with Remote & Handling Conflicts
1. Fetch latest changes:
   ```bash
   git fetch origin
   ```
2. Rebase or merge upstream changes:
   ```bash
   git pull --rebase origin main
   ```
3. If conflicts occur:
   - Identify conflicting files using `git status`.
   - Inspect markers (`<<<<<<<`, `=======`, `>>>>>>>`).
   - Resolve conflict logically, test the code, then run:
     ```bash
     git add <resolved-file>
     git rebase --continue
     ```

### D. Preparing a Pull Request Checklist
- [ ] All automated unit & integration tests pass.
- [ ] Code is formatted and linted.
- [ ] No extraneous debug logs, secrets, or temporary files committed.
- [ ] Meaningful commit history without repetitive fix-up commits.
