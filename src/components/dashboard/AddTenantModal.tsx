'use client';

import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiGlobe,
  FiLink,
  FiX,
} from 'react-icons/fi';
import { useTenantStore } from '@/store/tenantStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddTenantModal({ open, onClose }: Props) {
  const { addTenant } = useTenantStore();
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nobiro.ir';
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [domainType, setDomainType] = useState<'subdomain' | 'custom'>(
    'subdomain',
  );
  const [domainAddress, setDomainAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const validations = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('نام مستاجر الزامی است');
    if (!domainType) errors.push('نوع دامنه را مشخص کنید');
    if (domainType === 'subdomain' && !/^[a-z]+$/.test(name.trim())) {
      errors.push('نام زیر دامنه باید فقط با حروف کوچک انگلیسی باشد');
    }
    if (domainType === 'custom') {
      if (!domainAddress.trim()) errors.push('دامنه اختصاصی را وارد کنید');
      if (
        domainAddress &&
        !/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domainAddress.trim().toLowerCase())
      ) {
        errors.push('دامنه اختصاصی معتبر نیست');
      }
    }
    return errors;
  }, [domainAddress, domainType, name]);

  const handleSubmit = async () => {
    if (validations.length) {
      setFormError(validations[0]);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      domainType,
      domainAddress: domainType === 'custom' ? domainAddress.trim() : undefined,
      title: title.trim() || undefined,
    };
    const result = await addTenant(payload);
    setSubmitting(false);

    if (result.ok) {
      setToast({ type: 'success', message: 'مستاجر جدید با موفقیت ایجاد شد' });
      setName('');
      setTitle('');
      setDomainAddress('');
      setDomainType('subdomain');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setToast({
        type: 'error',
        message: result.error ?? 'خطا در ایجاد مستاجر',
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">افزودن مستاجر جدید</p>
            <p className="text-sm text-muted-soft">
              زیر دامنه یا دامنه اختصاصی را وارد کنید
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
            <span className="text-muted">نام مستاجر (زیر دامنه)</span>
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
              <FiLink className="text-muted" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="مثال: fadecity"
              />
              <span className="text-xs text-muted-soft">.{baseDomain}</span>
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

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDomainType('subdomain')}
              className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition ${
                domainType === 'subdomain'
                  ? 'border-orange-400/60 bg-orange-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-muted'
              }`}
            >
              <span className="text-sm font-semibold">زیر دامنه</span>
              <span className="text-xs text-muted-soft">مانند fadecity.nobiro.ir</span>
            </button>
            <button
              onClick={() => setDomainType('custom')}
              className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition ${
                domainType === 'custom'
                  ? 'border-rose-400/60 bg-rose-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-muted'
              }`}
            >
              <span className="text-sm font-semibold">دامنه اختصاصی</span>
              <span className="text-xs text-muted-soft">مانند barbers.ir</span>
            </button>
          </div>

          {domainType === 'custom' ? (
            <label className="block space-y-1 text-sm">
              <span className="text-muted">دامنه اختصاصی</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
                <FiGlobe className="text-muted" />
                <input
                  value={domainAddress}
                  onChange={(e) => setDomainAddress(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 text-white outline-none"
                  placeholder="مثال: barbers.ir"
                />
              </div>
            </label>
          ) : null}

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
              {submitting ? 'در حال ارسال...' : 'ثبت مستاجر'}
              <FiCheck />
            </button>
          </div>

          {toast ? (
            <div
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                toast.type === 'success'
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
