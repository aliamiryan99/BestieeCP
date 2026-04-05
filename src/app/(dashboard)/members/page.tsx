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
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { useUserStore } from "@/store/userStore";
import { CPUser, SupportRole } from "@/types/cp";

function AddUserModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addUser = useUserStore((state) => state.addUser);
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
    role: "Missionary",
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
        role: "Missionary",
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
    const result = await addUser({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      password: form.password.trim(),
      role: form.role,
    });
    setSaving(false);

    if (result.ok) {
      pushToast({
        type: "success",
        title: "کاربر ایجاد شد",
        message: "کاربر جدید با موفقیت به لیست افزوده شد",
      });
      onClose();
    } else {
      setError(result.error ?? "امکان ثبت کاربر وجود ندارد");
      pushToast({
        type: "error",
        title: "خطا",
        message: result.error ?? "امکان ثبت کاربر وجود ندارد",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-white">افزودن کاربر جدید</p>
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
  user: CPUser | null;
  onClose: () => void;
}) {
  const editUser = useUserStore((state) => state.editUser);
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
    role: "Missionary",
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
        role: user.role ?? "Missionary",
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
      role: form.role,
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.password.trim()) payload.password = form.password.trim();
    const result = await editUser(user.id, payload);
    setSaving(false);

    if (result.ok) {
      pushToast({
        type: "success",
        title: "ویرایش انجام شد",
        message: "کاربر با موفقیت به‌روزرسانی شد",
      });
      onClose();
    } else {
      setError(result.error ?? "امکان ویرایش کاربر وجود ندارد");
      pushToast({
        type: "error",
        title: "خطا",
        message: result.error ?? "امکان ویرایش کاربر وجود ندارد",
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
  const { initialized, role, isCreator } = useAuthStore();
  const { users, loading, fetchUsers, toggleActive, removeUser } =
    useUserStore();
  const pushToast = useToastStore((state) => state.push);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<CPUser | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const currentRole = role();
  const allowed = initialized && isCreator();

  useEffect(() => {
    if (initialized && allowed) {
      fetchUsers({
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
    }
  }, [allowed, fetchUsers, initialized]);

  useEffect(() => {
    if (initialized && currentRole === "Missionary") {
      pushToast({
        type: "error",
        title: "دسترسی محدود",
        message: "این صفحه تنها برای Creator فعال است",
      });
    }
  }, [currentRole, initialized, pushToast]);

  const handleToggleActive = async (user: CPUser) => {
    setActionLoading(user.id);
    const result = await toggleActive(user.id);
    setActionLoading(null);

    if (result.ok) {
      pushToast({
        type: "success",
        title: "به‌روزرسانی وضعیت",
        message: `کاربر ${user.name} ${user.active ? "غیرفعال شد" : "فعال شد"}`,
      });
    } else {
      pushToast({
        type: "error",
        title: "خطا",
        message: result.error ?? "امکان تغییر وضعیت وجود ندارد",
      });
    }
  };

  const handleDelete = async (user: CPUser) => {
    if (!window.confirm(`آیا از حذف کاربر ${user.name} مطمئن هستید؟`)) {
      return;
    }
    setDeletingId(user.id);
    const result = await removeUser(user.id);
    setDeletingId(null);
    if (result.ok) {
      pushToast({
        type: "success",
        title: "کاربر حذف شد",
        message: "کاربر از لیست حذف شد",
      });
    } else {
      pushToast({
        type: "error",
        title: "خطا",
        message: result.error ?? "امکان حذف کاربر وجود ندارد",
      });
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        در حال آماده‌سازی جلسه کاربری...
      </div>
    );
  }

  if (!allowed) {
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
            <p className="text-lg font-semibold text-white">کاربران پشتیبانی</p>
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
            افزودن کاربر
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
            {users.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-muted-soft"
                >
                  کاربری ثبت نشده است
                </td>
              </tr>
            ) : null}
            {users.map((user: CPUser) => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-muted-soft">#{user.id}</div>
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.active
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
                      disabled={actionLoading === user.id}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1 text-white/80 transition ${
                        user.active
                          ? "border border-emerald-500/40 hover:bg-emerald-500/20"
                          : "border border-amber-400/40 hover:bg-amber-400/20"
                      } disabled:opacity-60`}
                    >
                      {actionLoading === user.id ? (
                        "..."
                      ) : (
                        <>
                          <span>{user.active ? "غیرفعال" : "فعال"}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deletingId === user.id}
                      className="flex items-center gap-1 rounded-xl border border-rose-500/40 px-3 py-1 text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                    >
                      <FiTrash2 />
                      {deletingId === user.id ? "در حال حذف..." : "حذف"}
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
