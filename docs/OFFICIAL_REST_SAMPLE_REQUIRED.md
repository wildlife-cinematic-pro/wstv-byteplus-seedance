# Official Playground REST Sample

This repository now contains a redacted official sample at:

```text
docs/official-rest-sample.redacted.json
```

That sample enables only controlled one-paid-task response capture for `dreamina-seedance-2-0-260128`. The captured create-task response verified the task ID field as `$.id`; production automation remains blocked.

How to replace or refresh the sample safely:

1. Open BytePlus ModelArk Playground in AP-Southeast.
2. Select `dreamina-seedance-2-0-260128`.
3. Configure the same request shape you intend to submit.
4. Open the REST/API sample.
5. Copy the sample locally.
6. Remove the full `Authorization` header and any real API key.
7. Redact signed URLs, private media URLs, user IDs, and account IDs.
8. Save only a schema sample, not a real secret.
9. Use an explicit reviewed status such as `"VERIFIED_REDACTED_OFFICIAL_SAMPLE_CONTROLLED_CAPTURE"` only after human review.

The file must not contain `Authorization`, `Bearer`, `sk-`, or a real key.
