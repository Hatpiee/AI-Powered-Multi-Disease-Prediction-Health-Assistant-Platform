import axios from "axios";
import { getToken, removeToken } from "@/lib/auth";
import type { LoginPayload, RegisterPayload, Token, User } from "@/types/user";
import type {
  DiabetesInput,
  HeartInput,
  LiverInput,
  KidneyInput,
  PredictionResult,
  PredictionListItem,
} from "@/types/prediction";
import type { ChatSession, ChatMessage } from "@/types/chat";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<User>("/api/v1/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<Token>("/api/v1/auth/login", payload).then((r) => r.data),

  me: () =>
    api.get<User>("/api/v1/auth/me").then((r) => r.data),
};

export interface ExtractedReportData {
  diabetes: Partial<{
    age: number; pregnancies: number; glucose: number; blood_pressure: number;
    bmi: number; insulin: number; skin_thickness: number; diabetes_pedigree: number;
  }>;
  heart: Partial<{
    age: number; resting_bp: number; cholesterol: number;
    max_heart_rate: number; st_depression: number;
  }>;
  liver: Partial<{
    age: number; total_bilirubin: number; direct_bilirubin: number;
    alkaline_phosphotase: number; alamine_aminotransferase: number;
    aspartate_aminotransferase: number; total_proteins: number;
    albumin: number; ag_ratio: number;
  }>;
  kidney: Partial<{
    age: number; blood_pressure: number; blood_glucose_random: number;
    blood_urea: number; serum_creatinine: number; sodium: number;
    potassium: number; hemoglobin: number; packed_cell_volume: number;
    white_blood_cell_count: number; red_blood_cell_count: number;
  }>;
}

export const predictionApi = {
  diabetes: (body: DiabetesInput) =>
    api.post<PredictionResult>("/api/v1/predictions/diabetes", body).then((r) => r.data),

  heart: (body: HeartInput) =>
    api.post<PredictionResult>("/api/v1/predictions/heart", body).then((r) => r.data),

  liver: (body: LiverInput) =>
    api.post<PredictionResult>("/api/v1/predictions/liver", body).then((r) => r.data),

  kidney: (body: KidneyInput) =>
    api.post<PredictionResult>("/api/v1/predictions/kidney", body).then((r) => r.data),

  extractFromPdf: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<ExtractedReportData>("/api/v1/predictions/extract-from-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  history: (limit = 20) =>
    api
      .get<PredictionListItem[]>(`/api/v1/predictions/history?limit=${limit}`)
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<PredictionResult>(`/api/v1/predictions/${id}`).then((r) => r.data),
};

export const appointmentApi = {
  create: (body: import("@/types/appointment").AppointmentCreate) =>
    api
      .post<import("@/types/appointment").AppointmentOut>("/api/v1/appointments", body)
      .then((r) => r.data),

  list: () =>
    api
      .get<import("@/types/appointment").AppointmentOut[]>("/api/v1/appointments")
      .then((r) => r.data),

  cancel: (id: number) =>
    api
      .patch<import("@/types/appointment").AppointmentOut>(`/api/v1/appointments/${id}/cancel`)
      .then((r) => r.data),
};

export const reportApi = {
  downloadPdf: (predictionId: number) =>
    api
      .get(`/api/v1/reports/${predictionId}`, { responseType: "blob" })
      .then((r) => r.data as Blob),
};

export const chatApi = {
  createSession: () =>
    api.post<ChatSession>("/api/v1/chat/sessions").then((r) => r.data),

  sendMessage: (sessionId: number, content: string) =>
    api
      .post<ChatMessage>(`/api/v1/chat/sessions/${sessionId}/messages`, { content })
      .then((r) => r.data),

  getSessions: () =>
    api.get<ChatSession[]>("/api/v1/chat/sessions").then((r) => r.data),

  getMessages: (sessionId: number) =>
    api
      .get<ChatMessage[]>(`/api/v1/chat/sessions/${sessionId}/messages`)
      .then((r) => r.data),
};

export default api;
