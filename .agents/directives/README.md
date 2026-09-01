# Layer 1: Directives (SOPs)

This directory contains standard operating procedures (SOPs) written in Markdown.

## How to write Directives:
Each directive should clearly specify:
1. **Goal**: What the task accomplishes.
2. **Inputs**: What parameters, files, or data the task expects.
3. **Execution Tools**: Which Python scripts in `execution/` should be run.
4. **Outputs / Deliverables**: Where final results should be uploaded (e.g. Google Sheets/Slides) and intermediate data location (`.tmp/`).
5. **Edge Cases & Error Handling**: What to do when rate limits, network failures, or invalid inputs occur.
6. **Learnings & Changelog**: Updates discovered during self-annealing.

---

## Directives Index

- [`template_directive.md`](./template_directive.md) - Standard template for authoring new directives.
