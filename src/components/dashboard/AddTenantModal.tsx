'use client';

import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiLink,
  FiX,
} from 'react-icons/fi';
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { Id } from "@backend/dataModel";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddTenantModal({ open, onClose }: Props) {
  const defaultMain = 'bestiee.ir';
  const activeCities = useQuery(api.cities.listActive);
  const createTenant = useMutation(api.tenants.tenants.create);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [cityId, setCityId] = useState<Id<"cities"> | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const validations = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('نام شعبه الزامی است');
    if (!/^[a-z]+$/.test(name.trim())) {
      errors.push('نام زیر دامنه باید فقط با حروف کوچک انگلیسی باشد');
    }
    return errors;
  }, [name]);

  const handleSubmit = async () => {
    if (validations.length) {
      setFormError(validations[0]);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      type: "barbers" as const,
      subdomain: name.trim(),
      mainDomain: defaultMain,
      title: title.trim() || name.trim(),
      cityId: cityId ? (cityId as Id<"cities">) : undefined,
    };

    try {
      await createTenant(payload);
      setSubmitting(false);
      setToast({ type: 'success', message: 'شعبه جدید با موفقیت ایجاد شد' });
      setName('');
      setTitle('');
      setCityId('');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e: any) {
      setSubmitting(false);
      setToast({
        type: 'error',
        message: e.message ?? 'خطا در ایجاد شعبه',
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">افزودن شعبه جدید</p>
            <p className="text-sm text-muted-soft">
              شعبه با دامنه اصلی bestiee.ir ساخته می‌شود
            </p>
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
            <span className="text-muted">نام شعبه (زیر دامنه)</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
              <FiLink className="text-muted" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="مثال: fadecity"
              />
              <span className="text-xs text-muted-soft">.{defaultMain}</span>
            </div>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-muted">عنوان سایت (اختیاری)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-500/60"
              placeholder="عنوان روی سایت"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-muted">شهر (اختیاری)</span>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value as any)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-orange-500/60 appearance-none"
            >
              <option value="" className="bg-slate-900">انتخاب شهر</option>
              {activeCities?.map((city: any) => (
                <option key={city._id} value={city._id} className="bg-slate-900">
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          {formError ? (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              <FiAlertCircle />
              {formError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
              disabled={submitting}
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {submitting ? 'در حال ارسال...' : 'ثبت شعبه'}
              <FiCheck />
            </button>
          </div>

          {toast ? (
            <div
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${toast.type === 'success'
                  ? 'bg-green-500/15 text-green-200'
                  : 'bg-rose-500/15 text-rose-100'
                }`}
            >
              {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
