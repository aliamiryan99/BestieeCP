'use client';

import { useEffect, useMemo } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiLink,
  FiTrash2,
} from 'react-icons/fi';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TenantFilters } from '@/types/cp';

type TenantRow = {
  _id: any;
  name: string;
  status: string;
  domains: { hostname: string }[];
  _creationTime: number;
};

type Props = {
  title?: string;
  description?: string;
  filters?: TenantFilters;
  onEdit?: (tenant: TenantRow) => void;
  onDelete?: (tenant: TenantRow) => void;
  onPageChange?: (page: number) => void;
};

export function TenantTable({
  title = 'لیست مستاجران',
  description = 'نمایش آخرین مستاجران ثبت شده به همراه وضعیت',
  filters,
  onEdit,
  onDelete,
  onPageChange,
}: Props) {
  const tenantsQuery = useQuery(api.tenants.tenants.listAll);
  const loadingTenants = tenantsQuery === undefined;
  
  // For pagination safely resolving locally bounds natively tracking constraints cleanly
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 10;
  
  const tenants = useMemo(() => {
    if (!tenantsQuery) return [];
    return tenantsQuery.slice((page - 1) * limit, page * limit) as unknown as TenantRow[];
  }, [tenantsQuery, page, limit]);

  const totalPages = tenantsQuery ? Math.ceil(tenantsQuery.length / limit) : 1;

  const changePage = (direction: 'next' | 'prev') => {
    const target = direction === 'next' ? page + 1 : page - 1;
    if (target < 1 || target > totalPages) return;
    onPageChange?.(target);
  };

  const showActions = !!(onEdit || onDelete);

  return (
    <div className="glass-panel overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="text-sm text-muted-soft">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-soft">
          <FiClock className="text-base" />
          بروزرسانی لحظه‌ای
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead>
            <tr className="bg-white/5 text-muted">
              <th className="px-5 py-3 text-right font-medium">نام</th>
              <th className="px-5 py-3 text-right font-medium">دامنه/اسکیما</th>
              <th className="px-5 py-3 text-right font-medium">وضعیت</th>
              <th className="px-5 py-3 text-right font-medium">انقضا</th>
              {showActions ? (
                <th className="px-5 py-3 text-right font-medium">عملیات</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tenants.length === 0 && !loadingTenants ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center text-muted-soft"
                >
                  {'مستاجری یافت نشد'}
                </td>
              </tr>
            ) : null}

            {tenants.map((tenant: any) => (
              <tr key={tenant._id} className="hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">{tenant.name}</div>
                  <div className="text-xs text-muted-soft">{tenant._id}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-muted">
                    <FiLink />
                    <span className="font-mono text-xs">
                      {tenant.domains?.[0]?.hostname ?? '---'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      tenant.status === 'alive'
                        ? 'bg-green-500/15 text-green-300'
                        : 'bg-rose-500/15 text-rose-200'
                    }`}
                  >
                    {tenant.status === 'alive' ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-soft">
                  {new Date(tenant._creationTime).toLocaleDateString('fa-IR')}
                </td>
                {showActions ? (
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {onEdit ? (
                        <button
                          onClick={() => onEdit(tenant)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
                        >
                          <FiEdit2 />
                          ویرایش
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          onClick={() => onDelete(tenant)}
                          className="flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/20"
                        >
                          <FiTrash2 />
                          حذف
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/5 px-5 py-4 text-sm text-muted">
        <div>
          صفحه {page} از {totalPages} — مجموع{' '}
          {tenantsQuery?.length ?? 0} مستاجر
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage('prev')}
            disabled={page <= 1 || loadingTenants}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight />
            قبلی
          </button>
          <button
            onClick={() => changePage('next')}
            disabled={
              page >= totalPages || loadingTenants
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            بعدی
            <FiChevronLeft />
          </button>
        </div>
      </div>
    </div>
  );
}
