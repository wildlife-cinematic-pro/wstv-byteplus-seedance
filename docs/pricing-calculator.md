# Pricing Calculator

The toolkit uses official BytePlus ModelArk pricing docs verified on 2026-06-15 for Seedance 2.0 model-specific estimates.

Important:

- Estimates are labelled `ESTIMATED`.
- Console billing is final.
- Returned task `usage.completion_tokens` is the best reconciliation value after a real task.
- Do not use one default rate for every model.
- When input includes video, Seedance 2.0 has different rates and minimum token rules.

Example:

```bash
python3 scripts/cost_calculator.py --duration 15 --resolution 720p --ratio 9:16 --max-cost-usd 3
```

If `passes` is false, do not submit.
