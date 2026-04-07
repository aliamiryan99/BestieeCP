"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiEdit3,
  FiPlus,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";
import { CPUser, SupportRole } from "@/types/cp";

function AddUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createConvexUser = useMutation(api.users.users.create);
  const pushToast = useToastStore((state) => state.push);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    role: SupportRole;
  }>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "creator" as any,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset form each time the modal opens
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) {
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "creator",
      });
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.password.trim()) {
      setError("نام و رمز عبور الزامی هستند");
      return;
    }
    setSaving(true);
    try {
      await createConvexUser({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password.trim(),
        role: form.role.toLowerCase() as any,
      });
      setSaving(false);
      pushToast({
        type: "success",
        title: "کاربر ایجاد شد",
        message: "کاربر جدید با موفقیت به لیست افزوده شد",
      });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e.message ?? "امکان ثبت کاربر وجود ندارد");
      pushToast({
        type: "error",
        title: "خطا",
        message: e.message ?? "امکان ثبت کاربر وجود ندارد",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-white">عضو جدید</p>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70 transition hover:bg-white/10"
            aria-label="بستن"
          >
            <FiX />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">نام و نام خانوادگی</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
              <FiUser className="text-muted" />
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="نام کاربر"
              />
            </div>
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">ایمیل</span>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
                placeholder="example@email.com"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-muted">شماره موبایل</span>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
                placeholder="09xx..."
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">رمز عبور</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
                placeholder="رمز قوی وارد کنید"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
              disabled={saving}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {saving ? "در حال ذخیره..." : "ایجاد کاربر"}
              <FiCheck />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: any | null;
  onClose: () => void;
}) {
  const updateConvexUser = useMutation(api.users.users.update);
  const pushToast = useToastStore((state) => state.push);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    role: SupportRole;
  }>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "creator" as any,
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
        role: (user.role ?? "creator") as any,
      });
      setError(null);
    }
  }, [open, user]);

  if (!open || !user) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("نام الزامی است");
      return;
    }
    setSaving(true);
    const payload: Partial<typeof form> = {
      name: form.name.trim(),
      role: form.role.toLowerCase() as any,
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.password.trim()) payload.password = form.password.trim();
    try {
      await updateConvexUser({
        userId: user._id as any,
        ...payload
      });
      setSaving(false);
      pushToast({
        type: "success",
        title: "ویرایش انجام شد",
        message: "کاربر با موفقیت به‌روزرسانی شد",
      });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e.message ?? "امکان ویرایش کاربر وجود ندارد");
      pushToast({
        type: "error",
        title: "خطا",
        message: e.message ?? "امکان ویرایش کاربر وجود ندارد",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-white">ویرایش کاربر</p>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70 transition hover:bg-white/10"
            aria-label="بستن"
          >
            <FiX />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">نام و نام خانوادگی</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
              <FiUser className="text-muted" />
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="نام کاربر"
              />
            </div>
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">ایمیل</span>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
                placeholder="example@email.com"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-muted">شماره موبایل</span>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
                placeholder="09xx..."
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">رمز عبور جدید (اختیاری)</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-400/60"
                placeholder="در صورت نیاز تغییر دهید"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
              disabled={saving}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              <FiCheck />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const router = useRouter();

  const me = useQuery(api.users.auth.me);
  const dbUsers = useQuery(api.users.users.list);
  const updateConvexUser = useMutation(api.users.users.update);
  const removeConvexUser = useMutation(api.users.users.remove);

  const pushToast = useToastStore((state) => state.push);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentRole = me?.role;
  const isCreatorMode = currentRole === "creator" || currentRole === "owner";
  const initialized = me !== undefined;

  const users = dbUsers ?? [];

  useEffect(() => {
    if (initialized && !isCreatorMode) {
      pushToast({
        type: "error",
        title: "دسترسی محدود",
        message: "این صفحه تنها برای مدیران مجاز است",
      });
    }
  }, [currentRole, initialized, isCreatorMode, pushToast]);

  const handleToggleActive = async (user: any) => {
    setActionLoading(user._id);
    try {
      await updateConvexUser({ userId: user._id, active: !user.active });
      pushToast({
        type: "success",
        title: "به‌روزرسانی وضعیت",
        message: `کاربر ${user.name} ${!user.active ? "فعال شد" : "غیرفعال شد"}`,
      });
    } catch (e: any) {
      pushToast({
        type: "error",
        title: "خطا",
        message: e.message ?? "امکان تغییر وضعیت وجود ندارد",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: any) => {
    if (!window.confirm(`آیا از حذف کاربر ${user.name} مطمئن هستید؟`)) return;
    setDeletingId(user._id);
    try {
      await removeConvexUser({ userId: user._id });
      pushToast({
        type: "success",
        title: "کاربر حذف شد",
        message: "کاربر از سیستم حذف شد"
      });
    } catch (e: any) {
      pushToast({
        type: "error",
        title: "خطا",
        message: e.message ?? "امکان حذف کاربر وجود ندارد",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        در حال آماده‌سازی جلسه کاربری...
      </div>
    );
  }

  if (!isCreatorMode) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/80">
          <p className="text-xl font-semibold text-white">عدم دسترسی</p>
          <p className="mt-2 text-sm text-muted-soft">
            تنها نقش Creator می‌تواند کاربران جدید ثبت کند. در صورت نیاز با مدیر
            سیستم تماس بگیرید.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/20">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">اعضای پشتیبانی</p>
            <p className="text-sm text-muted-soft">
              تنها Creator می‌تواند اعضای جدید اضافه کند؛ لیست کاربران از
              /cp/users خوانده می‌شود.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40"
          >
            <FiPlus />
            عضو جدید
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead className="bg-white/5 text-muted">
            <tr>
              <th className="px-5 py-3 text-right font-medium">نام</th>
              <th className="px-5 py-3 text-right font-medium">
                ایمیل / موبایل
              </th>
              <th className="px-5 py-3 text-right font-medium">نقش</th>
              <th className="px-5 py-3 text-right font-medium">وضعیت</th>
              <th className="px-5 py-3 text-right font-medium">ایجاد</th>
              <th className="px-5 py-3 text-right font-medium">اقدامات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 && dbUsers !== undefined ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-muted-soft"
                >
                  کاربری ثبت نشده است
                </td>
              </tr>
            ) : null}
            {users.map((user: any) => (
              <tr key={user._id} className="hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-muted-soft">#{user._id.slice(-6)}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-white/80">
                    {user.email || "--"}
                  </div>
                  <div className="text-xs text-muted-soft">
                    {user.phone || "بدون شماره"}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${user.active
                      ? "bg-green-500/15 text-green-300"
                      : "bg-rose-500/15 text-rose-200"
                      }`}
                  >
                    {user.active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-muted-soft">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("fa-IR")
                    : "--"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1 text-white/80 transition hover:bg-white/10"
                    >
                      <FiEdit3 className="text-orange-300" />
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={actionLoading === user._id}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1 text-white/80 transition ${user.active
                        ? "border border-emerald-500/40 hover:bg-emerald-500/20"
                        : "border border-amber-400/40 hover:bg-amber-400/20"
                        } disabled:opacity-60`}
                    >
                      {actionLoading === user._id ? (
                        "..."
                      ) : (
                        <>
                          <span>{user.active ? "غیرفعال" : "فعال"}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deletingId === user._id}
                      className="flex items-center gap-1 rounded-xl border border-rose-500/40 px-3 py-1 text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                    >
                      <FiTrash2 />
                      {deletingId === user._id ? "در حال حذف..." : "حذف"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUserModal open={showModal} onClose={() => setShowModal(false)} />
      <EditUserModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />
    </div>
  );
}
