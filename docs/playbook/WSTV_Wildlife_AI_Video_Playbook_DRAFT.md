# WSTV Wildlife AI Video Playbook

## From First Idea to Published Reel

Step-by-step AI production system for Wild Stories TV wildlife videos.

**Production draft:** Full draft — Chapters 1–19 + Appendices A–F
**Status:** Final audit before PDF conversion
**Use:** PDF-ready markdown source

---

# How To Use This Playbook

This is your production system, not a tutorial.
You do not need to read it end to end.

The fastest way to use it:

1. Find your step in the 19-Step Sequence in Chapter 2.
2. Go to that chapter in Part Two.
3. Copy the prompt block into your AI.
4. Paste the AI output back here to check the gate.
5. When the gate passes, go to the next step.

Multi-AI note:
Every prompt in this playbook works in ChatGPT, Claude,
DeepSeek, Gemini, or Grok. No special formatting needed.
Just paste the block. The prompts are tool-neutral.

One exception: the Dashboard Steps in Chapters 9-10 are
for the local WSTV dashboard only at `127.0.0.1:8765`.
Do not paste those into an AI.

Use this playbook one production at a time. Lock each step before moving forward.

---

# Safety Rules

```text
WSTV NON-NEGOTIABLE SAFETY RULES
(Apply to every prompt, every step, every video)

NO blood, gore, or visible injury.
NO bite contact.
NO animal death shown.
NO baby animal harmed.
NO unsafe human contact with wildlife.
NO text, logo, watermark, UI, subtitles, frame numbers,
   captions, or storyboard grid inside the generated video.
NO split screen, collage, panel blending, or morphing.
NO direct impact, crushing, burial, or graphic contact.
NO 180-degree camera flip during the video.
Wildlife behavior must remain physically believable.

For rescue scenes:
Humans may appear only when explicitly requested.
Rescuers must maintain professional distance unless
a safe vehicle/equipment context is specified.
Acceptable rescue equipment: vehicles, crates, ropes,
nets, waders, long-reach tools. No casual animal touching.
```

---

# Table Of Contents

## Front Matter

| Section | Purpose |
| --- | --- |
| How To Use This Playbook | How to run the PDF as a production system |
| Safety Rules | Permanent WSTV rules for every production |

## Part One: The Big Picture

| Chapter | Title | Purpose |
| ---: | --- | --- |
| 1 | The WSTV Production System | Define the product, tools, roles, pipeline, and safety rules |
| 2 | The 19-Step Production Sequence | Map the full workflow from idea to social pack |

## Part Two: Step-By-Step AI Production

| Chapter | Title |
| ---: | --- |
| 3 | Step 1-2: Choose Animal / Generate Ideas |
| 4 | Step 3-4: Score And Select Best Idea |
| 5 | Step 5: Species And Habitat Realism Check |
| 6 | Step 6-7: Master Image Prompt And QA |
| 7 | Step 8-9: 9-Panel Storyboard And Lock Gate |
| 8 | Step 10: Final Seedance 15s Prompt |
| 9 | Step 11: Local Dashboard Dry Run |
| 10 | Step 12: Paid Generation |
| 11 | Step 13-14: Video QA And Repair |
| 12 | Step 15: CapCut Edit And Export |
| 13 | Step 16: Facebook Caption And Social Pack |
| 14 | Step 17: Comment Reply Pack |
| 15 | Step 18: Token / Cost Tracking |
| 16 | Step 19: Archive Production Notes |

## Part Three: Reference Systems

| Chapter | Title |
| ---: | --- |
| 17 | Scene Category Encyclopedia |
| 18 | Failure Recovery System |
| 19 | Prompt Architecture Deep Dive |

## Appendices

| Appendix | Title |
| --- | --- |
| A | Viral Scoring Master Table |
| B | Quality Gate Summary |
| C | Token / Cost Reference Card |
| D | Seedance Dashboard Field Reference |
| E | Multi-AI Compatibility Notes |
| F | Master Prompt Template Index |

---

# Chapter 1 — The WSTV Production System

## Purpose

This chapter explains what WSTV produces, which tools are used, what AI handles, what the creator handles, and which safety rules cannot be negotiated.

Use this chapter before starting a new production. It gives the AI enough context to act like a WSTV production assistant instead of a generic prompt writer.

## What WSTV Produces

WSTV produces short, vertical, photorealistic wildlife videos built for USA Facebook Reels.

Each finished video should be:

| Requirement | Standard |
| --- | --- |
| Format | Vertical 9:16 |
| Length | 15 seconds |
| Style | Photorealistic wildlife documentary |
| Primary audience | USA Facebook Reels viewers |
| Core appeal | Fast hook, clear animal story, emotional or suspenseful payoff |
| Safety posture | No gore, no visible injury, no unsafe wildlife handling |
| Video text | No text, subtitles, captions, UI, frame numbers, logos, or watermarks inside generated video |

The video should be readable on a phone without sound. The viewer should understand the animal, the situation, the tension, and the safe ending quickly.

## Target Platform And Format

| Platform | Format | Practical Rule |
| --- | --- | --- |
| Facebook Reels | 9:16 vertical video | Compose for mobile first. Keep the main animal large and readable. |
| WSTV production draft | Markdown source | Keep prompt blocks and checklists copy-paste friendly. |
| Final PDF | Creator guide | Use clean headings, tables, checkboxes, and fenced prompt blocks. |

## Tool Map

| Tool | Used For | Creator Rule |
| --- | --- | --- |
| AI assistant | Ideas, scoring, realism research, prompts, QA, repair, social copy | Paste one step at a time and check the gate before moving on. |
| Image generator | Master image and optional storyboard image | Never accept text, logos, grids, split screens, or unsafe contact as final video references. |
| Local WSTV dashboard | Dry run and controlled video generation workflow | Use dry run before paid submit. Do not change dashboard safety limits. |
| BytePlus Seedance 2.0 | 15-second wildlife video generation | Submit only through the approved dashboard workflow. |
| CapCut | Final edit, export, optional thumbnail overlay, audio cleanup | Add overlay text only in CapCut, never inside AI video generation. |
| Facebook | Publishing, captions, comments, audience testing | Use the social pack only after Video QA passes. |

## Full Pipeline Overview

| Phase | Steps | Output |
| --- | --- | --- |
| Ideation | 1-4 | Locked scene idea |
| Realism + identity | 5 | Species and habitat fact sheet |
| Master image | 6-7 | Approved identity/environment anchor |
| Storyboard | 8-9 | Approved 9-panel motion guide |
| Seedance prompt | 10 | Final 15-second prompt under 3500 characters |
| Dashboard generation | 11-12 | Dry-run pass, then one controlled paid generation |
| Video QA + repair | 13-14 | Approved video or repair path |
| Edit + publish | 15-17 | Exported video, caption, hashtags, replies |
| Tracking + archive | 18-19 | Token/cost record and production notes |

## What AI Does

AI helps you move faster and keep the workflow consistent.

AI should:

- Generate scene ideas.
- Score ideas against WSTV criteria.
- Check species, habitat, behavior, and geography.
- Write master image prompts.
- Write storyboard prompts.
- Write final video prompts under 3500 characters.
- Diagnose video failures.
- Write repair prompts.
- Draft captions, hashtags, pinned comments, and replies.
- Help resume a stopped production from locked outputs.

AI should not:

- Invent safety exceptions.
- Tell you to skip quality gates.
- Ask for private credentials.
- Store secrets, temporary output URLs, private task responses, or MP4 files in this playbook.
- Change the WSTV dashboard prompt limit.
- Submit paid tasks.

## What Creator Does

The creator owns the final decision at every gate.

You must:

- Choose the animal and production direction.
- Confirm the locked idea.
- Review realism before image generation.
- Review the master image.
- Review the storyboard.
- Check the final prompt character count.
- Run dashboard dry run first.
- Approve any paid generation manually.
- Watch the full video before publishing.
- Log usage only after a completed paid generation.
- Archive what worked and what failed.

## Non-Negotiable Safety Rules

Use the safety block exactly. Copy it into any AI session that will generate or repair WSTV production prompts.

```text
WSTV NON-NEGOTIABLE SAFETY RULES
(Apply to every prompt, every step, every video)

NO blood, gore, or visible injury.
NO bite contact.
NO animal death shown.
NO baby animal harmed.
NO unsafe human contact with wildlife.
NO text, logo, watermark, UI, subtitles, frame numbers,
   captions, or storyboard grid inside the generated video.
NO split screen, collage, panel blending, or morphing.
NO direct impact, crushing, burial, or graphic contact.
NO 180-degree camera flip during the video.
Wildlife behavior must remain physically believable.

For rescue scenes:
Humans may appear only when explicitly requested.
Rescuers must maintain professional distance unless
a safe vehicle/equipment context is specified.
Acceptable rescue equipment: vehicles, crates, ropes,
nets, waders, long-reach tools. No casual animal touching.
```

## Quick-Start Example

Use this when you want to begin a fresh production fast.

| Field | Example |
| --- | --- |
| Animal | Sea turtle hatchling |
| Scene category | Marine/Beach Rescue |
| Habitat | Moonlit Florida beach |
| Hook | Hatchling turns toward boardwalk lights, then safe movement toward surf |
| Safety focus | No human touching, no injury, no predator contact, no text in video |
| Target output | 15-second vertical wildlife Reel |

Do not generate the final video prompt from this example yet. First run ideation, scoring, realism, master image, storyboard, and prompt gates in order.

## Copy This Into AI

```text
You are my WSTV production assistant.

I am producing one 15-second vertical 9:16 photorealistic wildlife video
for Wild Stories TV, targeting USA Facebook Reels.

Your job is to guide me through the WSTV 19-step production workflow
one step at a time. Do not skip gates. Do not jump to final video prompt
until the idea, realism check, master image, and storyboard are locked.

WSTV NON-NEGOTIABLE SAFETY RULES
(Apply to every prompt, every step, every video)

NO blood, gore, or visible injury.
NO bite contact.
NO animal death shown.
NO baby animal harmed.
NO unsafe human contact with wildlife.
NO text, logo, watermark, UI, subtitles, frame numbers,
   captions, or storyboard grid inside the generated video.
NO split screen, collage, panel blending, or morphing.
NO direct impact, crushing, burial, or graphic contact.
NO 180-degree camera flip during the video.
Wildlife behavior must remain physically believable.

For rescue scenes:
Humans may appear only when explicitly requested.
Rescuers must maintain professional distance unless
a safe vehicle/equipment context is specified.
Acceptable rescue equipment: vehicles, crates, ropes,
nets, waders, long-reach tools. No casual animal touching.

Start a new WSTV production.

Ask me only for:
1. Primary animal or animal group
2. Scene category
3. Habitat or location type

Then generate Step 1-2 ideation options only.
Output a table with 5 ideas, short hooks, safety notes,
realism risks, generation risks, and PASS/REVISE/REJECT guidance.
```

## Pass/Fail Checklist

Use this checklist before moving from Chapter 1 into the 19-step workflow.

[ ] I understand WSTV produces 15-second vertical 9:16 wildlife videos.
[ ] I understand the target platform is USA Facebook Reels.
[ ] I understand AI assists production but does not approve final decisions.
[ ] I understand the creator must pass each gate before moving forward.
[ ] I understand the local dashboard is production tooling, not PDF content.
[ ] I understand the 3500-character prompt limit must not be changed.
[ ] I understand no paid task is submitted from this playbook.
[ ] I understand no secrets, temporary output URLs, private JSON, or MP4 files belong in the playbook.
[ ] I have copied the safety rules exactly into the AI session.
[ ] I am ready to start with Step 1, not the final video prompt.

Result:

- If all boxes pass: go to Chapter 2.
- If any box fails: reread this chapter and fix the production setup before continuing.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Starting with a final Seedance prompt | Skips realism, identity, and storyboard gates | Begin at Step 1 and lock each phase |
| Treating AI output as approved | AI can miss safety or realism failures | Creator must check every gate |
| Allowing text in the generated video | Violates WSTV safety/format rules | Move thumbnail or caption text to CapCut or Facebook |
| Using a storyboard as a visual style source | Grid, labels, and panel borders may bleed into video | Tell AI storyboard is only shot order, framing, pacing, and motion guide |
| Logging dry runs as paid usage | Corrupts cost tracking | Log only completed paid generations |
| Reusing private dashboard data in docs | Creates security risk | Keep docs free of secrets and private task artifacts |

## Next Action

Go to Chapter 2. Identify the current production step and follow the sequence exactly.

---

# Chapter 2 — The 19-Step Production Sequence

## Purpose

This chapter maps the complete WSTV production workflow from first idea to finished social pack. It shows the order of work, the output of every step, the gate that must pass, and how to resume if a session stops halfway.

Use this chapter as the control board for every production.

## What AI Does

AI helps keep the sequence clean.

AI should:

- Track the current step.
- Ask only for the inputs needed for that step.
- Produce the required output for that step.
- Stop at each gate.
- Help diagnose failed gates.
- Resume from locked outputs if a session is interrupted.

AI should not:

- Skip ahead to paid generation.
- Combine unrelated steps unless the playbook says to.
- Treat a failed gate as acceptable.
- Ask for private task data, temporary output URLs, API keys, or MP4 files.
- Change dashboard safety settings or limits.

## What Creator Does

The creator keeps the workflow honest.

You must:

- Confirm which step you are on.
- Save locked outputs outside private dashboard data.
- Reject unsafe or unrealistic ideas.
- Run each gate as a binary pass/fail decision.
- Resume from the last locked step if work stops.
- Submit at most one paid task only after the required gates pass.

## Full 19-Step Sequence

| Step | Phase | Action | Output | Gate |
| ---: | --- | --- | --- | --- |
| 1 | Ideation | Choose animal / scene type | Animal, category, habitat direction | Idea Gate |
| 2 | Ideation | Generate viral scene ideas | 3-5 ideas with scores | Idea Gate |
| 3 | Ideation | Score and rank ideas for USA Facebook virality | Ranked PASS/REVISE/REJECT table | Idea Gate |
| 4 | Ideation | Select best idea and lock it | One confirmed scene concept | Creator written confirmation |
| 5 | Realism + identity | Research species and habitat realism | Fact sheet | Realism Gate |
| 6 | Master image | Generate master image prompt | Copy-ready image prompt | Master Image Gate |
| 7 | Master image | Audit master image | PASS or fix prompt | Master Image Gate |
| 8 | Storyboard | Generate 9-panel storyboard prompt | 3x3 storyboard prompt | Storyboard Gate |
| 9 | Storyboard | Audit storyboard and lock it | PASS or fix prompt | Storyboard Gate |
| 10 | Seedance prompt | Generate final 15s prompt | Prompt under 3500 characters | Prompt Gate |
| 11 | Dashboard generation | Run local dashboard dry run | Log with no errors | Dry Run Gate |
| 12 | Dashboard generation | Submit one paid generation | Generated video result | Paid Submit Gate |
| 13 | Video QA + repair | Watch and audit full video | PASS or issue list | Video QA Gate |
| 14 | Video QA + repair | Generate repair prompt if needed | Targeted fix prompt | Return to Step 10 |
| 15 | Edit + publish | Edit and export in CapCut | Final export | CapCut Export Checklist |
| 16 | Edit + publish | Generate Facebook caption and social pack | Caption, hashtags, pinned comment, titles | Social Pack Gate |
| 17 | Edit + publish | Generate comment reply pack | Friendly, skeptic, safety, no-touch replies | Comment Reply Tone Checklist |
| 18 | Tracking + archive | Log token / cost usage | Usage entry | Token Usage Entry Checklist |
| 19 | Tracking + archive | Archive production notes | Production record | Archive Gate |

## Phases From Idea To Social Pack

| Phase | Steps | Goal | Do Not Continue Until |
| --- | --- | --- | --- |
| Phase 1: Ideation | 1-4 | Find one strong, safe, realistic idea | Creator locks one idea |
| Phase 2: Realism + Identity | 5 | Make biology and habitat believable | Realism Gate passes |
| Phase 3: Master Image | 6-7 | Create one approved identity/environment anchor | Master Image Gate passes |
| Phase 4: Storyboard | 8-9 | Create one approved motion guide | Storyboard Gate passes |
| Phase 5: Seedance Prompt | 10 | Write final prompt under 3500 characters | Prompt Gate passes |
| Phase 6: Dashboard Generation | 11-12 | Dry run, then one controlled paid generation | Dry Run and Paid Submit gates pass |
| Phase 7: Video QA + Repair | 13-14 | Approve video or repair the prompt | Video QA Gate passes |
| Phase 8: Edit + Publish | 15-17 | Export, caption, and reply pack | Social Pack Gate passes |
| Phase 9: Tracking + Archive | 18-19 | Record cost and lessons | Archive Gate passes |

## One-Page Workflow Map

```text
WSTV 19-STEP PRODUCTION WORKFLOW

PHASE 1 — IDEATION
Step 1  Choose animal / scene type
Step 2  Generate 3-5 viral scene ideas
Step 3  Score and rank ideas for USA Facebook virality
Step 4  Select best idea and lock it
Gate    IDEA GATE

PHASE 2 — REALISM + IDENTITY LOCK
Step 5  Species + habitat realism research
Gate    REALISM GATE

PHASE 3 — MASTER IMAGE
Step 6  Generate master image prompt
Step 7  Master image QA
Gate    MASTER IMAGE GATE

PHASE 4 — STORYBOARD
Step 8  Generate 9-panel storyboard prompt
Step 9  Storyboard QA / lock
Gate    STORYBOARD GATE

PHASE 5 — SEEDANCE PROMPT
Step 10 Generate final Seedance 15s prompt
Gate    PROMPT GATE

PHASE 6 — DASHBOARD GENERATION
Step 11 Dashboard dry run
Step 12 Paid generation
Gate    DRY RUN GATE, then PAID SUBMIT GATE

PHASE 7 — VIDEO QA + REPAIR
Step 13 Video QA
Step 14 Repair prompt if needed
Gate    VIDEO QA GATE

PHASE 8 — EDIT + PUBLISH
Step 15 CapCut edit + export
Step 16 Facebook caption + social pack
Step 17 Comment reply pack
Gate    SOCIAL PACK GATE

PHASE 9 — TRACKING + ARCHIVE
Step 18 Token / cost tracking
Step 19 Archive production notes
Gate    ARCHIVE GATE
```

## Pass/Fail Gate Logic

Every WSTV gate is binary.

| Result | Meaning | Action |
| --- | --- | --- |
| PASS | All required boxes are checked | Continue to the next step |
| REVISE | The idea or asset can be repaired | Fix and repeat the same gate |
| REJECT | The idea or asset is unsafe, unrealistic, or unusable | Return to the earlier step and generate a new option |
| BLOCKER | Publishing or paid submit would create safety, quality, or cost risk | Stop until fixed |

Rules:

- Do not continue if a gate fails.
- Do not submit a paid generation if Dry Run Gate fails.
- Do not publish if Video QA Gate fails.
- Do not log usage until a paid generation confirms complete.
- Do not log the same paid usage twice.

## How To Resume If A Session Stops Halfway

If an AI session stops, do not restart from zero unless nothing was locked.

Resume from the last locked output:

| Last Locked Output | Resume At |
| --- | --- |
| Animal/category only | Step 2 |
| Scored idea table | Step 3 or Step 4 |
| Locked scene concept | Step 5 |
| Realism fact sheet | Step 6 |
| Approved master image | Step 8 |
| Approved storyboard | Step 10 |
| Final Seedance prompt | Step 11 |
| Dry run passed | Step 12 |
| Generated video | Step 13 |
| Video QA passed | Step 15 |
| Final export | Step 16 |
| Social pack | Step 18 |

When resuming, paste only the safe production notes needed for the next step. Do not paste API keys, private task JSON, temporary output URLs, MP4 links, dashboard logs with private data, or anything from `data/`.

## Copy This Into AI

```text
Resume my WSTV production from the last locked step.

Brand: Wild Stories TV / WSTV
Target: USA Facebook Reels
Format: 15-second vertical 9:16 photorealistic wildlife video

WSTV NON-NEGOTIABLE SAFETY RULES
(Apply to every prompt, every step, every video)

NO blood, gore, or visible injury.
NO bite contact.
NO animal death shown.
NO baby animal harmed.
NO unsafe human contact with wildlife.
NO text, logo, watermark, UI, subtitles, frame numbers,
   captions, or storyboard grid inside the generated video.
NO split screen, collage, panel blending, or morphing.
NO direct impact, crushing, burial, or graphic contact.
NO 180-degree camera flip during the video.
Wildlife behavior must remain physically believable.

For rescue scenes:
Humans may appear only when explicitly requested.
Rescuers must maintain professional distance unless
a safe vehicle/equipment context is specified.
Acceptable rescue equipment: vehicles, crates, ropes,
nets, waders, long-reach tools. No casual animal touching.

Last locked step:
[PASTE STEP NUMBER AND NAME]

Locked outputs:
[PASTE ONLY SAFE PRODUCTION NOTES: idea, score, realism fact sheet,
master image description, storyboard summary, or final prompt.
Do not paste API keys, temporary output URLs, private task JSON, MP4 links,
dashboard private responses, or anything from data/.]

Your task:
1. Identify the correct next WSTV step.
2. Summarize what is already locked.
3. Tell me what input you need from me, if any.
4. Produce only the next step output.
5. Stop at the next pass/fail gate.
```

## Pass/Fail Checklist

Use this checklist before starting or resuming production.

[ ] I know the current step number.
[ ] I know the last locked output.
[ ] I know the next gate that must pass.
[ ] I have not pasted secrets, private task JSON, temporary output URLs, MP4 links, or `data/` contents into AI.
[ ] I will not skip realism, master image, storyboard, prompt, dry run, or video QA gates.
[ ] I will keep the final Seedance prompt under 3500 characters.
[ ] I will not submit a paid task before Dry Run Gate passes.
[ ] I will submit one paid task only when all paid-submit checks pass.
[ ] I will not log dry runs as paid usage.
[ ] I will not publish until Video QA passes.
[ ] I will archive the production after social output is complete.

Result:

- If all boxes pass: continue from the current step.
- If any box fails: fix the production record, then repeat this checklist.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Restarting from zero after a break | Wastes time and may change the idea | Resume from the last locked output |
| Pasting private dashboard data into AI | Creates security risk | Paste only safe notes and approved prompt text |
| Skipping from storyboard to paid submit | Misses final prompt and dry run gates | Complete Steps 10 and 11 first |
| Treating REVISE as PASS | Leaves avoidable failures in production | Repair and repeat the same gate |
| Logging token usage before completion | Creates false cost records | Log only after paid generation confirms complete |
| Publishing after a low-quality but unsafe video | Violates WSTV rules | Repair or reject unsafe outputs |

## Next Action

Choose one:

| Situation | Next Action |
| --- | --- |
| Starting fresh | Begin Step 1 in Chapter 3 after review approval |
| Resuming | Use the resume prompt above and continue from the last locked output |
| Reviewing this draft | Confirm Chapters 1-2 before generating Chapters 3-8 |

---

# Chapter 3 — Steps 1-2: Choose Animal / Generate Ideas

## Purpose

This chapter starts a WSTV production. You choose the animal, scene category, and habitat direction, then use AI to generate 5 safe, high-potential scene ideas for USA Facebook Reels.

The goal is not to find a final prompt yet. The goal is to create strong options that can be scored, revised, or rejected before any image or video work begins.

## Scene Category Selection

Choose one category before asking for ideas.

| Category | Best Use | Safety Reminder |
| --- | --- | --- |
| Predator near-miss | Tension, escape, bluff, chase without contact | No bite contact, no visible injury |
| Baby animal rescue/protection | Parent return, herd shield, safe rescue distance | No baby harmed, no casual human contact |
| Natural obstacle escape | Mud, tide, cliff edge, ice, branch, water channel | No crushing, burial, or direct impact |
| Marine/beach rescue | Sea turtle, seal, otter, sea lion, shorebird | Humans only with equipment and professional distance |
| Comic wildlife mistake | Low-risk animal behavior comedy | No injury, no humiliation, no unsafe handling |
| Quiet emotional moment | Reunion, release, shelter, rest, parent bond | Keep tension gentle and physically believable |
| Storm/flood survival | Distant weather, rising water, animals moving to safety | Hazard remains non-graphic |
| Herd wall defense | Group closes ranks around young | No attack contact |

## Animal Selection

Pick animals that are readable on mobile and familiar enough for a USA audience to understand quickly.

Strong first choices:

| Animal Group | Works Well For | Notes |
| --- | --- | --- |
| Bears, wolves, bison, elk, deer | North American familiarity | Strong USA relevance |
| Elephants, lions, zebras, giraffes | Big visual silhouettes | Good global wildlife appeal |
| Eagles, owls, hawks | Fast hooks and strong icon value | Keep prey contact non-graphic |
| Sea turtles, seals, otters, sea lions | Beach rescue and emotional scenes | Avoid casual handling |
| Foxes, coyotes, raccoons | Comic or suburban-edge moments | Keep comedy safe and gentle |

Avoid animals or setups that require graphic harm, confusing scale, unsafe human contact, or biology that the AI is likely to distort.

## Idea Output Format

Ask AI for exactly 5 ideas in this table format.

| # | Title | Animal(s) | Habitat | 0-3s Hook | 15s Arc | USA Appeal | Realism Risk | Generation Risk | Safety Note | Score /100 | Verdict |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| 1 |  |  |  |  |  |  | Low/Medium/High | Low/Medium/High |  |  | PASS/REVISE/REJECT |

## Idea Scoring Criteria

Use these criteria for first-pass idea quality.

| Criterion | What It Checks |
| --- | --- |
| Hook strength | Is the first 0-3 seconds clear and urgent? |
| USA relevance | Will a USA Facebook Reels viewer understand and care quickly? |
| Animal popularity | Is the animal visually familiar, loved, feared, or iconic? |
| Emotional tension | Is there suspense, relief, surprise, protection, or warmth? |
| Baby / parent factor | Does the idea include safe parent-young emotion when appropriate? |
| Novelty | Does the scene feel fresh without becoming unrealistic? |
| Mobile readability | Is the action visible on a phone screen? |
| Realism | Could this animal, place, season, and behavior exist together? |
| Safety risk | Lower risk scores higher. No gore, injury, contact, or unsafe handling. |
| Generation ease | Easier scenes score higher because they are less likely to fail. |

## PASS / REVISE / REJECT Rules

| Score | Verdict | Action |
| ---: | --- | --- |
| 80-100 | PASS | Candidate can move to Chapter 4 scoring and selection. |
| 60-79 | REVISE | Keep the core idea but fix weak hook, realism, safety, or readability. |
| 0-59 | REJECT | Do not use. Generate a new idea. |

Never pass an idea that requires blood, visible injury, bite contact, animal death, harmed baby animals, unsafe human contact, text inside generated video, split screen, collage, panel blending, morphing, or a camera flip to work.

## What AI Does

AI generates and organizes idea options. It should:

- Ask for animal, category, and habitat.
- Generate exactly 5 scene ideas.
- Keep every idea vertical 9:16, 15 seconds, and USA Facebook Reels friendly.
- Build a strong 0-3 second hook.
- Add a safety note for each idea.
- Give a first-pass score and verdict.

AI should not write the final Seedance prompt yet.

## What Creator Does

You choose the direction and reject unsafe ideas.

You must:

- Pick or approve the scene category.
- Pick or approve the animal.
- Check whether the idea is readable on mobile.
- Reject any idea that needs harm, gore, unsafe contact, or text in the generated video.
- Save the 5-idea table for Chapter 4.

## Copy This Into AI — Universal Idea Generator

```text
I am producing one WSTV wildlife AI video.

Brand: Wild Stories TV / WSTV
Platform: USA Facebook Reels
Format: 15 seconds, vertical 9:16
Style: photorealistic wildlife documentary realism

Scene category: [CATEGORY]
Primary animal: [ANIMAL]
Habitat or location type: [HABITAT]

Permanent WSTV rules:
- Strong 0-3 second hook
- No blood
- No gore
- No visible injury
- No bite contact
- No animal death shown
- No baby animal harmed
- No unsafe human contact
- No humans unless explicitly requested
- No text, logo, watermark, UI, subtitles, frame numbers, or captions inside generated video
- No storyboard grid copied into video
- No split screen, collage, panel blending, or morphing

Generate exactly 5 scene ideas.

Output as a table with these columns:
1. #
2. Title
3. Animal(s)
4. Habitat
5. 0-3s Hook
6. Full 15s Arc
7. Why It May Work For USA Facebook Reels
8. Realism Risk: Low / Medium / High
9. Generation Risk: Low / Medium / High
10. Safety Note
11. Score /100
12. Verdict: PASS / REVISE / REJECT

Score using:
hook strength, USA relevance, animal popularity, emotional tension,
baby/parent factor, novelty, mobile readability, realism,
safety risk where lower risk scores higher, and generation ease.

Do not write image prompts, storyboard prompts, or final Seedance prompts yet.
```

## Copy This Into AI — Predator Near-Miss

```text
Generate 5 WSTV predator near-miss ideas.

Rules:
- The scene must be a near-miss, escape, bluff, or interrupted chase.
- No bite contact.
- No visible injury.
- No animal death shown.
- No blood or gore.
- The prey must remain safe by the end.
- Keep the action readable in a 15-second vertical 9:16 video.

Primary predator: [PREDATOR]
Primary prey or threatened animal: [PREY]
Habitat: [HABITAT]

Use the WSTV 5-idea table format and score every idea /100.
```

## Copy This Into AI — Baby Animal Rescue / Protection

```text
Generate 5 WSTV baby animal rescue or protection ideas.

Rules:
- The baby animal must not be harmed.
- Parent, herd, or professional rescue action may protect the baby.
- Humans may appear only if explicitly needed and must use professional distance or safe equipment.
- No casual animal touching.
- No blood, gore, visible injury, or animal death.
- The ending must clearly show the baby safe.

Baby animal: [BABY ANIMAL]
Protector or rescuer: [PARENT / HERD / PROFESSIONAL RESCUER / NONE]
Habitat: [HABITAT]

Use the WSTV 5-idea table format and score every idea /100.
```

## Copy This Into AI — Natural Obstacle Escape

```text
Generate 5 WSTV natural obstacle escape ideas.

Rules:
- The danger is an obstacle, not graphic harm.
- Good obstacles: tide pool, mud edge, fallen branch, shallow ditch, ice shelf, ledge, fast but distant water.
- No direct impact, crushing, burial, visible injury, blood, or gore.
- The animal must exit safe or reach a stable safe position.
- Keep the scene physically believable for the species and habitat.

Animal: [ANIMAL]
Obstacle: [OBSTACLE TYPE]
Habitat: [HABITAT]

Use the WSTV 5-idea table format and score every idea /100.
```

## Copy This Into AI — Marine / Beach Rescue

```text
Generate 5 WSTV marine or beach rescue ideas.

Rules:
- Good animals: sea turtle, seal, otter, sea lion, shorebird.
- Good settings: rocky beach, tide pool, sandbar, surf line, dune edge.
- Humans may appear only when explicitly requested.
- If humans appear, they must use professional distance or equipment such as crates, nets, ropes, waders, or long-reach tools.
- No casual handling.
- No blood, gore, visible injury, animal death, or harmed baby animal.

Marine animal: [ANIMAL]
Beach or marine setting: [SETTING]
Human rescue visible? [YES/NO]

Use the WSTV 5-idea table format and score every idea /100.
```

## Copy This Into AI — Comic Wildlife Mistake

```text
Generate 5 WSTV comic wildlife mistake ideas.

Rules:
- Comedy must come from believable animal behavior.
- No animal is hurt, trapped, humiliated, or handled unsafely.
- No blood, gore, visible injury, bite contact, or animal death.
- The joke must be readable in the first 0-3 seconds.
- Keep the ending gentle and safe.

Animal: [ANIMAL]
Setting: [HABITAT OR SUBURBAN EDGE]
Comedy object or situation: [OBJECT / SITUATION]

Use the WSTV 5-idea table format and score every idea /100.
```

## Idea Gate Checklist

[ ] One scene category is chosen.
[ ] One primary animal or animal group is chosen.
[ ] Habitat or location type is defined.
[ ] AI generated exactly 5 ideas.
[ ] Each idea has a clear 0-3 second hook.
[ ] Each idea fits 15 seconds and vertical 9:16 framing.
[ ] Each idea includes a safety note.
[ ] No idea depends on blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact.
[ ] No idea requires text, logo, watermark, UI, subtitles, frame numbers, or captions inside generated video.
[ ] At least one idea has PASS potential.

Result:

- If one or more ideas can pass: continue to Chapter 4.
- If all ideas are REVISE: revise the best 1-2 ideas and repeat this gate.
- If all ideas are REJECT: generate a new 5-idea table.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Choosing a scene before choosing a category | Ideas become scattered | Pick category first |
| Asking for a final prompt too early | Skips scoring and realism | Stop at 5 idea options |
| Making the hook too subtle | Viewers do not understand the first 3 seconds | Put visible motion or tension in frame immediately |
| Using graphic predator action | Violates WSTV rules | Convert to near-miss, bluff, or escape |
| Adding humans by default | Creates handling risk | Use humans only when explicitly requested |

## Fix/Retry Prompt

```text
Revise the WSTV idea table.

Keep only ideas that can obey:
no blood, no gore, no visible injury, no bite contact, no animal death,
no baby animal harmed, no unsafe human contact, no text inside generated video,
no split screen, no collage, no panel blending, and no morphing.

Improve:
- 0-3 second hook clarity
- USA Facebook Reels appeal
- mobile readability
- biological realism
- generation ease

Return a new 5-idea table with PASS / REVISE / REJECT verdicts.
```

## Next Action

Go to Chapter 4. Score and select one locked concept.

---

# Chapter 4 — Steps 3-4: Score And Select Best Idea

## Purpose

This chapter turns the 5-idea table into one locked WSTV concept. You score ideas, revise weak ideas if useful, reject unsafe ideas, and write the selected concept in a stable format for realism research.

Do not continue until one concept is locked.

## Viral Scoring Table

Use this table for each idea.

| Criterion | Weight | Score | Weighted Points | Notes |
| --- | ---: | ---: | ---: | --- |
| Hook strength | x1.5 | /10 | /15 | Clear in 0-3 seconds |
| USA relevance | x1.5 | /10 | /15 | Familiar, emotionally legible, or culturally resonant |
| Animal popularity | x1.0 | /10 | /10 | Recognizable and visually strong |
| Emotional tension | x1.0 | /10 | /10 | Suspense, relief, protection, surprise, warmth |
| Baby / parent factor | x1.0 | /10 | /10 | Safe parent-young emotion when relevant |
| Novelty | x1.0 | /10 | /10 | Fresh without becoming strange |
| Mobile readability | x1.0 | /10 | /10 | Readable on a phone screen without sound |
| Realism | x1.0 | /10 | /10 | Species, habitat, behavior, and weather make sense |
| Safety risk | x1.0 | /10 | /10 | Lower risk gets higher score |
| Generation ease | x1.0 | /10 | /10 | Lower model-failure risk gets higher score |
| Total |  |  | /100 | PASS / REVISE / REJECT |

## Score Weighting

Hook strength and USA relevance are weighted higher because WSTV videos must work fast in a USA Facebook Reels feed.

| Total | Verdict | Meaning |
| ---: | --- | --- |
| 80-100 | PASS | Strong candidate for locking |
| 60-79 | REVISE | Usable idea with fixable weakness |
| 0-59 | REJECT | Too weak, unsafe, unclear, or hard to generate |

## USA Relevance Score

Use this definition when scoring USA relevance.

| Score | Definition | Example |
| ---: | --- | --- |
| 1 | Most USA viewers will not recognize the animal, place, or emotional stakes quickly. | Rare species in an unclear habitat with subtle behavior |
| 5 | Viewers may understand the scene, but the animal or situation is not instantly familiar. | Interesting animal behavior with weak cultural or emotional hook |
| 10 | Viewers can understand the animal, danger, and emotional stakes immediately. | Bear cub, eagle, wolf, bison, sea turtle, deer, rescue, escape, parent protection |

## How To Select One Locked Concept

Pick the idea that has the best combination of:

- PASS score.
- Strong 0-3 second hook.
- Clear animal identity.
- Low safety risk.
- Low generation risk.
- Strong mobile readability.
- Realistic animal, habitat, and behavior.
- Ending that can be safe and visually clear.

If the highest-score idea is risky, choose the safer PASS idea. Safety beats novelty.

## How To Revise A Weak Idea

Revise only if the core idea is strong.

| Weakness | Revision Move |
| --- | --- |
| Hook is slow | Put the animal and visible problem in frame 0-3 seconds |
| Safety risk is high | Convert contact into near-miss, distance, or escape |
| Habitat is unrealistic | Move the scene to a believable region and season |
| Too many animals | Reduce to 1-3 readable subjects |
| Too hard to generate | Simplify motion, reduce crowding, and remove complex contact |
| Ending unclear | Add a simple safe payoff in seconds 12-15 |

## Selected Concept Lock Format

Save the locked concept like this.

```text
WSTV SELECTED CONCEPT LOCK

Scene title:
[TITLE]

Category:
[CATEGORY]

Primary animal(s):
[ANIMAL(S)]

Habitat / region:
[HABITAT OR REGION]

0-3s hook:
[VISIBLE OPENING HOOK]

15s arc:
0-3s: [HOOK]
3-6s: [ESCALATION]
6-9s: [PEAK TENSION]
9-12s: [TURN / ESCAPE / PROTECTION]
12-15s: [SAFE ENDING]

Why this works for USA Facebook Reels:
[SHORT REASON]

Safety lock:
No blood, gore, visible injury, bite contact, animal death,
harmed baby animal, unsafe human contact, text, logo, watermark,
UI, subtitles, frame numbers, captions, split screen, collage,
panel blending, morphing, or storyboard grid in generated video.

Verdict:
LOCKED FOR REALISM CHECK
```

## What AI Does

AI scores and explains. It should:

- Apply the weighted scoring table.
- Define PASS / REVISE / REJECT for each idea.
- Recommend the safest strong idea.
- Suggest revisions for fixable ideas.
- Produce one selected concept lock.

AI should not invent a new concept after you lock one unless the gate fails.

## What Creator Does

You choose the final locked idea.

You must:

- Review each score.
- Challenge scores that feel too generous.
- Reject unsafe or unrealistic ideas even if the score is high.
- Confirm the selected concept in writing.
- Save the concept lock for Chapter 5.

## Copy This Into AI — Scoring Prompt

```text
Score and select the best WSTV idea from this table.

Brand: Wild Stories TV / WSTV
Platform: USA Facebook Reels
Format: 15 seconds, vertical 9:16
Style: photorealistic wildlife documentary realism

Permanent rules:
No blood, gore, visible injury, bite contact, animal death,
harmed baby animal, unsafe human contact, humans unless explicitly requested,
text, logo, watermark, UI, subtitles, frame numbers, captions,
storyboard grid copied into video, split screen, collage, panel blending, or morphing.

Score each idea using this weighted table:
- Hook strength x1.5
- USA relevance x1.5
- Animal popularity x1.0
- Emotional tension x1.0
- Baby / parent factor x1.0
- Novelty x1.0
- Mobile readability x1.0
- Realism x1.0
- Safety risk x1.0 where lower risk gets higher score
- Generation ease x1.0

USA relevance guide:
1 = USA viewers will not understand or care quickly.
5 = understandable but not instantly familiar or emotionally strong.
10 = instantly clear, familiar, emotional, or iconic for USA viewers.

Output:
1. Scoring table for all ideas
2. PASS / REVISE / REJECT verdict for each
3. Best safe recommendation
4. If needed, revised version of the best weak idea
5. One WSTV SELECTED CONCEPT LOCK in the exact lock format

Ideas to score:
[PASTE 5-IDEA TABLE]
```

## Pass/Fail Checklist

[ ] All 5 ideas were scored with the weighted table.
[ ] USA relevance was scored using the 1/5/10 definition.
[ ] Unsafe ideas were rejected even if they had strong hooks.
[ ] At least one idea scored PASS, or one REVISE idea was improved and rescored.
[ ] One selected concept is written in the lock format.
[ ] The selected concept has a clear 0-3 second hook.
[ ] The selected concept has a safe 12-15 second ending.
[ ] The selected concept can fit a 15-second vertical 9:16 video.
[ ] The selected concept avoids text, logos, UI, captions, frame numbers, and storyboard grid inside generated video.
[ ] Creator confirmed the concept is locked.

Result:

- If all boxes pass: continue to Chapter 5.
- If any box fails: revise, rescore, or return to Chapter 3.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Picking the highest score automatically | It may have hidden safety or generation risk | Choose the safest strong PASS idea |
| Treating USA relevance as personal taste | The target is USA Facebook Reels viewers | Use the 1/5/10 definition |
| Locking multiple concepts | Breaks the production chain | Lock exactly one |
| Keeping vague locations | Weakens realism and image prompting | Define habitat or region before Chapter 5 |
| Keeping unsafe tension | Creates downstream repair work | Convert harm into near-miss, distance, or escape |

## Fix/Retry Prompt

```text
Revise the selected WSTV concept before realism research.

Problem:
[DESCRIBE WEAKNESS: hook, USA relevance, safety, realism, mobile readability, or generation risk]

Keep:
- 15 seconds
- vertical 9:16
- USA Facebook Reels target
- photorealistic wildlife documentary realism
- strong 0-3 second hook
- safe 12-15 second ending

Remove or avoid:
blood, gore, visible injury, bite contact, animal death,
harmed baby animal, unsafe human contact, text, logo, watermark,
UI, subtitles, frame numbers, captions, storyboard grid,
split screen, collage, panel blending, and morphing.

Return one revised WSTV SELECTED CONCEPT LOCK.
```

## Next Action

Go to Chapter 5. Run the Species & Habitat Realism Check.

---

# Chapter 5 — Step 5: Species & Habitat Realism Check

## Purpose

This chapter checks whether the locked concept is biologically and geographically believable before you create any images.

The goal is to prevent species drift, impossible anatomy, wrong habitats, wrong seasons, unrealistic predator-prey pairings, unsafe rescue staging, and weak environment details.

## What AI Does

AI builds a realism fact sheet. It should:

- Identify exact species or plausible species group.
- Check anatomy and visible features.
- Check habitat, region, season, light, weather, and terrain.
- Check predator-prey or animal relationship realism.
- Check behavior realism.
- Identify safety risks.
- Create geography and camera-direction locks for later prompts.

AI should not move to master image prompting until the Realism Gate passes.

## What Creator Does

You approve or reject the realism foundation.

You must:

- Confirm the species is correct.
- Confirm the habitat and region are plausible.
- Remove impossible animal pairings.
- Remove unsafe rescue staging.
- Save the final fact sheet and geography lock.

## Species Anatomy Check

Lock details that should stay consistent across image, storyboard, and video.

| Field | What To Define |
| --- | --- |
| Exact species | Common name and, when useful, scientific name |
| Age class | Adult, juvenile, calf, cub, pup, hatchling |
| Body size | Relative size compared with terrain or nearby animals |
| Body proportions | Leg length, head shape, neck, tail, wings, horns, ears |
| Markings | Coat, feathers, shell, stripe, spots, scars only if safe and non-injury |
| Movement style | Walk, run, hop, swim, glide, climb, stumble, pause |

Do not invent anatomy that makes the animal more dramatic but less believable.

## Habitat / Region / Season Realism

Check whether the animal and setting belong together.

| Check | Question |
| --- | --- |
| Region | Could this species be in this region? |
| Habitat | Does the terrain match the animal's real habitat? |
| Season | Is the season plausible for the behavior and environment? |
| Time of day | Does the light support clear mobile readability? |
| Weather | Does the weather make sense without hiding the action? |
| Terrain | Can the animal physically move through the scene? |

## Predator / Prey Relationship Realism

Use predator-prey pairings only when they are plausible and safe.

| Relationship Type | Allowed Direction |
| --- | --- |
| Predator near-miss | Predator appears, prey escapes, no bite contact |
| Parent protection | Parent blocks, guides, or shields, no graphic contact |
| Herd wall | Group closes ranks, predator stays outside contact range |
| Rescue | Professional distance or equipment if humans appear |
| Comic mistake | No predator pressure required |

## Behavior Realism

Ask whether the animal would plausibly do the action.

Examples:

- A sea turtle hatchling moves toward light or surf.
- A bison cow positions herself between threat and calf.
- A wolf changes direction at a ravine edge.
- A seal pup stays near the surf line while rescue equipment remains at distance.
- A raccoon investigates a harmless object and retreats.

Avoid behavior that makes the animal act like a human, perform tricks, or survive impossible physics.

## Lighting / Weather / Terrain Realism

Lighting should make the subject readable and natural.

| Element | WSTV Preference |
| --- | --- |
| Light | Dawn, golden hour, overcast daylight, clear moonlit scene only if readable |
| Weather | Mild mist, distant storm, light rain, wind, surf spray |
| Terrain | Simple enough for a 15-second scene |
| Camera | Same side of action throughout, no 180-degree flip |

## Danger / Safety Realism

Danger should create tension without showing harm.

Allowed:

- Near-miss.
- Escape.
- Distance.
- Parent shield.
- Herd wall.
- Professional equipment.
- Natural obstacle with safe exit.

Not allowed:

- Blood.
- Gore.
- Visible injury.
- Bite contact.
- Animal death shown.
- Baby animal harmed.
- Unsafe human contact.
- Direct impact, crushing, burial, or graphic contact.

## Copy This Into AI — Realism Fact Sheet Prompt

```text
Create a WSTV Species & Habitat Realism Fact Sheet.

Locked concept:
[PASTE WSTV SELECTED CONCEPT LOCK]

Production rules:
- 15 seconds
- vertical 9:16
- USA Facebook Reels
- photorealistic wildlife documentary realism
- strong 0-3 second hook
- no blood
- no gore
- no visible injury
- no bite contact
- no animal death shown
- no baby animal harmed
- no unsafe human contact
- no humans unless explicitly requested
- no text, logo, watermark, UI, subtitles, frame numbers, or captions inside generated video
- no storyboard grid copied into video
- no split screen, collage, panel blending, or morphing

Output:
1. Exact species or plausible species group
2. Anatomy lock: size, body proportions, markings, movement
3. Habitat lock: region, terrain, vegetation, water/rock/snow/sand features
4. Season and time-of-day lock
5. Weather and lighting lock
6. Behavior realism notes
7. Predator/prey or animal relationship realism notes
8. Danger/safety realism notes
9. What must be removed or changed, if anything
10. Verdict: PASS / REVISE / REJECT

If the concept fails realism, give a revised safe version.
Do not write image, storyboard, or video prompts yet.
```

## Copy This Into AI — Geography / Environment Lock Prompt

```text
Create a WSTV Geography + Environment Lock for this production.

Use this approved realism fact sheet:
[PASTE REALISM FACT SHEET]

Output a stable lock with:
1. Region or biome
2. Terrain layout
3. Main animal starting position: screen left / center / right
4. Secondary animal, obstacle, water, shelter, or threat position
5. Camera side that must stay consistent
6. Direction of movement
7. Background landmarks
8. Light direction
9. Weather and atmosphere
10. No 180-degree camera flip rule

Keep it practical for a 15-second vertical 9:16 wildlife video.
Do not add text, captions, logos, UI, frame numbers, split screen,
collage, panel blending, morphing, blood, gore, visible injury,
bite contact, animal death, harmed baby animal, or unsafe human contact.
```

## Realism Gate Checklist

[ ] Exact species or plausible species group is named.
[ ] Anatomy lock includes size, proportions, markings, and movement.
[ ] Habitat is believable for the species.
[ ] Region or biome is plausible.
[ ] Season and time of day fit the behavior.
[ ] Weather and lighting keep the subject readable.
[ ] Terrain allows the animal to move physically.
[ ] Predator-prey or animal relationship is realistic.
[ ] Danger creates tension without graphic harm.
[ ] Human presence is absent unless explicitly requested.
[ ] If humans appear, they use professional distance or safe equipment.
[ ] Camera side and movement direction are defined.
[ ] No 180-degree flip rule is included.
[ ] Verdict is PASS or a clear revision is provided.

Result:

- If all boxes pass: continue to Chapter 6.
- If any box fails: revise the concept or fact sheet and repeat this gate.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Using only a common animal name | Can cause species drift | Name exact species or plausible species group |
| Combining animal and habitat loosely | Generates wrong environments | Lock region, terrain, season, and weather |
| Making danger too intense | Violates WSTV safety | Use near-miss, distance, shield, or escape |
| Ignoring camera direction | Causes later 180-degree flip | Define screen positions now |
| Adding humans to make rescue clearer | Creates unsafe handling risk | Use humans only when explicitly requested |

## Fix/Retry Prompt

```text
Revise this WSTV realism fact sheet.

Failure:
[DESCRIBE FAILED REALISM OR SAFETY ITEM]

Keep the locked concept if possible, but repair:
- species anatomy
- habitat/region/season
- behavior realism
- predator/prey relationship
- lighting/weather/terrain
- danger/safety realism
- camera side and geography lock

Do not add blood, gore, visible injury, bite contact, animal death,
harmed baby animal, unsafe human contact, text, logo, watermark,
UI, subtitles, frame numbers, captions, split screen, collage,
panel blending, morphing, or storyboard grid.

Return a corrected fact sheet and PASS / REVISE / REJECT verdict.
```

## Next Action

Go to Chapter 6. Generate and audit the master image prompt.

---

# Chapter 6 — Steps 6-7: Master Image Prompt + QA

## Purpose

The master image is the identity and environment anchor for the whole production. It is one full-screen vertical 9:16 still that locks the animal, anatomy, habitat, light, terrain, and composition.

It is not a storyboard. It is not a collage. It is not a panel layout.

## What AI Does

AI converts the realism fact sheet into a master image prompt and audits the resulting image.

AI should:

- Preserve the selected concept.
- Preserve species anatomy and markings.
- Preserve habitat, light, and terrain.
- Write one full-screen 9:16 image prompt.
- Add safety and negative constraints.
- Audit the generated image against the gate.
- Produce a fix prompt if the image fails.

## What Creator Does

You generate or review the image and decide whether it can become the anchor.

You must:

- Confirm the animal is the correct species.
- Confirm anatomy is readable and believable.
- Confirm the environment matches the realism lock.
- Reject text, logos, UI, captions, frame numbers, collage, grids, split screens, or extra panels.
- Save only the approved master image description for later steps.

## Master Image Prompt Architecture

Use this order.

| Section | Purpose |
| --- | --- |
| Output format | One full-screen vertical 9:16 still only |
| Scene | One sentence describing the core moment |
| Subject identity lock | Species, age, size, markings, anatomy |
| Environment lock | Region, terrain, season, weather, light |
| Composition lock | Screen position, camera angle, depth |
| Safety constraints | No gore, injury, bite contact, death, unsafe contact |
| Negative constraints | No text, logo, watermark, UI, captions, frame numbers, grid, panels, collage |
| Style | Photorealistic wildlife documentary realism |

## Copy This Into AI — Master Image Prompt Generator

```text
Create one WSTV master image prompt.

Purpose:
This image is the identity and environment anchor for a 15-second vertical 9:16 wildlife video.
It is one full-screen still only.
It is not a storyboard, not a collage, not a split screen, and not a panel layout.

Use this locked concept:
[PASTE WSTV SELECTED CONCEPT LOCK]

Use this realism fact sheet:
[PASTE REALISM FACT SHEET]

Use this geography/environment lock:
[PASTE GEOGRAPHY + ENVIRONMENT LOCK]

Prompt requirements:
- One full-screen vertical 9:16 photorealistic wildlife documentary still
- Exact species and age class
- Clear subject identity: size, anatomy, markings, posture
- Environment lock: region, terrain, season, weather, light
- Composition lock: subject position, camera angle, foreground/midground/background
- Strong mobile readability
- No text, logo, watermark, UI, subtitles, captions, frame numbers, or storyboard grid
- No split screen, collage, panel blending, morphing, or multiple panels
- No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact
- Humans absent unless explicitly requested in the concept

Output:
1. Copy-ready master image prompt
2. Negative prompt line
3. Short note explaining what the image must lock
```

## Copy This Into AI — Master Image QA Auditor

```text
Audit this WSTV master image.

Intended locked concept:
[PASTE WSTV SELECTED CONCEPT LOCK]

Realism fact sheet:
[PASTE REALISM FACT SHEET]

Generated image description or observations:
[DESCRIBE IMAGE OR PASTE SAFE NONPRIVATE NOTES]

Check:
1. Correct species
2. Correct age class
3. Believable anatomy
4. Distinct identity markings or features
5. Correct habitat and region feel
6. Correct season, weather, and light
7. One full-screen vertical 9:16 still
8. Subject readable on mobile
9. No text, logo, watermark, UI, captions, frame numbers, or storyboard grid
10. No split screen, collage, panel blending, morphing, or extra panels
11. No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact
12. Good enough to use as Image 1 master identity/environment reference

Output:
- PASS or FAIL
- Failed checklist items
- Risk level: LOW / MEDIUM / HIGH / BLOCKER
- Copy-ready fix prompt if not PASS
```

## Master Image Gate Checklist

[ ] Image is one full-screen vertical 9:16 still.
[ ] Image is not a storyboard, collage, split screen, or panel layout.
[ ] Correct species is shown.
[ ] Age class is correct.
[ ] Anatomy is believable and readable.
[ ] Identity markings or features are clear enough to reuse.
[ ] Habitat matches the realism fact sheet.
[ ] Season, weather, terrain, and light match the lock.
[ ] Subject is readable on mobile.
[ ] No text, logo, watermark, UI, subtitles, captions, frame numbers, or grid appears.
[ ] No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact appears.
[ ] Image can serve as Image 1 master identity/environment reference.

Result:

- If all boxes pass: lock the master image and continue to Chapter 7.
- If any box fails: generate a fix prompt and repeat the gate.

## Fix Prompt Examples

### Wrong Species Or Anatomy

```text
Regenerate the WSTV master image.
Keep the same environment and composition, but correct the animal identity.
The subject must be [EXACT SPECIES], [AGE CLASS], with [MARKINGS/ANATOMY].
Do not change species, size, markings, or anatomy.
One full-screen vertical 9:16 still only.
No text, logo, watermark, UI, captions, frame numbers, grid, collage, split screen, blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact.
```

### Collage Or Storyboard Appeared

```text
Regenerate as one single full-screen vertical 9:16 wildlife documentary still.
Remove all panels, borders, grids, split screen, collage layout, frame numbers, captions, text, logos, watermarks, and UI.
Keep only one continuous scene with [ANIMAL] in [ENVIRONMENT].
```

### Environment Drifted

```text
Regenerate the WSTV master image with the correct environment lock:
[PASTE ENVIRONMENT LOCK]
Keep the animal identity unchanged.
One full-screen vertical 9:16 still only.
No text, panels, grid, unsafe contact, blood, gore, visible injury, bite contact, or animal death.
```

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Asking for multiple moments | Creates storyboard-like output | Ask for one still only |
| Accepting a pretty but wrong animal | Causes species drift later | Regenerate until species and anatomy pass |
| Accepting text or watermark | Can carry into video references | Reject and remove all text/UI |
| Making the subject too small | Weak mobile readability | Move subject to foreground or midground |
| Ignoring environment mismatch | Breaks realism | Regenerate with environment lock |

## Next Action

Go to Chapter 7. Create a 9-panel storyboard using the approved master image as the identity and environment anchor.

---

# Chapter 7 — Steps 8-9: 9-Panel Storyboard + Lock Gate

## Purpose

The storyboard maps the 15-second video into exactly 9 panels. It helps lock timing, motion, camera side, screen direction, and the safe ending before writing the final Seedance prompt.

The storyboard is a planning asset. It is not the final video layout.

## What AI Does

AI turns the locked concept, realism fact sheet, geography lock, and master image identity into a 9-panel storyboard prompt.

AI should:

- Preserve the approved master image identity and environment.
- Create exactly 9 panels in a clean 3x3 grid.
- Treat each panel as a vertical 9:16 frame.
- Add only tiny frame number and short caption below each panel.
- Keep camera side and screen direction consistent.
- Avoid species drift.
- Avoid extra text, logos, watermark, UI, captions inside panels, or unsafe contact.
- Audit the storyboard before it becomes Image 2.

## What Creator Does

You approve whether the storyboard is safe and usable as a motion guide.

You must:

- Confirm exactly 9 panels.
- Confirm the animal identity matches the master image.
- Confirm camera side and screen direction stay stable.
- Confirm the ending is safe.
- Reject grid contamination risk if captions, labels, or panel text are too prominent.
- Save the approved storyboard summary for Chapter 8.

## Storyboard Requirements

| Requirement | Standard |
| --- | --- |
| Panel count | Exactly 9 |
| Layout | Clean 3x3 grid |
| Panel shape | Each panel represents a vertical 9:16 frame |
| Labels | Tiny frame number and short caption below panel only |
| Identity | Same species, anatomy, size, markings, and age class as master image |
| Environment | Same habitat, light, terrain, weather, and geography |
| Camera | Same side of action, no 180-degree flip |
| Safety | No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact |

## Reference Risk Warning

Storyboard grids, captions, labels, borders, and frame numbers can be copied into the final video if the storyboard is used as a reference image.

In Chapter 8, Image 2 must be described as storyboard shot order, framing, pacing, and motion guide only.

Never let the final video copy:

- Grid lines.
- Borders.
- Frame numbers.
- Captions.
- Text.
- Logos.
- Watermarks.
- UI.
- Panel layout.

## Copy This Into AI — 9-Panel Storyboard Prompt Generator

```text
Create a WSTV 9-panel storyboard prompt.

Purpose:
The storyboard is a motion and timing guide for a 15-second vertical 9:16 wildlife video.
It must preserve the approved master image identity and environment.
It is not the final video layout.

Use this locked concept:
[PASTE WSTV SELECTED CONCEPT LOCK]

Use this realism fact sheet:
[PASTE REALISM FACT SHEET]

Use this geography/environment lock:
[PASTE GEOGRAPHY + ENVIRONMENT LOCK]

Use this approved master image description:
[PASTE MASTER IMAGE DESCRIPTION]

Storyboard rules:
- Exactly 9 panels
- Clean 3x3 grid
- Each panel represents a vertical 9:16 frame
- Tiny frame number and short caption below each panel only
- Same animal species, age, size, markings, anatomy, and environment in every panel
- Same camera side and screen direction in every panel
- No 180-degree flip
- No extra text, logo, watermark, UI, subtitles, or captions inside panels
- No species drift
- No split screen inside panels
- No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact

Panel timing:
Panel 1: 0-2s hook
Panel 2: 2-4s escalation
Panel 3: 4-5s tension builds
Panel 4: 5-7s movement or reaction
Panel 5: 7-9s peak tension
Panel 6: 9-10s turn begins
Panel 7: 10-12s escape/protection/resolution movement
Panel 8: 12-14s safe payoff
Panel 9: 14-15s clean loop-ready ending

Output:
1. Copy-ready storyboard image prompt
2. Panel-by-panel beat list
3. Camera/geography lock reminder
4. Storyboard reference risk warning
```

## Copy This Into AI — Storyboard QA Auditor

```text
Audit this WSTV storyboard.

Locked concept:
[PASTE WSTV SELECTED CONCEPT LOCK]

Master image identity/environment:
[PASTE MASTER IMAGE DESCRIPTION]

Storyboard description or observations:
[DESCRIBE STORYBOARD OR PASTE SAFE NONPRIVATE NOTES]

Check:
1. Exactly 9 panels
2. Clean 3x3 grid
3. Each panel reads as vertical 9:16
4. Tiny frame number and short caption below panel only
5. Same species in all panels
6. Same age, size, anatomy, and markings in all panels
7. Same environment, light, terrain, and weather in all panels
8. Same camera side and screen direction, no 180-degree flip
9. No extra text, logo, watermark, UI, subtitles, or captions inside panels
10. No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact
11. Safe, clear ending
12. Usable as Image 2 storyboard/motion guide only

Output:
- PASS or FAIL
- Failed checklist items
- Risk level: LOW / MEDIUM / HIGH / BLOCKER
- Copy-ready fix prompt if not PASS
- One paragraph summary of the locked storyboard beats
```

## Storyboard Lock Gate Checklist

[ ] Storyboard has exactly 9 panels.
[ ] Storyboard is a clean 3x3 grid.
[ ] Each panel represents a vertical 9:16 frame.
[ ] Only tiny frame number and short caption appear below each panel.
[ ] No extra text, logo, watermark, UI, subtitles, or captions appear inside panels.
[ ] Species stays the same in all panels.
[ ] Age, size, anatomy, and markings stay consistent.
[ ] Environment, light, terrain, weather, and geography stay consistent.
[ ] Camera side stays consistent with no 180-degree flip.
[ ] Action reads clearly from panel 1 to panel 9.
[ ] Ending is safe and loop-ready.
[ ] No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact appears.
[ ] Creator understands Image 2 is storyboard/motion guide only and must not be copied as a grid.

Result:

- If all boxes pass: lock the storyboard and continue to Chapter 8.
- If any box fails: repair or regenerate storyboard, then repeat this gate.

## Fix Prompt Examples

### Wrong Panel Count

```text
Regenerate the storyboard as exactly 9 panels in a clean 3x3 grid.
Each panel must represent a vertical 9:16 frame.
Keep the same animal identity, environment, camera side, and safe ending.
```

### Species Drift

```text
Fix the storyboard by preserving the exact master image animal identity in every panel:
[PASTE MASTER IMAGE IDENTITY LOCK]
Do not change species, age, size, markings, or anatomy.
Keep all 9 panels in the same environment and camera side.
```

### Too Much Text Or Grid Risk

```text
Simplify storyboard labels.
Use only tiny frame numbers and very short captions below each panel.
Remove all text, UI, logos, watermarks, subtitles, captions, and labels inside panels.
Keep the grid clean and do not add decorative borders.
```

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Treating storyboard as final video composition | Can cause grid copied into video | Use it only as motion guide |
| Accepting 8 or 10 panels | Breaks timing map | Regenerate exactly 9 panels |
| Letting animal markings change | Causes identity drift | Re-anchor to master image |
| Camera crosses the action line | Creates 180-degree flip | Lock same side in every panel |
| Adding captions inside panels | Raises video contamination risk | Keep text below panels only |

## Next Action

Go to Chapter 8. Write the final Seedance 15-second prompt from the locked concept, realism fact sheet, master image, and storyboard.

---

# Chapter 8 — Step 10: Final Seedance 15s Prompt

## Purpose

This chapter creates the final Seedance prompt for one 15-second vertical 9:16 wildlife video.

The prompt must stay under 3500 characters. Preferred target is 1500-2500 characters. Shorter is better when it preserves identity, geography, timing, safety, and the ending.

Use 720p for testing. Use higher resolution only for final or high-value scenes after the workflow is reviewed.

## What AI Does

AI converts locked production notes into one clean final prompt.

AI should:

- Preserve subject identity.
- Preserve environment.
- Preserve geography and camera side.
- Use timed beats for the 15-second arc.
- Include safety and negative constraints.
- Define the safe ending.
- Keep the prompt under 3500 characters.
- Compress without removing protected details.
- Audit the prompt before dashboard dry run.

AI should not ask for private data or submit anything.

## What Creator Does

You review the prompt before the dashboard step.

You must:

- Confirm the prompt uses only safe production notes.
- Confirm Image 1 and Image 2 rules are clear.
- Confirm the prompt is under 3500 characters.
- Confirm the 0-3 second hook is strong.
- Confirm the ending is safe.
- Confirm no banned visual elements are allowed.

## Reference Image Rules

Use one or two reference images.

| Reference | Meaning | Rule |
| --- | --- | --- |
| Image 1 | Master identity/environment | Use for species, anatomy, markings, habitat, light, terrain, realism |
| Image 2 | Storyboard/motion guide only | Use only for shot order, framing, pacing, and motion |

If Image 2 is used, include this rule:

```text
Do not copy grid lines, borders, frame numbers, captions, text, logos, watermarks, UI, or panel layout from the storyboard.
```

## Prompt Architecture

| Section | Must Include |
| --- | --- |
| Format | One full-screen vertical 9:16 photorealistic wildlife documentary video, 15 seconds |
| Resolution | 720p for testing |
| Reference image rules | Image 1 identity/environment; Image 2 storyboard/motion guide only |
| Subject identity lock | Species, age, size, markings, anatomy |
| Environment lock | Region, terrain, weather, light, season |
| Geography lock | Screen positions, movement direction, camera side |
| Camera lock | No 180-degree flip |
| Timed beats | 0-3 / 3-6 / 6-9 / 9-12 / 12-15 |
| Safety constraints | No harm, no gore, no unsafe contact |
| Negative constraints | No text, UI, logo, watermark, captions, grid, split screen, collage, panel blending, morphing |
| Ending | Clear safe payoff and loop-ready final moment |

## Timed Beat Standard

| Time | Purpose |
| --- | --- |
| 0-3s | Hook: immediate animal, situation, motion, or danger |
| 3-6s | Escalation: animal reacts, obstacle appears, tension grows |
| 6-9s | Peak: closest safe moment, highest suspense |
| 9-12s | Turn: escape, parent shield, route opens, rescue distance resolves |
| 12-15s | Ending: safe payoff, readable final frame, loop point |

## Copy This Into AI — Final Seedance 15s Prompt Generator

```text
Create the final WSTV Seedance 15-second video prompt.

Use only these locked production notes:
Selected concept:
[PASTE WSTV SELECTED CONCEPT LOCK]

Realism fact sheet:
[PASTE REALISM FACT SHEET]

Geography/environment lock:
[PASTE GEOGRAPHY + ENVIRONMENT LOCK]

Master image identity/environment:
[PASTE APPROVED MASTER IMAGE DESCRIPTION]

Storyboard beats:
[PASTE APPROVED STORYBOARD SUMMARY]

Output rules:
- One full-screen vertical 9:16 photorealistic wildlife documentary video
- 15 seconds
- 720p for testing
- Preferred prompt length: 1500-2500 characters
- Absolute maximum: under 3500 characters
- Strong 0-3 second hook

Reference image rules:
Image 1 = master identity and environment reference.
Image 2 = storyboard shot order, framing, pacing, and motion guide only.
Do not copy grid lines, borders, frame numbers, captions, text, logos, watermarks, UI, or panel layout from the storyboard.

Prompt must include:
1. Subject identity lock: species, age, size, markings, anatomy
2. Environment lock: region, terrain, weather, light, season
3. Geography lock: screen positions, movement direction, camera side
4. Camera side rule: no 180-degree flip
5. Timed beats:
   0-3s hook
   3-6s escalation
   6-9s peak tension
   9-12s turn / escape / protection
   12-15s safe ending
6. Safety constraints:
   no blood, no gore, no visible injury, no bite contact,
   no animal death shown, no baby animal harmed,
   no unsafe human contact, no humans unless explicitly requested
7. Negative constraints:
   no text, logo, watermark, UI, subtitles, frame numbers,
   captions, storyboard grid, split screen, collage,
   panel blending, or morphing
8. Clear safe ending

Output:
1. Final copy-ready Seedance prompt
2. Estimated character count
3. Prompt Gate notes: PASS / REVISE
```

## Copy This Into AI — Seedance Prompt Compressor

```text
Compress this WSTV Seedance prompt to under 3500 characters.
Preferred target: 1500-2500 characters.

Protect these details:
- 15 seconds
- vertical 9:16
- photorealistic wildlife documentary realism
- 720p for testing
- strong 0-3 second hook
- subject identity lock: species, age, size, markings, anatomy
- environment lock
- geography lock
- camera side and no 180-degree flip
- all timed beats from 0-3 through 12-15 seconds
- safety constraints
- negative constraints
- safe ending

You may cut:
- repeated adjectives
- duplicate safety wording
- long scenic prose
- nonessential camera adjectives
- filler phrases

Do not remove:
no blood, no gore, no visible injury, no bite contact,
no animal death shown, no baby animal harmed,
no unsafe human contact, no humans unless explicitly requested,
no text, logo, watermark, UI, subtitles, frame numbers, captions,
no storyboard grid, no split screen, no collage, no panel blending,
no morphing, and no 180-degree flip.

Output:
1. Compressed prompt
2. Estimated character count
3. Removed details list
4. PASS if under 3500 characters, otherwise REVISE

Prompt to compress:
[PASTE PROMPT]
```

## Copy This Into AI — Prompt Gate Auditor

```text
Audit this final WSTV Seedance prompt before dashboard dry run.

Prompt:
[PASTE FINAL PROMPT]

Check:
1. Under 3500 characters
2. Preferred 1500-2500 character range, or clear reason for longer
3. 15 seconds
4. vertical 9:16
5. 720p for testing
6. photorealistic wildlife documentary realism
7. strong 0-3 second hook
8. subject identity lock included
9. environment lock included
10. geography lock included
11. camera side and no 180-degree flip included
12. timed beats included for 0-3, 3-6, 6-9, 9-12, 12-15
13. Image 1 master identity/environment rule included if references are used
14. Image 2 storyboard/motion guide only rule included if storyboard is used
15. no grid, borders, frame numbers, captions, text, logo, watermark, UI, or panel layout copied from storyboard
16. no blood, gore, visible injury, bite contact, animal death, harmed baby animal, unsafe human contact, or humans unless explicitly requested
17. no split screen, collage, panel blending, or morphing
18. safe ending included

Output:
- PASS or REVISE
- Failed items
- Exact fix text to add or replace
- Revised prompt if needed
```

## Prompt Gate Checklist

[ ] Prompt is under 3500 characters.
[ ] Prompt target is 1500-2500 characters unless there is a clear reason to be longer.
[ ] Prompt specifies 15 seconds.
[ ] Prompt specifies vertical 9:16.
[ ] Prompt specifies photorealistic wildlife documentary realism.
[ ] Prompt uses 720p for testing.
[ ] Prompt has a strong 0-3 second hook.
[ ] Subject identity lock is included.
[ ] Environment lock is included.
[ ] Geography lock is included.
[ ] Camera side and no 180-degree flip are included.
[ ] Timed beats cover 0-3, 3-6, 6-9, 9-12, and 12-15 seconds.
[ ] Image 1 is defined as master identity/environment if used.
[ ] Image 2 is defined as storyboard/motion guide only if used.
[ ] Prompt says not to copy grid, borders, frame numbers, captions, text, logos, watermarks, UI, or panel layout from storyboard.
[ ] Prompt bans blood, gore, visible injury, bite contact, animal death shown, baby animal harmed, unsafe human contact, and humans unless explicitly requested.
[ ] Prompt bans text, logo, watermark, UI, subtitles, frame numbers, captions, storyboard grid, split screen, collage, panel blending, and morphing.
[ ] Ending is safe and clear.

Result:

- If all boxes pass: continue to Chapter 9 dashboard dry run after review approval.
- If any box fails: revise or compress the prompt, then repeat this gate.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Prompt is too long | Dashboard blocks paid submit above 3500 characters | Compress before dry run |
| Storyboard used without warning | Grid, captions, or panels may appear in video | Add Image 2 guide-only rule |
| Weak 0-3 second hook | Viewer may scroll before story starts | Put visible animal action immediately |
| Missing identity lock | Species or markings may drift | Add species, age, size, anatomy, markings |
| Missing camera side | Video may flip direction | Add geography lock and no 180-degree flip |
| Ending is vague | Final seconds may feel unresolved | Write a concrete safe payoff |

## Fix/Retry Prompt

```text
Repair this WSTV final Seedance prompt.

Failure:
[DESCRIBE FAILED PROMPT GATE ITEM]

Keep the prompt under 3500 characters.
Preferred target is 1500-2500 characters.

Preserve:
- 15 seconds
- vertical 9:16
- 720p for testing
- photorealistic wildlife documentary realism
- strong 0-3 second hook
- subject identity lock
- environment lock
- geography lock
- camera side and no 180-degree flip
- timed beats
- safety constraints
- negative constraints
- safe ending

Return:
1. Repaired final prompt
2. Estimated character count
3. PASS / REVISE verdict
```

## Next Action

Go to Chapter 9. Run the local dashboard dry run with the approved final prompt.

---

# Chapter 9 — Step 11: Local Dashboard — Dry Run

## Purpose

The dry run checks the final Seedance prompt, reference image fields, filename, resolution, cost limit, and dashboard validation before any paid generation.

The local dashboard is local-only at `127.0.0.1:8765`. A dry run makes no paid BytePlus request.

## What AI Does

AI helps you prepare the dashboard fields and review dry-run errors. It should:

- Confirm the final prompt is under 3500 characters.
- Summarize what belongs in each dashboard field.
- Help diagnose dry-run log errors.
- Keep all guidance local-only and docs-only.

AI must not submit tasks, request credentials, change dashboard code, or change the 3500-character prompt limit.

## What Creator Does

You run the local dashboard and verify the dry run.

You must:

- Open the local dashboard at `127.0.0.1:8765`.
- Keep Safe Mode ON by default.
- Fill each field carefully.
- Click Dry Run before any paid action.
- Review the dry-run log.
- Fix every error before moving to Chapter 10.

## Dashboard Fields To Fill

| Field | What To Enter | Rule |
| --- | --- | --- |
| Scene idea | Short title or locked concept summary | Keep it specific and readable |
| Final Seedance prompt | Approved Chapter 8 prompt | Must be under 3500 characters |
| Reference image URL 1 | Master identity/environment image | Required for normal production |
| Reference image URL 2 | Storyboard/motion guide image | Optional; use only if needed |
| Output filename | Scene-specific filename | No vague names like `test` |
| Resolution | `720p` for testing | Use higher only for final/high-value scenes |
| Max cost USD | Creator-approved limit | Must be checked before paid submit |

## Dry Run Log Review

The dry-run log should confirm:

- Prompt accepted.
- Character count is under 3500.
- Required fields are present.
- Reference image fields are valid.
- Output filename is accepted.
- Resolution and cost settings are valid.
- No paid request was made.

Do not continue if the log shows an error, warning you do not understand, missing field, blocked validation, or prompt length failure.

## Copy This Into AI — Dry Run Review Helper

```text
Help me review a WSTV dashboard dry run.

Dashboard is local-only at 127.0.0.1:8765.
Dry run makes no paid BytePlus request.
Paid generation is not allowed unless Dry Run Gate passes.

Production rules:
- 15 seconds
- vertical 9:16
- USA Facebook Reels
- photorealistic wildlife documentary realism
- final prompt under 3500 characters
- 720p for testing
- no blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact
- no humans unless explicitly requested
- no text, logo, watermark, UI, subtitles, frame numbers, captions, storyboard grid, split screen, collage, panel blending, or morphing

Dry-run log or safe notes:
[PASTE SAFE DRY-RUN NOTES ONLY. DO NOT PASTE API KEYS, PRIVATE JSON, TEMPORARY OUTPUT URLS, MP4 LINKS, OR data/ CONTENTS.]

Output:
1. PASS / REVISE verdict
2. Any missing fields
3. Any prompt limit issue
4. Any reference image issue
5. Any filename/resolution/max-cost issue
6. Exact fix steps
7. Whether I can move to Paid Submit Gate
```

## Dry Run Gate Checklist

[ ] Dashboard is open at `127.0.0.1:8765`.
[ ] Safe Mode is ON.
[ ] Scene idea field is filled.
[ ] Final Seedance prompt is pasted.
[ ] Final Seedance prompt is under 3500 characters.
[ ] Reference image URL 1 is entered for master identity/environment.
[ ] Reference image URL 2 is entered only if storyboard/motion guide is needed.
[ ] Output filename is scene-specific and descriptive.
[ ] Resolution is set to `720p` for testing unless this is a final/high-value scene.
[ ] Max cost USD is set and acceptable.
[ ] Dry Run button was clicked.
[ ] Dry-run log was reviewed.
[ ] Dry-run log shows no blocking errors.
[ ] No paid BytePlus request was made.

Result:

- If all boxes pass: continue to Chapter 10.
- If any box fails: fix the issue and repeat the dry run.

## Common Dry-Run Errors

| Error | Likely Cause | Fix |
| --- | --- | --- |
| Prompt over limit | Final prompt exceeds 3500 characters | Compress prompt in Chapter 8 |
| Missing image field | Reference image URL 1 absent | Add master identity/environment URL |
| Storyboard warning | Reference image 2 used without risk awareness | Confirm it is motion guide only |
| Output filename rejected | Vague, unsafe, or invalid filename | Use a simple scene-specific name |
| Cost warning | Max cost missing or too low | Set an approved max cost |
| Resolution mismatch | Wrong resolution selected | Use 720p for testing |

## Fix/Retry Instructions

```text
Repair my WSTV dry-run setup.

Dry-run issue:
[DESCRIBE ERROR]

Keep:
- dashboard local-only at 127.0.0.1:8765
- Safe Mode ON during dry run
- no paid request during dry run
- final prompt under 3500 characters
- 720p for testing
- reference image 1 as master identity/environment
- reference image 2 as storyboard/motion guide only if used

Return:
1. What to change
2. Which field to edit
3. Whether the final prompt must be compressed
4. Whether I should repeat dry run before paid submit
```

## Next Action

Go to Chapter 10 only after the Dry Run Gate passes.

---

# Chapter 10 — Step 12: Paid Generation

## Purpose

Paid generation creates one WSTV Seedance video from the approved prompt and references. It should happen only after the Dry Run Gate passes.

This chapter is a safety gate, not an encouragement to submit. Submit one task only.

## What AI Does

AI can help review readiness and explain the checklist. It should:

- Confirm Dry Run Gate passed.
- Confirm the resolution choice.
- Confirm max cost is set.
- Confirm duplicate prevention steps.
- Remind you to submit one task only.

AI must not submit a task, request API keys, or tell you to bypass dashboard safety.

## What Creator Does

You make the paid decision manually.

You must:

- Confirm the dry run passed.
- Turn Safe Mode OFF only when ready.
- Type exactly `SUBMIT_ONE_PAID_TASK`.
- Submit one task only.
- Wait for completion before QA.
- Avoid duplicate submissions.

## Resolution Rule

| Situation | Resolution |
| --- | --- |
| Testing, iteration, normal prompt validation | `720p` |
| Final/high-value scene after review | `1080p` |

Use `720p` unless there is a clear reason to spend more.

## Duplicate Task Prevention

Before paid submit:

[ ] Output filename is unique.
[ ] You have not already submitted this same prompt/filename.
[ ] You have not clicked paid submit once already in this session.
[ ] If the previous submit failed or timed out, you checked local status and Console before trying again.
[ ] You understand there is no automatic retry.

## Copy This Into AI — Paid Submit Readiness Review

```text
Review my WSTV paid submit readiness.

Paid generation is allowed only after Dry Run Gate passes.
Dashboard is local-only at 127.0.0.1:8765.
Paid confirmation must be exactly: SUBMIT_ONE_PAID_TASK
Submit one task only.

Safe readiness notes:
[PASTE SAFE NOTES ONLY: dry-run verdict, resolution, max cost, output filename, prompt character count. DO NOT PASTE API KEYS, PRIVATE JSON, TEMPORARY OUTPUT URLS, MP4 LINKS, OR data/ CONTENTS.]

Check:
1. Dry Run Gate passed
2. Safe Mode should remain ON unless ready for paid submit
3. Safe Mode OFF only at the moment of intentional paid submit
4. Confirmation text exactly SUBMIT_ONE_PAID_TASK
5. One task only
6. Resolution: 720p for testing, 1080p only for final/high-value scene
7. Max cost USD verified
8. Duplicate task prevention checked

Output PASS / BLOCKED and explain any blocker.
```

## Paid Submit Gate Checklist

[ ] Dry Run Gate passed.
[ ] Safe Mode is still ON while reviewing readiness.
[ ] Final prompt is unchanged after dry run, or dry run was repeated after edits.
[ ] Output filename is unique.
[ ] Resolution is checked: `720p` for testing, `1080p` only for final/high-value scene.
[ ] Max cost USD is set correctly.
[ ] Duplicate task prevention checklist passes.
[ ] Safe Mode is set to OFF only when ready to submit.
[ ] Confirmation field contains exactly `SUBMIT_ONE_PAID_TASK`.
[ ] One paid task is submitted only once.
[ ] No automatic retry is attempted.

Result:

- If all boxes pass: submit one paid task and wait for completion.
- If any box fails: do not submit; fix and repeat the gate.

## After-Submit Notes

After submission:

- Wait for generation to complete.
- Note the output filename.
- Do not submit a second task for the same prompt unless you have confirmed the first did not create a usable paid result.
- Do not log token usage until generation confirms complete.
- Move to Video QA before editing, posting, or archiving.

## What Not To Do

Do not:

- Submit paid before dry run.
- Change prompt after dry run without repeating dry run.
- Submit multiple tasks because the page feels slow.
- Retry automatically after timeout.
- Paste private dashboard data into AI.
- Treat paid generation as QA-approved.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Turning Safe Mode OFF too early | Raises accidental-submit risk | Leave ON until final paid review |
| Retyping confirmation incorrectly | Paid gate will not pass | Use exactly `SUBMIT_ONE_PAID_TASK` |
| Submitting twice | Creates duplicate spend | Submit one task only |
| Using 1080p for tests | Higher cost during iteration | Use 720p for testing |
| Logging usage immediately | Completion and usage may not be confirmed | Log after result is complete |

## Next Action

Go to Chapter 11 after the generated video is available for review.

---

# Chapter 11 — Steps 13-14: Video QA + Repair

## Purpose

Video QA decides whether the generated video can move to editing or must be repaired, regenerated, or rejected.

Watch the full video before making any decision. A good prompt can still produce a failed video.

## What AI Does

AI helps diagnose issues from your safe description. It should:

- Classify issue severity.
- Identify likely prompt or reference cause.
- Recommend repair, regenerate, CapCut edit, or reject.
- Write targeted repair prompt text.

AI should not ask for private task JSON, temporary output URLs, MP4 links, or dashboard data.

## What Creator Does

You watch and judge the actual video.

You must:

- Watch the full video at least once.
- Check identity, safety, visual integrity, story, mobile readability, and ending.
- Mark blockers honestly.
- Do not edit around safety blockers.
- Regenerate if the issue cannot be safely fixed in CapCut.

## Issue Severity

| Severity | Meaning | Action |
| --- | --- | --- |
| BLOCKER | Violates safety, identity, format, or platform rules | Do not use; repair and regenerate |
| HIGH | Major story, camera, morphing, or continuity failure | Usually regenerate |
| MEDIUM | Noticeable quality issue but not unsafe | Repair prompt or edit if possible |
| LOW | Minor polish issue | CapCut edit or accept |

## Video QA Checklist

IDENTITY

[ ] Correct animal species.
[ ] Same individual identity through full video.
[ ] Anatomy correct.
[ ] No species drift between frames.
[ ] Animal count stays believable and consistent.

SAFETY

[ ] No blood.
[ ] No gore.
[ ] No visible injury.
[ ] No bite contact.
[ ] No animal death shown.
[ ] No baby animal harmed.
[ ] No unsafe human contact.
[ ] No humans unless explicitly requested.

VISUAL INTEGRITY

[ ] No text, watermark, logo, UI, subtitles, captions, or frame numbers.
[ ] No storyboard grid, borders, or panel layout copied.
[ ] No split screen, collage, panel blending, or morphing.
[ ] Camera direction stays consistent with no 180-degree flip.

STORY + MOBILE

[ ] Hook is clear in the first 0-3 seconds.
[ ] Story is readable on mobile without sound.
[ ] Ending is clear and safe.
[ ] Loop ending is acceptable with no hard confusing jump.

## Repair Decision

| Issue Type | Best Action |
| --- | --- |
| Safety blocker | Regenerate with repair prompt |
| Wrong species or identity drift | Regenerate with stronger identity lock |
| Text, grid, UI, watermark | Regenerate unless removable by crop without harming video |
| Camera flip | Regenerate with camera-side lock |
| Bad audio only | CapCut mute or replace |
| Long start or rough end | CapCut trim if story remains intact |
| Slight color or exposure issue | CapCut edit |

## Copy This Into AI — Video Mistake Diagnosis Prompt

```text
I have a WSTV wildlife AI video with a problem.
Diagnose the issue and recommend the safest next action.

Production rules:
- 15 seconds
- vertical 9:16
- USA Facebook Reels
- photorealistic wildlife documentary realism
- strong 0-3 second hook
- no blood, gore, visible injury, bite contact, animal death shown, harmed baby animal, unsafe human contact, or humans unless explicitly requested
- no text, logo, watermark, UI, subtitles, frame numbers, captions, storyboard grid, split screen, collage, panel blending, or morphing

Original intended scene:
[PASTE SAFE SCENE SUMMARY]

Problem observed:
[DESCRIBE WHAT YOU SAW. DO NOT PASTE PRIVATE JSON, TEMPORARY OUTPUT URLS, MP4 LINKS, OR data/ CONTENTS.]

Output:
1. Issue category
2. Severity: LOW / MEDIUM / HIGH / BLOCKER
3. Likely cause
4. Repair vs regenerate vs CapCut edit recommendation
5. Exact repair language to add to the prompt
6. Whether Video QA Gate can pass after this fix
```

## Copy This Into AI — Video Repair Prompt Generator

```text
Create a targeted WSTV video repair prompt.

Original final prompt:
[PASTE FINAL PROMPT]

QA issue:
[PASTE ISSUE DIAGNOSIS]

Repair goal:
[DESCRIBE THE SPECIFIC FIX]

Keep:
- final prompt under 3500 characters
- 15 seconds
- vertical 9:16
- USA Facebook Reels
- photorealistic wildlife documentary realism
- strong 0-3 second hook
- subject identity lock
- environment lock
- geography lock
- no 180-degree flip
- safe ending

Remove/avoid:
blood, gore, visible injury, bite contact, animal death shown,
baby animal harmed, unsafe human contact, humans unless explicitly requested,
text, logo, watermark, UI, subtitles, frame numbers, captions,
storyboard grid, split screen, collage, panel blending, and morphing.

Output:
1. Repaired final prompt
2. Estimated character count
3. What changed
4. Which QA issue it addresses
```

## Specific Repair Prompts

| Failure | Copy-Ready Repair Language |
| --- | --- |
| Wrong animal / species drift | `Keep the exact same species, age, size, markings, and anatomy from Image 1 through the full video. Do not change species or transform into another animal.` |
| Wrong animal count | `Show only [COUNT] main animal(s). Do not add extra animals, duplicates, crowds, or background copies.` |
| Storyboard grid copied | `Use Image 2 only for shot order and motion. Do not copy grid lines, borders, panels, frame numbers, captions, text, or layout.` |
| Text / watermark / UI appeared | `No text, logo, watermark, UI, subtitles, captions, labels, frame numbers, or readable marks anywhere in the video.` |
| Character morphing | `No morphing. Preserve stable body shape, anatomy, size, markings, and identity in every frame.` |
| Camera flip / 180-degree break | `Camera stays on the same side of the action for the entire video. No 180-degree flip. Movement direction remains consistent.` |
| Unsafe contact | `Keep animals and humans separated by professional distance or safe equipment. No casual touching, grabbing, holding, riding, or direct contact.` |
| Visible injury / gore | `No blood, gore, wounds, visible injury, limping injury focus, graphic contact, or aftermath of harm.` |
| Baby animal harmed | `The baby animal remains unharmed and visibly safe by the ending. No impact, injury, trapping, or distress close-up.` |
| Weak ending | `End with a clear safe payoff in seconds 12-15: [DESCRIBE SAFE ENDING]. Final frame should be readable and loop-ready.` |
| Confusing story | `Simplify the 15-second arc: 0-3s clear hook, 3-6s reaction, 6-9s peak, 9-12s turn, 12-15s safe resolution.` |

## Video QA Gate Checklist

[ ] Full video was watched.
[ ] Correct species and identity remain consistent.
[ ] Animal count is correct.
[ ] No blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact appears.
[ ] Humans are absent unless explicitly requested.
[ ] No text, logo, watermark, UI, subtitles, frame numbers, captions, or storyboard grid appears.
[ ] No split screen, collage, panel blending, or morphing appears.
[ ] Camera side stays consistent with no 180-degree flip.
[ ] 0-3 second hook is clear.
[ ] Story is readable on mobile without sound.
[ ] Ending is safe and clear.
[ ] Any issue has a severity label.
[ ] BLOCKER or HIGH issues were not accepted as final.
[ ] Repair/regenerate/edit decision is documented.

Result:

- If all boxes pass: continue to Chapter 12.
- If any blocker appears: repair and regenerate from Step 10.
- If only low polish issues remain: fix in CapCut if appropriate.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Watching only the first few seconds | Failures often appear near the end | Watch the full video |
| Editing around unsafe content | Safety blockers remain | Regenerate |
| Calling species drift “minor” | Identity is core quality | Repair identity lock |
| Ignoring grid artifacts | Storyboard contamination looks unprofessional | Regenerate with guide-only rule |
| Accepting confusing endings | Weakens loop and retention | Repair ending or trim only if clear |

## Next Action

Go to Chapter 12 after Video QA Gate passes.

---

# Chapter 12 — Step 15: CapCut Edit & Export

## Purpose

CapCut turns the QA-approved generated video into a clean final export for Facebook Reels.

This step is for trimming, audio cleanup, optional overlays, and export settings. It is not for hiding safety blockers.

## What AI Does

AI can help create an edit checklist or thumbnail text ideas. It should:

- Suggest trim points.
- Suggest audio cleanup.
- Suggest thumbnail overlay text.
- Confirm export settings.

AI should not claim the video passed QA if you have not checked it.

## What Creator Does

You edit and export.

You must:

- Import the generated video.
- Trim to a clean 15 seconds if needed.
- Remove or mute bad audio if needed.
- Prefer natural field audio when available and clean.
- Add optional logo or thumbnail text only in CapCut, outside AI generation.
- Export in the required format.

## CapCut Edit Rules

| Task | Rule |
| --- | --- |
| Import | Use the QA-approved generated video |
| Trim | Keep the story readable and close to 15 seconds |
| Audio | Prefer natural field audio; mute distorted audio |
| Music | Use only rights-safe audio |
| Logo | Optional, added in CapCut, not generated inside AI video |
| Thumbnail text | Allowed only as CapCut overlay or post thumbnail, not inside AI video |
| Safety blockers | Do not hide them with edits; regenerate instead |

## Export Settings

| Setting | Value |
| --- | --- |
| Resolution | `1080x1920` |
| Aspect ratio | `9:16` |
| Frame rate | `24 fps` or `30 fps` |
| Codec | `H.264` |
| Length | `15 seconds` |
| Platform | USA Facebook Reels |

## Copy This Into AI — CapCut Edit Plan

```text
Create a WSTV CapCut edit plan.

Video QA verdict:
[PASTE SAFE QA SUMMARY]

Scene summary:
[PASTE SAFE SCENE SUMMARY]

Rules:
- final export 1080x1920
- vertical 9:16
- 24 or 30 fps
- H.264
- 15 seconds
- no safety blockers accepted
- thumbnail text may be added only as CapCut overlay or post thumbnail, not inside AI-generated video
- optional logo may be added only in CapCut, not inside AI-generated video
- natural field audio preferred

Output:
1. Trim guidance
2. Audio guidance
3. Optional thumbnail text ideas
4. Export settings checklist
5. Any reason not to export
```

## CapCut Export Checklist

[ ] Video QA Gate passed.
[ ] Generated video imported into CapCut.
[ ] Clip is trimmed to a clean 15 seconds if needed.
[ ] Story still has clear hook, middle, and safe ending after trim.
[ ] Bad or distorted audio is muted or replaced.
[ ] Natural field audio is used if clean and rights-safe.
[ ] Optional logo is added only in CapCut, not inside AI generation.
[ ] Thumbnail text is added only as overlay/post asset, not inside AI-generated video.
[ ] Export resolution is `1080x1920`.
[ ] Export frame rate is `24 fps` or `30 fps`.
[ ] Export codec is `H.264`.
[ ] Final export is 15 seconds.

Result:

- If all boxes pass: continue to Chapter 13.
- If any box fails: fix the edit/export settings and export again.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Using CapCut to hide unsafe content | Safety blocker remains | Regenerate instead |
| Exporting wrong aspect ratio | Poor Reels display | Use 1080x1920 |
| Leaving distorted audio | Hurts quality | Mute or replace |
| Adding text during AI generation | Violates WSTV video rules | Add text only in CapCut |
| Over-trimming hook | Story becomes confusing | Preserve 0-3 second hook |

## Fix/Retry Prompt

```text
Review my WSTV CapCut export issue.

Issue:
[DESCRIBE EXPORT OR EDIT PROBLEM]

Required settings:
- 1080x1920
- vertical 9:16
- 24 or 30 fps
- H.264
- 15 seconds
- no safety blockers
- thumbnail text only as CapCut overlay/post thumbnail

Return exact fix steps.
```

## Next Action

Go to Chapter 13 and generate the Facebook social pack.

---

# Chapter 13 — Step 16: Facebook Caption & Social Pack

## Purpose

The social pack prepares the finished WSTV video for USA Facebook Reels with titles, caption, hashtags, pinned comment, optional disclosure, and thumbnail text ideas.

Do this only after the video is QA-approved and exported.

## What AI Does

AI writes short platform copy. It should:

- Create 3 title options.
- Write one caption under 150 characters.
- Provide exactly 5 hashtags.
- Write one pinned comment.
- Add optional AI disclosure if requested.
- Suggest thumbnail text ideas for CapCut overlay or post asset only.

AI should not invent rescue claims or claim real footage if the scene is AI-generated.

## What Creator Does

You approve the final words.

You must:

- Confirm the caption matches what is actually shown.
- Use American English.
- Avoid fake rescue claims unless rescue is actually shown.
- Keep exactly 5 hashtags.
- Keep thumbnail text outside the generated AI video.

## Social Pack Requirements

| Asset | Rule |
| --- | --- |
| Titles | 3 options, short and clear |
| Caption | Under 150 characters |
| Hashtags | Exactly 5 |
| Language | American English |
| Claims | No fake rescue claims |
| Pinned comment | Short, warm, and engagement-friendly |
| AI disclosure | Optional, honest, neutral |
| Thumbnail text | Ideas only; not inside AI video |

## Copy This Into AI — Facebook Social Pack Generator

```text
Generate a WSTV Facebook social pack.

Brand: Wild Stories TV / WSTV
Platform: USA Facebook Reels
Video format: 15-second vertical 9:16 wildlife video
Style: photorealistic wildlife documentary realism

Video description:
[DESCRIBE WHAT IS ACTUALLY SHOWN]

Animals:
[LIST ANIMALS]

Scene category:
[CATEGORY]

Outcome:
[SAFE ENDING / ESCAPE / PROTECTION / RESCUE / COMIC PAYOFF]

Rules:
- American English
- caption under 150 characters
- exactly 5 hashtags
- no fake rescue claims unless rescue is actually shown
- do not claim real footage if disclosure is needed
- thumbnail text ideas are for CapCut overlay or post thumbnail only, not inside AI-generated video

Output:
1. Three title options under 8 words each
2. One Facebook caption under 150 characters
3. Exactly 5 hashtags
4. One pinned comment under 100 characters
5. Optional AI disclosure line
6. Three thumbnail text ideas
```

## Social Pack Gate Checklist

[ ] Video QA Gate passed.
[ ] Final export exists.
[ ] 3 title options are provided.
[ ] Caption is under 150 characters.
[ ] Caption uses American English.
[ ] Caption accurately describes what is shown.
[ ] No fake rescue claim is made.
[ ] Exactly 5 hashtags are included.
[ ] Pinned comment is short and natural.
[ ] Optional AI disclosure line is honest and neutral if used.
[ ] Thumbnail text ideas are clearly for CapCut overlay or post thumbnail only.
[ ] No instruction adds text inside AI-generated video.

Result:

- If all boxes pass: continue to Chapter 14.
- If any box fails: revise the social pack and repeat this gate.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Caption too long | Weak mobile readability | Keep under 150 characters |
| Too many hashtags | Looks spammy and breaks the rule | Use exactly 5 |
| Fake rescue claim | Misrepresents the video | Say only what is shown |
| Thumbnail text in AI prompt | Violates video generation rules | Add text only in CapCut/post asset |
| Over-explaining AI | Distracts from video | Use one neutral disclosure line if needed |

## Fix/Retry Prompt

```text
Repair this WSTV social pack.

Problem:
[DESCRIBE ISSUE]

Rules:
- American English
- caption under 150 characters
- exactly 5 hashtags
- no fake rescue claims unless rescue is actually shown
- optional AI disclosure must be honest and neutral
- thumbnail text ideas are not inside AI-generated video

Return a corrected social pack.
```

## Next Action

Go to Chapter 14 and generate the comment reply pack.

---

# Chapter 14 — Step 17: Comment Reply Pack

## Purpose

The comment reply pack gives you ready responses for common Facebook comments after publishing.

Replies should be warm, short, natural, and non-argumentative. Do not start every reply with “Absolutely.”

## What AI Does

AI drafts reply options. It should:

- Write 10 friendly replies.
- Write 5 AI skeptic replies.
- Write 5 animal safety replies.
- Write 3 no-touch wildlife replies.
- Keep tone short, calm, and varied.

AI should not argue with viewers, over-explain, or shame people.

## What Creator Does

You choose replies that fit the actual comment.

You must:

- Read the viewer comment first.
- Pick the correct reply type.
- Edit for natural voice if needed.
- Avoid defensive or repetitive replies.
- Avoid giving unsafe wildlife advice.

## Reply Types

| Reply Type | Count | Use For |
| --- | ---: | --- |
| Friendly replies | 10 | Positive reactions, awe, emotion, general comments |
| AI skeptic replies | 5 | “This is fake,” “AI?” or realism questions |
| Animal safety replies | 5 | Welfare, rescue, habitat, species concern |
| No-touch wildlife replies | 3 | Handling, rescue distance, “I would grab it” comments |

## Bad Reply Examples To Avoid

| Bad Reply | Why To Avoid |
| --- | --- |
| “You clearly don’t understand wildlife.” | Insulting and argumentative |
| “Absolutely! Absolutely! Absolutely!” | Repetitive and unnatural |
| “Anyone should pick up animals like this.” | Unsafe wildlife advice |
| “This is 100% real footage.” | Misleading if AI-generated |
| “Stop commenting if you don’t like it.” | Escalates conflict |

## Copy This Into AI — Comment Reply Pack Generator

```text
Generate a WSTV comment reply pack.

Brand: Wild Stories TV / WSTV
Platform: USA Facebook Reels
Video summary:
[PASTE SAFE VIDEO SUMMARY]

Tone:
warm, short, natural, calm, wildlife-aware, non-argumentative

Rules:
- Do not start every reply with “Absolutely.”
- Do not argue with viewers.
- Do not shame people.
- Do not give unsafe wildlife handling advice.
- Be honest and calm about AI if asked.
- Keep most replies 1 sentence.

Output:
1. 10 friendly replies
2. 5 AI skeptic replies
3. 5 animal safety replies
4. 3 no-touch wildlife replies
5. 5 bad reply patterns to avoid
```

## Comment Reply Tone Checklist

[ ] Replies are warm and natural.
[ ] Replies are short enough for Facebook comments.
[ ] Replies do not all start the same way.
[ ] Replies do not all start with “Absolutely.”
[ ] AI skeptic replies are honest, calm, and brief.
[ ] Animal safety replies are welfare-aware and non-preachy.
[ ] No-touch replies recommend professional distance.
[ ] No reply gives unsafe wildlife handling advice.
[ ] No reply insults, argues, or shames viewers.
[ ] Replies match what is actually shown in the video.

Result:

- If all boxes pass: continue to Chapter 15.
- If any box fails: revise the reply pack and repeat this checklist.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Over-answering skeptics | Creates arguments | Keep replies brief and calm |
| Repeating the same opener | Sounds automated | Vary sentence starts |
| Giving rescue instructions | Unsafe | Recommend trained help and distance |
| Sounding defensive | Hurts brand tone | Stay warm and factual |
| Using replies without reading comments | Can mismatch context | Choose reply by situation |

## Fix/Retry Prompt

```text
Revise this WSTV comment reply pack.

Problem:
[DESCRIBE TONE OR SAFETY ISSUE]

Rules:
- warm, short, natural
- do not start every reply with “Absolutely”
- no arguing
- no unsafe wildlife handling advice
- honest and calm if AI is mentioned

Return corrected replies only.
```

## Next Action

Go to Chapter 15 and record token/cost tracking after paid generation is complete.

---

# Chapter 15 — Step 18: Token / Cost Tracking

## Purpose

Token and cost tracking helps the creator estimate production capacity and avoid duplicate usage records.

BytePlus Console Billing remains the final source of truth. The dashboard/local ledger is for creator tracking only.

## What AI Does

AI can help explain estimates and check a manual entry. It should:

- Compare selected resolution with projected tokens.
- Explain pack tokens left and estimated videos left.
- Help check duplicate usage risk.
- Remind you that Console Billing is final.

AI should not ask for API keys, private JSON, temporary output URLs, or MP4 links.

## What Creator Does

You record usage only after paid generation confirms complete.

You must:

- Check BytePlus Console Billing for final usage.
- Use dashboard/local ledger for tracking.
- Avoid logging dry runs.
- Avoid duplicate usage entries.
- Use manual console usage entry only from verified Console data.

## Token Reference

| Resolution | Projected Tokens | Use |
| --- | ---: | --- |
| `720p` | `324000` | Testing and normal iteration |
| `1080p` | `801900` | Final/high-value scenes only |

Use `720p` for testing.

## Token Pack Example

| Field | Example |
| --- | --- |
| Pack size | `1M x 7` |
| Total tokens | `7,000,000` |
| Total price | `$30.10` |
| Effective rate | `$4.30/M` |
| Validity | `90 days` |

## How To Read The Tracker

| Tracker Field | Meaning |
| --- | --- |
| Pack tokens left | Estimated remaining token balance in local tracker |
| Pack videos left | How many more videos fit at selected resolution |
| Estimated videos left | Projection, not billing guarantee |
| Selected resolution | Determines estimated next-video token use |
| Token source | Actual Console usage or local estimate |

## Manual Console Usage Entry

Use manual entry only when:

- A paid generation completed.
- Console usage is known.
- The generation is not already logged.
- The filename/date/token combination is not a duplicate.

Never log a dry run as paid usage.

## Copy This Into AI — Token Usage Review

```text
Review this WSTV token/cost tracking entry.

BytePlus Console Billing remains the final source of truth.
The dashboard/local ledger is for creator tracking only.

Production usage notes:
[PASTE SAFE NOTES ONLY: output filename, resolution, token count if verified, date, whether paid generation completed. DO NOT PASTE API KEYS, PRIVATE JSON, TEMPORARY OUTPUT URLS, MP4 LINKS, OR data/ CONTENTS.]

Reference:
- 720p projected tokens: 324000
- 1080p projected tokens: 801900
- 720p is for testing
- 1080p is for final/high-value scenes only
- example pack: 7M tokens, 1M x 7, $30.10 total, $4.30/M, valid 90 days

Check:
1. Is this a completed paid generation?
2. Is this not a dry run?
3. Is the resolution recorded?
4. Is the token count actual or estimated?
5. Is there duplicate-entry risk?
6. What should the creator verify in Console?

Output PASS / BLOCKED with exact correction steps.
```

## Token Usage Entry Checklist

[ ] Paid generation completed.
[ ] Dry runs are not logged as paid usage.
[ ] BytePlus Console Billing was checked when actual usage is needed.
[ ] Output filename is recorded.
[ ] Resolution is recorded.
[ ] Token count is recorded as actual or estimated.
[ ] Token source is clear.
[ ] Entry is not a duplicate.
[ ] Manual console usage entry uses verified Console data.
[ ] Selected resolution matches the production record.

Result:

- If all boxes pass: continue to Chapter 16.
- If any box fails: do not log yet; verify and repeat the checklist.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Logging dry run usage | Dry run is not paid usage | Log only completed paid generations |
| Treating estimates as final billing | Estimates can differ | Check Console Billing |
| Duplicate entry | Inflates cost and reduces estimated videos left | Check filename/date/token record |
| Missing resolution | Token math becomes unreliable | Record 720p or 1080p |
| Forgetting pack validity | Remaining videos may expire | Track purchase date and 90-day validity |

## Fix/Retry Prompt

```text
Fix my WSTV token/cost tracking note.

Problem:
[DESCRIBE ISSUE]

Rules:
- Console Billing is final source of truth
- local ledger is creator tracking only
- do not log dry runs
- do not duplicate paid usage
- record output filename, resolution, token count, token source, and date

Return the corrected tracking note and any verification needed.
```

## Next Action

Go to Chapter 16 and archive the production notes.

---

# Chapter 16 — Step 19: Archive Production Notes

## Purpose

The archive step saves the production record so future WSTV videos improve over time.

Archive only safe production notes. Do not save secrets, private task artifacts, temporary output links, or private media links in the playbook source.

## What AI Does

AI can format the archive note and summarize lessons learned. It should:

- Organize safe production details.
- Capture prompts used.
- Capture QA verdict and repair notes.
- Capture social pack.
- Capture lessons for future production.

AI should not request or store API keys, private JSON, signed URLs, MP4 links, secrets, or anything under `data/`.

## What Creator Does

You save a clean production note.

You must save:

- Scene title.
- Animals.
- Category.
- Master image prompt.
- Storyboard prompt.
- Final Seedance prompt.
- Output filename.
- Resolution.
- Token usage.
- QA verdict.
- Social pack.
- Lessons learned.

You must not save:

- API keys.
- Private JSON.
- Signed URLs.
- MP4 links.
- Secrets.
- Anything from `data/`.

## Copy This Into AI — Production Archive Note Template

```text
Create a safe WSTV Production Archive Note.

Rules:
- Include only safe production notes.
- Do not include API keys.
- Do not include private JSON.
- Do not include signed URLs.
- Do not include MP4 links.
- Do not include secrets.
- Do not include anything from data/.

Use this structure:

# WSTV Production Archive Note

Scene title:
[TITLE]

Animals:
[ANIMALS]

Category:
[CATEGORY]

Platform / format:
USA Facebook Reels, 15 seconds, vertical 9:16

Master image prompt:
[PASTE SAFE PROMPT TEXT]

Storyboard prompt:
[PASTE SAFE PROMPT TEXT]

Final Seedance prompt:
[PASTE SAFE PROMPT TEXT]

Output filename:
[FILENAME ONLY]

Resolution:
[720p / 1080p]

Token usage:
[TOKEN COUNT AND SOURCE]

QA verdict:
[PASS / REPAIR / REJECT + SHORT NOTES]

Social pack:
[TITLE OPTIONS, CAPTION, HASHTAGS, PINNED COMMENT, OPTIONAL DISCLOSURE]

Lessons learned:
[WHAT WORKED / WHAT TO CHANGE NEXT TIME]

Next improvement:
[ONE PRACTICAL NOTE]
```

## Archive Gate Checklist

[ ] Scene title is saved.
[ ] Animals are saved.
[ ] Category is saved.
[ ] Master image prompt is saved.
[ ] Storyboard prompt is saved.
[ ] Final Seedance prompt is saved.
[ ] Output filename is saved as filename only.
[ ] Resolution is saved.
[ ] Token usage and source are saved.
[ ] QA verdict is saved.
[ ] Social pack is saved.
[ ] Lessons learned are saved.
[ ] No API keys are saved.
[ ] No private JSON is saved.
[ ] No signed URLs are saved.
[ ] No MP4 links are saved.
[ ] No secrets are saved.
[ ] Nothing from `data/` is saved.

Result:

- If all boxes pass: production record is complete.
- If any box fails: remove unsafe or missing content and repeat this gate.

## Common Mistakes

| Mistake | Why It Fails | Fix |
| --- | --- | --- |
| Saving private task data | Security risk | Save only safe production notes |
| Forgetting QA verdict | Future review loses context | Save PASS / REPAIR / REJECT |
| Saving links instead of filenames | Can expose private outputs | Save filename only |
| Not saving lessons learned | Repeats avoidable mistakes | Add one practical lesson |
| Mixing archive with dashboard data | Creates unsafe docs | Keep archive separate and clean |

## Fix/Retry Prompt

```text
Clean this WSTV archive note for safe storage.

Archive note:
[PASTE NOTE]

Remove:
- API keys
- private JSON
- signed URLs
- MP4 links
- secrets
- anything from data/

Keep:
- scene title
- animals
- category
- master image prompt
- storyboard prompt
- final Seedance prompt
- output filename only
- resolution
- token usage
- QA verdict
- social pack
- lessons learned

Return the cleaned archive note.
```

## Next Action

Production complete. Use Chapter 17 for category reference on the next production.

---

# Chapter 17 — Scene Category Encyclopedia

## Purpose

This chapter is the fast reference for choosing a WSTV scene category. Use it before Chapter 3 when you need a proven structure for a 15-second vertical 9:16 wildlife video for USA Facebook Reels.

Every category must keep WSTV realism and safety rules: photorealistic wildlife documentary realism, strong 0-3 second hook, no blood, no gore, no visible injury, no bite contact, no animal death shown, no baby animal harmed, no unsafe human contact, no humans unless explicitly requested, no text/logo/watermark/UI/subtitles/frame numbers/captions inside generated video, no storyboard grid copied into video, no split screen, no collage, no panel blending, no morphing, and final Seedance prompt under 3500 characters.

## How To Use This Encyclopedia

| Need | Use |
| --- | --- |
| High suspense without harm | Predator Near-Miss |
| Emotional rescue or protection | Baby Animal Rescue / Protection |
| Parent blocks danger | Parent Protection |
| Animal escapes terrain problem | Natural Obstacle Escape |
| Weather creates urgency | Storm / Flood / Fire Survival |
| Shoreline or marine animal | Marine / Beach Rescue |
| Professional distance rescue | Helicopter / Vehicle Rescue |
| Group protects young | Herd Wall Protection |
| Shareable low-risk comedy | Comic Wildlife Mistake |
| Gentle emotion, no threat | Quiet Emotional Wildlife Moment |

## Category Reference Table

| # | Category | Purpose | Best Animals | USA-Friendly Habitats | Best Opening Hooks | 15s Arc Pattern | Main Danger Rules | Generation Risks | Safety Risks | Sample Ideas | Verdict Guidance |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Predator Near-Miss | Create suspense with escape, bluff, or interruption. | wolf/elk, eagle/rabbit, lion/zebra, coyote/deer | forest edge, snowy meadow, savanna, cliff path | prey freezes, shadow enters, predator appears at edge | hook, chase starts, near-miss, escape turn, safe distance | no bite contact, no injury, no death | contact may appear, species may change | BLOCKER if contact or injury appears | elk dodges wolf at creek; rabbit slips under brush before eagle lands | PASS only if it stays near-miss |
| 2 | Baby Animal Rescue / Protection | Use safe baby-animal emotion. | bear cub, elephant calf, seal pup, fawn, owl chick | riverbank, beach, forest clearing, meadow | baby near obstacle, parent notices | baby in trouble, helper arrives, safe path opens, baby exits safe | baby never harmed, no casual handling | baby may look injured or trapped too harshly | BLOCKER if baby harmed | calf blocked from flood edge by mother; seal pup guided from tide pool | PASS only with clear safe ending |
| 3 | Parent Protection | Show parent positioning between young and danger. | bison cow/calf, elephant cow/calf, wolf mother/pups, goose/goslings | grassland, waterhole, den edge, pond trail | young visible, threat approaches, parent steps in | young at risk, parent blocks, threat pauses, young moves safe | no attack contact, no gore | parent may lunge too aggressively | HIGH if contact implied | bison cow blocks coyote; elephant shields calf from ditch | PASS if protection is distance/blocking |
| 4 | Natural Obstacle Escape | Build tension from terrain, tide, mud, ice, branch, or ledge. | deer, moose, turtle, fox, wild horse | mud flat, shallow creek, snow edge, tide pool, ledge | animal stuck or approaching edge | obstacle, struggle, route appears, animal exits, safe final | no burial, crushing, direct impact | obstacle may become graphic | BLOCKER if animal visibly injured | deer steps out of frozen creek; turtle turns from tire rut | PASS if escape is believable |
| 5 | Storm / Flood / Fire Survival | Use distant natural hazard and movement to safety. | deer, wild horse, wolf pack, bison, bear | river bend, canyon, meadow, ridge, forest edge | distant lightning, rising water, smoke far away | hazard visible, animals move, route narrows, safety reached | hazard stays non-graphic, no direct impact | smoke/flood may obscure subject | BLOCKER if burning, drowning, impact shown | horses move to ridge before flood; deer exits storm creek | PASS if hazard is distant and readable |
| 6 | Marine / Beach Rescue | Use shoreline wildlife with safe-distance rescue or natural escape. | sea turtle, seal, otter, sea lion, shorebird | rocky beach, tide pool, sandbar, dune edge | animal near tide/rope/rock, surf moving | problem, safe approach/distance, route opens, ocean/shore safety | no casual handling, no injury | rope/gear may look tangled into body | HIGH if unsafe handling appears | turtle turns toward surf; seal pup moves off rocks | PASS if no casual touch |
| 7 | Helicopter / Vehicle Rescue | Show professional rescue context at distance. | elk, deer, horse, large bird, sea turtle | road edge, flood plain, beach, open field | vehicle lights far back, animal near obstacle | professionals set distance, equipment guides, animal reaches safe zone | only professional equipment, no casual contact | vehicles may dominate frame | HIGH if humans grab animal | ranger vehicle blocks road while elk crosses; rescue crate waits near turtle path | PASS if animal remains central |
| 8 | Herd Wall Protection | Show group formation around young. | bison, musk ox, elephants, elk | grassland, snowy plain, waterhole | calf in center, herd closes ranks | threat/danger appears, herd forms wall, young moves safe, calm end | no predator contact, no attack | too many animals may confuse model | HIGH if collision/attack shown | bison ring closes around calf; elephants shield calf from ditch | PASS if formation is clear |
| 9 | Comic Wildlife Mistake | Create harmless animal behavior comedy. | fox, coyote, raccoon, otter, squirrel, penguin | meadow, creek, campsite edge, snowy path | animal investigates wrong object | curiosity, mistake, surprise, retreat, safe funny ending | zero injury, no trapping, no unsafe human contact | comedy may become cartoonish | MEDIUM if realism drops | raccoon startles at reflection; otter slides past fish | PASS if realistic and gentle |
| 10 | Quiet Emotional Wildlife Moment | Create warmth without high danger. | wolf, owl, deer, elephant, fox, sea turtle | forest dawn, meadow sunset, den edge, beach dusk | animal pauses, reunion or rest begins | quiet hook, approach, recognition, calm contact/distance, soft ending | no sudden attack, no fake rescue claim | may be too slow | LOW unless unsafe contact added | wolf returns to pack; owl chick settles under wing | PASS if emotion is readable |

## Copy-Ready Category Prompts

Use one prompt and replace bracketed fields.

### Predator Near-Miss

```text
Generate 5 WSTV Predator Near-Miss ideas.
Animal pair: [PREDATOR] and [PREY]
Habitat: [HABITAT]
Rules: 15 seconds, vertical 9:16, USA Facebook Reels, photorealistic wildlife documentary realism, strong 0-3 second hook. The scene must be a near-miss, bluff, or escape. No blood, gore, visible injury, bite contact, animal death shown, harmed baby animal, unsafe human contact, text, logo, watermark, UI, subtitles, frame numbers, captions, storyboard grid, split screen, collage, panel blending, or morphing.
Output 5 ideas with title, hook, 15s arc, safety note, generation risk, and PASS / REVISE / REJECT.
```

### Baby Animal Rescue / Protection

```text
Generate 5 WSTV Baby Animal Rescue / Protection ideas.
Baby animal: [BABY ANIMAL]
Protector/rescuer: [PARENT / HERD / PROFESSIONAL RESCUER / NONE]
Habitat: [HABITAT]
Rules: baby animal is never harmed, ending shows baby safe, humans appear only if explicitly requested and must use professional distance or equipment. No casual touching. Keep 15 seconds, vertical 9:16, USA Facebook Reels, photorealistic realism, strong 0-3 second hook, and all WSTV safety rules.
Output 5 ideas with PASS / REVISE / REJECT.
```

### Parent Protection

```text
Generate 5 WSTV Parent Protection ideas.
Parent animal: [PARENT]
Young animal: [YOUNG]
Possible danger: [DANGER]
Habitat: [HABITAT]
Rules: parent protects by blocking, guiding, shielding, or positioning. No attack contact, bite contact, visible injury, blood, gore, animal death, harmed baby animal, unsafe human contact, text, UI, grid, split screen, collage, panel blending, or morphing.
Output 5 safe 15-second vertical 9:16 ideas for USA Facebook Reels.
```

### Natural Obstacle Escape

```text
Generate 5 WSTV Natural Obstacle Escape ideas.
Animal: [ANIMAL]
Obstacle: [MUD / TIDE / ICE / LEDGE / BRANCH / WATER CHANNEL]
Habitat: [HABITAT]
Rules: danger comes from terrain, not graphic harm. No crushing, burial, direct impact, visible injury, blood, gore, animal death, harmed baby animal, unsafe human contact, text, logo, watermark, UI, subtitles, frame numbers, captions, grid, split screen, collage, panel blending, or morphing.
Output 5 ideas with safe endings.
```

### Storm / Flood / Fire Survival

```text
Generate 5 WSTV Storm / Flood / Fire Survival ideas.
Animal(s): [ANIMAL]
Hazard: [DISTANT STORM / RISING WATER / DISTANT SMOKE]
Habitat: [HABITAT]
Rules: hazard remains distant or non-graphic. No direct impact, burning animal, drowning, injury, gore, bite contact, animal death, harmed baby animal, unsafe human contact, text, UI, grid, split screen, collage, panel blending, or morphing. Keep action readable on mobile.
Output 5 ideas with 0-3s hooks and PASS / REVISE / REJECT.
```

### Marine / Beach Rescue

```text
Generate 5 WSTV Marine / Beach Rescue ideas.
Marine animal: [ANIMAL]
Setting: [BEACH / TIDE POOL / ROCKS / SANDBAR]
Human rescue visible? [YES / NO]
Rules: if humans appear, they use professional distance or safe equipment only. No casual handling. No blood, gore, visible injury, animal death, harmed baby animal, unsafe contact, text, logo, watermark, UI, subtitles, frame numbers, captions, grid, split screen, collage, panel blending, or morphing.
Output 5 safe 15-second vertical 9:16 ideas.
```

### Helicopter / Vehicle Rescue

```text
Generate 5 WSTV Helicopter / Vehicle Rescue ideas.
Animal: [ANIMAL]
Professional equipment: [VEHICLE / CRATE / ROPE / NET / LONG-REACH TOOL / HELICOPTER AT DISTANCE]
Habitat: [HABITAT]
Rules: professional rescue context only. No casual touching, unsafe handling, close contact, blood, gore, visible injury, animal death, harmed baby animal, text, logo, watermark, UI, captions, frame numbers, grid, split screen, collage, panel blending, or morphing.
Output 5 ideas where the animal remains the main subject.
```

### Herd Wall Protection

```text
Generate 5 WSTV Herd Wall Protection ideas.
Herd animal: [SPECIES]
Young animal: [CALF / YOUNG]
Habitat: [HABITAT]
Rules: herd protects by formation, blocking, or guiding. No attack contact, bite contact, visible injury, gore, death, harmed baby animal, unsafe human contact, text, UI, grid, split screen, collage, panel blending, or morphing.
Output 5 ideas with clear 15-second arcs.
```

### Comic Wildlife Mistake

```text
Generate 5 WSTV Comic Wildlife Mistake ideas.
Animal: [ANIMAL]
Setting: [HABITAT OR SUBURBAN EDGE]
Object/situation: [OBJECT OR MOMENT]
Rules: comedy comes from realistic animal behavior. No injury, trapping, humiliation, unsafe human contact, blood, gore, bite contact, animal death, harmed baby animal, text, UI, grid, split screen, collage, panel blending, or morphing.
Output 5 gentle, realistic, shareable ideas.
```

### Quiet Emotional Wildlife Moment

```text
Generate 5 WSTV Quiet Emotional Wildlife Moment ideas.
Animal(s): [ANIMALS]
Emotion: [REUNION / REST / RELEASE / SHELTER / PARENT BOND]
Habitat: [HABITAT]
Rules: low threat, realistic behavior, clear emotion, safe ending. No fake rescue claims, no blood, gore, visible injury, bite contact, animal death, harmed baby animal, unsafe human contact, text, UI, grid, split screen, collage, panel blending, or morphing.
Output 5 ideas with readable 0-3s hooks.
```

## PASS / REVISE / REJECT Guidance

| Verdict | Use When | Action |
| --- | --- | --- |
| PASS | Hook is clear, animal/habitat are realistic, safety risk is low, generation risk is manageable | Move to scoring and realism |
| REVISE | Core idea is strong but hook, habitat, safety, or ending needs repair | Fix and rescore |
| REJECT | Idea needs harm, unsafe contact, impossible behavior, confusing visuals, or likely model failure | Generate a new idea |

## Next Action

Use the selected category prompt in Chapter 3 or continue to Appendix A for scoring.

---

# Chapter 18 — Failure Recovery System

## Purpose

This chapter tells you what to do when a WSTV output fails. Diagnose the failure, assign severity, choose repair/regenerate/edit, then return to the correct workflow step.

Safety blockers are never fixed by hiding them in editing.

## Severity Rules

| Severity | Meaning | Default Action |
| --- | --- | --- |
| LOW | Minor polish problem, no safety issue | CapCut edit or accept |
| MEDIUM | Noticeable quality issue, no safety blocker | Repair prompt or edit |
| HIGH | Major identity, story, continuity, or realism failure | Usually regenerate |
| BLOCKER | Safety, format, private-data, or paid-flow risk | Stop and fix before continuing |

## Failure Recovery Table

| Failure Type | What It Looks Like | Likely Cause | Severity | Repair Strategy | Regenerate vs CapCut Edit |
| --- | --- | --- | --- | --- | --- |
| Wrong animal | Output shows a different species than intended | Weak subject identity lock or bad reference | HIGH | Strengthen exact species, anatomy, markings | Regenerate |
| Wrong animal count | Extra animals appear or main animal duplicates | Prompt allowed crowding or ambiguity | MEDIUM/HIGH | Specify exact count and no duplicates | Regenerate if story changes |
| Species drift | Animal changes species mid-video | Identity lock not repeated strongly enough | HIGH | Add no species change rule | Regenerate |
| Character morphing | Body shape, limbs, markings shift unnaturally | Motion too complex or weak anatomy lock | HIGH | Simplify motion and lock anatomy | Regenerate |
| Storyboard grid copied | Grid, panels, borders, or frame numbers appear | Image 2 used as visual source, not motion guide | BLOCKER | Add guide-only storyboard language | Regenerate |
| Text/logo/watermark/UI appeared | Any visible text or interface appears | Missing negative constraints or contaminated reference | BLOCKER | Add hard negative text/UI language | Regenerate unless safely cropped |
| Camera flip / 180-degree break | Screen direction reverses suddenly | Missing camera-side lock | HIGH | Add same-side camera rule | Regenerate |
| Geography drift | Environment, positions, or landmarks change | Weak geography lock | MEDIUM/HIGH | Lock screen positions and landmarks | Regenerate if confusing |
| Unsafe human contact | Human touches, grabs, holds, or crowds wildlife | Rescue prompt too vague | BLOCKER | Require professional distance/equipment | Regenerate |
| Visible injury/gore | Wounds, blood, gore, or injury focus visible | Danger language too intense | BLOCKER | Remove harm language, use near-miss | Regenerate |
| Baby animal harmed | Baby appears injured, trapped graphically, or hit | Safety not explicit enough | BLOCKER | State baby remains unharmed and safe | Regenerate |
| Weak ending | Ending lacks payoff or cuts abruptly | 12-15s beat too vague | MEDIUM | Add clear safe final frame | CapCut trim if possible, else regenerate |
| Confusing story | Viewer cannot follow action | Too many events/subjects | MEDIUM/HIGH | Simplify 5-beat arc | Regenerate if unclear |
| Low realism | Animal, habitat, behavior, physics look fake | Skipped or weak realism check | MEDIUM/HIGH | Return to realism fact sheet | Regenerate |
| Token/cost mistake | Wrong resolution, duplicate log, dry run logged | Tracking error or skipped gate | BLOCKER for records | Verify Console and local ledger | Do not edit video; fix records |

## Copy-Ready Fix Prompts

| Failure Type | Fix Prompt |
| --- | --- |
| Wrong animal | `Repair the prompt so the subject remains exactly [SPECIES], [AGE], [SIZE], with [MARKINGS]. Do not show any other species. Preserve this identity in every frame.` |
| Wrong animal count | `Show exactly [COUNT] main animal(s). Do not add extra animals, duplicates, crowds, or background copies.` |
| Species drift | `Do not change species, breed, size, markings, or anatomy at any point in the video. The same individual remains visible from start to finish.` |
| Character morphing | `No morphing. Preserve stable anatomy, limb count, body proportions, size, markings, and movement style in every frame.` |
| Storyboard grid copied | `Use Image 2 only for shot order, framing, pacing, and motion. Do not copy grid lines, borders, panels, frame numbers, captions, text, logos, watermarks, UI, or panel layout.` |
| Text/logo/watermark/UI appeared | `No text, logo, watermark, UI, subtitles, captions, labels, frame numbers, readable marks, or interface elements anywhere in the video.` |
| Camera flip / 180-degree break | `Keep the camera on the same side of the action for the entire video. No 180-degree flip. Screen-left and screen-right positions stay consistent.` |
| Geography drift | `Lock the geography: [ANIMAL] starts [SCREEN POSITION], [OBSTACLE/THREAT/SHELTER] stays [SCREEN POSITION], movement goes [DIRECTION], background landmarks remain stable.` |
| Unsafe human contact | `Humans appear only if explicitly requested and must keep professional distance or use vehicles, crates, ropes, nets, waders, or long-reach tools. No casual touching, grabbing, holding, riding, or crowding wildlife.` |
| Visible injury/gore | `No blood, gore, wounds, visible injury, graphic contact, aftermath of harm, or injury-focused limping. Convert danger into near-miss, distance, or escape.` |
| Baby animal harmed | `The baby animal remains unharmed for the full video and is clearly safe by seconds 12-15. No impact, injury, crushing, trapping, or distress close-up.` |
| Weak ending | `Make seconds 12-15 a clear safe payoff: [SAFE ENDING]. Final frame is readable, calm, and loop-ready.` |
| Confusing story | `Simplify the arc: 0-3s clear hook, 3-6s reaction, 6-9s peak tension, 9-12s turn, 12-15s safe resolution.` |
| Low realism | `Rebuild around realistic species anatomy, habitat, season, behavior, terrain, weather, and movement. Remove impossible physics and human-like behavior.` |
| Token/cost mistake | `Review this tracking note. Do not log dry runs. Do not duplicate completed paid usage. Console Billing is final. Return what must be corrected before archive.` |

## Copy This Into AI — Failure Recovery Router

```text
Route this WSTV failure to the correct recovery action.

Production rules:
15 seconds, vertical 9:16, USA Facebook Reels, photorealistic wildlife documentary realism, strong 0-3 second hook, final prompt under 3500 characters.
No blood, gore, visible injury, bite contact, animal death shown, baby animal harmed, unsafe human contact, humans unless explicitly requested, text, logo, watermark, UI, subtitles, frame numbers, captions, storyboard grid, split screen, collage, panel blending, or morphing.

Failure observed:
[DESCRIBE FAILURE SAFELY]

Original intent:
[PASTE SAFE SCENE SUMMARY]

Output:
1. Failure type
2. Severity: LOW / MEDIUM / HIGH / BLOCKER
3. Likely cause
4. Repair strategy
5. Copy-ready fix prompt
6. Regenerate vs CapCut edit decision
7. Which workflow step to return to
```

## Next Action

Use this chapter whenever a gate fails. Return to the earliest step that caused the problem.

---

# Chapter 19 — Prompt Architecture Deep Dive

## Purpose

This chapter explains how WSTV prompts work underneath the step-by-step system. Use it when writing a prompt from scratch, auditing a prompt, or repairing model drift.

## Prompt Architecture Table

| Prompt Element | What It Controls | Strong Example |
| --- | --- | --- |
| Subject identity lock | Species, age, size, markings, anatomy | `adult bald eagle, white head, dark brown body, yellow beak, accurate wings and talons` |
| Environment lock | Habitat, season, weather, terrain, light | `rocky Pacific Northwest shoreline, overcast morning, wet basalt rocks, low surf` |
| Geography lock | Positions and movement direction | `eagle starts screen right, tide pool screen left, movement stays right to left` |
| Camera side lock | Prevents disorienting perspective flips | `camera remains on same side of the shoreline, no 180-degree flip` |
| Timed beats | Keeps story readable in 15 seconds | `0-3s hook, 3-6s escalation, 6-9s peak, 9-12s turn, 12-15s safe ending` |
| Safety constraints | Prevents harmful content | `no blood, gore, visible injury, bite contact, animal death, harmed baby animal, or unsafe human contact` |
| Negative constraints | Prevents unwanted visual artifacts | `no text, logo, watermark, UI, subtitles, frame numbers, captions, grid, split screen, collage, panel blending, or morphing` |
| Mobile readability | Keeps action visible on phone | `main animal large in foreground or midground, simple background, clear silhouette` |
| Ending design | Creates payoff and loop | `animal reaches safe ground, pauses, final frame calm and readable` |

## Subject Identity Lock

Write the animal like a continuity sheet:

- Exact species or plausible species group.
- Age class.
- Size.
- Markings.
- Anatomy.
- Movement style.

Weak: `a bird escapes`
Strong: `adult bald eagle, white head, dark brown body, yellow beak, broad wings, accurate talons, powerful wingbeats`

## Environment And Geography Lock

The environment lock says where the scene is. The geography lock says where everything sits in the frame.

Use:

- Region or biome.
- Terrain.
- Weather.
- Light direction.
- Main animal position.
- Obstacle/threat/shelter position.
- Movement direction.
- Stable background landmarks.

## Camera Side And 180-Degree Continuity

The camera must stay on the same side of the action. If the animal starts moving screen left to screen right, do not let the camera cross the action line and reverse movement.

Use this sentence:

```text
Camera remains on the same side of the action for the entire video. No 180-degree flip. Screen-left and screen-right positions stay consistent.
```

## Screen-Left / Screen-Right Movement

Screen direction makes short videos easier to understand.

| Pattern | Use |
| --- | --- |
| Animal screen left, danger screen right | Clear approach or threat |
| Animal screen right, safe route screen left | Clear escape route |
| Parent center, baby behind | Protection scenes |
| Herd ring center | Herd wall scenes |
| Waterline background, animal foreground | Marine/beach clarity |

## Timed Beats

| Time | Job |
| --- | --- |
| 0-3s | Hook: show animal and problem immediately |
| 3-6s | Escalation: movement or reaction |
| 6-9s | Peak: closest safe tension |
| 9-12s | Turn: escape, shield, route opens |
| 12-15s | Ending: safe payoff and loop-ready final frame |

## Safety Constraint Language

Use direct constraints. Do not soften them.

```text
No blood. No gore. No visible injury. No bite contact.
No animal death shown. No baby animal harmed.
No unsafe human contact. No humans unless explicitly requested.
```

## Negative Constraint Language

Use direct visual negatives:

```text
No text, logo, watermark, UI, subtitles, frame numbers, captions,
storyboard grid, split screen, collage, panel blending, or morphing.
```

## Mobile Readability

Design for a phone screen:

- One main action.
- One main animal or small readable group.
- Large subject.
- Clear silhouette.
- Simple background.
- Fast hook.
- No tiny details needed to understand the story.

## Ending Design

The ending must answer: “Is the animal safe?”

Good endings:

- Animal reaches safe ground.
- Parent blocks and young moves behind parent.
- Herd closes ranks calmly.
- Turtle reaches surf line.
- Comic animal retreats safely.
- Quiet animal settles or reunites.

## Prompt Compression Priority

| Protect First | Remove First |
| --- | --- |
| Species, age, anatomy, markings | Extra adjectives |
| Geography and camera side | Repeated scenic language |
| Timed beats | Long mood descriptions |
| Safety constraints | Duplicate safety wording |
| Negative constraints | Filler phrases |
| Safe ending | Nonessential lens details |

## Prevent Storyboard Contamination

When using Image 2, always state:

```text
Image 2 is storyboard shot order, framing, pacing, and motion guide only.
Do not copy grid lines, borders, frame numbers, captions, text, logos,
watermarks, UI, or panel layout from the storyboard.
```

## Prompts That Survive Model Drift

To reduce drift:

- Repeat the exact species once in the subject lock and once in the continuity line.
- Avoid too many animals.
- Avoid complex contact.
- Keep camera direction stable.
- Keep environment simple.
- Use specific negative constraints.
- Use timed beats instead of long prose.
- Keep the prompt under 3500 characters.

## Copy This Into AI — Build Prompt From Scratch

```text
Build a WSTV final Seedance prompt from scratch.

Requirements:
- 15 seconds
- vertical 9:16
- USA Facebook Reels
- photorealistic wildlife documentary realism
- 720p for testing
- strong 0-3 second hook
- final prompt under 3500 characters

Scene concept:
[PASTE CONCEPT]

Subject identity lock:
[SPECIES, AGE, SIZE, MARKINGS, ANATOMY]

Environment lock:
[REGION, HABITAT, SEASON, WEATHER, LIGHT, TERRAIN]

Geography lock:
[SCREEN POSITIONS, MOVEMENT DIRECTION, CAMERA SIDE]

Timed beats:
0-3s: [HOOK]
3-6s: [ESCALATION]
6-9s: [PEAK]
9-12s: [TURN]
12-15s: [SAFE ENDING]

Safety constraints:
No blood, gore, visible injury, bite contact, animal death shown,
baby animal harmed, unsafe human contact, or humans unless explicitly requested.

Negative constraints:
No text, logo, watermark, UI, subtitles, frame numbers, captions,
storyboard grid, split screen, collage, panel blending, or morphing.

Output one copy-ready final prompt and estimated character count.
```

## Copy This Into AI — Audit My Prompt Before Generation

```text
Audit this WSTV prompt before generation.

Prompt:
[PASTE PROMPT]

Check:
1. Under 3500 characters
2. 15 seconds
3. vertical 9:16
4. USA Facebook Reels
5. photorealistic wildlife documentary realism
6. strong 0-3 second hook
7. subject identity lock
8. environment lock
9. geography lock
10. camera side and no 180-degree flip
11. timed beats 0-3, 3-6, 6-9, 9-12, 12-15
12. safety constraints
13. negative constraints
14. safe ending
15. storyboard contamination prevention if Image 2 is used

Output PASS / REVISE, failed items, and exact fix text.
```

## Next Action

Use the appendices as print-ready references.

---

# Appendix A — Viral Scoring Master Table

Use this table to score any WSTV idea.

| Criterion | Weight | Score | Weighted Points | Meaning |
| --- | ---: | ---: | ---: | --- |
| Hook strength | x1.5 | /10 | /15 | Clear, immediate 0-3 second hook |
| USA relevance | x1.5 | /10 | /15 | USA viewers understand and care quickly |
| Animal popularity | x1.0 | /10 | /10 | Animal is familiar, iconic, loved, or feared |
| Emotional tension | x1.0 | /10 | /10 | Suspense, relief, protection, comedy, or warmth |
| Baby / parent factor | x1.0 | /10 | /10 | Safe young/parent emotion when relevant |
| Novelty | x1.0 | /10 | /10 | Fresh but not unrealistic |
| Mobile readability | x1.0 | /10 | /10 | Clear on a phone without sound |
| Realism | x1.0 | /10 | /10 | Species, habitat, behavior, and physics make sense |
| Safety risk | x1.0 | /10 | /10 | Lower risk gets higher score |
| Generation ease | x1.0 | /10 | /10 | Easier model task gets higher score |
| Total |  |  | /100 | Verdict |

## Score Meanings

| Score | Meaning |
| ---: | --- |
| 1-3 | Weak, unclear, unrealistic, unsafe, or not mobile-readable |
| 4-6 | Usable direction but needs revision |
| 7-8 | Strong and practical |
| 9-10 | Excellent for WSTV |

## Verdict Rules

| Total | Verdict | Action |
| ---: | --- | --- |
| 80-100 | PASS | Continue to realism check |
| 60-79 | REVISE | Fix weak areas and rescore |
| 0-59 | REJECT | Generate a new idea |

---

# Appendix B — Quality Gate Summary

| Gate | When Used | Must Pass Before |
| --- | --- | --- |
| Idea Gate | After 5 ideas | Scoring and selection |
| Realism Gate | After species/habitat check | Master image prompt |
| Master Image Gate | After master image | Storyboard prompt |
| Storyboard Gate | After 9-panel storyboard | Final Seedance prompt |
| Prompt Gate | After final prompt | Dashboard dry run |
| Dry Run Gate | After local dashboard dry run | Paid submit |
| Paid Submit Gate | Before paid generation | One paid task |
| Video QA Gate | After generated video | CapCut edit |
| CapCut Export Gate | Before final export accepted | Social pack |
| Social Pack Gate | Before posting | Comment replies |
| Comment Reply Tone Gate | Before using replies | Token/cost tracking |
| Token Usage Entry Gate | Before logging usage | Archive |
| Archive Gate | Before closing production | Production complete |

Rule: if any gate fails, stop and fix that gate. Paid generation always requires dry run first. Paid confirmation remains exactly `SUBMIT_ONE_PAID_TASK`.

---

# Appendix C — Token / Cost Reference Card

BytePlus Console Billing remains the final source of truth. The local ledger is creator tracking only.

| Resolution | Projected Tokens | Rule |
| --- | ---: | --- |
| `720p` | `324000` | Use for testing and normal iteration |
| `1080p` | `801900` | Use only for final/high-value scenes |

## Token Pack Example

| Field | Value |
| --- | --- |
| Pack | `7M` |
| Quantity | `1M x 7` |
| Total tokens | `7,000,000` |
| Total price | `$30.10` |
| Effective rate | `$4.30/M` |
| Validity | `90 days` |

Tracking rules:

- Do not log dry runs as paid usage.
- Do not log usage twice.
- Mark token source as actual or estimated.
- Verify final spend in BytePlus Console Billing.

---

# Appendix D — Seedance Dashboard Field Reference

The dashboard is local-only at `127.0.0.1:8765`.

| Field | Purpose | Rule |
| --- | --- | --- |
| Scene idea | Short production summary | Use locked concept title/summary |
| Final Seedance prompt | Approved Chapter 8 prompt | Must stay under 3500 characters |
| Reference Image URL 1 | Master identity/environment | Required for normal production |
| Reference Image URL 2 | Storyboard/motion guide | Optional; guide only |
| Storyboard warning checkbox | Confirms Image 2 contamination risk | Required if Image 2 is used |
| Non-WSTV host checkbox | Acknowledges external reference host risk | Use only when needed |
| Output filename | Local output name | Scene-specific, descriptive |
| Resolution | Generation resolution | 720p for testing |
| Max cost USD | Creator-approved cap | Verify before paid submit |
| Dry run | Local validation | Makes no paid request |
| Safe Mode | Paid safety control | ON by default |
| Paid confirmation | Manual paid gate | Exactly `SUBMIT_ONE_PAID_TASK` |
| QA checklist | Creator review aid | Complete after video generation |
| Cost/budget tracker | Local creator tracking | Console Billing remains final |
| Add token pack | Record resource pack | Stores safe tracking data only |
| Add manual console usage | Backfill verified usage | Avoid duplicates |

Never use the dashboard as a public service. Do not paste private dashboard data into AI.

---

# Appendix E — Multi-AI Compatibility Notes

The playbook works with ChatGPT, Claude, DeepSeek, Gemini, and Grok because the prompts are plain text and tool-neutral.

| AI | What To Paste | What To Avoid | Best Use |
| --- | --- | --- | --- |
| ChatGPT | One chapter prompt block and locked notes | Private dashboard data | Iteration, repair, social packs |
| Claude | Longer context blocks and tables | Asking for too many chapters at once | Drafting and consistency checks |
| DeepSeek | Structured prompts and scoring tables | Ambiguous safety wording | Scoring and compression |
| Gemini | Prompt blocks plus concise context | Overloaded reference details | Summaries and alternate ideas |
| Grok | Short task blocks and clear outputs | Loose tone requests | Fast idea variations |

## What To Paste

- Current step prompt.
- Locked concept.
- Realism fact sheet.
- Safe master image description.
- Safe storyboard summary.
- Final prompt text.
- Safe QA notes.

## What To Avoid

- API keys.
- Private JSON.
- Signed URLs.
- MP4 links.
- Anything under `data/`.
- Dashboard logs that include private details.
- Requests to skip gates.

## Resume A Session

```text
Resume my WSTV production from the last locked step.
Last locked step: [STEP]
Safe locked notes: [PASTE NOTES]
Identify the next step, produce only that output, and stop at the next gate.
```

## Ask For Shorter Output

```text
Rewrite shorter. Keep the same safety rules, gate result, and copy-ready prompt. Remove extra explanation.
```

## Ask For Chapter-By-Chapter Output

```text
Generate only Chapter [NUMBER]. Use the WSTV chapter format: Purpose, What AI does, What creator does, Copy This Into AI, checklist, common mistakes, fix/retry prompt, next action. Stop after this chapter.
```

---

# Appendix F — Master Prompt Template Index

| Template | Location |
| --- | --- |
| Idea generator | Chapter 3 |
| Category-specific idea prompts | Chapter 3 and Chapter 17 |
| Scoring prompt | Chapter 4 |
| Realism prompt | Chapter 5 |
| Geography/environment lock prompt | Chapter 5 |
| Master image prompt | Chapter 6 |
| Master image QA | Chapter 6 |
| Storyboard prompt | Chapter 7 |
| Storyboard QA | Chapter 7 |
| Final Seedance prompt | Chapter 8 |
| Compressor | Chapter 8 |
| Prompt auditor | Chapter 8 and Chapter 19 |
| Dry-run checklist/helper | Chapter 9 |
| Paid gate readiness review | Chapter 10 |
| Video QA | Chapter 11 |
| Repair prompts | Chapter 11 and Chapter 18 |
| CapCut checklist/edit plan | Chapter 12 |
| Social pack | Chapter 13 |
| Comment replies | Chapter 14 |
| Token/cost tracking | Chapter 15 |
| Archive note | Chapter 16 |
| Build prompt from scratch | Chapter 19 |

END OF WSTV WILDLIFE AI VIDEO PLAYBOOK DRAFT
