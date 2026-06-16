# WSTV Wildlife AI Video Playbook Source

This folder contains the PDF-ready markdown source for the **WSTV Wildlife AI Video Playbook**.

The playbook is a production guide for creating short-form vertical wildlife AI videos for Wild Stories TV. It organizes the WSTV workflow into copy-paste-ready AI prompts, safety rules, quality gates, tables, and checklists.

This is documentation only. It is not dashboard code, does not change the local WSTV dashboard, and does not change the 3500-character prompt limit.

## Folder Structure

| Path | Purpose |
| --- | --- |
| `WSTV_Wildlife_AI_Video_Playbook_DRAFT.md` | Historical draft source |
| `WSTV_Wildlife_AI_Video_Playbook_FINAL.md` | Final PDF-ready source |
| `WSTV_Wildlife_AI_Video_Playbook_FINAL.pdf` | Generated final PDF |
| `build_playbook_pdf.py` | Local PDF and ZIP builder |
| `templates/PROMPT_TEMPLATE_INDEX.md` | Index of required prompt templates |
| `checklists/QUALITY_GATE_INDEX.md` | Index of required quality gates and checklists |
| `tables/TABLE_INDEX.md` | Index of required reference tables |

## How To Use

Read or edit the markdown files directly. The final markdown is prepared for PDF rebuilds after review.

Recommended production flow:

1. Review the final source in `WSTV_Wildlife_AI_Video_Playbook_FINAL.md`.
2. Run the final audit.
3. Clean formatting, Table of Contents, and status lines.
4. Convert the markdown to PDF.
5. Review the final PDF.
6. Keep secrets and private files out of the package.
7. Recreate the ZIP package: `docs/playbook/WSTV_Playbook_Final_PDF_Package.zip`

The ZIP package must include only:

- `docs/playbook/README.md`
- `docs/playbook/WSTV_Wildlife_AI_Video_Playbook_DRAFT.md`
- `docs/playbook/templates/`
- `docs/playbook/checklists/`
- `docs/playbook/tables/`

## Safety And Security

Do not add secrets or private production data to this folder.

Never include:

- API keys or tokens
- `.env` contents
- Signed URLs
- Private task JSON
- Full dashboard API responses
- MP4 files or links to private MP4 files
- Local paid-task logs from `data/`
- Anything copied from private BytePlus Console responses

All files in this folder should remain safe to commit.
