import io
from datetime import datetime
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

_DISEASE_LABELS = {
    "diabetes": "Diabetes",
    "heart": "Heart Disease",
    "liver": "Liver Disease",
    "kidney": "Kidney Disease",
}

_RISK_COLORS = {
    "low": colors.HexColor("#10b981"),
    "medium": colors.HexColor("#f59e0b"),
    "high": colors.HexColor("#ef4444"),
}


def generate_prediction_report(
    prediction_id: int,
    disease_type: str,
    risk_score: float,
    risk_level: str,
    shap_values: List[Dict[str, Any]],
    user_name: str,
    created_at: datetime,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    blue = colors.HexColor("#2563eb")
    gray_dark = colors.HexColor("#111827")
    gray_mid = colors.HexColor("#374151")
    gray_light = colors.HexColor("#6b7280")
    border = colors.HexColor("#e5e7eb")
    row_alt = colors.HexColor("#f9fafb")
    header_bg = colors.HexColor("#eff6ff")

    title_style = ParagraphStyle("title", parent=styles["Heading1"], fontSize=20, textColor=blue, spaceAfter=2)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], fontSize=11, textColor=gray_light, spaceAfter=16)
    section_style = ParagraphStyle("section", parent=styles["Heading2"], fontSize=13, textColor=gray_dark, spaceBefore=10, spaceAfter=6)
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=10, textColor=gray_mid, spaceAfter=4)
    note_style = ParagraphStyle("note", parent=styles["Normal"], fontSize=8, textColor=gray_light, spaceAfter=4, leading=12)

    pct = round(risk_score * 100)
    disease_label = _DISEASE_LABELS.get(disease_type, disease_type.title())
    risk_color = _RISK_COLORS.get(risk_level, colors.gray)

    story = []

    # Header
    story.append(Paragraph("AI Health Platform", title_style))
    story.append(Paragraph("Predictive Health Assessment Report", sub_style))
    story.append(HRFlowable(width="100%", color=border, thickness=1))
    story.append(Spacer(1, 0.3 * cm))

    # Patient info
    story.append(Paragraph("Patient Information", section_style))
    story.append(Paragraph(f"<b>Patient:</b> {user_name}", body_style))
    story.append(Paragraph(f"<b>Generated:</b> {created_at.strftime('%B %d, %Y at %I:%M %p')}", body_style))
    story.append(Paragraph(f"<b>Report ID:</b> #{prediction_id}", body_style))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", color=border, thickness=1))
    story.append(Spacer(1, 0.3 * cm))

    # Risk summary table
    story.append(Paragraph(f"{disease_label} Risk Summary", section_style))

    risk_data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style)],
        ["Disease Type", disease_label],
        ["Risk Score", f"{pct}%"],
        ["Risk Level", risk_level.upper()],
    ]
    risk_table = Table(risk_data, colWidths=[5 * cm, 12 * cm])
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), blue),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, row_alt]),
        ("GRID", (0, 0), (-1, -1), 0.5, border),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("TEXTCOLOR", (1, 3), (1, 3), risk_color),
        ("FONTNAME", (1, 3), (1, 3), "Helvetica-Bold"),
    ]))
    story.append(risk_table)
    story.append(Spacer(1, 0.5 * cm))

    # SHAP values table
    if shap_values:
        story.append(Paragraph("Feature Impact Analysis (SHAP Values)", section_style))
        story.append(Paragraph(
            "The table below shows which clinical features most influenced the prediction. "
            "Positive values increase risk; negative values decrease risk. "
            "Features are ranked by absolute importance.",
            body_style,
        ))
        story.append(Spacer(1, 0.2 * cm))

        sorted_shap = sorted(shap_values, key=lambda x: abs(x["value"]), reverse=True)[:12]
        shap_data = [
            [
                Paragraph("<b>Feature</b>", body_style),
                Paragraph("<b>SHAP Value</b>", body_style),
                Paragraph("<b>Direction</b>", body_style),
            ]
        ]
        for entry in sorted_shap:
            feature = entry["feature"].replace("_", " ").title()
            val = float(entry["value"])
            direction = "Increases Risk" if val > 0 else "Decreases Risk"
            dir_color = colors.HexColor("#ef4444") if val > 0 else colors.HexColor("#10b981")
            shap_data.append([
                feature,
                f"{val:+.4f}",
                Paragraph(f'<font color="{dir_color.hexval()}">{direction}</font>', body_style),
            ])

        shap_table = Table(shap_data, colWidths=[7 * cm, 4 * cm, 6 * cm])
        shap_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, 0), blue),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, row_alt]),
            ("GRID", (0, 0), (-1, -1), 0.5, border),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(shap_table)
        story.append(Spacer(1, 0.5 * cm))

    # Disclaimer
    story.append(HRFlowable(width="100%", color=border, thickness=1))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("<b>Medical Disclaimer</b>", ParagraphStyle(
        "disc_h", parent=styles["Normal"], fontSize=9, textColor=gray_mid, fontName="Helvetica-Bold", spaceAfter=3
    )))
    story.append(Paragraph(
        "This report is generated by an AI model for informational purposes only and does not constitute "
        "medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before "
        "making any health-related decisions. Predictions are based on statistical models and individual "
        "results may vary significantly.",
        note_style,
    ))

    doc.build(story)
    return buffer.getvalue()
