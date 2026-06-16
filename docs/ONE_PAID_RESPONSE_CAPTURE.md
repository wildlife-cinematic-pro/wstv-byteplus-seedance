# Controlled One-Paid-Task Response Capture

Purpose: capture one redacted official create-task response body so the response task ID field can be verified.

Do not run this until all are true:

- BytePlus Console billing, region, quota, and model access are verified.
- You have a local `ARK_API_KEY`; never commit or print it.
- `scripts/doctor.py` has been reviewed.
- Request schema is verified from the redacted official sample.
- You accept the exact `--max-cost-usd` value.
- You understand this may create one paid task.

Manual command to run later:

```bash
python3 scripts/generate_video.py \
  --prompt-file prompts/wstv-wildlife-template.txt \
  --image-url "https://example.com/master-image.jpg" \
  --duration 15 \
  --ratio 9:16 \
  --resolution 720p \
  --max-cost-usd 3 \
  --confirm SUBMIT_ONE_PAID_TASK \
  --capture-create-response \
  --submit
```

Expected behavior after the manually approved call:

- Save a redacted request preview.
- Save a redacted create-task response JSON under `outputs/create-response-captures/`.
- Record timestamp, model ID, estimated cost, and task ID field candidates.
- Append safe metadata to `data/tasks.jsonl`.
- Do not auto-poll.
- Do not auto-download.
- Do not retry automatically.

After capture, inspect `task_id_field_candidates` and update the verified response parser in a separate PR.
