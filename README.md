# WSTV BytePlus Seedance Toolkit

यो standalone Python CLI toolkit हो Wild Stories TV को लागि। Goal: BytePlus ModelArk Dreamina Seedance 2.0 API use गरेर 15-second vertical 9:16 wildlife documentary video generate गर्ने।

Official model ID:

```text
dreamina-seedance-2-0-260128
```

Guessed Seedance alias model IDs use नगर्नुहोस्। सधैं माथिको official model ID मात्र use गर्नुहोस्।

## WSTV workflow

```text
master image -> Seedance API -> CapCut edit
```

1. पहिले clean master image बनाउनुहोस्।
2. Master image approve भएपछि Seedance API मा prompt + image पठाउनुहोस्।
3. Output video डाउनलोड गरेर CapCut मा edit गर्नुहोस्।
4. Facebook Reels को लागि final crop, captions, music, and export गर्नुहोस्।

## Default WSTV rules

- 15-second vertical 9:16
- photorealistic wildlife documentary
- full-body readable animals
- realistic anatomy
- grounded motion
- no blood
- no gore
- no visible wounds/injury
- no generated text
- no watermark
- no humans unless explicitly needed

## Setup

### 1. Python environment

```bash
cd /Users/acharyabimal/Documents/wstv-byteplus-seedance
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. BytePlus account

1. BytePlus account बनाउनुहोस्।
2. Console मा ModelArk enable गर्नुहोस्।
3. Dreamina / Seedance video generation access check गर्नुहोस्।
4. Billing/quota setup गर्नुहोस्।

### 3. Region

Default region/base URL:

```text
https://ark.ap-southeast.byteplus.com/api/v3
```

तपाईंको account region फरक छ भने BytePlus ModelArk API Explorer बाट सही base URL copy गर्नुहोस्।

### 4. API key and .env

```bash
cp .env.example .env
```

`.env` मा real key राख्नुहोस्:

```text
BYTEPLUS_API_KEY=
BYTEPLUS_BASE_URL=https://ark.ap-southeast.byteplus.com/api/v3
BYTEPLUS_MODEL_ID=dreamina-seedance-2-0-260128
```

API key hardcode नगर्नुहोस्। `.env` GitHub मा commit नगर्नुहोस्।

## Important API Explorer note

BytePlus endpoint path र request payload schema official docs/API Explorer अनुसार फरक हुन सक्छ। यो toolkit मा endpoint paths `.env` बाट override गर्न मिल्छ:

```text
BYTEPLUS_CREATE_TASK_PATH=/contents/generations/tasks
BYTEPLUS_RETRIEVE_TASK_PATH=/contents/generations/tasks/{task_id}
BYTEPLUS_LIST_TASKS_PATH=/contents/generations/tasks
BYTEPLUS_CANCEL_TASK_PATH=/contents/generations/tasks/{task_id}
```

Exact endpoint/request schema must be copied or updated from BytePlus API Explorer if official docs differ. Payload builder `scripts/generate_video.py` भित्र isolated छ ताकि update गर्न सजिलो होस्।

## Generate video

Prompt text बाट:

```bash
python3 scripts/generate_video.py \
  --prompt "Create a 15-second photorealistic cinematic wildlife documentary video..." \
  --image-url "https://example.com/master-image.jpg" \
  --negative-prompt "$(cat prompts/negative-prompt.txt)" \
  --poll
```

Prompt file बाट:

```bash
python3 scripts/generate_video.py \
  --prompt-file prompts/wstv-wildlife-template.txt \
  --image-url "https://example.com/master-image.jpg" \
  --poll
```

Defaults:

- `duration=15`
- `ratio=9:16`
- `resolution=720p`
- `model=dreamina-seedance-2-0-260128`

Local image path:

```bash
python3 scripts/generate_video.py \
  --prompt-file prompts/wstv-wildlife-template.txt \
  --image-path ./master-image.jpg
```

If BytePlus API Explorer requires base64 image input, set:

```text
BYTEPLUS_IMAGE_SCHEMA=base64
```

Otherwise API Explorer may require upload/file_id first.

## Check task

```bash
python3 scripts/check_task.py TASK_ID
```

This prints task status, token/usage info if available, and output URL if available.

## List tasks

```bash
python3 scripts/list_tasks.py --limit 10
```

## Cost calculator

```bash
python3 scripts/cost_calculator.py --tokens 108900
```

Formula:

```text
cost = total_tokens / 1_000_000 * price_per_million_tokens
```

Default price: `$7.0` per 1M tokens for 480p/720p input without video.

## Safety prompt

Always include:

```text
no blood, no gore, no visible wounds/injury, no generated text, no watermark
```

Negative prompt is in:

```text
prompts/negative-prompt.txt
```
