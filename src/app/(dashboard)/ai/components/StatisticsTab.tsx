import { useState, useEffect, useRef } from "react";
import { FiStar, FiTrendingUp, FiActivity, FiUsers, FiCpu, FiRefreshCw, FiMapPin } from "react-icons/fi";
import { useAction } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";

type StatisticsMetrics = {
  ai?: {
    totalProviderRemainingCredits: number;
    totalUserBoughtCredits: number;
    totalConsumedCredits: number;
    totalUserRemainingCredits: number;
    providers: Array<{ name: string; key: string; credit: number }>;
    usageByGender: {
      male: number;
      female: number;
    };
    byCity: Array<{
      cityId: string | null;
      cityName: string;
      province: string | null;
      purchaseCredits: number;
      consumedCredits: number;
    }>;
  };
};

async function runProviderSync({
  silent,
  syncCredits,
  pushToast,
  setIsSyncing,
}: {
  silent: boolean;
  syncCredits: () => Promise<unknown>;
  pushToast: ReturnType<typeof useToastStore.getState>["push"];
  setIsSyncing: (value: boolean) => void;
}) {
  setIsSyncing(true);
  try {
    await syncCredits();
    if (!silent) {
      pushToast({
        type: "success",
        title: "اعتبار به‌روز شد",
        message: "اعتبار تامین‌کننده‌ها با موفقیت همگام‌سازی شد.",
      });
    }
  } catch (error: unknown) {
    console.error(error);
    if (!silent) {
      pushToast({
        type: "error",
        title: "خطا در همگام‌سازی",
        message: error instanceof Error ? error.message : "مشکلی در دریافت اطلاعات از تامین‌کننده‌ها ایجاد شد.",
      });
    }
  } finally {
    setIsSyncing(false);
  }
}

export default function StatisticsTab({ metrics }: { metrics: StatisticsMetrics | null | undefined }) {
  const syncCredits = useAction(api.ai.settings.syncProviderCredits);
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSyncedRef = useRef(false);
  const pushToast = useToastStore((state) => state.push);

  const handleSync = async (silent = false) => {
    await runProviderSync({
      silent,
      syncCredits,
      pushToast,
      setIsSyncing,
    });
  };

  useEffect(() => {
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true;
      void runProviderSync({
        silent: true,
        syncCredits,
        pushToast,
        setIsSyncing,
      });
    }
  }, [pushToast, syncCredits]);

  if (!metrics || !metrics.ai) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const { ai } = metrics;
  const providerMaxCredit = Math.max(
    ...ai.providers.map((p) => p.credit),
    10000 // Ensure a minimum scale
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Highlight Metrics Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden group">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><FiStar className="text-xl" /></div>
              <h3 className="text-sm font-bold text-white/80">اعتبار تامین‌کننده‌ها</h3>
            </div>
            <button 
              onClick={() => handleSync(false)}
              disabled={isSyncing}
              className="text-amber-400/50 hover:text-amber-400 hover:bg-amber-400/10 p-2 rounded-xl transition"
              title="همگام‌سازی با API"
            >
              <FiRefreshCw className={isSyncing ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="text-3xl font-black text-white px-2 relative z-10">{ai.totalProviderRemainingCredits.toLocaleString()}</div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-amber-500/5 rotate-12 pointer-events-none transition-transform group-hover:scale-110"><FiStar /></div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><FiTrendingUp className="text-xl" /></div>
            <h3 className="text-sm font-bold text-white/80">خرید کل کاربران</h3>
          </div>
          <div className="text-3xl font-black text-white px-2">{ai.totalUserBoughtCredits.toLocaleString()}</div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-emerald-500/5 rotate-12 pointer-events-none"><FiTrendingUp /></div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-rose-500/10 to-pink-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400"><FiActivity className="text-xl" /></div>
            <h3 className="text-sm font-bold text-white/80">کل مصرف سیستم</h3>
          </div>
          <div className="text-3xl font-black text-white px-2">{ai.totalConsumedCredits.toLocaleString()}</div>
          <div className="text-xs text-rose-400 mt-[-10px] px-2 font-bold flex gap-2">
            باقی‌مانده دست کاربران: {ai.totalUserRemainingCredits.toLocaleString()}
          </div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-rose-500/5 rotate-12 pointer-events-none"><FiActivity /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Providers ── */}
        <div className="glass-panel rounded-3xl border border-white/8 p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FiCpu className="text-indigo-400" />
            وضعیت تامین‌کننده‌ها
          </h3>
          <div className="space-y-5">
            {ai.providers.map((p, idx: number) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white/80">{p.name}</span>
                  <span className="text-indigo-300 font-mono">{p.credit.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900/50 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${Math.max(5, (p.credit / providerMaxCredit) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Demographics Breakdown ── */}
        <div className="glass-panel rounded-3xl border border-white/8 p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-[150px] text-white/5 -rotate-12 pointer-events-none"><FiUsers /></div>

          <h3 className="text-lg font-bold text-white flex items-center gap-2 relative z-10">
            <FiUsers className="text-cyan-400" />
            مصرف به تفکیک جنسیت
          </h3>

          <div className="flex gap-4 relative z-10 h-full pb-8">
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col justify-between items-center text-center hover:bg-white/10 transition">
              <span className="text-sm font-bold text-white/50 mb-4">آقایان</span>
              <span className="text-2xl font-black text-blue-400">{ai.usageByGender.male.toLocaleString()}</span>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col justify-between items-center text-center hover:bg-white/10 transition">
              <span className="text-sm font-bold text-white/50 mb-4">بانوان</span>
              <span className="text-2xl font-black text-pink-400">{ai.usageByGender.female.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/8 p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <FiMapPin className="text-amber-400" />
          <h3 className="text-lg font-bold text-white">اعتبار به تفکیک شهر</h3>
        </div>

        {ai.byCity.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/5 p-6 text-center text-sm text-white/40">
            هنوز تراکنش اعتباری برای هیچ شهری ثبت نشده است.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/8">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-3 bg-white/5 px-4 py-3 text-xs font-bold text-white/45">
              <span>شهر</span>
              <span className="text-center">خرید</span>
              <span className="text-center">مصرف</span>
              <span className="text-center">مجموع</span>
            </div>

            <div className="divide-y divide-white/6">
              {ai.byCity.map((city, index) => {
                const total = city.purchaseCredits + city.consumedCredits;

                return (
                  <div
                    key={city.cityId ?? `unknown-${index}`}
                    className="grid grid-cols-[minmax(0,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-3 px-4 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{city.cityName}</div>
                      <div className="mt-1 text-xs text-white/35">
                        {city.province ?? "بدون استان"}
                      </div>
                    </div>
                    <div className="text-center font-bold text-emerald-400">
                      {city.purchaseCredits.toLocaleString()}
                    </div>
                    <div className="text-center font-bold text-rose-400">
                      {city.consumedCredits.toLocaleString()}
                    </div>
                    <div className="text-center font-black text-white">
                      {total.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
