"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { History, ChevronRight, ClipboardList, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { predictionApi } from "@/lib/api";
import type { PredictionListItem } from "@/types/prediction";
import { cn } from "@/lib/utils";

const DISEASE_LABELS: Record<string, string> = {
  diabetes: "Diabetes",
  heart: "Heart Disease",
  liver: "Liver Disease",
  kidney: "Kidney Disease",
};

const DISEASE_COLORS: Record<string, string> = {
  diabetes: "#6366f1",
  heart: "#ef4444",
  liver: "#f59e0b",
  kidney: "#10b981",
};

const RISK_STYLES = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

type DiseaseKey = "diabetes" | "heart" | "liver" | "kidney";

type ChartPoint = {
  date: string;
  dateTime: string;
  score: number;
  risk_level: string;
  id: number;
};

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_STYLES[level as keyof typeof RISK_STYLES] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function buildChartData(items: PredictionListItem[], disease: string): ChartPoint[] {
  return items
    .filter((i) => i.disease_type === disease)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((item) => ({
      date: new Date(item.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      dateTime: item.created_at,
      score: Math.round(item.risk_score * 100),
      risk_level: item.risk_level,
      id: item.id,
    }));
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-gray-400 text-xs mb-1.5">
        {new Date(d.dateTime).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <p className="text-2xl font-bold text-gray-900">{d.score}%</p>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1.5 ${
          d.risk_level === "high"
            ? "bg-red-100 text-red-800"
            : d.risk_level === "medium"
            ? "bg-amber-100 text-amber-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {d.risk_level.charAt(0).toUpperCase() + d.risk_level.slice(1)} Risk
      </span>
    </div>
  );
}

function TrendChart({ points, color, disease }: { points: ChartPoint[]; color: string; disease: string }) {
  const gradId = `grad-${disease}`;

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
        No {DISEASE_LABELS[disease]?.toLowerCase() ?? disease} assessments yet.
      </div>
    );
  }

  if (points.length === 1) {
    const p = points[0];
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-center">
          <p className="text-5xl font-bold mb-2" style={{ color }}>
            {p.score}%
          </p>
          <p className="text-sm text-gray-500">
            1 assessment ·{" "}
            <span
              className={
                p.risk_level === "high"
                  ? "text-red-600"
                  : p.risk_level === "medium"
                  ? "text-amber-600"
                  : "text-green-600"
              }
            >
              {p.risk_level} risk
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(p.dateTime).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Run more assessments to see your trend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={points} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={33}
          stroke="#10b981"
          strokeDasharray="4 4"
          strokeOpacity={0.5}
        />
        <ReferenceLine
          y={66}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          strokeOpacity={0.5}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={{ fill: color, strokeWidth: 0, r: 4 }}
          activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Sparkline({ points, color, disease }: { points: ChartPoint[]; color: string; disease: string }) {
  if (points.length < 2) return null;
  const sparkId = `spark-${disease}`;
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${sparkId})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DiseaseSummaryCard({
  disease,
  points,
  active,
  onClick,
}: {
  disease: DiseaseKey;
  points: ChartPoint[];
  active: boolean;
  onClick: () => void;
}) {
  const color = DISEASE_COLORS[disease];
  const latest = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = latest && prev ? latest.score - prev.score : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 text-left w-full transition-all border",
        active
          ? "border-2 shadow-sm"
          : "border border-gray-100 bg-white hover:border-gray-200"
      )}
      style={active ? { borderColor: color, backgroundColor: `${color}08` } : {}}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
          {DISEASE_LABELS[disease]}
        </p>
        {delta !== null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              delta > 0 ? "text-red-500" : delta < 0 ? "text-green-500" : "text-gray-400"
            )}
          >
            {delta > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : delta < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>

      {latest ? (
        <>
          <p className="text-xl font-bold leading-none mb-0.5" style={{ color }}>
            {latest.score}%
          </p>
          <p className="text-xs text-gray-400 mb-2">
            {points.length} assessment{points.length !== 1 ? "s" : ""}
          </p>
          <Sparkline points={points} color={color} disease={disease} />
        </>
      ) : (
        <p className="text-sm text-gray-400 py-2">No data yet</p>
      )}
    </button>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<PredictionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDisease, setActiveDisease] = useState<DiseaseKey>("diabetes");

  useEffect(() => {
    predictionApi
      .history(100)
      .then((data) => {
        setItems(data);
        // Default to the disease with the most assessments
        const counts: Record<string, number> = {
          diabetes: 0,
          heart: 0,
          liver: 0,
          kidney: 0,
        };
        data.forEach((i) => {
          if (i.disease_type in counts) counts[i.disease_type]++;
        });
        const top = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as DiseaseKey;
        if (counts[top] > 0) setActiveDisease(top);
      })
      .finally(() => setLoading(false));
  }, []);

  const diseaseData: Record<DiseaseKey, ChartPoint[]> = {
    diabetes: buildChartData(items, "diabetes"),
    heart: buildChartData(items, "heart"),
    liver: buildChartData(items, "liver"),
    kidney: buildChartData(items, "kidney"),
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
          <p className="text-gray-500 mt-1">Track your health risk trends over time</p>
        </div>
        <button
          onClick={() => router.push("/assessment")}
          className="btn-primary flex items-center gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          New Assessment
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No assessments yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Run your first disease risk assessment to see trends here.
          </p>
          <button onClick={() => router.push("/assessment")} className="btn-primary">
            Start Assessment
          </button>
        </div>
      ) : (
        <>
          {/* ── Trend chart card ─────────────────────────────────────────── */}
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-gray-800">Risk Score Trends</h2>
              <span className="text-xs text-gray-400 ml-auto">
                Dashed lines mark Low / Medium / High boundaries
              </span>
            </div>

            {/* Disease selector cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {(["diabetes", "heart", "liver", "kidney"] as DiseaseKey[]).map((d) => (
                <DiseaseSummaryCard
                  key={d}
                  disease={d}
                  points={diseaseData[d]}
                  active={activeDisease === d}
                  onClick={() => setActiveDisease(d)}
                />
              ))}
            </div>

            {/* Full trend chart */}
            <div className="border-t border-gray-50 pt-5">
              <p className="text-sm font-medium text-gray-600 mb-4">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: DISEASE_COLORS[activeDisease] }}
                />
                {DISEASE_LABELS[activeDisease]} — Risk Score Over Time
              </p>
              <TrendChart
                points={diseaseData[activeDisease]}
                color={DISEASE_COLORS[activeDisease]}
                disease={activeDisease}
              />
            </div>
          </div>

          {/* ── All assessments table ────────────────────────────────────── */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4">
              All Assessments
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({items.length})
              </span>
            </h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3.5 font-medium text-gray-500">Disease</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-500">Risk Level</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-500">Score</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-500">Date</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/results/${item.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                DISEASE_COLORS[item.disease_type as DiseaseKey] ?? "#94a3b8",
                            }}
                          />
                          <span className="font-medium text-gray-900">
                            {DISEASE_LABELS[item.disease_type] ?? item.disease_type}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <RiskBadge level={item.risk_level} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                item.risk_level === "high"
                                  ? "bg-red-500"
                                  : item.risk_level === "medium"
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                              )}
                              style={{ width: `${Math.round(item.risk_score * 100)}%` }}
                            />
                          </div>
                          <span className="text-gray-600 text-xs">
                            {Math.round(item.risk_score * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4 text-gray-300">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
