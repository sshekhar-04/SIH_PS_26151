# Directive: [Task Name]

## 1. Objective
Briefly describe what this workflow accomplishes and what business goal it serves.

## 2. Inputs
- `input_param_1`: Description and format.
- `input_file`: Path to input dataset (if applicable).

## 3. Execution Tools
- Script: [`execution/your_script.py`](../execution/your_script.py)
- Command format:
  ```bash
  python execution/your_script.py --input <value> --out-tmp .tmp/output.json
  ```

## 4. Intermediate vs Deliverable Outputs
- **Intermediate (`.tmp/`)**: Temporary JSON/CSV processing files saved to `.tmp/`.
- **Deliverable**: Google Sheets, Google Slides, or target cloud storage URL.

## 5. Edge Cases & Known Constraints
- **Rate Limits**: Limit requests to X per second.
- **Missing Data**: Fallback behavior if specific fields are unavailable.

## 6. Self-Annealing & Learnings Log
- *YYYY-MM-DD*: Initial directive creation.
- *YYYY-MM-DD*: Document any bugs fixed or API constraints encountered during execution.
