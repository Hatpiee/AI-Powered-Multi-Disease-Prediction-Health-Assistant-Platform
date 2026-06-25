from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ── Input schemas ─────────────────────────────────────────────────────────────

class DiabetesInput(BaseModel):
    pregnancies:        int   = Field(ge=0,  le=20,   description="Number of pregnancies")
    glucose:            float = Field(gt=0,  le=300,  description="Plasma glucose (mg/dL)")
    blood_pressure:     float = Field(gt=0,  le=200,  description="Diastolic blood pressure (mmHg)")
    skin_thickness:     float = Field(ge=0,  le=100,  description="Triceps skin fold thickness (mm)")
    insulin:            float = Field(ge=0,  le=1000, description="2-hour serum insulin (μU/mL)")
    bmi:                float = Field(gt=0,  le=70,   description="Body mass index (kg/m²)")
    diabetes_pedigree:  float = Field(gt=0,  le=3.0,  description="Diabetes pedigree function")
    age:                int   = Field(gt=0,  le=120,  description="Age in years")


class HeartInput(BaseModel):
    age:                int   = Field(gt=0,  le=120)
    sex:                Literal["male", "female"]
    chest_pain_type:    Literal["asympt", "atyp_angina", "non_anginal", "typ_angina"]
    resting_bp:         float = Field(gt=0,  le=250,  description="Resting blood pressure (mmHg)")
    cholesterol:        float = Field(gt=0,  le=600,  description="Serum cholesterol (mg/dL)")
    fasting_bs_gt120:   bool  = Field(description="Fasting blood sugar > 120 mg/dL")
    rest_ecg:           Literal["normal", "st_t_wave_abnormality", "left_vent_hyper"]
    max_heart_rate:     float = Field(gt=0,  le=250,  description="Maximum heart rate achieved")
    exercise_angina:    bool  = Field(description="Exercise-induced angina")
    st_depression:      float = Field(ge=0,  le=10,   description="ST depression (oldpeak)")
    st_slope:           Literal["up", "flat", "down"]
    num_vessels:        int   = Field(ge=0,  le=3,    description="Number of major vessels (0-3)")
    thalassemia:        Literal["normal", "fixed_defect", "reversable_defect"]


class LiverInput(BaseModel):
    age:                        int   = Field(gt=0,  le=120)
    gender:                     Literal["Male", "Female"]
    total_bilirubin:            float = Field(ge=0,  description="Total Bilirubin (mg/dL)")
    direct_bilirubin:           float = Field(ge=0,  description="Direct Bilirubin (mg/dL)")
    alkaline_phosphotase:       int   = Field(ge=0,  description="Alkaline Phosphotase (IU/L)")
    alamine_aminotransferase:   int   = Field(ge=0,  description="SGPT / ALT (IU/L)")
    aspartate_aminotransferase: int   = Field(ge=0,  description="SGOT / AST (IU/L)")
    total_proteins:             float = Field(ge=0,  description="Total Proteins (g/dL)")
    albumin:                    float = Field(ge=0,  description="Albumin (g/dL)")
    ag_ratio:                   float = Field(ge=0,  description="Albumin/Globulin Ratio")


class KidneyInput(BaseModel):
    age:                    Optional[float] = Field(None, ge=0, le=120)
    blood_pressure:         Optional[float] = Field(None, description="Blood pressure (mmHg)")
    specific_gravity:       Optional[float] = Field(None, description="Urine specific gravity (e.g. 1.010, 1.015)")
    albumin_level:          Optional[int]   = Field(None, ge=0, le=5, description="Albumin level (0-5)")
    sugar_level:            Optional[int]   = Field(None, ge=0, le=5, description="Sugar level (0-5)")
    red_blood_cells:        Optional[Literal["normal", "abnormal"]] = None
    pus_cell:               Optional[Literal["normal", "abnormal"]] = None
    pus_cell_clumps:        Optional[Literal["present", "notpresent"]] = None
    bacteria:               Optional[Literal["present", "notpresent"]] = None
    blood_glucose_random:   Optional[float] = Field(None, description="Blood glucose random (mg/dL)")
    blood_urea:             Optional[float] = Field(None, description="Blood urea (mg/dL)")
    serum_creatinine:       Optional[float] = Field(None, description="Serum creatinine (mg/dL)")
    sodium:                 Optional[float] = Field(None, description="Sodium (mEq/L)")
    potassium:              Optional[float] = Field(None, description="Potassium (mEq/L)")
    hemoglobin:             Optional[float] = Field(None, description="Hemoglobin (g/dL)")
    packed_cell_volume:     Optional[float] = None
    white_blood_cell_count: Optional[float] = None
    red_blood_cell_count:   Optional[float] = None
    hypertension:           Optional[Literal["yes", "no"]] = None
    diabetes_mellitus:      Optional[Literal["yes", "no"]] = None
    coronary_artery_disease: Optional[Literal["yes", "no"]] = None
    appetite:               Optional[Literal["good", "poor"]] = None
    pedal_edema:            Optional[Literal["yes", "no"]] = None
    anemia:                 Optional[Literal["yes", "no"]] = None


# ── Output schemas ────────────────────────────────────────────────────────────

class ShapEntry(BaseModel):
    feature:   str
    value:     float
    direction: Literal["positive", "negative"]


class PredictionResult(BaseModel):
    id:              int
    disease_type:    str
    risk_score:      float
    risk_level:      Literal["low", "medium", "high"]
    shap_values:     List[ShapEntry]
    recommendations: List[str] = []
    created_at:      str


class PredictionListItem(BaseModel):
    id:           int
    disease_type: str
    risk_score:   float
    risk_level:   str
    created_at:   str
