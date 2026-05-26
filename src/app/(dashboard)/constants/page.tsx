"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { useRouter } from "next/navigation";
import {
  FiMapPin,
  FiGrid,
  FiSlash,
  FiDatabase,
  FiAward,
} from "react-icons/fi";

import CitiesTab from "./components/CitiesTab";
import ServicesTab from "./components/ServicesTab";
import PlansTab from "./components/PlansTab";

export default function ConstantsPage() {
  const [activeTab, setActiveTab] = useState<"cities" | "services" | "plans">("cities");
  const me = useQuery(api.users.auth.me);
  const router = useRouter();

  if (me === undefined) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!me || (me.role !== "creator" && me.role !== "promoter")) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی ندارید</p>
        <p className="text-sm text-white/40">این بخش مختص مدیران پلتفرم است.</p>
        <button onClick={() => router.push("/")} className="cursor-pointer mt-2 rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5 transition">
          بازگشت
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "cities", label: "شهرها", icon: FiMapPin, show: true },
    { id: "services", label: "خدمات و مدل‌ها", icon: FiGrid, show: me.role === "creator" },
    { id: "plans", label: "پلان‌ها", icon: FiAward, show: me.role === "creator" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-5 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <FiDatabase className="text-xl text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">داده‌های ثابت</h1>
            <p className="text-sm text-white/40 mt-0.5">مدیریت اطلاعات زیرساختی و پایه‌ای پلتفرم</p>
          </div>
        </div>
        
        {/* Tabs row */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-hide">
          {tabs.filter(t => t.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${activeTab === tab.id
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
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
        {activeTab === "cities" && <CitiesTab />}
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "plans" && <PlansTab />}
      </div>
    </div>
  );
}
