# BytePlus Setup Guide for WSTV

यो guide Wild Stories TV को Seedance video generation toolkit setup गर्न हो। भाषा simple Nepali/Nepanglish राखिएको छ ताकि workflow copy-paste गर्न सजिलो होस्।

## 1. BytePlus account बनाउनुहोस्

1. BytePlus account खोल्नुहोस्।
2. Console मा login गर्नुहोस्।
3. ModelArk service enable गर्नुहोस्।
4. Billing/payment setup complete गर्नुहोस्, किनकि video generation paid हुन सक्छ।

## 2. ModelArk र Seedance access

1. ModelArk console खोल्नुहोस्।
2. Dreamina / Seedance video generation model access check गर्नुहोस्।
3. WSTV ले use गर्ने model ID:

```text
dreamina-seedance-2-0-260128
```

यो model ID मात्र use गर्नुहोस्। Guessed Seedance alias model IDs use नगर्नुहोस्।

## 3. Region र base URL

Default base URL:

```text
https://ark.ap-southeast.byteplus.com/api/v3
```

तपाईंको BytePlus account region फरक छ भने ModelArk API Explorer बाट सही base URL copy गर्नुहोस्।

## 4. API key

1. BytePlus console मा API key create गर्नुहोस्।
2. Key लाई safe राख्नुहोस्।
3. API key कहिल्यै GitHub मा commit नगर्नुहोस्।

## 5. .env setup

Project folder मा:

```bash
cp .env.example .env
```

त्यसपछि `.env` edit गर्नुहोस्:

```text
BYTEPLUS_API_KEY=
BYTEPLUS_BASE_URL=https://ark.ap-southeast.byteplus.com/api/v3
BYTEPLUS_MODEL_ID=dreamina-seedance-2-0-260128
```

`.env` file commit नगर्नुहोस्। `.gitignore` ले protect गर्छ, तर commit गर्नु अघि `git status` check गर्नु राम्रो।

## 6. API Explorer is source of truth

Important: BytePlus endpoint path र request payload schema change हुन सक्छ। यो toolkit मा endpoint paths configurable छन्:

```text
BYTEPLUS_CREATE_TASK_PATH
BYTEPLUS_RETRIEVE_TASK_PATH
BYTEPLUS_LIST_TASKS_PATH
BYTEPLUS_CANCEL_TASK_PATH
```

यदि official docs/API Explorer फरक देखिन्छ भने `.env` र scripts को payload builder update गर्नुहोस्। Exact endpoint/request schema सधैं BytePlus API Explorer बाट copy/update गर्नुहोस्।

## 7. WSTV production flow

```text
master image -> Seedance API -> CapCut edit
```

1. पहिले approved master image बनाउनुहोस्।
2. Prompt मा same animal identity, realistic anatomy, grounded motion राख्नुहोस्।
3. Seedance API बाट 15-second vertical 9:16 video generate गर्नुहोस्।
4. Output video CapCut मा edit, caption, music, and final export गर्नुहोस्।

## 8. Safety rules

- no blood
- no gore
- no visible wounds/injury
- no generated text
- no watermark
- no humans unless explicitly needed
- full-body readable animals
- realistic anatomy
- grounded motion
