"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Activity, Heart, Microscope, Stethoscope,
  ChevronLeft, Loader2, Upload, FileText, CheckCircle, X,
} from "lucide-react";
import { usePrediction } from "@/hooks/usePrediction";
import { predictionApi, type ExtractedReportData } from "@/lib/api";
import type { DiseaseType } from "@/types/prediction";
import { cn } from "@/lib/utils";

// ── Disease selector ──────────────────────────────────────────────────────────

const DISEASES: {
  id: DiseaseType;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  bg: string;
}[] = [
  {
    id: "diabetes",
    label: "Diabetes",
    icon: Activity,
    description: "Assess blood sugar regulation and insulin resistance risk.",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    id: "heart",
    label: "Heart Disease",
    icon: Heart,
    description: "Evaluate cardiovascular risk based on clinical indicators.",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 hover:border-red-400",
  },
  {
    id: "liver",
    label: "Liver Disease",
    icon: Stethoscope,
    description: "Analyse liver function tests for hepatic condition risk.",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200 hover:border-amber-400",
  },
  {
    id: "kidney",
    label: "Kidney Disease",
    icon: Microscope,
    description: "Screen chronic kidney disease using lab and clinical data.",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
];

// ── Shared form utilities ─────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400 text-xs">({hint})</span>}
      </label>
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ── Shared form props ─────────────────────────────────────────────────────────

interface FormProps {
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  error: string | null;
  defaultValues?: Record<string, unknown>;
}

// ── Diabetes form ─────────────────────────────────────────────────────────────

function DiabetesForm({ onSubmit, loading, error, defaultValues }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, number>>({ defaultValues: (defaultValues ?? {}) as Record<string, number> });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) reset(defaultValues as Record<string, number>);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      <Section title="Patient Info">
        <Field label="Age" hint="years" error={errors.age?.message}>
          <input type="number" className="input-field" {...register("age", { valueAsNumber: true, required: "Required", min: { value: 1, message: "Min 1" }, max: { value: 120, message: "Max 120" } })} />
        </Field>
        <Field label="Pregnancies" hint="0–20" error={errors.pregnancies?.message}>
          <input type="number" className="input-field" {...register("pregnancies", { valueAsNumber: true, required: "Required", min: { value: 0, message: "Min 0" }, max: { value: 20, message: "Max 20" } })} />
        </Field>
      </Section>

      <Section title="Clinical Measurements">
        <Field label="Plasma Glucose" hint="mg/dL" error={errors.glucose?.message}>
          <input type="number" step="0.1" className="input-field" {...register("glucose", { valueAsNumber: true, required: "Required", min: { value: 1, message: "Min 1" }, max: { value: 300, message: "Max 300" } })} />
        </Field>
        <Field label="Diastolic Blood Pressure" hint="mmHg" error={errors.blood_pressure?.message}>
          <input type="number" step="0.1" className="input-field" {...register("blood_pressure", { valueAsNumber: true, required: "Required", min: { value: 1, message: "Min 1" }, max: { value: 200, message: "Max 200" } })} />
        </Field>
        <Field label="BMI" hint="kg/m²" error={errors.bmi?.message}>
          <input type="number" step="0.1" className="input-field" {...register("bmi", { valueAsNumber: true, required: "Required", min: { value: 1, message: "Min 1" }, max: { value: 70, message: "Max 70" } })} />
        </Field>
        <Field label="2-Hour Insulin" hint="μU/mL" error={errors.insulin?.message}>
          <input type="number" step="0.1" className="input-field" {...register("insulin", { valueAsNumber: true, required: "Required", min: { value: 0, message: "Min 0" }, max: { value: 1000, message: "Max 1000" } })} />
        </Field>
      </Section>

      <Section title="Advanced Metrics">
        <Field label="Skin Thickness" hint="mm" error={errors.skin_thickness?.message}>
          <input type="number" step="0.1" className="input-field" {...register("skin_thickness", { valueAsNumber: true, required: "Required", min: { value: 0, message: "Min 0" }, max: { value: 100, message: "Max 100" } })} />
        </Field>
        <Field label="Diabetes Pedigree Function" hint="0–3" error={errors.diabetes_pedigree?.message}>
          <input type="number" step="0.001" className="input-field" {...register("diabetes_pedigree", { valueAsNumber: true, required: "Required", min: { value: 0, message: "Min 0" }, max: { value: 3, message: "Max 3" } })} />
        </Field>
      </Section>

      <SubmitBtn loading={loading} />
    </form>
  );
}

// ── Heart form ────────────────────────────────────────────────────────────────

function HeartForm({ onSubmit, loading, error, defaultValues }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({ defaultValues: defaultValues ?? {} });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) reset(defaultValues);
  }, [defaultValues, reset]);

  const process = (raw: Record<string, unknown>) => {
    onSubmit({
      ...raw,
      age: Number(raw.age),
      resting_bp: Number(raw.resting_bp),
      cholesterol: Number(raw.cholesterol),
      max_heart_rate: Number(raw.max_heart_rate),
      st_depression: Number(raw.st_depression),
      num_vessels: Number(raw.num_vessels),
      fasting_bs_gt120: raw.fasting_bs_gt120 === "true",
      exercise_angina: raw.exercise_angina === "true",
    });
  };

  return (
    <form onSubmit={handleSubmit(process)} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      <Section title="Patient Info">
        <Field label="Age" hint="years" error={errors.age?.message}>
          <input type="number" className="input-field" {...register("age", { required: "Required" })} />
        </Field>
        <Field label="Sex" error={errors.sex?.message}>
          <select className="input-field" {...register("sex", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
      </Section>

      <Section title="Symptoms">
        <Field label="Chest Pain Type" error={errors.chest_pain_type?.message}>
          <select className="input-field" {...register("chest_pain_type", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="asympt">Asymptomatic</option>
            <option value="atyp_angina">Atypical Angina</option>
            <option value="non_anginal">Non-Anginal Pain</option>
            <option value="typ_angina">Typical Angina</option>
          </select>
        </Field>
        <Field label="Exercise-Induced Angina" error={errors.exercise_angina?.message}>
          <select className="input-field" {...register("exercise_angina", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </Field>
        <Field label="Fasting Blood Sugar &gt; 120 mg/dL" error={errors.fasting_bs_gt120?.message}>
          <select className="input-field" {...register("fasting_bs_gt120", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </Field>
      </Section>

      <Section title="Clinical Measurements">
        <Field label="Resting Blood Pressure" hint="mmHg" error={errors.resting_bp?.message}>
          <input type="number" step="0.1" className="input-field" {...register("resting_bp", { required: "Required" })} />
        </Field>
        <Field label="Serum Cholesterol" hint="mg/dL" error={errors.cholesterol?.message}>
          <input type="number" step="0.1" className="input-field" {...register("cholesterol", { required: "Required" })} />
        </Field>
        <Field label="Max Heart Rate Achieved" error={errors.max_heart_rate?.message}>
          <input type="number" step="0.1" className="input-field" {...register("max_heart_rate", { required: "Required" })} />
        </Field>
        <Field label="Resting ECG" error={errors.rest_ecg?.message}>
          <select className="input-field" {...register("rest_ecg", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="normal">Normal</option>
            <option value="st_t_wave_abnormality">ST-T Wave Abnormality</option>
            <option value="left_vent_hyper">Left Ventricular Hypertrophy</option>
          </select>
        </Field>
      </Section>

      <Section title="ECG & Imaging">
        <Field label="ST Depression (Oldpeak)" hint="0–10" error={errors.st_depression?.message}>
          <input type="number" step="0.1" className="input-field" {...register("st_depression", { required: "Required" })} />
        </Field>
        <Field label="ST Slope" error={errors.st_slope?.message}>
          <select className="input-field" {...register("st_slope", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="up">Upsloping</option>
            <option value="flat">Flat</option>
            <option value="down">Downsloping</option>
          </select>
        </Field>
        <Field label="Major Vessels (Fluoroscopy)" hint="0–3" error={errors.num_vessels?.message}>
          <select className="input-field" {...register("num_vessels", { required: "Required" })}>
            <option value="">Select…</option>
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="Thalassemia" error={errors.thalassemia?.message}>
          <select className="input-field" {...register("thalassemia", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="normal">Normal</option>
            <option value="fixed_defect">Fixed Defect</option>
            <option value="reversable_defect">Reversible Defect</option>
          </select>
        </Field>
      </Section>

      <SubmitBtn loading={loading} />
    </form>
  );
}

// ── Liver form ────────────────────────────────────────────────────────────────

function LiverForm({ onSubmit, loading, error, defaultValues }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({ defaultValues: defaultValues ?? {} });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) reset(defaultValues);
  }, [defaultValues, reset]);

  const process = (raw: Record<string, unknown>) => {
    onSubmit({
      ...raw,
      age: Number(raw.age),
      total_bilirubin: Number(raw.total_bilirubin),
      direct_bilirubin: Number(raw.direct_bilirubin),
      alkaline_phosphotase: Number(raw.alkaline_phosphotase),
      alamine_aminotransferase: Number(raw.alamine_aminotransferase),
      aspartate_aminotransferase: Number(raw.aspartate_aminotransferase),
      total_proteins: Number(raw.total_proteins),
      albumin: Number(raw.albumin),
      ag_ratio: Number(raw.ag_ratio),
    });
  };

  return (
    <form onSubmit={handleSubmit(process)} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      <Section title="Patient Info">
        <Field label="Age" hint="years" error={errors.age?.message}>
          <input type="number" className="input-field" {...register("age", { required: "Required" })} />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <select className="input-field" {...register("gender", { required: "Required" })}>
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>
      </Section>

      <Section title="Bilirubin Tests">
        <Field label="Total Bilirubin" hint="mg/dL" error={errors.total_bilirubin?.message}>
          <input type="number" step="0.01" className="input-field" {...register("total_bilirubin", { required: "Required" })} />
        </Field>
        <Field label="Direct Bilirubin" hint="mg/dL" error={errors.direct_bilirubin?.message}>
          <input type="number" step="0.01" className="input-field" {...register("direct_bilirubin", { required: "Required" })} />
        </Field>
      </Section>

      <Section title="Enzyme Tests">
        <Field label="Alkaline Phosphotase" hint="IU/L" error={errors.alkaline_phosphotase?.message}>
          <input type="number" className="input-field" {...register("alkaline_phosphotase", { required: "Required" })} />
        </Field>
        <Field label="ALT / SGPT" hint="IU/L" error={errors.alamine_aminotransferase?.message}>
          <input type="number" className="input-field" {...register("alamine_aminotransferase", { required: "Required" })} />
        </Field>
        <Field label="AST / SGOT" hint="IU/L" error={errors.aspartate_aminotransferase?.message}>
          <input type="number" className="input-field" {...register("aspartate_aminotransferase", { required: "Required" })} />
        </Field>
      </Section>

      <Section title="Protein Tests">
        <Field label="Total Proteins" hint="g/dL" error={errors.total_proteins?.message}>
          <input type="number" step="0.1" className="input-field" {...register("total_proteins", { required: "Required" })} />
        </Field>
        <Field label="Albumin" hint="g/dL" error={errors.albumin?.message}>
          <input type="number" step="0.1" className="input-field" {...register("albumin", { required: "Required" })} />
        </Field>
        <Field label="A/G Ratio" error={errors.ag_ratio?.message}>
          <input type="number" step="0.01" className="input-field" {...register("ag_ratio", { required: "Required" })} />
        </Field>
      </Section>

      <SubmitBtn loading={loading} />
    </form>
  );
}

// ── Kidney form ───────────────────────────────────────────────────────────────

function KidneyForm({ onSubmit, loading, error, defaultValues }: FormProps) {
  const { register, handleSubmit, reset } = useForm<Record<string, unknown>>({
    defaultValues: defaultValues ?? {},
  });

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) reset(defaultValues);
  }, [defaultValues, reset]);

  const process = (raw: Record<string, unknown>) => {
    const toNum = (v: unknown) => (v === "" || v === undefined || v === null ? null : Number(v));
    const toStr = (v: unknown) => (v === "" ? null : v);
    onSubmit({
      age: toNum(raw.age),
      blood_pressure: toNum(raw.blood_pressure),
      specific_gravity: toNum(raw.specific_gravity),
      albumin_level: toNum(raw.albumin_level),
      sugar_level: toNum(raw.sugar_level),
      red_blood_cells: toStr(raw.red_blood_cells),
      pus_cell: toStr(raw.pus_cell),
      pus_cell_clumps: toStr(raw.pus_cell_clumps),
      bacteria: toStr(raw.bacteria),
      blood_glucose_random: toNum(raw.blood_glucose_random),
      blood_urea: toNum(raw.blood_urea),
      serum_creatinine: toNum(raw.serum_creatinine),
      sodium: toNum(raw.sodium),
      potassium: toNum(raw.potassium),
      hemoglobin: toNum(raw.hemoglobin),
      packed_cell_volume: toNum(raw.packed_cell_volume),
      white_blood_cell_count: toNum(raw.white_blood_cell_count),
      red_blood_cell_count: toNum(raw.red_blood_cell_count),
      hypertension: toStr(raw.hypertension),
      diabetes_mellitus: toStr(raw.diabetes_mellitus),
      coronary_artery_disease: toStr(raw.coronary_artery_disease),
      appetite: toStr(raw.appetite),
      pedal_edema: toStr(raw.pedal_edema),
      anemia: toStr(raw.anemia),
    });
  };

  return (
    <form onSubmit={handleSubmit(process)} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        All fields are optional — provide whatever lab values you have available.
      </p>

      <Section title="Basic Info">
        <Field label="Age" hint="years, optional">
          <input type="number" className="input-field" {...register("age")} />
        </Field>
        <Field label="Blood Pressure" hint="mmHg, optional">
          <input type="number" step="0.1" className="input-field" {...register("blood_pressure")} />
        </Field>
      </Section>

      <Section title="Urine Analysis">
        <Field label="Specific Gravity" hint="e.g. 1.010">
          <input type="number" step="0.001" className="input-field" placeholder="1.015" {...register("specific_gravity")} />
        </Field>
        <Field label="Albumin Level" hint="0–5">
          <select className="input-field" {...register("albumin_level")}>
            <option value="">Unknown</option>
            {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Sugar Level" hint="0–5">
          <select className="input-field" {...register("sugar_level")}>
            <option value="">Unknown</option>
            {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Red Blood Cells">
          <select className="input-field" {...register("red_blood_cells")}>
            <option value="">Unknown</option>
            <option value="normal">Normal</option>
            <option value="abnormal">Abnormal</option>
          </select>
        </Field>
        <Field label="Pus Cell">
          <select className="input-field" {...register("pus_cell")}>
            <option value="">Unknown</option>
            <option value="normal">Normal</option>
            <option value="abnormal">Abnormal</option>
          </select>
        </Field>
        <Field label="Pus Cell Clumps">
          <select className="input-field" {...register("pus_cell_clumps")}>
            <option value="">Unknown</option>
            <option value="present">Present</option>
            <option value="notpresent">Not Present</option>
          </select>
        </Field>
        <Field label="Bacteria">
          <select className="input-field" {...register("bacteria")}>
            <option value="">Unknown</option>
            <option value="present">Present</option>
            <option value="notpresent">Not Present</option>
          </select>
        </Field>
      </Section>

      <Section title="Blood Tests">
        <Field label="Blood Glucose (Random)" hint="mg/dL">
          <input type="number" step="0.1" className="input-field" {...register("blood_glucose_random")} />
        </Field>
        <Field label="Blood Urea" hint="mg/dL">
          <input type="number" step="0.1" className="input-field" {...register("blood_urea")} />
        </Field>
        <Field label="Serum Creatinine" hint="mg/dL">
          <input type="number" step="0.01" className="input-field" {...register("serum_creatinine")} />
        </Field>
        <Field label="Sodium" hint="mEq/L">
          <input type="number" step="0.1" className="input-field" {...register("sodium")} />
        </Field>
        <Field label="Potassium" hint="mEq/L">
          <input type="number" step="0.1" className="input-field" {...register("potassium")} />
        </Field>
        <Field label="Hemoglobin" hint="g/dL">
          <input type="number" step="0.1" className="input-field" {...register("hemoglobin")} />
        </Field>
        <Field label="Packed Cell Volume">
          <input type="number" step="0.1" className="input-field" {...register("packed_cell_volume")} />
        </Field>
        <Field label="White Blood Cell Count">
          <input type="number" step="0.1" className="input-field" {...register("white_blood_cell_count")} />
        </Field>
        <Field label="Red Blood Cell Count">
          <input type="number" step="0.01" className="input-field" {...register("red_blood_cell_count")} />
        </Field>
      </Section>

      <Section title="Medical History">
        <Field label="Hypertension">
          <select className="input-field" {...register("hypertension")}>
            <option value="">Unknown</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        <Field label="Diabetes Mellitus">
          <select className="input-field" {...register("diabetes_mellitus")}>
            <option value="">Unknown</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        <Field label="Coronary Artery Disease">
          <select className="input-field" {...register("coronary_artery_disease")}>
            <option value="">Unknown</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        <Field label="Appetite">
          <select className="input-field" {...register("appetite")}>
            <option value="">Unknown</option>
            <option value="good">Good</option>
            <option value="poor">Poor</option>
          </select>
        </Field>
        <Field label="Pedal Edema">
          <select className="input-field" {...register("pedal_edema")}>
            <option value="">Unknown</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
        <Field label="Anemia">
          <select className="input-field" {...register("anemia")}>
            <option value="">Unknown</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </Section>

      <SubmitBtn loading={loading} />
    </form>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitBtn({ loading }: { loading: boolean }) {
  return (
    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running Prediction…
        </>
      ) : (
        "Run Prediction"
      )}
    </button>
  );
}

// ── PDF upload panel ──────────────────────────────────────────────────────────

function PdfUploadPanel({
  onExtracted,
}: {
  onExtracted: (data: ExtractedReportData, fileName: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setExtractError("Please select a PDF file.");
      return;
    }
    setFile(f);
    setExtractError(null);
  };

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const data = await predictionApi.extractFromPdf(file);
      onExtracted(data, file.name);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to extract data from the PDF.";
      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-blue-500 shrink-0" />
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Drop your medical report PDF here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse · Max 10 MB</p>
          </div>
        )}
      </div>

      {extractError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {extractError}
        </p>
      )}

      <button
        onClick={handleExtract}
        disabled={!file || extracting}
        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {extracting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting values…
          </>
        ) : (
          "Extract Values from Report"
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Works with digitally generated PDFs (Thyrocare, SRL, Dr. Lal, etc.). Scanned image PDFs are not supported.
      </p>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function countNonNull(obj: Record<string, unknown> | undefined): number {
  if (!obj) return 0;
  return Object.values(obj).filter((v) => v !== null && v !== undefined).length;
}

function filterNulls(obj: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!obj) return {};
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined));
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const [step, setStep] = useState<"select" | "form">("select");
  const [disease, setDisease] = useState<DiseaseType | null>(null);
  const [inputMode, setInputMode] = useState<"manual" | "pdf">("manual");
  const [extractedData, setExtractedData] = useState<ExtractedReportData | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const { submit, loading, error } = usePrediction();

  const handleSelect = (d: DiseaseType) => {
    setDisease(d);
    setStep("form");
    setInputMode("manual");
    setExtractedData(null);
    setExtractedFileName(null);
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (disease) submit(disease, data as never);
  };

  const handleExtracted = (data: ExtractedReportData, fileName: string) => {
    setExtractedData(data);
    setExtractedFileName(fileName);
    setFormKey((k) => k + 1);
    setInputMode("manual");
  };

  const activeDiseaseInfo = DISEASES.find((d) => d.id === disease);
  const diseaseDefaults = disease && extractedData
    ? filterNulls(extractedData[disease] as Record<string, unknown>)
    : undefined;
  const filledCount = disease && extractedData ? countNonNull(extractedData[disease] as Record<string, unknown>) : 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Health Assessment</h1>
        <p className="text-gray-500 mt-1">Enter your clinical data to receive an AI-powered risk prediction.</p>
      </div>

      {step === "select" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DISEASES.map(({ id, label, icon: Icon, description, color, bg }) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={cn(
                "card text-left transition-all cursor-pointer border-2",
                bg
              )}
            >
              <Icon className={cn("w-7 h-7 mb-3", color)} />
              <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setStep("select")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Change disease
          </button>

          {activeDiseaseInfo && (
            <div className={cn("flex items-center gap-3 card mb-4 border-2", activeDiseaseInfo.bg)}>
              <activeDiseaseInfo.icon className={cn("w-6 h-6 shrink-0", activeDiseaseInfo.color)} />
              <div>
                <p className="font-semibold text-gray-900">{activeDiseaseInfo.label} Assessment</p>
                <p className="text-sm text-gray-500">{activeDiseaseInfo.description}</p>
              </div>
            </div>
          )}

          {/* Input mode tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
            <button
              onClick={() => setInputMode("manual")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                inputMode === "manual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Enter Manually
            </button>
            <button
              onClick={() => setInputMode("pdf")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5",
                inputMode === "pdf"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload PDF Report
            </button>
          </div>

          {/* Success banner after extraction */}
          {extractedFileName && inputMode === "manual" && filledCount > 0 && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">
                  {filledCount} field{filledCount !== 1 ? "s" : ""} auto-filled from report
                </p>
                <p className="text-xs text-green-600 truncate">{extractedFileName}</p>
              </div>
              <button
                onClick={() => { setExtractedData(null); setExtractedFileName(null); setFormKey((k) => k + 1); }}
                className="text-green-600 hover:text-green-800 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {inputMode === "pdf" ? (
            <div className="card">
              <PdfUploadPanel onExtracted={handleExtracted} />
            </div>
          ) : (
            <div className="card">
              {disease === "diabetes" && (
                <DiabetesForm key={formKey} onSubmit={handleSubmit} loading={loading} error={error} defaultValues={diseaseDefaults} />
              )}
              {disease === "heart" && (
                <HeartForm key={formKey} onSubmit={handleSubmit} loading={loading} error={error} defaultValues={diseaseDefaults} />
              )}
              {disease === "liver" && (
                <LiverForm key={formKey} onSubmit={handleSubmit} loading={loading} error={error} defaultValues={diseaseDefaults} />
              )}
              {disease === "kidney" && (
                <KidneyForm key={formKey} onSubmit={handleSubmit} loading={loading} error={error} defaultValues={diseaseDefaults} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
