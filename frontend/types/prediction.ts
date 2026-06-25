export type DiseaseType = "diabetes" | "heart" | "liver" | "kidney";

export interface DiabetesInput {
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree: number;
  age: number;
}

export interface HeartInput {
  age: number;
  sex: "male" | "female";
  chest_pain_type: "asympt" | "atyp_angina" | "non_anginal" | "typ_angina";
  resting_bp: number;
  cholesterol: number;
  fasting_bs_gt120: boolean;
  rest_ecg: "normal" | "st_t_wave_abnormality" | "left_vent_hyper";
  max_heart_rate: number;
  exercise_angina: boolean;
  st_depression: number;
  st_slope: "up" | "flat" | "down";
  num_vessels: number;
  thalassemia: "normal" | "fixed_defect" | "reversable_defect";
}

export interface LiverInput {
  age: number;
  gender: "Male" | "Female";
  total_bilirubin: number;
  direct_bilirubin: number;
  alkaline_phosphotase: number;
  alamine_aminotransferase: number;
  aspartate_aminotransferase: number;
  total_proteins: number;
  albumin: number;
  ag_ratio: number;
}

export interface KidneyInput {
  age?: number | null;
  blood_pressure?: number | null;
  specific_gravity?: number | null;
  albumin_level?: number | null;
  sugar_level?: number | null;
  red_blood_cells?: "normal" | "abnormal" | null;
  pus_cell?: "normal" | "abnormal" | null;
  pus_cell_clumps?: "present" | "notpresent" | null;
  bacteria?: "present" | "notpresent" | null;
  blood_glucose_random?: number | null;
  blood_urea?: number | null;
  serum_creatinine?: number | null;
  sodium?: number | null;
  potassium?: number | null;
  hemoglobin?: number | null;
  packed_cell_volume?: number | null;
  white_blood_cell_count?: number | null;
  red_blood_cell_count?: number | null;
  hypertension?: "yes" | "no" | null;
  diabetes_mellitus?: "yes" | "no" | null;
  coronary_artery_disease?: "yes" | "no" | null;
  appetite?: "good" | "poor" | null;
  pedal_edema?: "yes" | "no" | null;
  anemia?: "yes" | "no" | null;
}

export interface ShapEntry {
  feature: string;
  value: number;
  direction: "positive" | "negative";
}

export interface PredictionResult {
  id: number;
  disease_type: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  shap_values: ShapEntry[];
  recommendations: string[];
  created_at: string;
}

export interface PredictionListItem {
  id: number;
  disease_type: string;
  risk_score: number;
  risk_level: string;
  created_at: string;
}
