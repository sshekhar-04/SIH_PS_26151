# Layer 3: Execution Scripts

This directory contains deterministic Python scripts that handle the actual work (API calls, data transformations, database/cloud interactions).

## Rules for Execution Scripts:
1. **Deterministic & Testable**: Scripts should accept command-line arguments and return clear exit codes and structured JSON output.
2. **Environment Variables**: Load secrets and credentials from `.env` using `python-dotenv`.
3. **Intermediates in `.tmp/`**: Write local files only to the `.tmp/` directory.
4. **Error Handling**: Output clear error messages and stack traces to facilitate agent self-annealing.
5. **Well-Commented**: Include docstrings and comments explaining non-trivial logic.
