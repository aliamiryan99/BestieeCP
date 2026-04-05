'use client';

import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  accent?: string;
  loading?: boolean;
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'from-orange-500 to-rose-500',
  loading,
}: Props) {
  return (
    <div className="glass-panel rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-soft">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? 'در حال بارگذاری...' : value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-soft">{subtitle}</p>
          ) : null}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-xl text-white shadow-lg shadow-black/40`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
