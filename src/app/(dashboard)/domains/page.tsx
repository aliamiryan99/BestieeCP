"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";
import { sanitizeError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGlobe,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiX,
  FiCheck,
  FiLoader,
  FiToggleRight,
  FiToggleLeft,
  FiAlertTriangle,
  FiSlash,
  FiExternalLink,
  FiType,
  FiFilter,
  FiShield,
  FiScissors,
} from "react-icons/fi";

// ─── Types ───────────────────────────────────────────────────────────────────
type AllowedFor = "barbers" | "barbies" | null;

type MainDomain = {
  _id: string;
  _creationTime: number;
  domain: string;
  isActive: boolean;
  description?: string;
  allowedFor?: AllowedFor;
};

// ─── Config ──────────────────────────────────────────────────────────────────
const ALLOWED_CONFIG = {
  barbers: { label: "مردانه", icon: <FiScissors />, bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20" },
  barbies: { label: "زنانه", icon: <FiScissors />, bg: "bg-pink-500/10", text: "text-pink-300", border: "border-pink-500/20" },
  null: { label: "عمومی (همه)", icon: <FiGlobe />, bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20" },
} as const;

function getAllowedConfig(val: AllowedFor | undefined) {
  if (val === "barbers") return ALLOWED_CONFIG.barbers;
  if (val === "barbies") return ALLOWED_CONFIG.barbies;
  return ALLOWED_CONFIG.null;
}

// ─── Domain Form Modal ────────────────────────────────────────────────────────
function DomainModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: MainDomain;
  onSave: (data: { domain?: string; description?: string; allowedFor: AllowedFor }) => Promise<void>;
  onClose: () => void;
}) {
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [allowedFor, setAllowedFor] = useState<AllowedFor>(initial?.allowedFor ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial;

  const handleSubmit = async () => {
    if (!isEdit && !domain.trim()) { setError("دامنه اجباری است"); return; }
    if (!isEdit && !/^[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(domain.trim().toLowerCase())) {
      setError("فرمت دامنه صحیح نیست (مثال: barbers.ir)");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({ domain: isEdit ? undefined : domain.trim().toLowerCase(), description: description.trim() || undefined, allowedFor });
      onClose();
    } catch (e: any) {
      setError(sanitizeError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
              <FiGlobe className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{isEdit ? "ویرایش دامنه" : "دامنه جدید"}</h3>
              <p className="text-[11px] text-white/40">دامنه‌های اصلی پلتفرم</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition">
            <FiX className="text-sm" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-6">
          {/* Domain */}
          {!isEdit ? (
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                <FiGlobe className="text-xs" />
                آدرس دامنه
                <span className="text-rose-400">*</span>
              </label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
                placeholder="barbers.ir"
                dir="ltr"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <FiGlobe className="text-white/30 text-sm" />
              <span className="font-mono text-sm text-white/60" dir="ltr">{initial?.domain}</span>
              <span className="mr-auto text-[10px] text-white/25">غیرقابل تغییر</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
              <FiType className="text-xs" />
              توضیحات
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
              placeholder="مثلاً: دامنه اختصاصی آرایشگاه‌های مردانه"
            />
          </div>

          {/* Allowed For */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
              <FiFilter className="text-xs" />
              مناسب برای
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([null, "barbers", "barbies"] as AllowedFor[]).map((t) => {
                const cfg = getAllowedConfig(t);
                const active = allowedFor === t;
                return (
                  <button
                    key={String(t)}
                    onClick={() => setAllowedFor(t)}
                    className={`cursor-pointer rounded-2xl border py-2.5 text-xs font-bold transition ${active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "border-white/10 bg-white/5 text-white/40 hover:bg-white/8"}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-white/25">
              {allowedFor === "barbers" && "فقط آرایشگاه‌های مردانه می‌توانند این دامنه را انتخاب کنند"}
              {allowedFor === "barbies" && "فقط سالن‌های زیبایی می‌توانند این دامنه را انتخاب کنند"}
              {allowedFor === null && "تمام انواع شعب می‌توانند این دامنه را انتخاب کنند"}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <FiAlertTriangle className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/5 p-6">
          <button onClick={onClose} disabled={saving} className="cursor-pointer flex-1 rounded-2xl border border-white/10 py-2.5 text-sm text-white/60 transition hover:bg-white/10">
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-600 py-2.5 text-sm font-bold text-white transition disabled:opacity-70"
          >
            {saving ? <FiLoader className="animate-spin" /> : <FiCheck />}
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ domain, onConfirm, onCancel, loading }: {
  domain: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto mb-4">
          <FiTrash2 className="text-2xl text-rose-400" />
        </div>
        <h3 className="text-lg font-black text-white mb-1">حذف دامنه</h3>
        <p className="text-sm text-white/50 mb-2">
          آیا از حذف <strong className="text-white font-mono">{domain}</strong> اطمینان دارید؟
        </p>
        <p className="text-xs text-amber-400/80 mb-6 flex items-center justify-center gap-1">
          <FiAlertTriangle className="shrink-0" />
          اگر شعبه‌ای از این دامنه استفاده کند، حذف امکان‌پذیر نیست.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="cursor-pointer flex-1 rounded-2xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/10 transition">
            انصراف
          </button>
          <button onClick={onConfirm} disabled={loading} className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-70">
            {loading ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
            حذف
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Domain Card ──────────────────────────────────────────────────────────────
function DomainCard({ domain, onEdit, onDelete, onToggle, toggling }: {
  domain: MainDomain;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const cfg = getAllowedConfig(domain.allowedFor ?? null);

  return (
    <div className={`flex flex-col gap-4 rounded-3xl border p-5 transition-all duration-200 ${
      domain.isActive
        ? "border-white/8 bg-white/4 hover:bg-white/7 hover:border-white/12"
        : "border-white/4 bg-white/2 opacity-60"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${domain.isActive ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-white/5 border border-white/10"}`}>
            <FiGlobe className={`text-lg ${domain.isActive ? "text-cyan-400" : "text-white/30"}`} />
          </div>
          <div>
            <p className="font-bold text-white font-mono text-sm" dir="ltr">{domain.domain}</p>
            {domain.description && (
              <p className="text-xs text-white/40 mt-0.5">{domain.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            domain.isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-white/5 text-white/30 border-white/10"
          }`}>
            {domain.isActive ? "فعال" : "غیرفعال"}
          </span>
        </div>
      </div>

      {/* Link preview */}
      <div className="flex items-center gap-2 rounded-xl bg-white/4 border border-white/5 px-3 py-2">
        <FiExternalLink className="text-white/25 text-xs shrink-0" />
        <span className="text-[11px] font-mono text-white/30" dir="ltr">
          example.{domain.domain}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`cursor-pointer flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition flex-1 disabled:opacity-50 ${
            domain.isActive
              ? "border-amber-500/30 text-amber-300 hover:bg-amber-900/20"
              : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/20"
          }`}
        >
          {toggling ? <FiLoader className="animate-spin text-[10px]" /> : (domain.isActive ? <FiToggleLeft className="text-[10px]" /> : <FiToggleRight className="text-[10px]" />)}
          {domain.isActive ? "غیرفعال کن" : "فعال کن"}
        </button>
        <button
          onClick={onEdit}
          className="cursor-pointer flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <FiEdit3 className="text-[10px]" />
          ویرایش
        </button>
        <button
          onClick={onDelete}
          className="cursor-pointer flex items-center justify-center gap-1.5 rounded-xl border border-rose-800/40 px-3 py-1.5 text-xs text-rose-400 transition hover:bg-rose-900/20"
        >
          <FiTrash2 className="text-[10px]" />
          حذف
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MainDomainsPage() {
  const router = useRouter();
  const me = useQuery(api.users.auth.me);
  const rawDomains = useQuery(api.tenants.tenants.listAllMainDomains);
  const addMutation = useMutation(api.tenants.tenants.addMainDomain);
  const updateMutation = useMutation(api.tenants.tenants.updateMainDomain);
  const toggleMutation = useMutation(api.tenants.tenants.toggleMainDomainStatus);
  const removeMutation = useMutation(api.tenants.tenants.removeMainDomain);
  const pushToast = useToastStore((s) => s.push);

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<MainDomain | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MainDomain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const domains = rawDomains as MainDomain[] | undefined;
  const loading = me === undefined || rawDomains === undefined;

  const stats = useMemo(() => {
    if (!domains) return null;
    return {
      total: domains.length,
      active: domains.filter(d => d.isActive).length,
      barbers: domains.filter(d => d.allowedFor === "barbers").length,
      barbies: domains.filter(d => d.allowedFor === "barbies").length,
      general: domains.filter(d => !d.allowedFor).length,
    };
  }, [domains]);

  const handleAdd = async (data: any) => {
    await addMutation(data);
    pushToast({ type: "success", title: "اضافه شد", message: `دامنه ${data.domain} ثبت شد` });
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await updateMutation({ domainId: editTarget._id as any, ...data });
    pushToast({ type: "success", title: "بروزرسانی شد", message: "دامنه ویرایش شد" });
  };

  const handleToggle = async (domain: MainDomain) => {
    setTogglingId(domain._id);
    try {
      await toggleMutation({ domainId: domain._id as any });
      pushToast({ type: "success", title: domain.isActive ? "غیرفعال شد" : "فعال شد", message: domain.domain });
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: sanitizeError(e) });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeMutation({ domainId: deleteTarget._id as any });
      pushToast({ type: "success", title: "حذف شد", message: `دامنه ${deleteTarget.domain} حذف شد` });
      setDeleteTarget(null);
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا در حذف", message: sanitizeError(e) });
    } finally {
      setDeleting(false);
    }
  };

  if (!loading && me?.role !== "creator") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی ندارید</p>
        <p className="text-sm text-white/40">این صفحه فقط برای خالق پلتفرم قابل دسترس است.</p>
        <button onClick={() => router.push("/")} className="cursor-pointer mt-2 rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5 transition">
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
              <FiGlobe className="text-xl text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">دامنه‌های اصلی</h1>
              <p className="text-sm text-white/40 mt-0.5">مدیریت دامنه‌هایی که شعب می‌توانند انتخاب کنند</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105 active:scale-95"
          >
            <FiPlus />
            دامنه جدید
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "کل دامنه‌ها", value: stats.total, color: "text-white" },
              { label: "فعال", value: stats.active, color: "text-emerald-400" },
              { label: "مردانه", value: stats.barbers, color: "text-blue-300" },
              { label: "زنانه", value: stats.barbies, color: "text-pink-300" },
              { label: "عمومی", value: stats.general, color: "text-cyan-300" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="flex items-start gap-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 p-4">
          <FiShield className="text-cyan-400 text-base mt-0.5 shrink-0" />
          <div className="text-xs text-cyan-200/70 leading-relaxed">
            <strong className="text-cyan-300">نحوه کارکرد:</strong> هنگام ایجاد شعبه جدید، دامنه‌های فعال بر اساس نوع انتخابی شعبه فیلتر می‌شوند.
            دامنه‌های «عمومی» برای همه نوع شعب قابل انتخاب هستند.
            دامنه‌های «مردانه» فقط برای آرایشگاه‌های مردانه و «زنانه» فقط برای سالن‌های زیبایی نمایش داده می‌شوند.
          </div>
        </div>
      </div>

      {/* ── Cards ─────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-white/5 bg-white/4 p-5 h-44" />
          ))}
        </div>
      )}

      {!loading && (!domains || domains.length === 0) && (
        <div className="flex flex-col items-center gap-4 py-20 rounded-3xl border border-white/5 bg-white/3 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            <FiGlobe className="text-2xl text-white/30" />
          </div>
          <p className="text-sm text-white/40">هنوز دامنه‌ای ثبت نشده است.</p>
          <button onClick={() => setShowAdd(true)} className="cursor-pointer flex items-center gap-2 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 px-5 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-600/30">
            <FiPlus />
            اولین دامنه را ثبت کنید
          </button>
        </div>
      )}

      {!loading && domains && domains.length > 0 && (
        <>
          {/* Grouped by type */}
          {(["general", "barbers", "barbies"] as const).map((groupKey) => {
            const groupDomains = domains.filter(d => {
              if (groupKey === "general") return !d.allowedFor || d.allowedFor === null;
              return d.allowedFor === groupKey;
            });
            if (groupDomains.length === 0) return null;

            const groupCfg = groupKey === "general" ? ALLOWED_CONFIG.null : ALLOWED_CONFIG[groupKey];

            return (
              <div key={groupKey}>
                <h2 className={`flex items-center gap-2 mb-3 text-sm font-bold ${groupCfg.text}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${groupCfg.bg} ${groupCfg.border} border`}>
                    {groupCfg.icon}
                  </span>
                  {groupCfg.label}
                  <span className="text-white/30 font-normal">({groupDomains.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupDomains.map((d) => (
                    <DomainCard
                      key={d._id}
                      domain={d}
                      onEdit={() => setEditTarget(d)}
                      onDelete={() => setDeleteTarget(d)}
                      onToggle={() => handleToggle(d)}
                      toggling={togglingId === d._id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <DomainModal onSave={handleAdd} onClose={() => setShowAdd(false)} />
        )}
        {editTarget && (
          <DomainModal initial={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
        )}
        {deleteTarget && (
          <DeleteModal
            domain={deleteTarget.domain}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
