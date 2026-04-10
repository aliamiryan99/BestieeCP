"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiScissors, FiUsers, FiCpu, FiActivity } from "react-icons/fi";

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = "hourly" | "daily" | "monthly" | "yearly";

// ─── Mock Data Generators ─────────────────────────────────────────────────────
function generateHourlyData() {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  let totalTenants = 42, totalBarbers = 28, totalBarbies = 14, totalCustomers = 380;
  return hours.map((h) => {
    const newBarbers = Math.max(0, Math.round(Math.sin(h / 3) * 1.5 + (h > 8 && h < 22 ? 1 : 0)));
    const newBarbies = Math.max(0, Math.round(Math.cos(h / 4) * 0.8 + (h > 9 && h < 20 ? 0.5 : 0)));
    const newTenants = newBarbers + newBarbies;
    const newCustomers = Math.max(0, Math.round((h > 10 && h < 23 ? 8 : 1) + Math.random() * 5));
    const aiUsage = Math.max(0, Math.round((h > 9 && h < 23 ? 120 : 20) + Math.random() * 80));
    totalTenants += newTenants;
    totalBarbers += newBarbers;
    totalBarbies += newBarbies;
    totalCustomers += newCustomers;
    return {
      label: `${String(h).padStart(2, "0")}:00`,
      newTenants, newBarbers, newBarbies, newCustomers, aiUsage,
      totalTenants, totalBarbers, totalBarbies, totalCustomers,
    };
  });
}

function generateDailyData() {
  const dayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  let totalTenants = 32, totalBarbers = 20, totalBarbies = 12, totalCustomers = 300;
  return Array.from({ length: 30 }, (_, i) => {
    const newBarbers = Math.max(0, Math.round(2 + Math.random() * 3));
    const newBarbies = Math.max(0, Math.round(1 + Math.random() * 2));
    const newTenants = newBarbers + newBarbies;
    const newCustomers = Math.max(0, Math.round(15 + Math.random() * 25));
    const aiUsage = Math.max(0, Math.round(800 + Math.random() * 600));
    totalTenants += newTenants;
    totalBarbers += newBarbers;
    totalBarbies += newBarbies;
    totalCustomers += newCustomers;
    return {
      label: dayNames[i % 7],
      day: i + 1,
      newTenants, newBarbers, newBarbies, newCustomers, aiUsage,
      totalTenants, totalBarbers, totalBarbies, totalCustomers,
    };
  });
}

function generateMonthlyData() {
  const months = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  let totalTenants = 8, totalBarbers = 5, totalBarbies = 3, totalCustomers = 80;
  return months.map((m) => {
    const newBarbers = Math.max(1, Math.round(4 + Math.random() * 8));
    const newBarbies = Math.max(1, Math.round(2 + Math.random() * 5));
    const newTenants = newBarbers + newBarbies;
    const newCustomers = Math.max(5, Math.round(30 + Math.random() * 80));
    const aiUsage = Math.max(100, Math.round(3000 + Math.random() * 8000));
    totalTenants += newTenants;
    totalBarbers += newBarbers;
    totalBarbies += newBarbies;
    totalCustomers += newCustomers;
    return {
      label: m,
      newTenants, newBarbers, newBarbies, newCustomers, aiUsage,
      totalTenants, totalBarbers, totalBarbies, totalCustomers,
    };
  });
}

function generateYearlyData() {
  let totalTenants = 0, totalBarbers = 0, totalBarbies = 0, totalCustomers = 0;
  return Array.from({ length: 5 }, (_, i) => {
    const year = 1399 + i;
    const newBarbers = Math.max(2, Math.round(5 + i * 8 + Math.random() * 10));
    const newBarbies = Math.max(1, Math.round(3 + i * 4 + Math.random() * 6));
    const newTenants = newBarbers + newBarbies;
    const newCustomers = Math.max(10, Math.round(50 + i * 70 + Math.random() * 80));
    const aiUsage = Math.max(100, Math.round(1000 + i * 15000 + Math.random() * 8000));
    totalTenants += newTenants;
    totalBarbers += newBarbers;
    totalBarbies += newBarbies;
    totalCustomers += newCustomers;
    return {
      label: String(year),
      newTenants, newBarbers, newBarbies, newCustomers, aiUsage,
      totalTenants, totalBarbers, totalBarbies, totalCustomers,
    };
  });
}

// ─── Custom dark tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl text-right" dir="rtl">
      <p className="text-[11px] font-bold text-white/50 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
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

  const data = useMemo(() => {
    switch (period) {
      case "hourly":  return generateHourlyData();
      case "daily":   return generateDailyData();
      case "yearly":  return generateYearlyData();
      default:        return generateMonthlyData();
    }
  }, [period]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const tenantTrend = prev ? Math.round(((last.newTenants - prev.newTenants) / Math.max(1, prev.newTenants)) * 100) : 0;
  const customerTrend = prev ? Math.round(((last.newCustomers - prev.newCustomers) / Math.max(1, prev.newCustomers)) * 100) : 0;
  const aiTrend = prev ? Math.round(((last.aiUsage - prev.aiUsage) / Math.max(1, prev.aiUsage)) * 100) : 0;

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
            <p className="text-xs text-white/30 mt-0.5">داده‌های نمایشی — به‌زودی با آمار واقعی</p>
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
          badge="کل + مردانه + زنانه"
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
              <Area type="monotone" dataKey="totalBarbers" name="مردانه" stroke={C.barbers.stroke} strokeWidth={1.5} fill="url(#gBarbers)" dot={false} />
              <Area type="monotone" dataKey="totalBarbies" name="زنانه" stroke={C.barbies.stroke} strokeWidth={1.5} fill="url(#gBarbies)" dot={false} />
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
              <Bar dataKey="newBarbers" name="مردانه" fill={C.barbers.fill} fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="tenants" />
              <Bar dataKey="newBarbies" name="زنانه" fill={C.barbies.fill} fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="tenants" />
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
          badge="کل مشتریان پلتفرم"
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gCustomer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.customer.fill} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.customer.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="totalCustomers" name="کل مشتریان" stroke={C.customer.stroke} strokeWidth={2.5} fill="url(#gCustomer)" dot={false} activeDot={{ r: 4, fill: C.customer.fill }} />
            </AreaChart>
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
            <LineChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={data.reduce((acc, d) => acc + d.newCustomers, 0) / data.length}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="4 4"
                label={{ value: "میانگین", fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
              />
              <Line type="monotone" dataKey="newCustomers" name="مشتریان جدید" stroke={C.customer.stroke} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* ── Row 3: AI Usage ──────────────────────────────────── */}
      <ChartSection
        title="مصرف هوش مصنوعی"
        icon={<FiCpu className="text-sm" />}
        badge="توکن‌های مصرف‌شده در هر دوره"
        trend={aiTrend}
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "بیشینه در دوره", value: Math.max(...data.map(d => d.aiUsage)).toLocaleString(), color: "text-violet-300" },
            { label: "میانگین", value: Math.round(data.reduce((a, d) => a + d.aiUsage, 0) / data.length).toLocaleString(), color: "text-white" },
            { label: "کمینه در دوره", value: Math.min(...data.map(d => d.aiUsage)).toLocaleString(), color: "text-white/40" },
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
            <Tooltip content={<CustomTooltip valueFormatter={(v: number) => v.toLocaleString() + " توکن"} />} />
            <ReferenceLine
              y={data.reduce((a, d) => a + d.aiUsage, 0) / data.length}
              stroke="rgba(167,139,250,0.25)"
              strokeDasharray="4 4"
            />
            <Area type="monotone" dataKey="aiUsage" name="توکن مصرفی" stroke={C.ai.stroke} strokeWidth={2} fill="url(#gAI)" dot={false} activeDot={{ r: 4, fill: C.ai.fill }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartSection>
    </div>
  );
}
