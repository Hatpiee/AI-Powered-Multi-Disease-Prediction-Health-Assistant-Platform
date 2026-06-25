"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { predictionApi } from "@/lib/api";
import type {
  DiseaseType,
  DiabetesInput,
  HeartInput,
  LiverInput,
  KidneyInput,
  PredictionResult,
} from "@/types/prediction";

type PredictionInput = DiabetesInput | HeartInput | LiverInput | KidneyInput;

export function usePrediction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const submit = async (disease: DiseaseType, data: PredictionInput) => {
    setLoading(true);
    setError(null);
    try {
      let res: PredictionResult;
      if (disease === "diabetes") res = await predictionApi.diabetes(data as DiabetesInput);
      else if (disease === "heart") res = await predictionApi.heart(data as HeartInput);
      else if (disease === "liver") res = await predictionApi.liver(data as LiverInput);
      else res = await predictionApi.kidney(data as KidneyInput);

      setResult(res);
      sessionStorage.setItem(`prediction_${res.id}`, JSON.stringify(res));
      router.push(`/results/${res.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Prediction failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error, result };
}
