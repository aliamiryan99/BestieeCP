"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiEdit3,
  FiPlus,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
  FiShield,
  FiStar,
  FiPhone,
  FiMail,
  FiMapPin,
  FiToggleLeft,
  FiToggleRight,
  FiAlertTriangle,
  FiLoader,
  FiAward,
  FiCreditCard,
  FiZap,
  FiLock,
  FiUnlock,
  FiClock,
} from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";
import { translateRole } from "@/lib/translations";

// ─── Types ───────────────────────────────────────────────────────────────────
type StaffUser = {
  _id: string;
  _creationTime: number;
  name: string;
  phone: string;
  email?: string;
  role: "creator" | "promoter";
  active: boolean;
  ban: boolean;
  privilege: boolean;
  reputation: number;
  credit: number;
  score?: number;
  city: string;
  gender: "male" | "female";
  profilePictureUrl?: string;
  job?: string;
  address?: string;
};

// ─── Role Config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  creator: {
    label: "خالق",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-300",
    icon: <FiShield />,
    glow: "shadow-amber-500/20",
  },
  promoter: {
    label: "پروموتر",
    gradient: "from-indigo-400 to-violet-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-300",
    icon: <FiStar />,
    glow: "shadow-indigo-500/20",
  },
} as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function MemberCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/5 bg-white/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
      </div>
      <div className="mt-6 flex gap-2">
        <div className="h-8 w-20 rounded-xl bg-white/10" />
        <div className="h-8 w-20 rounded-xl bg-white/10" />
        <div className="h-8 w-16 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

// ─── Stat Badge ──────────────────────────────────────────────────────────────
function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 border border-white/5">
      <span className={`text-sm ${color}`}>{icon}</span>
      <div>
        <p className="text-[10px] text-white/40 leading-none mb-0.5">{label}</p>
        <p className={`text-xs font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Member Card ─────────────────────────────────────────────────────────────
function MemberCard({
  user,
  isCurrentUser,
  onEdit,
  onToggleActive,
  onToggleBan,
  onDelete,
  actionLoading,
  deletingId,
}: {
  user: StaffUser;
  isCurrentUser: boolean;
  onEdit: (user: StaffUser) => void;
  onToggleActive: (user: StaffUser) => void;
  onToggleBan: (user: StaffUser) => void;
  onDelete: (user: StaffUser) => void;
  actionLoading: string | null;
  deletingId: string | null;
}) {
  const role = ROLE_CONFIG[user.role];
  const isActing = actionLoading === user._id;
  const isDeleting = deletingId === user._id;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-3xl border bg-white/5 p-6 transition-all duration-300 hover:bg-white/8 hover:shadow-2xl ${role.border} ${role.glow} hover:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative h-12 w-12 shrink-0">
            <div
              className={`flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${role.gradient} text-black font-bold text-sm shadow-lg`}
            >
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {isCurrentUser && (
              <span className="absolute -top-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[7px] text-white font-bold ring-2 ring-slate-900">
                شما
              </span>
            )}
          </div>

          {/* Name & ID */}
          <div>
            <p className="font-semibold text-white leading-tight">
              {user.name}
            </p>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">
              #{user._id.slice(-8)}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${role.bg} ${role.text} border ${role.border}`}
        >
          {role.icon}
          {role.label}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <FiPhone className="text-white/30 shrink-0" />
          <span dir="ltr">{user.phone}</span>
        </div>
        {user.email && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <FiMail className="text-white/30 shrink-0" />
            <span dir="ltr">{user.email}</span>
          </div>
        )}
        {user.city && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <FiMapPin className="text-white/30 shrink-0" />
            <span>{user.city}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <FiClock className="text-white/20 shrink-0" />
          <span>
            {new Date(user._creationTime).toLocaleDateString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <StatBadge
          icon={<FiCreditCard />}
          label="اعتبار"
          value={user.credit.toLocaleString()}
          color="text-emerald-400"
        />
        {user.role === "promoter" && (
          <StatBadge
            icon={<FiAward />}
            label="امتیاز"
            value={user.score ?? 0}
            color="text-indigo-400"
          />
        )}
        <StatBadge
          icon={<FiZap />}
          label="اعتبار"
          value={`${user.reputation ?? 0} ★`}
          color="text-amber-400"
        />
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${user.active
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
            }`}
        >
          {user.active ? (
            <FiToggleRight className="text-sm" />
          ) : (
            <FiToggleLeft className="text-sm" />
          )}
          {user.active ? "فعال" : "غیرفعال"}
        </span>

        {user.ban && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-900/30 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-300">
            <FiAlertTriangle className="text-sm" />
            مسدود
          </span>
        )}

        {user.privilege && (
          <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
            <FiShield className="text-sm" />
            امتیازی
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onEdit(user)}
          className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <FiEdit3 className="text-orange-300" />
          ویرایش
        </button>

        <button
          onClick={() => onToggleActive(user)}
          disabled={isActing}
          className={`cursor-pointer flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition disabled:opacity-50 ${user.active
              ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
              : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            }`}
        >
          {isActing ? (
            <FiLoader className="animate-spin" />
          ) : user.active ? (
            <FiToggleLeft />
          ) : (
            <FiToggleRight />
          )}
          {user.active ? "غیرفعال کن" : "فعال کن"}
        </button>

        <button
          onClick={() => onToggleBan(user)}
          disabled={isActing}
          className={`cursor-pointer flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition disabled:opacity-50 ${user.ban
              ? "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              : "border-red-500/30 text-red-300 hover:bg-red-500/10"
            }`}
        >
          {user.ban ? <FiUnlock /> : <FiLock />}
          {user.ban ? "رفع مسدودی" : "مسدود کن"}
        </button>

        {!isCurrentUser && (
          <button
            onClick={() => onDelete(user)}
            disabled={isDeleting}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-rose-800/40 px-3 py-1.5 text-xs text-rose-400 transition hover:bg-rose-900/20 disabled:opacity-50 mr-auto"
          >
            <FiTrash2 />
            {isDeleting ? "حذف..." : "حذف"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createUser = useMutation(api.users.users.create);
  const pushToast = useToastStore((state) => state.push);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "promoter" as "creator" | "promoter",
    gender: "male" as "male" | "female",
    city: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "promoter",
        gender: "male",
        city: "",
      });
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("نام الزامی است");
      return;
    }
    if (!form.phone.trim()) {
      setError("شماره تلفن الزامی است");
      return;
    }
    if (!form.password.trim() || form.password.length < 4) {
      setError("رمز عبور باید حداقل ۴ کاراکتر باشد");
      return;
    }

    setSaving(true);
    try {
      await createUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        role: form.role,
        gender: form.gender,
        city: form.city.trim() || "تهران",
      });
      pushToast({
        type: "success",
        title: "عضو افزوده شد",
        message: `${form.name} با نقش ${ROLE_CONFIG[form.role].label} اضافه شد`,
      });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "خطا در ایجاد کاربر");
      pushToast({ type: "error", title: "خطا", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400">
              <FiUsers className="text-black" />
            </div>
            <p className="font-semibold text-white">افزودن عضو جدید</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/50">نام و نام خانوادگی *</span>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
              <FiUser className="text-white/30 shrink-0" />
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                placeholder="علی رضایی"
              />
            </div>
          </label>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">شماره موبایل *</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
                <FiPhone className="text-white/30 shrink-0" />
                <input
                  value={form.phone}
                  dir="ltr"
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                  placeholder="09123456789"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">ایمیل</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
                <FiMail className="text-white/30 shrink-0" />
                <input
                  value={form.email}
                  dir="ltr"
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                  placeholder="name@bestiee.ir"
                />
              </div>
            </label>
          </div>

          {/* Password + City */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">رمز عبور *</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-400/50 transition"
                placeholder="حداقل ۴ کاراکتر"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">شهر</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
                <FiMapPin className="text-white/30 shrink-0" />
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                  placeholder="تهران"
                />
              </div>
            </label>
          </div>

          {/* Role + Gender */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">نقش</span>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as "creator" | "promoter" }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50 transition"
              >
                <option value="promoter">پروموتر</option>
                <option value="creator">خالق</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">جنسیت</span>
              <select
                value={form.gender}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as "male" | "female" }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50 transition"
              >
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <FiAlertTriangle className="shrink-0" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {saving ? <FiLoader className="animate-spin" /> : <FiCheck />}
              {saving ? "در حال ذخیره..." : "افزودن عضو"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Member Modal ────────────────────────────────────────────────────────
function EditMemberModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: StaffUser | null;
  onClose: () => void;
}) {
  const updateUser = useMutation(api.users.users.update);
  const pushToast = useToastStore((state) => state.push);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "promoter" as "creator" | "promoter",
    city: "",
    job: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        password: "",
        role: user.role as "creator" | "promoter",
        city: user.city ?? "",
        job: user.job ?? "",
        address: user.address ?? "",
      });
      setError(null);
    }
  }, [open, user]);

  if (!open || !user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("نام الزامی است");
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, any> = {
        name: form.name.trim(),
        role: form.role,
      };
      if (form.email.trim()) patch.email = form.email.trim();
      if (form.phone.trim()) patch.phone = form.phone.trim();
      if (form.password.trim()) patch.password = form.password.trim();
      if (form.city.trim()) patch.city = form.city.trim();
      if (form.job.trim()) patch.job = form.job.trim();
      if (form.address.trim()) patch.address = form.address.trim();

      await updateUser({ userId: user._id as any, ...patch });
      pushToast({
        type: "success",
        title: "اطلاعات به‌روز شد",
        message: `پروفایل ${form.name} با موفقیت به‌روزرسانی شد`,
      });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "خطا در ویرایش کاربر");
      pushToast({ type: "error", title: "خطا", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const cfg = ROLE_CONFIG[user.role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 bg-slate-900 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.gradient} text-black font-bold text-sm`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">ویرایش پروفایل</p>
              <p className="text-[11px] text-white/40">{user.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/50">نام و نام خانوادگی *</span>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
              <FiUser className="text-white/30 shrink-0" />
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
              />
            </div>
          </label>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">شماره موبایل</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
                <FiPhone className="text-white/30 shrink-0" />
                <input
                  value={form.phone}
                  dir="ltr"
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">ایمیل</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
                <FiMail className="text-white/30 shrink-0" />
                <input
                  value={form.email}
                  dir="ltr"
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                />
              </div>
            </label>
          </div>

          {/* Password */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/50">
              رمز عبور جدید{" "}
              <span className="text-white/25">(در صورت نیاز به تغییر)</span>
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-400/50 transition"
              placeholder="خالی = بدون تغییر"
            />
          </label>

          {/* City + Job */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">شهر</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-orange-400/50 transition">
                <FiMapPin className="text-white/30 shrink-0" />
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/20"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/50">شغل</span>
              <input
                value={form.job}
                onChange={(e) => setForm((p) => ({ ...p, job: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-orange-400/50 transition"
                placeholder="مثال: مدیر فروش"
              />
            </label>
          </div>

          {/* Role */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/50">نقش</span>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as "creator" | "promoter" }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50 transition"
            >
              <option value="promoter">پروموتر</option>
              <option value="creator">خالق</option>
            </select>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <FiAlertTriangle className="shrink-0" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {saving ? <FiLoader className="animate-spin" /> : <FiCheck />}
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  user: StaffUser;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-rose-500/20 bg-slate-900 p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20">
            <FiAlertTriangle className="text-rose-400 text-lg" />
          </div>
          <div>
            <p className="font-semibold text-white">تأیید حذف</p>
            <p className="text-xs text-white/40">این عمل قابل برگشت نیست</p>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed mb-6">
          آیا از حذف{" "}
          <span className="font-semibold text-white">{user.name}</span> با نقش{" "}
          <span className={`font-semibold ${ROLE_CONFIG[user.role].text}`}>
            {ROLE_CONFIG[user.role].label}
          </span>{" "}
          مطمئن هستید؟ تمام داده‌های مرتبط پاک خواهد شد.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer flex-1 rounded-2xl border border-white/10 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-70"
          >
            {loading ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
            {loading ? "در حال حذف..." : "حذف کن"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const router = useRouter();
  const me = useQuery(api.users.auth.me);
  const staffList = useQuery(api.users.users.listStaff);
  const updateUser = useMutation(api.users.users.update);
  const removeUser = useMutation(api.users.users.remove);
  const pushToast = useToastStore((state) => state.push);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaffUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "creator" | "promoter">("all");

  const initialized = me !== undefined;
  const isCreator = me?.role === "creator";
  const users = (staffList ?? []) as StaffUser[];

  // Role guard
  useEffect(() => {
    if (initialized && !isCreator) {
      pushToast({
        type: "error",
        title: "دسترسی محدود",
        message: "این بخش فقط برای خالق سیستم مجاز است",
      });
    }
  }, [initialized, isCreator, pushToast]);

  const handleToggleActive = async (user: StaffUser) => {
    setActionLoading(user._id);
    try {
      await updateUser({ userId: user._id as any, active: !user.active });
      pushToast({
        type: "success",
        title: "وضعیت به‌روز شد",
        message: `${user.name} ${!user.active ? "فعال شد" : "غیرفعال شد"}`,
      });
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBan = async (user: StaffUser) => {
    setActionLoading(user._id);
    try {
      await updateUser({ userId: user._id as any, ban: !user.ban });
      pushToast({
        type: "success",
        title: "وضعیت مسدودیت",
        message: `${user.name} ${!user.ban ? "مسدود شد" : "رفع مسدودی شد"}`,
      });
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete._id);
    try {
      await removeUser({ userId: pendingDelete._id as any });
      pushToast({
        type: "success",
        title: "عضو حذف شد",
        message: `${pendingDelete.name} از سیستم حذف شد`,
      });
      setPendingDelete(null);
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (!initialized || staffList === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-28 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(4)].map((_, i) => <MemberCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // Access denied
  if (!isCreator) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10">
            <FiShield className="text-rose-400 text-xl" />
          </div>
          <p className="text-lg font-bold text-white mb-2">دسترسی محدود</p>
          <p className="text-sm text-white/50">
            این بخش فقط برای خالق سیستم قابل دسترس است.
          </p>
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer mt-6 rounded-2xl border border-white/10 px-6 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalCreators = users.filter((u) => u.role === "creator").length;
  const totalPromoters = users.filter((u) => u.role === "promoter").length;
  const totalActive = users.filter((u) => u.active).length;
  const totalBanned = users.filter((u) => u.ban).length;

  const filtered =
    filter === "all" ? users : users.filter((u) => u.role === filter);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Page Header ── */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 p-6 shadow-inner shadow-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400">
                <FiUsers className="text-black text-lg" />
              </span>
              تیم بستی
            </h1>
            <p className="mt-1 text-sm text-white/40">
              مدیریت خالقان و پروموترهای پلتفرم
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer flex items-center gap-2 self-start rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/40 md:self-auto"
          >
            <FiPlus />
            عضو جدید
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              icon: <FiUsers />,
              label: "کل اعضای تیم",
              value: users.length,
              color: "text-white",
              bg: "bg-white/10",
            },
            {
              icon: <FiShield />,
              label: "خالقان",
              value: totalCreators,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              icon: <FiStar />,
              label: "پروموترها",
              value: totalPromoters,
              color: "text-indigo-400",
              bg: "bg-indigo-500/10",
            },
            {
              icon: <FiToggleRight />,
              label: "اعضای فعال",
              value: totalActive,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex items-center gap-3 rounded-2xl ${stat.bg} border border-white/5 px-4 py-3`}
            >
              <span className={`text-lg ${stat.color}`}>{stat.icon}</span>
              <div>
                <p className="text-[11px] text-white/40">{stat.label}</p>
                <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "creator", "promoter"] as const).map((f) => {
          const labels = { all: "همه", creator: "خالقان", promoter: "پروموترها" };
          const counts = {
            all: users.length,
            creator: totalCreators,
            promoter: totalPromoters,
          };
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${active
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
            >
              {labels[f]}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-orange-500/20 text-orange-200" : "bg-white/10 text-white/40"
                  }`}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}

        {totalBanned > 0 && (
          <span className="mr-auto flex items-center gap-1.5 rounded-2xl border border-red-500/20 bg-red-900/20 px-3 py-2 text-xs text-red-300">
            <FiAlertTriangle />
            {totalBanned} حساب مسدود
          </span>
        )}
      </div>

      {/* ── Card Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
          <div className="text-center">
            <FiUsers className="mx-auto mb-3 text-3xl text-white/20" />
            <p className="text-sm text-white/40">عضوی یافت نشد</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((user) => (
            <MemberCard
              key={user._id}
              user={user}
              isCurrentUser={user._id === me?._id}
              onEdit={setEditingUser}
              onToggleActive={handleToggleActive}
              onToggleBan={handleToggleBan}
              onDelete={setPendingDelete}
              actionLoading={actionLoading}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <AddMemberModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditMemberModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />
      {pendingDelete && (
        <DeleteConfirmModal
          user={pendingDelete}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
          loading={deletingId === pendingDelete._id}
        />
      )}
    </div>
  );
}
