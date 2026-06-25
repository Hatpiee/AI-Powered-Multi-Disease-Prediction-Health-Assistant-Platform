"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  ClipboardList,
  MessageSquare,
  History,
  ChevronRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Minus,
} from "lucide-react";
import { predictionApi } from "@/lib/api";
import type { PredictionListItem } from "@/types/prediction";
import { cn } from "@/lib/utils";

const RISK_STYLES = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

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

type DiseaseKey = "diabetes" | "heart" | "liver" | "kidney";

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_STYLES[level as keyof typeof RISK_STYLES] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniSparkline({ items, disease }: { items: PredictionListItem[]; disease: string }) {
  const color = DISEASE_COLORS[disease] ?? "#6366f1";
  const points = items
    .filter((i) => i.disease_type === disease)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((i) => ({ score: Math.round(i.risk_score * 100) }));

  if (points.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`db-spark-${disease}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#db-spark-${disease})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DiseaseMiniCard({
  disease,
  items,
  onClick,
}: {
  disease: DiseaseKey;
  items: PredictionListItem[];
  onClick: () => void;
}) {
  const color = DISEASE_COLORS[disease];
  const diseaseItems = items
    .filter((i) => i.disease_type === disease)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const latest = diseaseItems[diseaseItems.length - 1];
  const prev = diseaseItems[diseaseItems.length - 2];
  const delta = latest && prev
    ? Math.round(latest.risk_score * 100) - Math.round(prev.risk_score * 100)
    : null;

  return (
    <button
      onClick={onClick}
      className="card text-left w-full hover:shadow-md transition-all border border-gray-100 hover:border-gray-200 p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {DISEASE_LABELS[disease]}
        </span>
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
            {delta > 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>

      {latest ? (
        <>
          <p className="text-2xl font-bold" style={{ color }}>
            {Math.round(latest.risk_score * 100)}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5 mb-2">
            {diseaseItems.length} run{diseaseItems.length !== 1 ? "s" : ""}
          </p>
          <MiniSparkline items={items} disease={disease} />
        </>
      ) : (
        <p className="text-sm text-gray-400 py-1">Not assessed</p>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PredictionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    predictionApi
      .history(50)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  const latest = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const totalAssessments = history.length;
  const hasAnyData = history.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Your health overview at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Activity}
          label="Total Assessments"
          value={loading ? "…" : totalAssessments}
          sub="Across all diseases"
          color="bg-primary-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Latest Risk Level"
          value={
            loading
              ? "…"
              : latest
              ? latest.risk_level.charAt(0).toUpperCase() + latest.risk_level.slice(1)
              : "–"
          }
          sub={latest ? DISEASE_LABELS[latest.disease_type] ?? latest.disease_type : "No assessments yet"}
          color={
            !latest
              ? "bg-gray-400"
              : latest.risk_level === "high"
              ? "bg-red-500"
              : latest.risk_level === "medium"
              ? "bg-amber-500"
              : "bg-green-500"
          }
        />
        <StatCard
          icon={Calendar}
          label="Last Assessment"
          value={
            loading
              ? "…"
              : latest
              ? new Date(latest.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "–"
          }
          sub={
            latest
              ? new Date(latest.created_at).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Run your first assessment"
          }
          color="bg-purple-600"
        />
      </div>

      {/* Disease risk summary */}
      {!loading && hasAnyData && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Disease Risk Summary</h2>
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View trends
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["diabetes", "heart", "liver", "kidney"] as DiseaseKey[]).map((d) => (
              <DiseaseMiniCard
                key={d}
                disease={d}
                items={history}
                onClick={() => router.push("/history")}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent predictions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Predictions</h2>
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="card py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="card py-12 text-center">
              <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No assessments yet</p>
              <button
                onClick={() => router.push("/assessment")}
                className="btn-primary mt-4 text-sm"
              >
                Start your first assessment
              </button>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Disease</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Risk</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Score</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...history]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 6)
                    .map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/results/${item.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: DISEASE_COLORS[item.disease_type] ?? "#94a3b8",
                              }}
                            />
                            <span className="font-medium text-gray-900">
                              {DISEASE_LABELS[item.disease_type] ?? item.disease_type}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <RiskBadge level={item.risk_level} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
                            <span className="text-xs text-gray-500">
                              {Math.round(item.risk_score * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-300">
                          <ChevronRight className="w-4 h-4" />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/assessment")}
              className="card w-full text-left flex items-center gap-4 hover:border-primary-200 hover:shadow-sm transition-all border border-gray-100"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50">
                <ClipboardList className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">New Assessment</p>
                <p className="text-xs text-gray-400">Check your disease risk</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </button>

            <button
              onClick={() => router.push("/chat")}
              className="card w-full text-left flex items-center gap-4 hover:border-primary-200 hover:shadow-sm transition-all border border-gray-100"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">AI Health Chat</p>
                <p className="text-xs text-gray-400">Ask medical questions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </button>

            <button
              onClick={() => router.push("/history")}
              className="card w-full text-left flex items-center gap-4 hover:border-primary-200 hover:shadow-sm transition-all border border-gray-100"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50">
                <History className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Risk Trends</p>
                <p className="text-xs text-gray-400">View score history & charts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-700 leading-relaxed">
              AI predictions are for informational purposes only and do not constitute medical advice. Always consult a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
