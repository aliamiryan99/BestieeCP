"use client";

import { useEffect } from "react";
import { FiBarChart2, FiMail, FiUsers } from "react-icons/fi";
import { IncomeChart } from "@/components/dashboard/IncomeChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TenantTable } from "@/components/dashboard/TenantTable";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Home() {
  const tenants = useQuery(api.tenants.tenants.listAll);
  const loadingMetrics = tenants === undefined;

  const totalTenants = tenants?.length ?? 0;
  const aliveTenants = tenants?.filter((t: any) => t.status === "alive").length ?? 0;
  const monthlyIncome = 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fa-IR").format(value);

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel grid grid-cols-1 gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm text-orange-200/80">خوش آمدید</p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            داشبورد مرکزی کنترل پنل
          </h1>
          <p className="mt-1 text-sm text-muted-soft">
            وضعیت آخرین شعبه‌ها و درآمد را در یک نگاه مشاهده کنید. برای افزودن
            شعبه جدید، از دکمه بالای صفحه استفاده کنید.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-soft">
            <span className="rounded-full bg-white/10 px-3 py-1">
              اپدیت خودکار داده‌ها
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              اتصال مستقیم به API /cp/tenant
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">آخرین اطلاعیه</p>
          <p className="text-sm text-muted-soft leading-relaxed">
            یادآوری: قبل از غیرفعال‌سازی یک شعبه، از لیست تراکنش‌ها خروجی
            بگیرید تا در گزارشات مالی ثبت شود.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          title="کل شعبه‌ها"
          value={totalTenants}
          icon={<FiUsers />}
          subtitle="مجموع ثبت شده در سیستم"
          loading={loadingMetrics}
        />
        <KpiCard
          title="شعبه‌ها فعال"
          value={aliveTenants}
          icon={<FiMail />}
          subtitle="دارای وضعیت alive"
          accent="from-green-500 to-emerald-500"
          loading={loadingMetrics}
        />
        <KpiCard
          title="درآمد ماه جاری"
          value={`${formatCurrency(monthlyIncome)} تومان`}
          icon={<FiBarChart2 />}
          subtitle="بر اساس endpoint درآمد"
          accent="from-amber-400 to-orange-500"
          loading={loadingMetrics}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TenantTable />
        </div>
        <div className="lg:col-span-1">
          <IncomeChart />
        </div>
      </section>
    </div>
  );
}
