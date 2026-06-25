"""
Maps user-friendly API inputs to the exact numeric feature vectors each model expects.

Categorical encoding rules match what each training notebook produced:
  - Heart: pd.Categorical(col).codes  → alphabetical category ordering
  - Liver: LabelEncoder               → alphabetical ordering
  - Kidney: LabelEncoder              → alphabetical ordering
"""

import numpy as np
from typing import Any, Dict, List


def _vec(mapping: Dict[str, Any], feature_names: List[str]) -> np.ndarray:
    return np.array([mapping[f] for f in feature_names], dtype=float).reshape(1, -1)


# ── Diabetes (Pima Indians OpenML) ───────────────────────────────────────────
# Features: preg, plas, pres, skin, insu, mass, pedi, age
def map_diabetes(data: Dict[str, Any]) -> Dict[str, float]:
    return {
        "preg": data["pregnancies"],
        "plas": data["glucose"],
        "pres": data["blood_pressure"],
        "skin": data["skin_thickness"],
        "insu": data["insulin"],
        "mass": data["bmi"],
        "pedi": data["diabetes_pedigree"],
        "age":  data["age"],
    }


# ── Heart (Cleveland heart-c OpenML, pd.Categorical codes) ───────────────────
# Categorical orderings (OpenML ARFF alphabetical):
#   sex: female=0, male=1
#   cp: asympt=0, atyp_angina=1, non_anginal=2, typ_angina=3
#   fbs: f=0, t=1
#   restecg: left_vent_hyper=0, normal=1, st_t_wave_abnormality=2
#   exang: no=0, yes=1
#   slope: down=0, flat=1, up=2
#   thal: fixed_defect=0, normal=1, reversable_defect=2
_SEX   = {"female": 0, "male": 1}
_CP    = {"asympt": 0, "atyp_angina": 1, "non_anginal": 2, "typ_angina": 3}
_FBS   = {False: 0, True: 1, 0: 0, 1: 1}
_RECG  = {"left_vent_hyper": 0, "normal": 1, "st_t_wave_abnormality": 2}
_EXANG = {"no": 0, "yes": 1, False: 0, True: 1, 0: 0, 1: 1}
_SLOPE = {"down": 0, "flat": 1, "up": 2}
_THAL  = {"fixed_defect": 0, "normal": 1, "reversable_defect": 2}


def map_heart(data: Dict[str, Any]) -> Dict[str, float]:
    return {
        "age":      data["age"],
        "sex":      _SEX[data["sex"]],
        "cp":       _CP[data["chest_pain_type"]],
        "trestbps": data["resting_bp"],
        "chol":     data["cholesterol"],
        "fbs":      _FBS[data["fasting_bs_gt120"]],
        "restecg":  _RECG[data["rest_ecg"]],
        "thalach":  data["max_heart_rate"],
        "exang":    _EXANG[data["exercise_angina"]],
        "oldpeak":  data["st_depression"],
        "slope":    _SLOPE[data["st_slope"]],
        "ca":       data["num_vessels"],
        "thal":     _THAL[data["thalassemia"]],
    }


# ── Liver (ILPD, V1-V10, LabelEncoder on gender) ────────────────────────────
# V2 gender: Female=0, Male=1
_GENDER = {"female": 0, "male": 1, "Female": 0, "Male": 1}


def map_liver(data: Dict[str, Any]) -> Dict[str, float]:
    return {
        "V1":  data["age"],
        "V2":  _GENDER[data["gender"]],
        "V3":  data["total_bilirubin"],
        "V4":  data["direct_bilirubin"],
        "V5":  data["alkaline_phosphotase"],
        "V6":  data["alamine_aminotransferase"],
        "V7":  data["aspartate_aminotransferase"],
        "V8":  data["total_proteins"],
        "V9":  data["albumin"],
        "V10": data["ag_ratio"],
    }


# ── Kidney (CKD ucimlrepo, LabelEncoder on categoricals) ────────────────────
# Binary categoricals (alphabetical LabelEncoder):
#   rbc/pc: abnormal=0, normal=1
#   pcc/ba: notpresent=0, present=1
#   htn/dm/cad/pe/ane: no=0, yes=1
#   appet: good=0, poor=1
# Ordinal encoded as-is: al (0-5), su (0-5), sg (mapped 1.005→0 … 1.025→4)
_YN   = {"no": 0, "yes": 1, False: 0, True: 1, 0: 0, 1: 1}
_RBC  = {"abnormal": 0, "normal": 1}
_PCC  = {"notpresent": 0, "present": 1}
_APP  = {"good": 0, "poor": 1}
_SG   = {1.005: 0, 1.010: 1, 1.015: 2, 1.020: 3, 1.025: 4}


def map_kidney(data: Dict[str, Any]) -> Dict[str, float]:
    return {
        "age":   data.get("age"),
        "bp":    data.get("blood_pressure"),
        "sg":    _SG.get(data.get("specific_gravity"), data.get("specific_gravity")),
        "al":    data.get("albumin_level", 0),
        "su":    data.get("sugar_level", 0),
        "rbc":   _RBC.get(data.get("red_blood_cells", "normal"), 1),
        "pc":    _RBC.get(data.get("pus_cell", "normal"), 1),
        "pcc":   _PCC.get(data.get("pus_cell_clumps", "notpresent"), 0),
        "ba":    _PCC.get(data.get("bacteria", "notpresent"), 0),
        "bgr":   data.get("blood_glucose_random"),
        "bu":    data.get("blood_urea"),
        "sc":    data.get("serum_creatinine"),
        "sod":   data.get("sodium"),
        "pot":   data.get("potassium"),
        "hemo":  data.get("hemoglobin"),
        "pcv":   data.get("packed_cell_volume"),
        "wbcc":  data.get("white_blood_cell_count"),
        "rbcc":  data.get("red_blood_cell_count"),
        "htn":   _YN.get(data.get("hypertension", "no"), 0),
        "dm":    _YN.get(data.get("diabetes_mellitus", "no"), 0),
        "cad":   _YN.get(data.get("coronary_artery_disease", "no"), 0),
        "appet": _APP.get(data.get("appetite", "good"), 0),
        "pe":    _YN.get(data.get("pedal_edema", "no"), 0),
        "ane":   _YN.get(data.get("anemia", "no"), 0),
    }
