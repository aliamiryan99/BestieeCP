"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useConvex } from "convex/react";
import { api } from "@backend/api";
import dynamic from "next/dynamic";
import {
  FiSearch,
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiDownload,
  FiFilter,
  FiActivity,
  FiCreditCard,
  FiGrid,
  FiDollarSign,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from "recharts";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// Dynamically import the Persian Date Picker (SSR-safe)
const PersianDatePicker = dynamic(() => import("@/components/common/PersianDatePicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-4">
      <FiLoader className="animate-spin text-white/30" />
    </div>
  )
});

// Helper: Convert Date to Persian YYYY/MM/DD string in English digits
function getJalaliDateString(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      useGrouping: false
    });
    const parts = formatter.format(date).split("/");
    const toEng = (str: string) => {
      const pers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      return str
        .split("")
        .map((c) => {
          const idx = pers.indexOf(c);
          return idx !== -1 ? String(idx) : c;
        })
        .join("");
    };
    return toEng(parts.join("/"));
  } catch {
    return "";
  }
}

// Helper: Parse Persian YYYY/MM/DD to Gregorian timestamp
const getTimestampFromJalali = (jalaliStr: string, isEndOfDay = false) => {
  if (!jalaliStr) return undefined;
  try {
    const dateObj = new DateObject({
      date: jalaliStr,
      format: "YYYY/MM/DD",
      calendar: persian,
      locale: persian_fa
    });
    const date = dateObj.toDate();
    if (isEndOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date.getTime();
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

// Helper: Format large numbers to Persian style with commas
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fa-IR").format(price);
};

// Helper: Format timestamp to Persian Date String
const formatPersianDateTime = (timestamp: number) => {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
};

export default function FinancialReportsTab() {
  const convex = useConvex();

  // Date Filters (Default to last 30 days)
  const [startDateStr, setStartDateStr] = useState(() =>
    getJalaliDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );
  const [endDateStr, setEndDateStr] = useState(() => getJalaliDateString(new Date()));

  // Other filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "failed" | "pending">("all");
  const [gatewayFilter, setGatewayFilter] = useState<"all" | "zarinpal" | "jibit" | "zibal">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "tenant">("all");
  const [sandboxFilter, setSandboxFilter] = useState<"all" | "sandbox" | "production">("all");

  // Pagination & Period
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search
    }, 4000); // 400ms is standard, let's make it responsive
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Convert date strings to unix timestamps
  const startTimestamp = startDateStr ? getTimestampFromJalali(startDateStr, false) : undefined;
  const endTimestamp = endDateStr ? getTimestampFromJalali(endDateStr, true) : undefined;

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, gatewayFilter, typeFilter, sandboxFilter, startDateStr, endDateStr]);

  // Fetch reports data
  const reports = useQuery(api.dashboard.payments.getPaymentReports, {
    period,
    startDate: startTimestamp,
    endDate: endTimestamp
  });

  // Fetch paginated payments list
  const paymentsData = useQuery(api.dashboard.payments.listAllPayments, {
    status: statusFilter,
    gateway: gatewayFilter,
    type: typeFilter,
    sandbox: sandboxFilter,
    searchQuery: debouncedSearch || undefined,
    startDate: startTimestamp,
    endDate: endTimestamp,
    page,
    limit: 10
  });

  // CSV Export Handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch all matching items (up to 10k rows) for export
      const allFilteredData = await convex.query(api.dashboard.payments.listAllPayments, {
        status: statusFilter,
        gateway: gatewayFilter,
        type: typeFilter,
        sandbox: sandboxFilter,
        searchQuery: debouncedSearch || undefined,
        startDate: startTimestamp,
        endDate: endTimestamp,
        page: 1,
        limit: 10000
      });

      if (!allFilteredData || allFilteredData.data.length === 0) {
        alert("داده‌ای برای خروجی یافت نشد.");
        setIsExporting(false);
        return;
      }

      const headers = [
        "نام کاربر",
        "شماره تماس",
        "نوع تراکنش",
        "عنوان طرح",
        "سالن",
        "درگاه",
        "مبلغ (تومان)",
        "شناسه مرجع (RefId)",
        "کد مرجع درگاه (Authority)",
        "کارت بانکی",
        "وضعیت",
        "محیط تست",
        "تاریخ ایجاد"
      ];

      const rows = allFilteredData.data.map((p) => [
        p.userName,
        p.userPhone,
        p.type === "credit" ? "خرید اعتبار هوش مصنوعی" : "اشتراک سالن",
        p.planName,
        "tenantName" in p ? p.tenantName || "" : "",
        p.gateway === "zarinpal" ? "زرین‌پال" : p.gateway === "zibal" ? "زیبال" : "جیبیت",
        p.amount,
        p.refId || "",
        p.authority,
        p.cardPan || "",
        p.status === "verified" ? "موفق" : p.status === "failed" ? "ناموفق" : "در انتظار پرداخت",
        p.isSandbox ? "بله" : "خیر",
        new Date(p.createdAt).toLocaleDateString("fa-IR")
      ]);

      // UTF-8 BOM for Persian characters to open correctly in Excel
      let csvContent = "\uFEFF";
      csvContent += [
        headers.join(","),
        ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `گزارش_مالی_بستی_${new Date().toLocaleDateString("fa-IR")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("خطا در تهیه خروجی CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setGatewayFilter("all");
    setTypeFilter("all");
    setSandboxFilter("all");
    setStartDateStr(getJalaliDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    setEndDateStr(getJalaliDateString(new Date()));
    setPage(1);
  };

  const metrics = reports?.metrics;
  const breakdowns = reports?.breakdowns;
  const chartData = reports?.chartData || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── 1. Metrics Grid ── */}
      {reports === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/5 border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Card 1: Total Revenue */}
          <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-950/80 p-5 shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40">مجموع درآمد (تایید شده)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <FiDollarSign className="text-base" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{formatPrice(metrics?.totalRevenue || 0)}</span>
                <span className="text-xs font-bold text-white/50">تومان</span>
              </div>
              <p className="text-[10px] text-white/30 mt-1">از کل تراکنش‌های موفق</p>
            </div>
          </div>

          {/* Card 2: Successful Transactions */}
          <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-950/80 p-5 shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40">تعداد پرداخت‌های موفق</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <FiCheckCircle className="text-base" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-white">{formatPrice(metrics?.verifiedCount || 0)}</span>
              <span className="text-xs font-bold text-white/50 mr-1">تراکنش</span>
              <p className="text-[10px] text-white/30 mt-1">
                از مجموع {formatPrice(metrics?.totalTransactions || 0)} اقدام به پرداخت
              </p>
            </div>
          </div>

          {/* Card 3: Success Rate */}
          <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-950/80 p-5 shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40">نرخ موفقیت درگاه</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <FiTrendingUp className="text-base" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{metrics?.successRate || 0}٪</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${metrics?.successRate || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Type Split */}
          <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-950/80 p-5 shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-rose-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/40">اعتبار هوش مصنوعی / اشتراک</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                <FiActivity className="text-base" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs font-bold text-white/70">
                <span>اعتبار: {formatPrice(metrics?.creditRevenue || 0)} ت</span>
                <span>اشتراک: {formatPrice(metrics?.subscriptionRevenue || 0)} ت</span>
              </div>
              <div className="w-full bg-rose-500/20 h-1.5 rounded-full overflow-hidden mt-2 flex">
                <div 
                  className="bg-rose-400 h-full transition-all duration-500" 
                  style={{ 
                    width: `${metrics && metrics.totalRevenue > 0 ? (metrics.creditRevenue / metrics.totalRevenue) * 100 : 50}%` 
                  }}
                />
                <div 
                  className="bg-indigo-400 h-full transition-all duration-500" 
                  style={{ 
                    width: `${metrics && metrics.totalRevenue > 0 ? (metrics.subscriptionRevenue / metrics.totalRevenue) * 100 : 50}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Charts & Breakdowns Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue timeline Area chart */}
        <div className="glass-panel lg:col-span-2 rounded-3xl border border-white/8 bg-slate-900/40 p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white">نمودار جریان درآمدی</h3>
              <p className="text-xs text-white/40 mt-0.5">درآمد به تفکیک تراکنش‌های خرید اعتبار و اشتراک سالن‌ها</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 border border-white/8 p-1 self-start">
              {(["daily", "monthly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    period === p
                      ? "bg-amber-500 text-slate-950 shadow-md font-black"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {p === "daily" ? "روزانه" : p === "monthly" ? "ماهانه" : "سالانه"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {reports === undefined ? (
              <div className="flex h-full items-center justify-center">
                <FiLoader className="animate-spin text-2xl text-white/20" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-white/30">
                داده‌ای برای نمایش در این بازه زمانی وجود ندارد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="creditColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tenantColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontFamily: "inherit" }} 
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis 
                    tick={{ fill: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontFamily: "inherit" }} 
                    stroke="rgba(255,255,255,0.1)"
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}م` : `${val / 1000}هزار`}
                  />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      textAlign: "right",
                      fontFamily: "inherit",
                      direction: "rtl"
                    }}
                    formatter={(value: number, name: string) => {
                      const text = name === "creditRevenue" ? "خرید اعتبار هوش مصنوعی" : "اشتراک سالن‌ها";
                      return [`${formatPrice(value)} تومان`, text];
                    }}
                    labelFormatter={(label) => `بازه: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="creditRevenue"
                    stroke="#fb7185"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#creditColor)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="subscriptionRevenue"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#tenantColor)"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Share & breakdowns */}
        <div className="glass-panel rounded-3xl border border-white/8 bg-slate-900/40 p-6 flex flex-col justify-between gap-6 shadow-xl">
          <div className="pb-2 border-b border-white/5">
            <h3 className="text-lg font-bold text-white">تفکیک سهم درآمد</h3>
            <p className="text-xs text-white/40 mt-0.5">درآمد به تفکیک درگاه‌های بانکی و محیط‌های تست</p>
          </div>

          {reports === undefined ? (
            <div className="flex flex-1 items-center justify-center">
              <FiLoader className="animate-spin text-2xl text-white/20" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-around gap-6">
              {/* Gateways Split */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white">درگاه‌های پرداخت</span>
                  <span className="text-xs text-white/40">توزیع سهم مالی</span>
                </div>
                <div className="space-y-2">
                  {/* Zarinpal bar */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>زرین‌پال ({formatPrice(breakdowns?.gateway.zarinpal.count || 0)} تراکنش)</span>
                      <span className="font-mono">{formatPrice(breakdowns?.gateway.zarinpal.revenue || 0)} تومان</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${metrics && metrics.totalRevenue > 0 ? ((breakdowns?.gateway.zarinpal.revenue || 0) / metrics.totalRevenue) * 100 : 50}%` 
                        }}
                      />
                    </div>
                  </div>
                  {/* Jibit bar */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>جیبیت ({formatPrice(breakdowns?.gateway.jibit.count || 0)} تراکنش)</span>
                      <span className="font-mono">{formatPrice(breakdowns?.gateway.jibit.revenue || 0)} تومان</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${metrics && metrics.totalRevenue > 0 ? ((breakdowns?.gateway.jibit.revenue || 0) / metrics.totalRevenue) * 100 : 50}%` 
                        }}
                      />
                    </div>
                  </div>
                  {/* Zibal bar */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>زیبال ({formatPrice(breakdowns?.gateway.zibal?.count || 0)} تراکنش)</span>
                      <span className="font-mono">{formatPrice(breakdowns?.gateway.zibal?.revenue || 0)} تومان</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${metrics && metrics.totalRevenue > 0 ? ((breakdowns?.gateway.zibal?.revenue || 0) / metrics.totalRevenue) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sandbox vs Production Split */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white">محیط واقعی / شبیه‌ساز (Sandbox)</span>
                  <span className="text-xs text-white/40">تفکیک پرداخت‌های واقعی</span>
                </div>
                <div className="space-y-2">
                  {/* Production */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>پرداخت‌های واقعی ({formatPrice(metrics?.production.count || 0)} تراکنش)</span>
                      <span className="font-mono">{formatPrice(metrics?.production.revenue || 0)} تومان</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${metrics && metrics.totalRevenue > 0 ? ((metrics?.production.revenue || 0) / metrics.totalRevenue) * 100 : 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  {/* Sandbox */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>محیط تست (Sandbox) ({formatPrice(metrics?.sandbox.count || 0)} تراکنش)</span>
                      <span className="font-mono">{formatPrice(metrics?.sandbox.revenue || 0)} تومان</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${metrics && metrics.totalRevenue > 0 ? ((metrics?.sandbox.revenue || 0) / metrics.totalRevenue) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ── */}
      <div className="glass-panel rounded-3xl border border-white/8 bg-slate-900/20 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-sm font-bold text-white">
          <FiFilter />
          <span>فیلترهای پیشرفته و جستجو</span>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute right-4 top-3.5 text-white/30 text-lg" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام، تلفن، درگاه، شناسه مرجع..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 pr-11 pl-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20"
            />
          </div>

          {/* Gateway Select */}
          <div>
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value as "all" | "zarinpal" | "jibit" | "zibal")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">همه درگاه‌ها</option>
              <option value="zarinpal" className="bg-slate-900 text-white">زرین‌پال</option>
              <option value="jibit" className="bg-slate-900 text-white">جیبیت</option>
              <option value="zibal" className="bg-slate-900 text-white">زیبال</option>
            </select>
          </div>

          {/* Type Select */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "credit" | "tenant")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">همه نوع تراکنش</option>
              <option value="credit" className="bg-slate-900 text-white">خرید اعتبار هوش مصنوعی</option>
              <option value="tenant" className="bg-slate-900 text-white">اشتراک سالن‌ها</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "verified" | "failed" | "pending")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">همه وضعیت‌ها</option>
              <option value="verified" className="bg-slate-900 text-white">موفق</option>
              <option value="failed" className="bg-slate-900 text-white">ناموفق</option>
              <option value="pending" className="bg-slate-900 text-white">در انتظار پرداخت</option>
            </select>
          </div>

          {/* Sandbox Select */}
          <div>
            <select
              value={sandboxFilter}
              onChange={(e) => setSandboxFilter(e.target.value as "all" | "sandbox" | "production")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">همه محیط‌ها</option>
              <option value="production" className="bg-slate-900 text-white">واقعی (Production)</option>
              <option value="sandbox" className="bg-slate-900 text-white">تست (Sandbox)</option>
            </select>
          </div>
        </div>

        {/* Date Row */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
            {/* Start Date */}
            <div className="w-full sm:w-60">
              <PersianDatePicker
                label="از تاریخ"
                icon={<FiCalendar className="text-xs" />}
                value={startDateStr}
                onChange={setStartDateStr}
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
            {/* End Date */}
            <div className="w-full sm:w-60">
              <PersianDatePicker
                label="تا تاریخ"
                icon={<FiCalendar className="text-xs" />}
                value={endDateStr}
                onChange={setEndDateStr}
                placeholder="انتخاب تاریخ پایان"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3 text-xs font-bold text-white/70 hover:text-white transition cursor-pointer"
            >
              <FiRefreshCw />
              <span>بازنشانی فیلترها</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isExporting ? <FiLoader className="animate-spin" /> : <FiDownload />}
              <span>خروجی اکسل (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Payments Table ── */}
      <div className="glass-panel rounded-3xl border border-white/8 bg-slate-900/30 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02] text-white/50 text-xs font-bold">
                <th className="px-6 py-4">کاربر</th>
                <th className="px-6 py-4">نوع</th>
                <th className="px-6 py-4">عنوان بسته / طرح</th>
                <th className="px-6 py-4 text-center">درگاه</th>
                <th className="px-6 py-4">مبلغ (تومان)</th>
                <th className="px-6 py-4">شناسه‌ها (مرجع / درگاه)</th>
                <th className="px-6 py-4 text-center">وضعیت</th>
                <th className="px-6 py-4">تاریخ تراکنش</th>
                <th className="px-6 py-4 text-center">محیط</th>
              </tr>
            </thead>
            <tbody>
              {paymentsData === undefined ? (
                // Loading Skeleton Rows
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    <td className="px-6 py-4.5"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="px-6 py-4.5 text-center"><div className="h-4 w-12 bg-white/5 rounded mx-auto" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                    <td className="px-6 py-4.5 text-center"><div className="h-5 w-14 bg-white/5 rounded mx-auto" /></td>
                    <td className="px-6 py-4.5"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="px-6 py-4.5 text-center"><div className="h-4 w-10 bg-white/5 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : paymentsData.data.length === 0 ? (
                // Empty State Row
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-white/40">
                    هیچ تراکنشی منطبق با فیلترهای بالا یافت نشد.
                  </td>
                </tr>
              ) : (
                // Real Payments Rows
                paymentsData.data.map((p) => (
                  <tr 
                    key={p._id} 
                    className="border-b border-white/5 hover:bg-white/[0.01] transition-colors"
                  >
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white">{p.userName}</span>
                        <span className="text-[10px] text-white/40 font-mono">{p.userPhone}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      {p.type === "credit" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                          <FiCreditCard className="text-xs" />
                          شارژ اعتبار
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                          <FiGrid className="text-xs" />
                          اشتراک سالن
                        </span>
                      )}
                    </td>

                    {/* Plan Name */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-white/80 text-xs sm:text-sm">{p.planName}</span>
                        {"tenantName" in p && p.tenantName && (
                          <span className="text-[10px] text-white/30">سالن: {p.tenantName}</span>
                        )}
                      </div>
                    </td>

                    {/* Gateway */}
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold border px-2 py-1 rounded-lg ${
                        p.gateway === "zarinpal" 
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                          : p.gateway === "zibal"
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                      }`}>
                        {p.gateway === "zarinpal" ? "زرین‌پال" : p.gateway === "zibal" ? "زیبال" : "جیبیت"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-white text-sm">{formatPrice(p.amount)}</span>
                      <span className="text-[10px] text-white/40 mr-1">تومان</span>
                    </td>

                    {/* IDs */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-[10px] font-mono text-white/60">
                        {p.refId && <span>مرجع: {p.refId}</span>}
                        {p.authority ? (
                          <span>درگاه: {p.authority.substring(0, 16)}...</span>
                        ) : (
                          <span className="text-white/20">فاقد شناسه درگاه</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {p.status === "verified" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          موفق
                        </span>
                      ) : p.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/20 px-2.5 py-1 rounded-full">
                          <FiXCircle />
                          ناموفق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 rounded-full">
                          <FiHelpCircle />
                          در انتظار
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs font-medium text-white/70">
                      {formatPersianDateTime(p.createdAt)}
                    </td>

                    {/* Sandbox */}
                    <td className="px-6 py-4 text-center">
                      {p.isSandbox ? (
                        <span className="text-[9px] font-extrabold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                          تست
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          واقعی
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. Table Pagination Footer ── */}
        {paymentsData && paymentsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white/[0.01] border-t border-white/5">
            <span className="text-xs text-white/40">
              تراکنش‌های {formatPrice((page - 1) * 10 + 1)} تا{" "}
              {formatPrice(Math.min(page * 10, paymentsData.pagination.totalItems))} از{" "}
              {formatPrice(paymentsData.pagination.totalItems)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.min(p + 1, paymentsData.pagination.totalPages))}
                disabled={page === paymentsData.pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <FiChevronRight className="text-base" />
              </button>
              
              <div className="flex items-center gap-1.5">
                {[...Array(paymentsData.pagination.totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  // Show pages relative to current, standard sliding window pagination
                  if (
                    pNum === 1 || 
                    pNum === paymentsData.pagination.totalPages || 
                    Math.abs(pNum - page) <= 1
                  ) {
                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`h-8 w-8 text-xs font-bold rounded-lg transition cursor-pointer ${
                          page === pNum
                            ? "bg-amber-500 text-slate-950 font-black shadow-md"
                            : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {formatPrice(pNum)}
                      </button>
                    );
                  }
                  if (Math.abs(pNum - page) === 2) {
                    return <span key={pNum} className="text-white/30 text-xs px-0.5">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <FiChevronLeft className="text-base" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
