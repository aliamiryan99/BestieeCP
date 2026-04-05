'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { EditTenantModal } from '@/components/dashboard/EditTenantModal';
import { TenantTable } from '@/components/dashboard/TenantTable';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import { useToastStore } from '@/store/toastStore';
import { Tenant } from '@/types/cp';

export default function TenantsPage() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuthStore();
  const { fetchTenants, removeTenant, loadingTenants } = useTenantStore();
  const pushToast = useToastStore((state) => state.push);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const filters = useMemo(
    () => ({ page, limit: 10, q: query ? query.trim() : undefined }),
    [page, query]
  );

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelected(tenant);
    setShowEdit(true);
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!window.confirm(`حذف مستاجر ${tenant.name}؟`)) return;
    const result = await removeTenant(tenant.id);
    if (result.ok) {
      pushToast({
        type: 'success',
        title: 'حذف شد',
        message: 'مستاجر از سیستم حذف شد',
      });
      await fetchTenants(filters);
    } else {
      pushToast({
        type: 'error',
        title: 'خطا در حذف',
        message: result.error ?? 'امکان حذف مستاجر وجود ندارد',
      });
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/20">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">مدیریت مستاجران</p>
            <p className="text-sm text-muted-soft">
              جستجو، ویرایش و حذف شعبه‌ها؛ صفحات مطابق پارامترهای q و page واکنش می‌دهند.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-soft">
            <FiRefreshCw className="text-base" />
            {loadingTenants ? 'در حال دریافت...' : 'همگام با API /cp/tenants'}
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute right-3 top-3 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3 text-sm text-white outline-none transition focus:border-orange-400/60"
              placeholder="جستجوی نام یا دامنه مستاجر"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40"
            >
              اعمال جستجو
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setQuery('');
                setPage(1);
              }}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
            >
              پاکسازی
            </button>
          </div>
        </form>
      </div>

      <TenantTable
        title="لیست مستاجران"
        description="ویرایش وضعیت یا حذف مستاجر با احترام به صفحه‌بندی و جستجو"
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={setPage}
      />

      <EditTenantModal
        open={showEdit}
        tenant={selected}
        onClose={() => {
          setShowEdit(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
