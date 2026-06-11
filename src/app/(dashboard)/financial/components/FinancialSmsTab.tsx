"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import {
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import {
  FiSearch,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiMessageSquare,
  FiInfo,
  FiFileText,
  FiFilter,
  FiX
} from "react-icons/fi";

type Period = "hourly" | "daily" | "monthly" | "yearly";
type SmsType = "all" | "otp" | "booking_confirmation" | "booking_cancellation" | "booking_delay" | "system_notification";
type SmsStatus = "all" | "success" | "failed";

const PERIOD_LABELS: Record<Period, string> = {
  hourly: "ساعتی",
  daily: "روزانه",
  monthly: "ماهانه",
  yearly: "سالانه",
};

const TYPE_LABELS: Record<SmsType, string> = {
  all: "همه انواع",
  otp: "کد تایید (OTP)",
  booking_confirmation: "تایید نوبت",
  booking_cancellation: "لغو نوبت",
  booking_delay: "اعلام تاخیر",
  system_notification: "پیام سیستمی",
};

const TYPE_BG: Record<string, string> = {
  otp: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  booking_confirmation: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  booking_cancellation: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  booking_delay: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  system_notification: "bg-white/5 text-white/50 border-white/10",
};

const axisStyle = { fill: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "inherit" };

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl text-right" dir="rtl">
      <p className="text-[11px] font-bold text-white/50 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs flex-row-reverse mt-1">
          <span className="font-bold" style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-white font-black">{entry.value.toLocaleString()} عدد</span>
        </div>
      ))}
    </div>
  );
}

export default function FinancialSmsTab() {
  const [period, setPeriod] = useState<Period>("daily");
  const [chartMode, setChartMode] = useState<"status" | "type">("status");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SmsType>("all");
  const [statusFilter, setStatusFilter] = useState<SmsStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const statsQuery = useQuery(api.communications.sms.getSmsStats, { period });
  
  const pageSize = 10;
  const logsQuery = useQuery(api.communications.sms.listSmsLogs, {
    page: currentPage,
    pageSize,
    type: typeFilter,
    status: statusFilter,
    search: search.trim() ? search : undefined,
  });

  const chartData = useMemo(() => {
    return statsQuery || [];
  }, [statsQuery]);

  // Aggregate current stats from chart data
  const totalStats = useMemo(() => {
    if (!statsQuery) return { success: 0, failed: 0, total: 0 };
    let success = 0;
    let failed = 0;
    statsQuery.forEach((d: any) => {
      success += d.success || 0;
      failed += d.failed || 0;
    });
    return { success, failed, total: success + failed };
  }, [statsQuery]);

  const loading = statsQuery === undefined || logsQuery === undefined;

  const totalPages = logsQuery ? Math.ceil(logsQuery.totalCount / pageSize) : 1;
  const rangeStart = logsQuery && logsQuery.totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = logsQuery ? Math.min(currentPage * pageSize, logsQuery.totalCount) : 0;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex flex-col gap-2 relative overflow-hidden group">
          <span className="text-sm font-bold text-white/50">کل پیامک‌های ارسال شده ({PERIOD_LABELS[period]})</span>
          <span className="text-3xl font-black text-white">{totalStats.total.toLocaleString()}</span>
          <div className="absolute -bottom-6 -right-6 text-[90px] text-indigo-500/5 rotate-12 pointer-events-none group-hover:scale-110 transition"><FiMessageSquare /></div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex flex-col gap-2 relative overflow-hidden group">
          <span className="text-sm font-bold text-white/50">ارسال موفق</span>
          <span className="text-3xl font-black text-emerald-400">{totalStats.success.toLocaleString()}</span>
          <div className="absolute -bottom-6 -right-6 text-[90px] text-emerald-500/5 rotate-12 pointer-events-none"><FiCheckCircle /></div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-rose-500/10 to-pink-500/10 flex flex-col gap-2 relative overflow-hidden group">
          <span className="text-sm font-bold text-white/50">ارسال ناموفق</span>
          <span className="text-3xl font-black text-rose-400">{totalStats.failed.toLocaleString()}</span>
          <div className="absolute -bottom-6 -right-6 text-[90px] text-rose-500/5 rotate-12 pointer-events-none"><FiAlertTriangle /></div>
        </div>
      </div>

      {/* ── Chart Section ── */}
      <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/50 to-slate-900/80 p-6 shadow-xl flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/20 shadow-inner">
              <FiCpu className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">نمودار ترافیک پیامک</h3>
              <p className="text-xs text-white/30 mt-0.5">تفکیک حجم ارسال بر اساس بازه زمان انتخاب شده</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Chart Mode Selector */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setChartMode("status")}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  chartMode === "status"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                بر اساس وضعیت
              </button>
              <button
                onClick={() => setChartMode("type")}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  chartMode === "type"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                بر اساس نوع خدمت
              </button>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    period === p
                      ? "bg-gradient-to-r from-orange-500/25 to-amber-500/15 text-orange-300 shadow shadow-orange-500/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recharts Render */}
        <div className="h-[250px] w-full mt-2" dir="ltr">
          {loading ? (
            <div className="h-full w-full bg-white/3 animate-pulse rounded-2xl border border-white/5" />
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-white/40">
              داده‌ای در این بازه زمانی یافت نشد.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip mode={chartMode} />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
                
                {chartMode === "status" ? (
                  <>
                    <Bar dataKey="success" name="ارسال موفق" fill="#34d399" fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="sms" />
                    <Bar dataKey="failed" name="ارسال ناموفق" fill="#f87171" fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="sms" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="otp" name="کد تایید (OTP)" fill="#fbbf24" fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="sms" />
                    <Bar dataKey="booking" name="نوبت‌ها" fill="#60a5fa" fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="sms" />
                    <Bar dataKey="system" name="سیستمی" fill="#a78bfa" fillOpacity={0.8} radius={[4, 4, 0, 0]} stackId="sms" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Table & Filters Section ── */}
      <div className="glass-panel rounded-3xl border border-white/8 bg-slate-900/60 p-6 shadow-2xl flex flex-col gap-6">
        
        {/* Search & Filter Inputs */}
        <div className="flex gap-4 flex-wrap items-center justify-between">
          <div className="flex gap-3 flex-1 min-w-[300px] flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange-400/50 focus:bg-white/8"
                placeholder="جستجو شماره موبایل، پیامک، خطا..."
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition"
                >
                  <FiX className="text-sm" />
                </button>
              )}
            </div>

            {/* Type Filter Select */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as SmsType);
                  setCurrentPage(1);
                }}
                className="cursor-pointer rounded-2xl border border-white/10 bg-slate-800 text-xs text-white/70 py-2.5 px-4 outline-none transition hover:border-white/20 focus:border-orange-500/50"
              >
                {(Object.keys(TYPE_LABELS) as SmsType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Select */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as SmsStatus);
                  setCurrentPage(1);
                }}
                className="cursor-pointer rounded-2xl border border-white/10 bg-slate-800 text-xs text-white/70 py-2.5 px-4 outline-none transition hover:border-white/20 focus:border-orange-500/50"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="success">ارسال موفق</option>
                <option value="failed">ارسال ناموفق</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Trigger */}
          {(search || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={handleClearFilters}
              className="cursor-pointer text-xs text-orange-400/70 hover:text-orange-300 transition flex items-center gap-1"
            >
              پاکسازی فیلترها
            </button>
          )}
        </div>

        {/* Results Counter */}
        {logsQuery && (
          <p className="text-xs text-white/40 px-1">
            نمایش <span className="font-bold text-white/60">{rangeStart} تا {rangeEnd}</span> از <span className="font-bold text-white/60">{logsQuery.totalCount}</span> پیامک
          </p>
        )}

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/8 text-white/45 text-xs font-bold">
                <th className="p-4">زمان ارسال</th>
                <th className="p-4">شماره گیرنده</th>
                <th className="p-4">نوع پیامک</th>
                <th className="p-4 w-[40%]">متن پیام</th>
                <th className="p-4 text-center">وضعیت ارسال</th>
                <th className="p-4">جزئیات پیامک</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="p-4"><div className="h-4 w-4/5 bg-white/5 rounded" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 bg-white/5 rounded-full mx-auto" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                  </tr>
                ))
              ) : !logsQuery || logsQuery.logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/35">
                    هیچ پیامکی با فیلترهای مشخص‌شده یافت نشد.
                  </td>
                </tr>
              ) : (
                logsQuery.logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-white/2 transition duration-150">
                    <td className="p-4 text-xs font-mono text-white/50" dir="ltr">
                      {new Date(log.createdAt).toLocaleDateString("fa-IR")} - {new Date(log.createdAt).toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-mono text-white/70" dir="ltr">
                      {log.phone}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_BG[log.type] || TYPE_BG.system_notification}`}>
                        {TYPE_LABELS[log.type as SmsType] || log.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs leading-relaxed text-white/70 max-w-[250px] truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="p-4 text-center">
                      {log.status === "success" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                          <FiCheckCircle className="text-xs" />
                          موفق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400">
                          <FiAlertTriangle className="text-xs" />
                          ناموفق
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-white/40">
                      {log.status === "success" ? (
                        <span className="flex items-center gap-1">
                          <FiInfo className="text-indigo-400/50" />
                          شناسه: <span className="font-mono text-white/60">{log.packId || "-"}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400/80" title={log.error}>
                          <FiAlertTriangle />
                          خطا: <span className="truncate max-w-[120px] inline-block">{log.error || "خطای ارسال"}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination navigation bar */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-2 rounded-2xl border border-white/8 bg-white/3 p-3 shadow-lg">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FiChevronRight className="text-sm" />
              <span>قبلی</span>
            </button>

            <div className="flex items-center gap-1.5">
              {getPageNumbers().map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`dots-${idx}`} className="px-1 text-xs font-bold text-white/30">
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`cursor-pointer h-8 w-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? "border border-orange-500/40 bg-orange-500/15 text-orange-300 shadow shadow-orange-500/10"
                        : "border border-transparent bg-transparent text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>بعدی</span>
              <FiChevronLeft className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
