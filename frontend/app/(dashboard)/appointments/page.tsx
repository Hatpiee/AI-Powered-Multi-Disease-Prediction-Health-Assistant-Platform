"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Calendar, Plus, X, Loader2, Clock, Stethoscope } from "lucide-react";
import { appointmentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toaster";
import type { AppointmentCreate, AppointmentOut } from "@/types/appointment";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "General Physician",
  "Diabetologist / Endocrinologist",
  "Cardiologist",
  "Hepatologist",
  "Nephrologist",
  "Internal Medicine",
  "Pulmonologist",
  "Neurologist",
  "Oncologist",
  "Other",
];

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM",
];

const STATUS_STYLES = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500 line-through",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ── Appointment card ──────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
}: {
  appointment: AppointmentOut;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  const isCancelled = appointment.status === "cancelled";
  return (
    <div className={cn("card flex items-start gap-4", isCancelled && "opacity-60")}>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 shrink-0">
        <Stethoscope className="w-5 h-5 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900">{appointment.doctor_name}</p>
            <p className="text-sm text-gray-500">{appointment.specialization}</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(appointment.appointment_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {appointment.time_slot}
          </span>
        </div>
        {appointment.notes && (
          <p className="text-xs text-gray-400 mt-1.5 italic">{appointment.notes}</p>
        )}
      </div>
      {!isCancelled && (
        <button
          onClick={() => onCancel(appointment.id)}
          disabled={cancelling}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
          title="Cancel appointment"
        >
          {cancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

// ── Booking form ──────────────────────────────────────────────────────────────

function BookingForm({ onBooked }: { onBooked: (a: AppointmentOut) => void }) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentCreate>();

  const onSubmit = async (data: AppointmentCreate) => {
    try {
      const created = await appointmentApi.create(data);
      onBooked(created);
      reset();
      toast("Appointment booked successfully", "success");
    } catch {
      toast("Failed to book appointment. Please try again.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h2 className="font-semibold text-gray-800">Book New Appointment</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Doctor Name</label>
          <input
            type="text"
            placeholder="Dr. Jane Smith"
            className="input-field"
            {...register("doctor_name", { required: "Doctor name is required" })}
          />
          {errors.doctor_name && <p className="error-text">{errors.doctor_name.message}</p>}
        </div>

        <div>
          <label className="label">Specialization</label>
          <select
            className="input-field"
            {...register("specialization", { required: "Specialization is required" })}
          >
            <option value="">Select…</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.specialization && <p className="error-text">{errors.specialization.message}</p>}
        </div>

        <div>
          <label className="label">Appointment Date</label>
          <input
            type="date"
            min={todayStr()}
            className="input-field"
            {...register("appointment_date", { required: "Date is required" })}
          />
          {errors.appointment_date && <p className="error-text">{errors.appointment_date.message}</p>}
        </div>

        <div>
          <label className="label">Time Slot</label>
          <select
            className="input-field"
            {...register("time_slot", { required: "Time slot is required" })}
          >
            <option value="">Select…</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.time_slot && <p className="error-text">{errors.time_slot.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">
          Notes <span className="font-normal text-gray-400 text-xs">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Reason for visit, symptoms, or any additional notes…"
          className="input-field resize-none"
          {...register("notes")}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center gap-2">
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {isSubmitting ? "Booking…" : "Book Appointment"}
      </button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"list" | "book">("list");

  useEffect(() => {
    appointmentApi
      .list()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      const updated = await appointmentApi.cancel(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast("Appointment cancelled", "info");
    } catch {
      toast("Failed to cancel appointment", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleBooked = (newAppt: AppointmentOut) => {
    setAppointments((prev) => [newAppt, ...prev]);
    setTab("list");
  };

  const upcoming = appointments.filter((a) => a.status !== "cancelled");
  const past = appointments.filter((a) => a.status === "cancelled");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-1">Manage your doctor visits</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {(["list", "book"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "list" ? "My Appointments" : "Book New"}
          </button>
        ))}
      </div>

      {tab === "book" ? (
        <BookingForm onBooked={handleBooked} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No appointments yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Book your first appointment with a specialist.</p>
          <button onClick={() => setTab("book")} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onCancel={handleCancel}
                    cancelling={cancellingId === a.id}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Cancelled ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onCancel={handleCancel}
                    cancelling={cancellingId === a.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
