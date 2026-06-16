#!/usr/bin/env python3
"""Build the WSTV Wildlife AI Video Playbook PDF and safe ZIP package.

This script is intentionally local-only. It reads only files under docs/playbook,
does not make network calls, and does not include private runtime data.
"""

from __future__ import annotations

import sys
import textwrap
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape


try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.pdfbase.pdfmetrics import stringWidth
    from reportlab.platypus import (
        HRFlowable,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
        XPreformatted,
    )
except ModuleNotFoundError:
    print("reportlab is required to build the PDF.")
    print("Install locally with: .venv/bin/python -m pip install reportlab")
    raise SystemExit(2)


BASE_DIR = Path(__file__).resolve().parent
FINAL_MD = BASE_DIR / "WSTV_Wildlife_AI_Video_Playbook_FINAL.md"
FINAL_PDF = BASE_DIR / "WSTV_Wildlife_AI_Video_Playbook_FINAL.pdf"
FINAL_ZIP = BASE_DIR / "WSTV_Playbook_Final_PDF_Package.zip"

PACKAGE_FILES = [
    BASE_DIR / "WSTV_Wildlife_AI_Video_Playbook_FINAL.md",
    BASE_DIR / "WSTV_Wildlife_AI_Video_Playbook_FINAL.pdf",
    BASE_DIR / "build_playbook_pdf.py",
    BASE_DIR / "README.md",
    BASE_DIR / "templates" / "PROMPT_TEMPLATE_INDEX.md",
    BASE_DIR / "checklists" / "QUALITY_GATE_INDEX.md",
    BASE_DIR / "tables" / "TABLE_INDEX.md",
]


def assert_playbook_path(path: Path) -> None:
    resolved = path.resolve()
    if BASE_DIR.resolve() not in [resolved, *resolved.parents]:
        raise SystemExit(f"Refusing to read or package outside docs/playbook: {path}")


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "WSTVTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=36,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17213a"),
            spaceAfter=18,
        ),
        "subtitle": ParagraphStyle(
            "WSTVSubtitle",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#43506b"),
            spaceAfter=10,
        ),
        "cover_meta": ParagraphStyle(
            "WSTVCoverMeta",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#263555"),
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "WSTVH1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=27,
            textColor=colors.HexColor("#17213a"),
            spaceBefore=4,
            spaceAfter=12,
            keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "WSTVH2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15.5,
            leading=20,
            textColor=colors.HexColor("#263555"),
            spaceBefore=12,
            spaceAfter=8,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "WSTVH3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=colors.HexColor("#31415f"),
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "WSTVBody",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.8,
            leading=13.4,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "WSTVSmall",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
        ),
        "code": ParagraphStyle(
            "WSTVCode",
            parent=base["Code"],
            fontName="Courier",
            fontSize=7.5,
            leading=9.4,
            leftIndent=6,
            rightIndent=6,
            spaceBefore=6,
            spaceAfter=8,
            backColor=colors.HexColor("#f2f3f5"),
            borderColor=colors.HexColor("#d3d7df"),
            borderWidth=0.5,
            borderPadding=6,
        ),
        "cell": ParagraphStyle(
            "WSTVCell",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.2,
            leading=8.8,
        ),
        "cell_header": ParagraphStyle(
            "WSTVCellHeader",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=8.8,
            textColor=colors.white,
        ),
    }


def normalize_inline(text: str) -> str:
    text = escape(text)
    text = text.replace("**", "")
    text = text.replace("`", "")
    return text


def strip_markdown_cover(markdown: str) -> str:
    """Skip the markdown title/front matter because the PDF has a generated cover."""
    marker = "# How To Use This Playbook"
    index = markdown.find(marker)
    if index == -1:
        return markdown
    return markdown[index:]


def wrap_code_text(text: str, max_chars: int = 82) -> str:
    """Wrap code/prompt block lines so ReportLab never clips them horizontally."""
    wrapped_lines: list[str] = []
    for line in text.splitlines():
        if line == "":
            wrapped_lines.append("")
            continue
        leading = len(line) - len(line.lstrip(" "))
        indent = " " * min(leading, 12)
        content = line[leading:] if leading else line
        width = max(24, max_chars - len(indent))
        chunks = textwrap.wrap(
            content,
            width=width,
            break_long_words=True,
            break_on_hyphens=False,
            replace_whitespace=False,
            drop_whitespace=False,
        )
        if not chunks:
            wrapped_lines.append("")
            continue
        wrapped_lines.append(indent + chunks[0])
        wrapped_lines.extend(indent + "  " + chunk for chunk in chunks[1:])
    return "\n".join(wrapped_lines)


def is_table_separator(line: str) -> bool:
    stripped = line.strip().strip("|").strip()
    if not stripped:
        return False
    allowed = set("-:| ")
    return all(char in allowed for char in line.strip()) and "-" in stripped


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def add_table(story: list, table_lines: list[str], styles: dict[str, ParagraphStyle], page_width: float) -> None:
    rows: list[list[Paragraph]] = []
    for line in table_lines:
        if is_table_separator(line):
            continue
        cells = split_table_row(line)
        style = styles["cell_header"] if not rows else styles["cell"]
        rows.append([Paragraph(normalize_inline(cell), style) for cell in cells])
    if not rows:
        return
    col_count = max(len(row) for row in rows)
    for row in rows:
        while len(row) < col_count:
            row.append(Paragraph("", styles["cell"]))
    table = Table(rows, colWidths=[page_width / col_count] * col_count, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263555")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#c8ceda")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f8fb")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.extend([table, Spacer(1, 8)])


def add_paragraph(story: list, text: str, styles: dict[str, ParagraphStyle]) -> None:
    stripped = text.strip()
    if not stripped:
        return
    if stripped == "---":
        story.append(Spacer(1, 10))
        return
    if stripped.startswith("# "):
        title = stripped[2:].strip()
        if story and not isinstance(story[-1], PageBreak):
            story.append(PageBreak())
        story.append(Paragraph(normalize_inline(title), styles["h1"]))
        return
    if stripped.startswith("## "):
        story.append(Paragraph(normalize_inline(stripped[3:].strip()), styles["h2"]))
        return
    if stripped.startswith("### "):
        story.append(Paragraph(normalize_inline(stripped[4:].strip()), styles["h3"]))
        return
    story.append(Paragraph(normalize_inline(stripped), styles["body"]))


def markdown_to_story(markdown: str, styles: dict[str, ParagraphStyle], page_width: float) -> list:
    story: list = []
    paragraph_lines: list[str] = []
    table_lines: list[str] = []
    code_lines: list[str] = []
    in_code = False

    def flush_paragraph() -> None:
        nonlocal paragraph_lines
        if paragraph_lines:
            add_paragraph(story, " ".join(line.strip() for line in paragraph_lines), styles)
            paragraph_lines = []

    def flush_table() -> None:
        nonlocal table_lines
        if table_lines:
            add_table(story, table_lines, styles, page_width)
            table_lines = []

    def flush_code() -> None:
        nonlocal code_lines
        if code_lines:
            story.append(XPreformatted(escape(wrap_code_text("\n".join(code_lines))), styles["code"]))
            code_lines = []

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if line.startswith("```"):
            flush_paragraph()
            flush_table()
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if line.strip().startswith("|") and line.strip().endswith("|"):
            flush_paragraph()
            table_lines.append(line)
            continue
        flush_table()
        if not line.strip():
            flush_paragraph()
            story.append(Spacer(1, 4))
            continue
        if line.lstrip().startswith(("- ", "* ")):
            flush_paragraph()
            add_paragraph(story, "• " + line.lstrip()[2:].strip(), styles)
            continue
        if line.lstrip().startswith(tuple(f"{i}. " for i in range(1, 10))):
            flush_paragraph()
            add_paragraph(story, line.strip(), styles)
            continue
        if line.startswith("#"):
            flush_paragraph()
            add_paragraph(story, line, styles)
            continue
        paragraph_lines.append(line)

    flush_paragraph()
    flush_table()
    flush_code()
    return story


def max_code_line_width(markdown: str, max_chars: int = 82) -> float:
    max_width = 0.0
    in_code = False
    code_lines: list[str] = []
    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if line.startswith("```"):
            if in_code:
                wrapped = wrap_code_text("\n".join(code_lines), max_chars=max_chars)
                for wrapped_line in wrapped.splitlines():
                    max_width = max(max_width, stringWidth(wrapped_line, "Courier", 7.5))
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
    return max_width


def draw_page_number(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawCentredString(letter[0] / 2, 0.35 * inch, f"WSTV Wildlife AI Video Playbook · Page {doc.page}")
    canvas.restoreState()


def cover_story(styles: dict[str, ParagraphStyle]) -> list:
    divider = HRFlowable(
        width="58%",
        thickness=1,
        color=colors.HexColor("#263555"),
        spaceBefore=18,
        spaceAfter=18,
        hAlign="CENTER",
    )
    return [
        Spacer(1, 1.0 * inch),
        Paragraph("WSTV Wildlife AI Video Playbook", styles["title"]),
        Paragraph("From First Idea to Published Reel", styles["subtitle"]),
        divider,
        Paragraph("Final PDF Edition", styles["cover_meta"]),
        Paragraph("Wild Stories TV production system for vertical wildlife AI videos", styles["subtitle"]),
        Spacer(1, 0.35 * inch),
        Paragraph("Chapters 1–19 + Appendices A–F", styles["cover_meta"]),
        Paragraph("Use this playbook one production at a time. Lock each step before moving forward.", styles["subtitle"]),
        Spacer(1, 1.0 * inch),
        HRFlowable(
            width="34%",
            thickness=0.6,
            color=colors.HexColor("#c8ceda"),
            spaceBefore=8,
            spaceAfter=8,
            hAlign="CENTER",
        ),
        PageBreak(),
    ]


def build_pdf() -> None:
    assert_playbook_path(FINAL_MD)
    markdown = strip_markdown_cover(FINAL_MD.read_text(encoding="utf-8"))
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(FINAL_PDF),
        pagesize=letter,
        rightMargin=0.58 * inch,
        leftMargin=0.58 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.62 * inch,
        title="WSTV Wildlife AI Video Playbook",
        author="Wild Stories TV",
    )
    code_width = max_code_line_width(markdown)
    if code_width > doc.width - 24:
        raise SystemExit(f"Wrapped code is still too wide for the page: {code_width:.1f} > {doc.width - 24:.1f}")
    story = cover_story(styles)
    story.extend(markdown_to_story(markdown, styles, doc.width))
    doc.build(story, onFirstPage=draw_page_number, onLaterPages=draw_page_number)


def build_zip() -> None:
    for path in PACKAGE_FILES:
        assert_playbook_path(path)
        if not path.exists():
            raise SystemExit(f"Missing package file: {path.relative_to(BASE_DIR)}")
    with zipfile.ZipFile(FINAL_ZIP, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in PACKAGE_FILES:
            archive.write(path, path.relative_to(BASE_DIR.parent.parent).as_posix())


def main() -> int:
    build_pdf()
    if not FINAL_PDF.exists() or FINAL_PDF.stat().st_size <= 0:
        raise SystemExit("PDF build failed: output file is missing or empty.")
    build_zip()
    print(f"PDF: {FINAL_PDF}")
    print(f"PDF bytes: {FINAL_PDF.stat().st_size}")
    print(f"ZIP: {FINAL_ZIP}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
