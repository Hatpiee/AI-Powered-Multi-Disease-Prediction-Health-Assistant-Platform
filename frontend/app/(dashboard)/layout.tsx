"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Heart } from "lucide-react";
import { authApi } from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import type { User } from "@/types/user";

const USER_CACHE_KEY = "auth_user";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const MAX_ATTEMPTS = 20;
    const RETRY_DELAY = 2000;

    async function tryAuth(attempt: number) {
      try {
        const u = await authApi.me();
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
        setUser(u);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          sessionStorage.removeItem(USER_CACHE_KEY);
          router.push("/login");
          return;
        }
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => tryAuth(attempt + 1), RETRY_DELAY);
        } else {
          // All retries exhausted — go to login (health banner will show there)
          router.push("/login");
        }
      }
    }

    tryAuth(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const closeSidebar = () => setSidebarOpen(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar — always visible md+ */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeSidebar}
          />
          {/* Drawer */}
          <div className="relative z-50">
            <Sidebar user={user} onClose={closeSidebar} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary-600">
              <Heart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">AI Health Platform</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
