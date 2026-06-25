export interface AppointmentCreate {
  doctor_name: string;
  specialization: string;
  appointment_date: string;
  time_slot: string;
  notes?: string;
}

export interface AppointmentOut {
  id: number;
  doctor_name: string;
  specialization: string;
  appointment_date: string;
  time_slot: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string | null;
  created_at: string;
}
