# Antigravity Workspace Skills Catalog

This directory contains workspace-specific custom skills configured for Antigravity.

Skills are modular runbooks that teach the AI agent specific workflows, domain best practices, and procedures. Antigravity automatically discovers skills in the `.agents/skills/<skill-name>/SKILL.md` directory structure.

---

## 🚀 Newly Configured Engineering Skills

| Skill | Path | Description & Triggers |
| :--- | :--- | :--- |
| **`atc-voice-agent-architecture`** | [SKILL.md](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/atc-voice-agent-architecture/SKILL.md) | Enterprise voice agents, microservices monorepo, 7-layer Redis caching, LangGraph state machines, RS256 JWKS auth, React 4-layer architecture, and Qdrant RAG. |
| **`git-workflow`** | [SKILL.md](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/git-workflow/SKILL.md) | Branching strategies, Conventional Commits specification, merge conflict resolution, and PR checklists. |
| **`code-review`** | [SKILL.md](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/code-review/SKILL.md) | 4-pillar review checklist (Correctness, Security/OWASP, Performance/N+1, Maintainability) and structured feedback format. |
| **`api-testing`** | [SKILL.md](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/api-testing/SKILL.md) | REST API verification, HTTP status code matrix, payload validation testing, and cURL snippets. |
| **`spring-boot-dev`** | [SKILL.md](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/spring-boot-dev/SKILL.md) | Spring Boot 3.x layered architecture, JPA query optimization, `@RestControllerAdvice`, DTO records, and validation. |
| **`fullstack-node-react`** | [SKILL.md](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/fullstack-node-react/SKILL.md) | Node.js/Express backend patterns, React component architecture, custom hooks, Axios interceptors, and error handling. |

---

## 📚 Complete Workspace Skills Directory

### 💻 Development, Architecture & Engineering
- [atc-voice-agent-architecture](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/atc-voice-agent-architecture/SKILL.md) - Enterprise voice agents, LangGraph state machines, 7-layer Redis cache, zero-trust JWKS auth, and Qdrant RAG.
- [git-workflow](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/git-workflow/SKILL.md) - Git branching, commits, conflict resolution, PR workflows.
- [code-review](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/code-review/SKILL.md) - Rigorous code review across correctness, security, performance, and maintainability.
- [api-testing](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/api-testing/SKILL.md) - REST API testing, status contracts, and payload validation.
- [spring-boot-dev](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/spring-boot-dev/SKILL.md) - Enterprise Spring Boot 3.x & Java layered architecture.
- [fullstack-node-react](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/fullstack-node-react/SKILL.md) - Node.js/Express backend and React frontend development.
- [webapp-testing](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/webapp-testing/SKILL.md) - End-to-end web application testing.
- [mcp-builder](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/mcp-builder/SKILL.md) - Model Context Protocol server creation and integration.
- [claude-api](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/claude-api/SKILL.md) - Integration with Anthropic Claude APIs.

### 🎨 UI/UX & Design
- [frontend-design](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/frontend-design/SKILL.md) - Frontend interface design principles and modern aesthetics.
- [canvas-design](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/canvas-design/SKILL.md) - Canvas rendering and graphics manipulation.
- [algorithmic-art](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/algorithmic-art/SKILL.md) - Procedural and mathematical visual art generation.
- [theme-factory](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/theme-factory/SKILL.md) - Cohesive theme palettes and style tokens.
- [brand-guidelines](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/brand-guidelines/SKILL.md) - Visual branding and identity enforcement.
- [web-artifacts-builder](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/web-artifacts-builder/SKILL.md) - Interactive web components and widgets.
- [slack-gif-creator](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/slack-gif-creator/SKILL.md) - Animated GIFs and media creation.

### 📄 Document & Office Processing
- [docx](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/docx/SKILL.md) - Word document generation, styling, and parsing.
- [xlsx](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/xlsx/SKILL.md) - Excel spreadsheets, formulas, and data processing.
- [pptx](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/pptx/SKILL.md) - PowerPoint presentation creation and design.
- [pdf](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/pdf/SKILL.md) - PDF document generation and extraction.
- [doc-coauthoring](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/doc-coauthoring/SKILL.md) - Structured technical document co-authoring.
- [internal-comms](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/internal-comms/SKILL.md) - Engineering updates, memos, and executive communication.

### ⚙️ Meta & Skill Creation
- [skill-creator](file:///c:/Users/shrey/OneDrive/Desktop/.agents/skills/skill-creator/SKILL.md) - Skill authoring workflows for creating new custom skills.

---

## 🛠️ How Workspace Skills Work

### 1. Structure of a Skill
Every skill lives in its own subdirectory inside `.agents/skills/`:
```text
.agents/skills/<skill-name>/
├── SKILL.md          # Required: Main instruction file with YAML frontmatter
├── scripts/          # Optional: Automated helper scripts
├── examples/         # Optional: Code examples or templates
└── references/       # Optional: Extended documentation
```

### 2. Frontmatter Configuration
Each `SKILL.md` must start with valid YAML frontmatter:
```yaml
---
name: your-skill-name
description: >-
  Describe what the skill accomplishes and when the agent should activate it.
---
```

### 3. Progressive Disclosure
Antigravity automatically discovers skills in `.agents/skills/`. Only skill names and descriptions are loaded into the initial context window; the full content of `SKILL.md` is loaded dynamically on-demand when relevant to your prompt.
