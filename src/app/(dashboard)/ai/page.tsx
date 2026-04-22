"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { useRouter } from "next/navigation";
import {
  FiCpu,
  FiDollarSign,
  FiSlash,
  FiSettings,
  FiActivity,
} from "react-icons/fi";

import FinancialTab from "./components/FinancialTab";
import ModelsTab from "./components/ModelsTab";
import StatisticsTab from "./components/StatisticsTab";

export default function AIManagerPage() {
  const [activeTab, setActiveTab] = useState<"financial" | "models" | "stats">(
    "stats",
  );
  const me = useQuery(api.users.auth.me);
  const router = useRouter();

  // The settings query returns default values if no record exists
  const settings = useQuery(api.ai.settings.get);
  const metricsData = useQuery(api.dashboard.dashboard.getDashboardMetrics);

  if (me === undefined || settings === undefined || metricsData === undefined) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  // Only creators can manage AI settings entirely
  if (!me || me.role !== "creator") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی ندارید</p>
        <p className="text-sm text-white/40">
          این بخش مختص مدیران سیستم (Creator) است.
        </p>
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer mt-2 rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5 transition"
        >
          بازگشت
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "stats", label: "آمار", icon: FiActivity },
    { id: "financial", label: "مالی و سود", icon: FiDollarSign },
    { id: "models", label: "پارامترهای مدل", icon: FiCpu },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-5 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 shadow-inner">
            <FiSettings className="text-xl text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              مدیریت هوش مصنوعی
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              پیکربندی پارامترهای تولید تصویر و سیاست‌های قیمت‌گذاری
            </p>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`cursor-pointer flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "stats" && (
          <StatisticsTab metrics={metricsData?.metrics} />
        )}
        {activeTab === "financial" && <FinancialTab settings={settings} />}
        {activeTab === "models" && <ModelsTab settings={settings} />}
      </div>
    </div>
  );
}
