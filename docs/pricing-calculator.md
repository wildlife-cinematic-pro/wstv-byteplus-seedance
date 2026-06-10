# Pricing Calculator

BytePlus/ModelArk pricing token-based हुन सक्छ। Exact token count र price तपाईंको BytePlus billing/API response बाट confirm गर्नुहोस्।

## Formula

```text
cost = total_tokens / 1,000,000 * price_per_million_tokens
```

## Example

```text
108900 tokens at $7.0/M = 108900 / 1000000 * 7.0 = $0.7623
```

## Attempts

एक video perfect नआउन सक्छ, त्यसैले attempts को cost हेर्नुपर्छ।

```text
1 attempt = token cost once
3 attempts = token cost * 3
```

Example:

```text
1 attempt:  $0.7623
3 attempts: $2.2869
```

## 30 days

यदि daily reels बनाउनुहुन्छ भने:

```text
30-day cost = one_video_cost * daily_reels * 30
```

## 60 videos/month

```text
60 videos/month cost = one_video_cost * 60
```

Use:

```bash
python3 scripts/cost_calculator.py --tokens 108900
```

Custom price:

```bash
python3 scripts/cost_calculator.py --tokens 108900 --price 7.0
```
