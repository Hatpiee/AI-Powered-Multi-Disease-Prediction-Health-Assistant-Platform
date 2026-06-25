import io
import json
import os

import pdfplumber
from groq import Groq

_PROMPT = """You are a medical lab report parser. Extract numeric lab values from the report text below.

Return ONLY a valid JSON object with this exact structure. Use null for any value not found:

{
  "diabetes": {
    "age": null,
    "pregnancies": null,
    "glucose": null,
    "blood_pressure": null,
    "bmi": null,
    "insulin": null,
    "skin_thickness": null,
    "diabetes_pedigree": null
  },
  "heart": {
    "age": null,
    "resting_bp": null,
    "cholesterol": null,
    "max_heart_rate": null,
    "st_depression": null
  },
  "liver": {
    "age": null,
    "total_bilirubin": null,
    "direct_bilirubin": null,
    "alkaline_phosphotase": null,
    "alamine_aminotransferase": null,
    "aspartate_aminotransferase": null,
    "total_proteins": null,
    "albumin": null,
    "ag_ratio": null
  },
  "kidney": {
    "age": null,
    "blood_pressure": null,
    "blood_glucose_random": null,
    "blood_urea": null,
    "serum_creatinine": null,
    "sodium": null,
    "potassium": null,
    "hemoglobin": null,
    "packed_cell_volume": null,
    "white_blood_cell_count": null,
    "red_blood_cell_count": null
  }
}

Field mapping rules (extract the observed/result value, not reference range):
- age: "Age" in years
- glucose / blood_glucose_random: "Blood Glucose", "Average Blood Glucose", "ABG", "FBS", "RBS", "PPBS" → mg/dL
- blood_pressure (diastolic for diabetes): "Diastolic BP", "DBP" → mmHg
- resting_bp (systolic for heart) / blood_pressure (kidney): "Systolic BP", "SBP", or single "Blood Pressure" value → mmHg
- bmi: "BMI", "Body Mass Index" → kg/m²
- insulin: "Insulin", "Serum Insulin" → μU/mL
- cholesterol: "Total Cholesterol" → mg/dL
- total_bilirubin: "Total Bilirubin", "T. Bilirubin" → mg/dL
- direct_bilirubin: "Direct Bilirubin", "D. Bilirubin", "Conjugated Bilirubin" → mg/dL
- alkaline_phosphotase: "Alkaline Phosphatase", "ALP", "ALKP" → IU/L
- alamine_aminotransferase: "ALT", "SGPT", "Alanine Aminotransferase" → IU/L
- aspartate_aminotransferase: "AST", "SGOT", "Aspartate Aminotransferase" → IU/L
- total_proteins: "Total Protein", "Total Proteins" → g/dL
- albumin: "Albumin", "Serum Albumin" → g/dL
- ag_ratio: "A/G Ratio", "Albumin/Globulin Ratio" → unitless ratio
- blood_urea: "Blood Urea", "Urea" → mg/dL; if only "BUN" found multiply it by 2.14
- serum_creatinine: "Creatinine", "Serum Creatinine" → mg/dL
- sodium: "Sodium", "Na+" → mEq/L
- potassium: "Potassium", "K+" → mEq/L
- hemoglobin: "Hemoglobin", "Hb", "HGB" → g/dL
- packed_cell_volume: "PCV", "Hematocrit", "HCT", "HEMATOCRIT" → %
- white_blood_cell_count: "WBC", "TLC", "Total Leucocyte Count" → cells/cumm
- red_blood_cell_count: "RBC", "Total RBC" → million cells/cumm (e.g. 3.76 for 3.76×10⁶/μL)

Report text:
"""


def extract_from_pdf(file_bytes: bytes) -> dict:
    pages = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)

    full_text = "\n".join(pages)
    if not full_text.strip():
        raise ValueError(
            "No text could be extracted from this PDF. "
            "The file may contain scanned images rather than digital text."
        )

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": _PROMPT + full_text[:15000]}],
        temperature=0,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
