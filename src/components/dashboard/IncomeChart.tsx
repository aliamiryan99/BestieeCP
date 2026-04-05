'use client';

import { useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTenantStore } from '@/store/tenantStore';

export function IncomeChart() {
  const { incomeSeries, loadingIncome, fetchIncome } = useTenantStore();

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  return (
    <div className="glass-panel flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">نمودار درآمد</p>
          <p className="text-sm text-muted-soft">جریان درآمدی ماهانه</p>
        </div>
      </div>

      <div className="flex-1">
        {loadingIncome ? (
          <div className="flex h-64 items-center justify-center text-muted">
            در حال بارگذاری داده‌ها...
          </div>
        ) : incomeSeries.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-soft">
            داده‌ای برای نمایش وجود ندارد
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={incomeSeries}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor="#fb923c" stopOpacity={0.6} />
                  <stop offset="90%" stopColor="#fb7185" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.07)"
              />
              <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('fa-IR').format(value as number)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                formatter={(value: number) =>
                  `${new Intl.NumberFormat('fa-IR').format(value)} تومان`
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#fb923c"
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
