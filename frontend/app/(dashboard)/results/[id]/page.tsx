"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, ClipboardList, AlertTriangle, Download, Loader2, Lightbulb } from "lucide-react";
import { predictionApi, reportApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toaster";
import type { PredictionResult } from "@/types/prediction";

// ── Risk gauge (SVG circle) ───────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)));
  const color = pct < 34 ? "#10b981" : pct < 67 ? "#f59e0b" : "#ef4444";
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="relative inline-flex">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {pct}%
        </span>
        <span className="text-xs text-gray-400 mt-0.5">Risk Score</span>
      </div>
    </div>
  );
}

// ── Risk level badge ──────────────────────────────────────────────────────────

const RISK_STYLES = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_STYLES[level as keyof typeof RISK_STYLES] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${cls}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
}

// ── Feature name formatter ────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  // Diabetes (Pima OpenML short names)
  preg: "Pregnancies", plas: "Plasma Glucose", pres: "Blood Pressure",
  skin: "Skin Thickness", insu: "Insulin", mass: "BMI",
  pedi: "Diabetes Pedigree", age: "Age",
  // Heart (Cleveland OpenML)
  sex: "Sex", cp: "Chest Pain Type", trestbps: "Resting BP",
  chol: "Cholesterol", fbs: "Fasting Blood Sugar", restecg: "Resting ECG",
  thalach: "Max Heart Rate", exang: "Exercise Angina", oldpeak: "ST Depression",
  slope: "ST Slope", ca: "Num Vessels", thal: "Thalassemia",
  // Liver (ILPD V1-V10)
  V1: "Age", V2: "Gender", V3: "Total Bilirubin", V4: "Direct Bilirubin",
  V5: "Alkaline Phosphotase", V6: "Alanine Aminotransferase",
  V7: "Aspartate Aminotransferase", V8: "Total Proteins",
  V9: "Albumin", V10: "A/G Ratio",
  // Kidney (CKD abbreviated)
  bp: "Blood Pressure", sg: "Specific Gravity", al: "Albumin Level",
  su: "Sugar Level", rbc: "Red Blood Cells", pc: "Pus Cells",
  pcc: "Pus Cell Clumps", ba: "Bacteria", bgr: "Blood Glucose (Random)",
  bu: "Blood Urea", sc: "Serum Creatinine", sod: "Sodium", pot: "Potassium",
  hemo: "Hemoglobin", pcv: "Packed Cell Volume", wbcc: "WBC Count",
  rbcc: "RBC Count", htn: "Hypertension", dm: "Diabetes Mellitus",
  cad: "Coronary Artery Disease", appet: "Appetite", pe: "Pedal Edema",
  ane: "Anemia",
};

function formatFeature(name: string) {
  if (FEATURE_LABELS[name]) return FEATURE_LABELS[name];
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── SHAP waterfall chart ──────────────────────────────────────────────────────

function ShapChart({ shap }: { shap: PredictionResult["shap_values"] }) {
  const sorted = [...shap]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 12);

  const data = sorted.map((s) => ({
    feature: formatFeature(s.feature),
    value: s.value,
    absValue: Math.abs(s.value),
    direction: s.direction,
  }));

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">
        Feature Impact (SHAP Values)
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Red bars increase risk · Green bars decrease risk · Sorted by importance
      </p>
      <ResponsiveContainer width="100%" height={data.length * 36 + 30}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={180}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => [typeof v === "number" ? v.toFixed(4) : String(v), "SHAP value"]}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0 ? "#ef4444" : "#10b981"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Disease label map ─────────────────────────────────────────────────────────

const DISEASE_LABELS: Record<string, string> = {
  diabetes: "Diabetes",
  heart: "Heart Disease",
  liver: "Liver Disease",
  kidney: "Kidney Disease",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const blob = await reportApi.downloadPdf(result.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health-report-${result.disease_type}-${result.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("PDF report downloaded successfully", "success");
    } catch {
      toast("Failed to generate PDF report", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const cached = sessionStorage.getItem(`prediction_${id}`);
    if (cached) {
      sessionStorage.removeItem(`prediction_${id}`);
      setResult(JSON.parse(cached));
      return;
    }
    predictionApi
      .getById(Number(id))
      .then(setResult)
      .catch(() => setError("Could not load prediction. It may not exist or belong to another account."));
  }, [id]);

  // Poll once after 4s for background-generated recommendations
  useEffect(() => {
    if (!result) return;
    if ((result.recommendations ?? []).length > 0) return;
    const timer = setTimeout(() => {
      predictionApi.getById(Number(id)).then((fresh) => {
        if ((fresh.recommendations ?? []).length > 0) setResult(fresh);
      }).catch(() => {});
    }, 4000);
    return () => clearTimeout(timer);
  }, [result, id]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-700 font-medium mb-6">{error}</p>
        <button onClick={() => router.push("/history")} className="btn-secondary">
          Back to History
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const disease = DISEASE_LABELS[result.disease_type] ?? result.disease_type;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{disease} Prediction</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date(result.created_at).toLocaleString()}
        </p>
      </div>

      {/* Risk overview card */}
      <div className="card mb-6">
        <div className="flex items-center gap-8">
          <RiskGauge score={result.risk_score} />
          <div>
            <p className="text-sm text-gray-500 mb-2">Overall Risk Level</p>
            <RiskBadge level={result.risk_level} />
            <p className="text-xs text-gray-400 mt-3 max-w-xs">
              This score is generated by an AI model and is for informational purposes only. Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </div>

      {/* SHAP chart card */}
      {result.shap_values.length > 0 && (
        <div className="card mb-6">
          <ShapChart shap={result.shap_values} />
        </div>
      )}

      {/* Clinical recommendations */}
      {(result.recommendations ?? []).length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-gray-800">Clinical Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {(result.recommendations ?? []).map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
            AI-generated suggestions based on your risk profile. Always consult a qualified healthcare professional before making medical decisions.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => router.push("/assessment")}
          className="btn-primary flex items-center gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          New Assessment
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="btn-secondary flex items-center gap-2"
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloadingPdf ? "Generating…" : "Download PDF"}
        </button>
        <button onClick={() => router.push("/history")} className="btn-secondary">
          View History
        </button>
        <button onClick={() => router.push("/chat")} className="btn-secondary">
          Ask AI Chat
        </button>
      </div>
    </div>
  );
}
