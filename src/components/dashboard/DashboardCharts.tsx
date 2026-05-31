"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiScissors, FiUsers, FiCpu, FiActivity } from "react-icons/fi";
import { useQuery } from "convex/react";
import { api } from "@backend/api";

type Period = "hourly" | "daily" | "monthly" | "yearly";

function CustomTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl text-right" dir="rtl">
      <p className="text-[11px] font-bold text-white/50 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs flex-row-reverse">
          <span className="font-bold" style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-white font-black">{valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Period Tabs ──────────────────────────────────────────────────────────────
const PERIOD_LABELS: Record<Period, string> = {
  hourly: "ساعتی",
  daily: "روزانه",
  monthly: "ماهانه",
  yearly: "سالانه",
};

function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            value === p
              ? "bg-gradient-to-r from-orange-500/25 to-amber-500/15 text-orange-300 shadow shadow-orange-500/10"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

// ─── Trend badge ─────────────────────────────────────────────────────────────
function Trend({ value, unit = "%" }: { value: number; unit?: string }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-[10px] text-white/30"><FiMinus className="text-[9px]" /> بدون تغییر</span>;
  const positive = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
      {positive ? <FiTrendingUp className="text-[9px]" /> : <FiTrendingDown className="text-[9px]" />}
      {positive ? "+" : ""}{value}{unit}
    </span>
  );
}

// ─── Chart Section Wrapper ────────────────────────────────────────────────────
function ChartSection({ title, icon, badge, trend, children }: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  trend?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/50 to-slate-900/80 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/8 border border-white/10 text-white/60">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {badge && <span className="text-[10px] text-white/30">{badge}</span>}
          </div>
        </div>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      {children}
    </div>
  );
}

// ─── CHART COLORS ─────────────────────────────────────────────────────────────
const C = {
  total:    { stroke: "#f97316", fill: "#f97316" },
  barbers:  { stroke: "#60a5fa", fill: "#60a5fa" },
  barbies:  { stroke: "#f472b6", fill: "#f472b6" },
  customer: { stroke: "#34d399", fill: "#34d399" },
  ai:       { stroke: "#a78bfa", fill: "#a78bfa" },
};

const axisStyle = { fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "inherit" };

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function DashboardCharts() {
  const [period, setPeriod] = useState<Period>("monthly");
  const queryData = useQuery(api.dashboard.dashboard.getAnalyticsChartsData, { period });

  const data = useMemo(() => {
    return queryData || [];
  }, [queryData]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const tenantTrend = prev ? Math.round(((last.newTenants - prev.newTenants) / Math.max(1, prev.newTenants)) * 100) : 0;
  const customerTrend = prev ? Math.round(((last.newCustomers - prev.newCustomers) / Math.max(1, prev.newCustomers)) * 100) : 0;
  const aiTrend = prev ? Math.round(((last.aiUsage - prev.aiUsage) / Math.max(1, prev.aiUsage)) * 100) : 0;

  if (queryData === undefined) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/5 rounded-2xl border border-white/10" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-28 bg-white/5 rounded" />
              <div className="h-3 w-40 bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-8 w-44 bg-white/5 rounded-2xl border border-white/10" />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="h-[310px] rounded-3xl border border-white/8 bg-white/3" />
          <div className="h-[310px] rounded-3xl border border-white/8 bg-white/3" />
          <div className="h-[290px] rounded-3xl border border-white/8 bg-white/3" />
          <div className="h-[290px] rounded-3xl border border-white/8 bg-white/3" />
        </div>
        <div className="h-[290px] rounded-3xl border border-white/8 bg-white/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Section header with period tabs ──────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20">
            <FiActivity className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">نمودارهای تحلیلی</h2>
            <p className="text-xs text-white/30 mt-0.5">آمار واقعی رشد و مصرف پلتفرم</p>
          </div>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {/* ── Row 1: Tenant Growth ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Cumulative Tenants */}
        <ChartSection
          title="مجموع تجمعی شعب"
          icon={<FiScissors className="text-sm" />}
          badge="کل + Barbers + Barbies"
          trend={tenantTrend}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.total.fill} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.total.fill} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBarbers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.barbers.fill} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.barbers.fill} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBarbies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.barbies.fill} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.barbies.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Area type="monotone" dataKey="totalTenants" name="کل شعب" stroke={C.total.stroke} strokeWidth={2} fill="url(#gTotal)" dot={false} />
              <Area type="monotone" dataKey="totalBarbers" name="Barbers" stroke={C.barbers.stroke} strokeWidth={1.5} fill="url(#gBarbers)" dot={false} />
              <Area type="monotone" dataKey="totalBarbies" name="Barbies" stroke={C.barbies.stroke} strokeWidth={1.5} fill="url(#gBarbies)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* New Tenants per Period */}
        <ChartSection
          title="شعب جدید"
          icon={<FiTrendingUp className="text-sm" />}
          badge="افزوده‌شده در هر دوره"
          trend={tenantTrend}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="newBarbers" name="Barbers" fill={C.barbers.fill} fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="tenants" />
              <Bar dataKey="newBarbies" name="Barbies" fill={C.barbies.fill} fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="tenants" />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* ── Row 2: Customers ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Cumulative Customers */}
        <ChartSection
          title="مجموع تجمعی مشتریان"
          icon={<FiUsers className="text-sm" />}
          badge="کل + آقایان + بانوان"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Line type="monotone" dataKey="totalCustomers" name="کل مشتریان" stroke={C.customer.stroke} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="totalMenCustomers" name="آقایان" stroke={C.barbers.stroke} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="totalWomenCustomers" name="بانوان" stroke={C.barbies.stroke} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* New Customers per Period */}
        <ChartSection
          title="مشتریان جدید"
          icon={<FiUsers className="text-sm" />}
          badge="ثبت‌نام در هر دوره"
          trend={customerTrend}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="newMenCustomers" name="آقایان" fill={C.barbers.fill} fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="customers" />
              <Bar dataKey="newWomenCustomers" name="بانوان" fill={C.barbies.fill} fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="customers" />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* ── Row 3: AI Usage ──────────────────────────────────── */}
      <ChartSection
        title="مصرف هوش مصنوعی"
        icon={<FiCpu className="text-sm" />}
        badge="اعتبار مصرف‌شده در هر دوره"
        trend={aiTrend}
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "بیشینه در دوره", value: Math.max(...data.map((d: any) => d.aiUsage), 0).toLocaleString(), color: "text-violet-300" },
            { label: "میانگین", value: Math.round(data.reduce((a: number, d: any) => a + d.aiUsage, 0) / Math.max(1, data.length)).toLocaleString(), color: "text-white" },
            { label: "کمینه در دوره", value: Math.min(...data.map((d: any) => d.aiUsage), 0).toLocaleString(), color: "text-white/40" },
          ].map((m) => (
            <div key={m.label} className="flex flex-col gap-1 rounded-2xl bg-white/4 border border-white/5 px-3 py-2.5">
              <span className={`text-base font-black font-mono ${m.color}`}>{m.value}</span>
              <span className="text-[10px] text-white/30">{m.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gAI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.ai.fill} stopOpacity={0.35} />
                <stop offset="95%" stopColor={C.ai.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip valueFormatter={(v: number) => v.toLocaleString() + " اعتبار"} />} />
            <ReferenceLine
              y={data.reduce((a: number, d: any) => a + d.aiUsage, 0) / Math.max(1, data.length)}
              stroke="rgba(167,139,250,0.25)"
              strokeDasharray="4 4"
            />
            <Area type="monotone" dataKey="aiUsage" name="اعتبار مصرفی" stroke={C.ai.stroke} strokeWidth={2} fill="url(#gAI)" dot={false} activeDot={{ r: 4, fill: C.ai.fill }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartSection>
    </div>
  );
}
