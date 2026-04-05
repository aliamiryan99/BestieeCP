'use client';

import { useEffect, useState } from "react";
import { FiCheck, FiClock, FiHash, FiLink, FiX } from "react-icons/fi";
import { useTenantStore } from "@/store/tenantStore";
import { useToastStore } from "@/store/toastStore";
import { Tenant, TenantStatus } from "@/types/cp";

type Props = {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
};

const formatDate = (value?: string) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export function EditTenantModal({ open, tenant, onClose }: Props) {
  const { editTenant } = useTenantStore();
  const pushToast = useToastStore((state) => state.push);

  const [name, setName] = useState("");
  const [schema, setSchema] = useState("");
  const [status, setStatus] = useState<TenantStatus>("alive");
  const [subscriptionExpireAt, setSubscriptionExpireAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill fields when a tenant is selected
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!tenant) return;
    setName(tenant.name ?? "");
    setSchema(tenant.schema ?? "");
    setStatus(tenant.status ?? "alive");
    setSubscriptionExpireAt(formatDate(tenant.subscriptionExpireAt));
  }, [tenant]);

  if (!open || !tenant) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("نام شعبه الزامی است");
      return;
    }

    setFormError(null);
    setSaving(true);

    const payload: Parameters<typeof editTenant>[1] = {
      name: name.trim(),
      schema: schema.trim() || undefined,
      status,
      subscriptionExpireAt: subscriptionExpireAt
        ? new Date(subscriptionExpireAt).toISOString()
        : undefined,
    };

    const result = await editTenant(tenant.id, payload);
    setSaving(false);

    if (result.ok) {
      pushToast({
        type: "success",
        title: "ویرایش شد",
        message: "اطلاعات مستاجر با موفقیت بروزرسانی شد",
      });
      onClose();
    } else {
      pushToast({
        type: "error",
        title: "خطا",
        message: result.error ?? "در ذخیره تغییرات خطایی رخ داد",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">ویرایش مستاجر</p>
            <p className="text-sm text-muted-soft">{tenant.id}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70 transition hover:bg-white/10"
            aria-label="بستن"
          >
            <FiX />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-muted">نام شعبه</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
              <FiHash className="text-muted" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="نام نمایش داده شده"
              />
            </div>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-muted">اسکیما / پایگاه داده</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
              <FiLink className="text-muted" />
              <input
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="schema name"
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">تاریخ انقضا</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
                <FiClock className="text-muted" />
                <input
                  type="date"
                  value={subscriptionExpireAt}
                  onChange={(e) => setSubscriptionExpireAt(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 text-white outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-muted">وضعیت</span>
              <div className="flex items-center gap-2">
                {(["alive", "dead"] as TenantStatus[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      status === option
                        ? "border-orange-400/60 bg-orange-500/10 text-white"
                        : "border-white/10 bg-white/5 text-muted"
                    }`}
                  >
                    {option === "alive" ? "فعال" : "غیرفعال"}
                  </button>
                ))}
              </div>
            </label>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {formError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
              disabled={saving}
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {saving ? "در حال ذخیره" : "ثبت تغییرات"}
              <FiCheck />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
