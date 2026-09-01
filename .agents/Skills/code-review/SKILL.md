---
name: code-review
description: >-
  Provides structured guidelines and checklists for performing comprehensive code reviews,
  identifying security vulnerabilities, detecting performance bottlenecks, and enforcing clean code standards.
  Use when the user asks to review code, PRs, diffs, or check for bugs and best practices.
---

# Code Review Guidelines & Checklist

This skill guides the agent through performing rigorous, constructive, and actionable code reviews.

---

## 1. Review Dimensions

When reviewing code or a proposed change, evaluate across four core pillars:

### Pillar 1: Correctness & Logic
- Does the code meet the functional requirements?
- Are edge cases handled (e.g., `null`/`undefined`, empty lists, division by zero, invalid input formats)?
- Are concurrency / race conditions possible in multithreaded or async environments?
- Are transactions properly isolated and rolled back on exceptions?

### Pillar 2: Security & Vulnerabilities (OWASP Top 10)
- **Injection**: Are SQL, JPQL, or shell queries parameterized?
- **Authentication & Authorization**: Are endpoints guarded with appropriate role/permission checks?
- **Data Exposure**: Are sensitive fields (passwords, tokens, PII) masked or excluded from API responses and log statements?
- **Input Validation**: Is incoming payload strictly validated on the backend before processing?
- **CORS / CSRF / Headers**: Are secure communication policies configured?

### Pillar 3: Performance & Scalability
- **Database Access**: Are there N+1 query problems? Are appropriate indexes and join fetch queries used?
- **Memory & Resource Leaks**: Are database connections, HTTP response streams, and file handles properly closed (e.g., `try-with-resources`)?
- **Time Complexity**: Are loops, sorting, or collection operations optimized?
- **Caching**: Are expensive, idempotent calculations or lookups cached where appropriate?

### Pillar 4: Maintainability & Clean Architecture
- **Single Responsibility Principle (SRP)**: Do classes, functions, and components have a clear single responsibility?
- **Naming Conventions**: Are variable, function, and class names descriptive and aligned with domain terminology?
- **DRY (Don't Repeat Yourself)**: Is duplicate business logic extracted into reusable utility functions or services?
- **Error Handling**: Are specific exceptions caught rather than generic `catch (Exception e)`?

---

## 2. Review Output Format

Structure review comments clearly into categories:

```markdown
## Code Review Summary

### 🚨 Critical / Blocker Issues
- **[File:Line]**: Issue description, why it matters, and exact fix suggestion.

### ⚠️ Improvements & Best Practices
- **[File:Line]**: Non-critical suggestions for cleaner code, readability, or minor performance gains.

### 💡 Positive Highlights
- Well-implemented patterns or smart simplifications noticed in the change.

### 📋 Actionable Diff / Recommended Fix
```<language>
// Suggested refactoring snippet
```
```
