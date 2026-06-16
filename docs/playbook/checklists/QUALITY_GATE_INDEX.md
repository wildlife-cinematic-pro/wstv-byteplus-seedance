# WSTV Quality Gate Index

Every checklist in the WSTV Wildlife AI Video Playbook uses binary `[ ]` checkboxes. A gate either passes or it does not pass.

| Chapter | Gate Name | When Used |
| ---: | --- | --- |
| 3 | Idea Gate Checklist | After generating 5 ideas, before scoring and selecting the best idea. |
| 4 | Score And Select Checklist | After weighted scoring, before locking one concept. |
| 5 | Realism Gate Checklist | After the species, habitat, behavior, safety, and geography checks. |
| 6 | Master Image Gate Checklist | After generating or reviewing the master identity/environment still. |
| 7 | Storyboard Lock Gate Checklist | After generating or reviewing the 9-panel storyboard. |
| 8 | Prompt Gate Checklist | After writing the final Seedance prompt, before dashboard dry run. |
| 9 | Dry Run Gate Checklist | After local dashboard dry run, before any paid submit. |
| 10 | Paid Submit Gate Checklist | Immediately before one controlled paid generation. |
| 11 | Video QA Gate Checklist | After watching the full generated video. |
| 12 | CapCut Export Checklist | Before accepting final CapCut export. |
| 13 | Social Pack Gate Checklist | Before posting or scheduling. |
| 14 | Comment Reply Tone Checklist | Before using reply packs. |
| 15 | Token Usage Entry Checklist | Before logging completed paid usage in local tracking. |
| 16 | Archive Gate Checklist | Before closing the safe production record. |
| 17 | Category PASS / REVISE / REJECT Guidance | When selecting or revising category ideas. |
| 18 | Failure Severity Rules | When diagnosing a failed image, storyboard, video, tracking entry, or prompt. |
| 19 | Prompt Audit Checklist | Before generation from a custom prompt. |
| Appendix B | Quality Gate Summary | Permanent one-page gate reference. |

## Master Checklist Format

Use this format when writing full checklists:

```markdown
## Gate Name

[ ] Requirement one passes.
[ ] Requirement two passes.
[ ] Requirement three passes.

Result:
- If all boxes pass: continue to the next step.
- If any box fails: fix the issue and repeat this gate.
```
