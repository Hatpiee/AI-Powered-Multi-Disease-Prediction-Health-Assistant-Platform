import json
import os
import re

from groq import Groq

_DISEASE_CONTEXT = {
    "diabetes": "Type 2 Diabetes risk",
    "heart": "Cardiovascular / Heart Disease risk",
    "liver": "Liver Disease risk",
    "kidney": "Chronic Kidney Disease risk",
}

_PROMPT = """\
You are a clinical decision support assistant. A patient received an AI-generated health risk assessment.

Disease: {disease}
Risk Score: {risk_score}%
Risk Level: {risk_level}
Top contributing factors: {factors}

Provide exactly 4 brief, actionable recommendations tailored to this patient's risk level and contributing factors. \
Each recommendation must be a single sentence, practical, and clinically sound. \
Do NOT mention that an AI generated these. Do NOT include a disclaimer. \
Return ONLY a JSON array of exactly 4 strings, no other text.
Example: ["rec1", "rec2", "rec3", "rec4"]
"""


def generate(disease_type: str, risk_score: float, risk_level: str, shap_values: list) -> list[str]:
    top_factors = ", ".join(
        entry["feature"].replace("_", " ")
        for entry in sorted(shap_values, key=lambda x: abs(x.get("value", 0)), reverse=True)[:3]
    ) if shap_values else "not available"

    prompt = _PROMPT.format(
        disease=_DISEASE_CONTEXT.get(disease_type, disease_type),
        risk_score=round(risk_score * 100),
        risk_level=risk_level,
        factors=top_factors,
    )

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        print(f"[recommendation_service] raw response: {content[:300]}")

        # Try JSON object with "recommendations" key first
        try:
            raw = json.loads(content)
            if isinstance(raw, dict):
                for key in raw:
                    if isinstance(raw[key], list) and len(raw[key]) > 0:
                        return [str(r) for r in raw[key][:4]]
            if isinstance(raw, list):
                return [str(r) for r in raw[:4]]
        except json.JSONDecodeError:
            pass

        # Fallback: extract JSON array from anywhere in the text
        match = re.search(r'\[[\s\S]*?\]', content)
        if match:
            arr = json.loads(match.group())
            if isinstance(arr, list) and len(arr) > 0:
                return [str(r) for r in arr[:4]]

        print(f"[recommendation_service] could not parse recommendations from response")
        return []
    except Exception as exc:
        print(f"[recommendation_service] generate() failed: {exc}")
        return []
