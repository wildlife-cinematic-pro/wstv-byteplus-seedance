# Security

## Secrets

Never commit or print:

- `ARK_API_KEY`
- `BYTEPLUS_API_KEY`
- `Authorization` headers
- signed output URLs with query strings
- real `.env` files

## Submission Safety

Paid task creation is locked by default. A submit request requires:

- `--submit`
- `--max-cost-usd`
- `--confirm SUBMIT_ONE_PAID_TASK`
- local `ARK_API_KEY`
- verified redacted Playground REST sample
- duplicate fingerprint check
- writable task log

No automatic retry is allowed for create-task requests.

## Duplicate Prevention

The toolkit hashes safe request fields:

- model
- prompt hash
- input media identifier hash
- duration
- resolution
- ratio
- audio setting
- watermark setting

Identical active or recent submissions are blocked unless explicitly overridden.

## Revoking A Leaked Key

Open BytePlus API Key management, delete or disable the leaked key, create a new key, update your local environment, and audit GitHub history/logs.
