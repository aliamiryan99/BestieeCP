"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";
import { sanitizeError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiScissors,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiX,
  FiCheck,
  FiLoader,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiSlash,
  FiClock,
  FiTag,
  FiType,
  FiAlertTriangle,
} from "react-icons/fi";

// ─── Types ───────────────────────────────────────────────────────────────────
type TenantType = "barbers" | "barbies" | null;

type PredefinedService = {
  _id: string;
  _creationTime: number;
  name: string;
  description?: string;
  duration: number;
  icon?: string;
  tenantType?: TenantType;
};

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  barbers: { label: "مردانه", bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20" },
  barbies: { label: "زنانه", bg: "bg-pink-500/10", text: "text-pink-300", border: "border-pink-500/20" },
  null: { label: "عمومی (همه)", bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20" },
} as const;

function getTypeConfig(type: TenantType) {
  if (type === "barbers") return TYPE_CONFIG.barbers;
  if (type === "barbies") return TYPE_CONFIG.barbies;
  return TYPE_CONFIG.null;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} دقیقه`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}

// ─── Service Form Modal ────────────────────────────────────────────────────────
function ServiceModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: PredefinedService;
  onSave: (data: { name: string; description?: string; duration: number; icon?: string; tenantType: TenantType }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? 30);
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [tenantType, setTenantType] = useState<TenantType>(initial?.tenantType ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("نام سرویس اجباری است"); return; }
    if (duration < 5) { setError("مدت زمان باید حداقل ۵ دقیقه باشد"); return; }
    setError("");
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, duration, icon: icon.trim() || undefined, tenantType });
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
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20">
              <FiScissors className="text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{initial ? "ویرایش سرویس" : "سرویس جدید"}</h3>
              <p className="text-[11px] text-white/40">خدمات از پیش تعریف‌شده پلتفرم</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition">
            <FiX className="text-sm" />
          </button>
        </div>

        {/* Form body */}
        <div className="flex flex-col gap-4 p-6">
          {/* Name */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
              <FiType className="text-xs" />
              نام سرویس
              <span className="text-rose-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-500/40 focus:bg-white/8"
              placeholder="مثلاً: کوتاهی مو"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
              <FiTag className="text-xs" />
              توضیحات (اختیاری)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-500/40 focus:bg-white/8"
              placeholder="توضیح کوتاهی از این سرویس..."
            />
          </div>

          {/* Duration + Icon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                <FiClock className="text-xs" />
                مدت زمان (دقیقه)
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white text-center outline-none transition focus:border-amber-500/40"
                dir="ltr"
              />
              <p className="mt-1 text-[10px] text-white/30 text-center">{formatDuration(duration)}</p>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                آیکون (Emoji)
              </label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white text-center outline-none transition focus:border-amber-500/40"
                placeholder="✂️"
              />
            </div>
          </div>

          {/* Tenant Type */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
              <FiFilter className="text-xs" />
              مناسب برای
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([null, "barbers", "barbies"] as (TenantType)[]).map((t) => {
                const cfg = getTypeConfig(t);
                const active = tenantType === t;
                return (
                  <button
                    key={String(t)}
                    onClick={() => setTenantType(t)}
                    className={`cursor-pointer rounded-2xl border py-2 text-xs font-bold transition ${active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : "border-white/10 bg-white/5 text-white/40 hover:bg-white/8"}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
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
            className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 py-2.5 text-sm font-bold text-black transition disabled:opacity-70"
          >
            {saving ? <FiLoader className="animate-spin" /> : <FiCheck />}
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel, loading }: {
  name: string;
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
        <h3 className="text-lg font-black text-white mb-1">حذف سرویس</h3>
        <p className="text-sm text-white/50 mb-6">
          آیا از حذف <strong className="text-white">«{name}»</strong> اطمینان دارید؟
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

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ service, onEdit, onDelete }: {
  service: PredefinedService;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeConfig = getTypeConfig(service.tenantType ?? null);

  return (
    <div className="group flex flex-col gap-3 rounded-3xl border border-white/5 bg-white/4 p-5 transition-all duration-200 hover:bg-white/7 hover:border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 border border-white/10 text-xl">
            {service.icon || "✂️"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">{service.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <FiClock className="text-white/25 text-[10px]" />
              <span className="text-[11px] text-white/40">{formatDuration(service.duration)}</span>
            </div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-xs text-white/40 leading-relaxed">{service.description}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
        <button
          onClick={onEdit}
          className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <FiEdit3 className="text-[10px]" />
          ویرایش
        </button>
        <button
          onClick={onDelete}
          className="cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-800/40 py-1.5 text-xs text-rose-400 transition hover:bg-rose-900/20"
        >
          <FiTrash2 className="text-[10px]" />
          حذف
        </button>
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border px-4 py-1.5 text-xs font-bold transition-all ${active
        ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PredefinedServicesPage() {
  const router = useRouter();
  const me = useQuery(api.users.auth.me);
  const rawServices = useQuery(api.services.predefined.list, {});
  const createMutation = useMutation(api.services.predefined.create);
  const updateMutation = useMutation(api.services.predefined.update);
  const removeMutation = useMutation(api.services.predefined.remove);
  const pushToast = useToastStore((s) => s.push);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "barbers" | "barbies" | "general">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<PredefinedService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PredefinedService | null>(null);
  const [deleting, setDeleting] = useState(false);

  const services = rawServices as PredefinedService[] | undefined;
  const loading = me === undefined || rawServices === undefined;

  const filtered = useMemo(() => {
    if (!services) return [];
    let list = [...services];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (typeFilter === "barbers") list = list.filter(s => s.tenantType === "barbers");
    else if (typeFilter === "barbies") list = list.filter(s => s.tenantType === "barbies");
    else if (typeFilter === "general") list = list.filter(s => s.tenantType === null || s.tenantType === undefined);
    return list;
  }, [services, search, typeFilter]);

  const stats = useMemo(() => {
    if (!services) return null;
    return {
      total: services.length,
      barbers: services.filter(s => s.tenantType === "barbers").length,
      barbies: services.filter(s => s.tenantType === "barbies").length,
      general: services.filter(s => !s.tenantType).length,
    };
  }, [services]);

  const handleCreate = async (data: any) => {
    await createMutation(data);
    pushToast({ type: "success", title: "ایجاد شد", message: `سرویس «${data.name}» اضافه شد` });
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await updateMutation({ targetId: editTarget._id as any, ...data });
    pushToast({ type: "success", title: "بروزرسانی شد", message: `سرویس «${data.name}» ویرایش شد` });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeMutation({ targetId: deleteTarget._id as any });
      pushToast({ type: "success", title: "حذف شد", message: `سرویس «${deleteTarget.name}» حذف شد` });
      setDeleteTarget(null);
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: sanitizeError(e) });
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20">
              <FiScissors className="text-xl text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">سرویس‌های پیش‌فرض</h1>
              <p className="text-sm text-white/40 mt-0.5">قالب‌های آماده برای آرایشگاه‌های مردانه و زنانه</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg transition hover:scale-105 active:scale-95"
          >
            <FiPlus />
            سرویس جدید
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "کل سرویس‌ها", value: stats.total, color: "text-white" },
              { label: "مردانه", value: stats.barbers, color: "text-blue-300" },
              { label: "زنانه", value: stats.barbies, color: "text-pink-300" },
              { label: "عمومی", value: stats.general, color: "text-emerald-300" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] text-white/30">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange-400/50"
              placeholder="جستجو نام یا توضیحات..."
            />
            {search && <button onClick={() => setSearch("")} className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition"><FiX className="text-sm" /></button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip label="همه" active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
            <FilterChip label="مردانه" active={typeFilter === "barbers"} onClick={() => setTypeFilter("barbers")} />
            <FilterChip label="زنانه" active={typeFilter === "barbies"} onClick={() => setTypeFilter("barbies")} />
            <FilterChip label="عمومی" active={typeFilter === "general"} onClick={() => setTypeFilter("general")} />
          </div>
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────── */}
      {!loading && (
        <p className="px-1 text-sm text-white/40">
          نمایش <span className="font-bold text-white">{filtered.length}</span> سرویس
          {services && filtered.length !== services.length && <span className="text-white/25"> از {services.length}</span>}
        </p>
      )}

      {/* ── Grid ─────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-white/5 bg-white/4 p-5 h-36" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 rounded-3xl border border-white/5 bg-white/3 text-center">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            <FiScissors className="text-2xl text-white/30" />
          </div>
          <p className="text-sm text-white/40">سرویسی یافت نشد.</p>
          {search && <button onClick={() => setSearch("")} className="cursor-pointer text-xs text-orange-400/70 hover:text-orange-300 transition">پاکسازی جستجو</button>}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <ServiceCard
              key={s._id}
              service={s}
              onEdit={() => setEditTarget(s)}
              onDelete={() => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <ServiceModal onSave={handleCreate} onClose={() => setShowAdd(false)} />
        )}
        {editTarget && (
          <ServiceModal initial={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} />
        )}
        {deleteTarget && (
          <DeleteModal
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
