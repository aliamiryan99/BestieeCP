"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiSearch,
  FiX,
  FiPlus,
  FiScissors,
  FiLink,
  FiMapPin,
  FiPhone,
  FiClock,
  FiTrash2,
  FiEdit2,
  FiFilter,
  FiChevronDown,
  FiActivity,
  FiSlash,
  FiShield,
  FiLoader,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
type TenantType = "barbers" | "barbies";

type EnrichedTenant = {
  _id: string;
  _creationTime: number;
  name: string;
  type: TenantType;
  subdomain: string;
  mainDomain: string;
  active: boolean;
  planId: string;
  createdBy: string;
  domains: { hostname: string }[];
  siteTitle?: string | null;
  sitePhone?: string | null;
  siteAddress?: string | null;
  siteLocation?: { latitude: number | null; longitude: number | null } | null;
  certificateImageUrl?: string | null;
  planName: string;
  planKey: string;
  creatorName: string;
  ownerCount: number;
  staffCount: number;
  customerCount: number;
  hasBoughtPaidPlan?: boolean;
  subscriptionEndDate?: number;
  activityDeadlineAt?: number;
  daysUntilInactive?: number;
};

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  barbers: { label: "آرایشگاه مردانه", icon: <FiScissors />, gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20" },
  barbies: { label: "آرایشگاه زنانه", icon: <FiScissors />, gradient: "from-pink-400 to-rose-500", bg: "bg-pink-500/10", text: "text-pink-300", border: "border-pink-500/20" },
} as const;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  pro: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  ultra: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ tenant, onConfirm, onCancel, loading }: {
  tenant: EnrichedTenant;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <FiTrash2 className="text-2xl text-rose-400" />
          </div>
          <h3 className="text-lg font-black text-white">حذف شعبه</h3>
          <p className="text-sm text-white/50">
            آیا از حذف شعبه <strong className="text-white">{tenant.name}</strong> اطمینان دارید؟
            <br />
            <span className="text-rose-300 text-xs">این عمل قابل بازگشت نیست.</span>
          </p>
          <div className="flex gap-3 w-full pt-2">
            <button onClick={onCancel} disabled={loading} className="cursor-pointer flex-1 rounded-2xl border border-white/10 py-2.5 text-sm text-white/70 transition hover:bg-white/10">
              انصراف
            </button>
            <button onClick={onConfirm} disabled={loading} className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-70">
              {loading ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
              {loading ? "در حال حذف..." : "حذف کن"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tenant Card ──────────────────────────────────────────────────────────────
function TenantCard({
  tenant,
  onDelete,
  onExtend,
  canDelete,
  canExtend,
  extending,
}: {
  tenant: EnrichedTenant;
  onDelete: (t: EnrichedTenant) => void;
  onExtend: (t: EnrichedTenant) => void;
  canDelete: boolean;
  canExtend: boolean;
  extending: boolean;
}) {
  const typeConfig = TYPE_CONFIG[tenant.type] || TYPE_CONFIG.barbers;
  const planColor = PLAN_COLORS[tenant.planKey] || PLAN_COLORS.free;
  const hostname = tenant.domains?.[0]?.hostname ?? "—";
  const router = useRouter();
  const remainingDays = tenant.daysUntilInactive ?? 0;
  const remainingBadgeTone = remainingDays <= 1
    ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
    : remainingDays <= 3
      ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300";
  const remainingLabel = tenant.active
    ? remainingDays === 0
      ? "امروز آخرین مهلت"
      : `${remainingDays} روز تا راکد`
    : "راکد شده";

  return (
    <div className="group flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/4 p-5 transition-all duration-300 hover:bg-white/7 hover:border-white/10 hover:shadow-xl">
      {/* Top row: title + type + plan */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${typeConfig.gradient} text-white shadow-lg`}>
            {typeConfig.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{tenant.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <FiLink className="text-white/20 text-[10px] shrink-0" />
              <a
                href={`https://${hostname}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-[11px] font-mono text-white/40 hover:text-orange-300 transition truncate"
                dir="ltr"
              >
                {hostname}
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
            {typeConfig.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${planColor}`}>
            {tenant.planName}
          </span>
        </div>
      </div>

      {/* Status + creator */}
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        {tenant.active ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">
            <FiActivity className="text-[9px]" />
            فعال (در حال کار)
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 font-bold text-rose-400">
            <FiSlash className="text-[9px]" />
            راکد
          </span>
        )}
        {tenant.hasBoughtPaidPlan ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">
            <FiCheckCircle className="text-[9px]" />
            خرید کرده
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 font-bold text-slate-400">
            <FiXCircle className="text-[9px]" />
            بدون خرید
          </span>
        )}
        {tenant.subscriptionEndDate && (
          <span className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-bold text-blue-300">
            <FiCalendar className="text-[9px]" />
            انقضا: {new Date(tenant.subscriptionEndDate).toLocaleDateString("fa-IR")}
          </span>
        )}
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${remainingBadgeTone}`}>
          <FiClock className="text-[9px]" />
          {remainingLabel}
        </span>
        <span className="text-white/25">·</span>
        <span className="text-white/40 flex items-center gap-1">
          <FiShield className="text-[9px]" />
          {tenant.creatorName}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 px-2 py-2">
          <span className="text-sm font-black text-emerald-400">{tenant.ownerCount}</span>
          <span className="text-[9px] text-white/30">مدیر</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 px-2 py-2">
          <span className="text-sm font-black text-cyan-400">{tenant.staffCount}</span>
          <span className="text-[9px] text-white/30">پرسنل</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 px-2 py-2">
          <span className="text-sm font-black text-rose-400">{tenant.customerCount}</span>
          <span className="text-[9px] text-white/30">مشتری</span>
        </div>
      </div>

      {/* Contact info */}
      {(tenant.sitePhone || tenant.siteAddress) && (
        <div className="flex flex-col gap-1">
          {tenant.sitePhone && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
              <FiPhone className="text-white/25 shrink-0 text-[10px]" />
              <span dir="ltr">{tenant.sitePhone}</span>
            </div>
          )}
          {tenant.siteAddress && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
              <FiMapPin className="text-white/25 shrink-0 text-[10px]" />
              <span className="truncate">{tenant.siteAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Divider + Actions */}
      <div className="border-t border-white/5" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/20 flex items-center gap-1">
          <FiClock className="text-[9px]" />
          {new Date(tenant._creationTime).toLocaleDateString("fa-IR")}
        </span>
        <div className="mr-auto flex items-center gap-2">
          {canExtend && (
            <button
              onClick={() => onExtend(tenant)}
              disabled={extending}
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-emerald-800/40 bg-emerald-900/10 px-2.5 py-1 text-[11px] text-emerald-300 transition hover:bg-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {extending ? <FiLoader className="animate-spin text-[10px]" /> : <FiRefreshCw className="text-[10px]" />}
              {extending ? "در حال تمدید..." : "تمدید ۷ روز"}
            </button>
          )}
          <button
            onClick={() => router.push(`/tenants/${tenant._id}/edit`)}
            className="cursor-pointer flex items-center gap-1 rounded-xl border border-indigo-800/40 bg-indigo-900/10 px-2.5 py-1 text-[11px] text-indigo-300 transition hover:bg-indigo-900/30"
          >
            <FiEdit2 className="text-[10px]" />
            ویرایش
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(tenant)}
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-rose-800/40 px-2.5 py-1 text-[11px] text-rose-400 transition hover:bg-rose-900/20"
            >
              <FiTrash2 className="text-[10px]" />
              حذف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border px-4 py-1.5 text-xs font-bold transition-all duration-200 ${active
        ? "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow shadow-orange-500/10"
        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/5 bg-white/4 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded bg-white/10" />
            <div className="h-2.5 w-36 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-5 w-20 rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = useQuery(api.users.auth.me);
  const rawTenants = useQuery(api.tenants.tenants.listAll);
  const removeTenant = useMutation(api.tenants.tenants.remove);
  const extendActivityWindow = useMutation(api.tenants.tenants.extendActivityWindow);
  const pushToast = useToastStore((state) => state.push);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TenantType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro" | "ultra">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sinceFilter, setSinceFilter] = useState<number | null>(() => {
    const s = searchParams.get("since");
    return s ? Number(s) : null;
  });
  const [deleteTarget, setDeleteTarget] = useState<EnrichedTenant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [extendingTenantId, setExtendingTenantId] = useState<string | null>(null);

  const tenants = rawTenants as EnrichedTenant[] | undefined;
  const loading = me === undefined || rawTenants === undefined;
  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  // Filtering
  const filtered = useMemo(() => {
    if (!tenants) return [];
    let list = [...tenants];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.domains?.some(d => d.hostname.toLowerCase().includes(q)) ||
        t.siteTitle?.toLowerCase().includes(q) ||
        t.creatorName?.toLowerCase().includes(q) ||
        t.siteAddress?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter(t => t.type === typeFilter);
    if (statusFilter === "active") list = list.filter(t => t.active);
    if (statusFilter === "inactive") list = list.filter(t => !t.active);
    if (planFilter !== "all") list = list.filter(t => t.planKey === planFilter);
    if (sinceFilter) list = list.filter(t => t._creationTime > sinceFilter);

    return list;
  }, [tenants, search, typeFilter, statusFilter, planFilter, sinceFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!tenants) return null;
    return {
      total: tenants.length,
      active: tenants.filter(t => t.active).length,
      barbers: tenants.filter(t => t.type === "barbers").length,
      barbies: tenants.filter(t => t.type === "barbies").length,
      free: tenants.filter(t => t.planKey === "free").length,
      pro: tenants.filter(t => t.planKey === "pro").length,
      ultra: tenants.filter(t => t.planKey === "ultra").length,
      totalCustomers: tenants.reduce((acc, t) => acc + t.customerCount, 0),
    };
  }, [tenants]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeTenant({ tenantId: deleteTarget._id });
      pushToast({ type: "success", title: "حذف شد", message: `شعبه ${deleteTarget.name} حذف شد` });
      setDeleteTarget(null);
    } catch (e: unknown) {
      pushToast({ type: "error", title: "خطا در حذف", message: getErrorMessage(e, "امکان حذف شعبه وجود ندارد") });
    } finally {
      setDeleting(false);
    }
  };

  const handleExtend = async (tenant: EnrichedTenant) => {
    setExtendingTenantId(tenant._id);
    try {
      const result = await extendActivityWindow({ tenantId: tenant._id });
      pushToast({
        type: "success",
        title: "مهلت تمدید شد",
        message: `برای ${tenant.name} ${result.daysUntilInactive} روز مهلت باقی ماند.`,
      });
    } catch (e: unknown) {
      pushToast({ type: "error", title: "خطا در تمدید", message: getErrorMessage(e, "امکان تمدید مهلت وجود ندارد") });
    } finally {
      setExtendingTenantId(null);
    }
  };

  if (!loading && me?.role !== "creator" && me?.role !== "promoter") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی ندارید</p>
        <p className="text-sm text-white/40">مدیریت شعب فقط برای نقش خالق یا پیامبر قابل دسترس است.</p>
        <button onClick={() => router.push("/")} className="cursor-pointer mt-4 rounded-2xl border border-white/10 px-6 py-2.5 text-sm text-white/60 hover:bg-white/5 transition">
          بازگشت به داشبورد
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20">
              <FiScissors className="text-xl text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">مدیریت شعب</h1>
              <p className="text-sm text-white/40 mt-0.5">ایجاد، نظارت و مدیریت شعبات پلتفرم</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/tenants/new")}
            className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/40 hover:scale-105 active:scale-95"
          >
            <FiPlus />
            شعبه جدید
          </button>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "کل شعب", value: stats.total, color: "text-white" },
              { label: "فعال", value: stats.active, color: "text-emerald-400" },
              { label: "مردانه", value: stats.barbers, color: "text-blue-300" },
              { label: "زنانه", value: stats.barbies, color: "text-pink-300" },
              { label: "رایگان", value: stats.free, color: "text-emerald-300" },
              { label: "حرفه‌ای", value: stats.pro, color: "text-indigo-300" },
              { label: "اولترا", value: stats.ultra, color: "text-amber-300" },
              { label: "مشتریان", value: stats.totalCustomers, color: "text-rose-300" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 rounded-2xl bg-white/5 border border-white/5 px-3 py-2.5">
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                <span className="text-[9px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + filter toggle */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange-400/50 focus:bg-white/8"
              placeholder="جستجو نام شعبه، دامنه، آدرس..."
            />
            {search && (
              <button onClick={() => setSearch("")} className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition">
                <FiX className="text-sm" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`cursor-pointer flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${showFilters ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
          >
            <FiFilter className="text-base" />
            فیلتر
            <FiChevronDown className={`text-xs transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filter rows */}
        {showFilters && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/3 p-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">نوع</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="همه" active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
                <FilterChip label="مردانه" active={typeFilter === "barbers"} onClick={() => setTypeFilter("barbers")} />
                <FilterChip label="زنانه" active={typeFilter === "barbies"} onClick={() => setTypeFilter("barbies")} />
              </div>
            </div>
            <div className="border-t border-white/5" />
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">وضعیت</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="همه" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <FilterChip label="فعال" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
                <FilterChip label="غیرفعال" active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")} />
              </div>
            </div>
            <div className="border-t border-white/5" />
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">پلان</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="همه" active={planFilter === "all"} onClick={() => setPlanFilter("all")} />
                <FilterChip label="رایگان" active={planFilter === "free"} onClick={() => setPlanFilter("free")} />
                <FilterChip label="حرفه‌ای" active={planFilter === "pro"} onClick={() => setPlanFilter("pro")} />
                <FilterChip label="اولترا" active={planFilter === "ultra"} onClick={() => setPlanFilter("ultra")} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tenant Grid ───────────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-white/40">
            نمایش <span className="font-bold text-white">{filtered.length}</span> شعبه
            {tenants && filtered.length !== tenants.length && (
              <span className="text-white/25"> از {tenants.length}</span>
            )}
            {sinceFilter && (
              <span className="mr-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-400 font-bold">
                موارد جدید
              </span>
            )}
          </p>
          {(search || typeFilter !== "all" || statusFilter !== "all" || planFilter !== "all" || sinceFilter) && (
            <button
              onClick={() => { 
                setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setPlanFilter("all"); setSinceFilter(null);
                if (searchParams.toString()) router.replace("/tenants");
              }}
              className="cursor-pointer text-xs text-orange-400/70 hover:text-orange-300 transition"
            >
              پاکسازی فیلترها
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center rounded-3xl border border-white/5 bg-white/3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            <FiScissors className="text-2xl text-white/30" />
          </div>
          <p className="text-white/40 text-sm">شعبه‌ای با این مشخصات یافت نشد.</p>
          <button 
            onClick={() => { 
              setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setPlanFilter("all"); setSinceFilter(null);
              if (searchParams.toString()) router.replace("/tenants");
            }} 
            className="cursor-pointer text-xs text-orange-400/60 hover:text-orange-300 transition"
          >
            پاکسازی فیلترها
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tenant) => (
            <TenantCard 
              key={tenant._id} 
              tenant={tenant} 
              onDelete={setDeleteTarget} 
              onExtend={handleExtend}
              canDelete={me?.role === "creator"}
              canExtend={me?.role === "creator" || me?.role === "promoter"}
              extending={extendingTenantId === tenant._id}
            />
          ))}
        </div>
      )}

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            tenant={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
