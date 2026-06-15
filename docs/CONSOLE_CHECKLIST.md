# BytePlus Console Checklist

Before any paid task, verify:

- Region is AP-Southeast.
- ModelArk is enabled.
- `dreamina-seedance-2-0-260128` is activated.
- Billing method and budget are understood.
- Current rates match `config/models.json` or are updated with source/date.
- Account rate limits and concurrency are acceptable.
- API key has minimum required permission.
- The Playground REST sample has been copied and redacted.
- Failed-task billing behavior is understood from Console/docs.
- Output URL expiration behavior is understood.

After any paid task, verify:

- Task ID exists in Console.
- Status and usage match local `data/tasks.jsonl`.
- Actual billed amount is recorded outside this repo if needed.
- Output video was downloaded before URL expiry.
