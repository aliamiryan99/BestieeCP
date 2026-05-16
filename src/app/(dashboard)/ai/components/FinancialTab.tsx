import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@backend/api";
import {
  FiDollarSign,
  FiPercent,
  FiSave,
  FiInfo,
  FiCreditCard,
} from "react-icons/fi";
import { useToastStore } from "@/store/toastStore";

type FinancialSettings = {
  profitRatio?: number;
  dollarPriceToman?: number;
  creditPriceCents?: number;
  gptImageCostsCredits?: {
    res1K: number;
    res2K: number;
    res4K: number;
  };
  creditPriceToman?: number;
} | null;

export default function FinancialTab({
  settings,
}: {
  settings: FinancialSettings;
}) {
  const [profitRatio, setProfitRatio] = useState<number>(1);
  const [dollarPrice, setDollarPrice] = useState<number>(160000);
  const [creditPriceCents, setCreditPriceCents] = useState<number>(1);
  const [creditPriceToman, setCreditPriceToman] = useState<number>(1600);
  const [gptCosts, setGptCosts] = useState({
    res1K: 2,
    res2K: 3,
    res4K: 5,
  });
  const [isSaving, setIsSaving] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  const updateSettings = useMutation(api.ai.settings.update);

  useEffect(() => {
    if (settings) {
      setProfitRatio(settings.profitRatio ?? 1);
      setDollarPrice(settings.dollarPriceToman ?? 160000);
      setCreditPriceCents(settings.creditPriceCents ?? 1);
      setCreditPriceToman(settings.creditPriceToman ?? 1600);
      if (settings.gptImageCostsCredits) {
        setGptCosts({
          res1K: settings.gptImageCostsCredits.res1K ?? 2,
          res2K: settings.gptImageCostsCredits.res2K ?? 3,
          res4K: settings.gptImageCostsCredits.res4K ?? 5,
        });
      }
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        profitRatio,
        dollarPriceToman: dollarPrice,
        creditPriceCents,
        creditPriceToman,
        gptImageCostsCredits: gptCosts,
      });
      pushToast({
        type: "success",
        title: "تنظیمات ذخیره شد",
        message: "تنظیمات مالی با موفقیت به‌روزرسانی شد.",
      });
    } catch (error: unknown) {
      console.error(error);
      pushToast({
        type: "error",
        title: "خطا در ذخیره",
        message:
          error instanceof Error
            ? error.message
            : "مشکلی در ذخیره تنظیمات مالی ایجاد شد.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculation: Expected Toman Price = (Cent/100) * DollarToman * ProfitRatio
  const expectedTomanPrice = (creditPriceCents / 100) * dollarPrice * profitRatio;
  const isProfitable = creditPriceToman >= expectedTomanPrice;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 glass-panel rounded-3xl border border-white/8 p-6 shadow-xl space-y-8">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiDollarSign className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">نرخ‌گذاری و سود</h3>
            <p className="text-sm text-white/40">
              تنظیمات پایه قیمت‌گذاری برای سیستم هوش مصنوعی (GPT-Image-2)
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-white/70 block">
                هزینه مدل GPT-Image-2 (اعتبار بر اساس رزولوشن)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {/* 1K */}
                <div className="relative">
                  <span className="block text-xs text-white/50 mb-1">1K Resolution</span>
                  <input
                    type="number"
                    value={gptCosts.res1K}
                    onChange={(e) => setGptCosts(p => ({ ...p, res1K: Number(e.target.value) }))}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    dir="ltr"
                  />
                </div>
                {/* 2K */}
                <div className="relative">
                  <span className="block text-xs text-white/50 mb-1">2K Resolution</span>
                  <input
                    type="number"
                    value={gptCosts.res2K}
                    onChange={(e) => setGptCosts(p => ({ ...p, res2K: Number(e.target.value) }))}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    dir="ltr"
                  />
                </div>
                {/* 4K */}
                <div className="relative">
                  <span className="block text-xs text-white/50 mb-1">4K Resolution</span>
                  <input
                    type="number"
                    value={gptCosts.res4K}
                    onChange={(e) => setGptCosts(p => ({ ...p, res4K: Number(e.target.value) }))}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    dir="ltr"
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">
                هزینه تولید هر تصویر توسط مدل جدید GPT-Image-2 بر اساس رزولوشن انتخاب شده.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <label className="text-sm font-bold text-white/70 block">
                قیمت روز دلار (تومان)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={dollarPrice}
                  onChange={(e) => setDollarPrice(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  dir="ltr"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">
                  تومان
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-white/70 block">
                قیمت پایه اعتبار (سنت)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={creditPriceCents}
                  onChange={(e) => setCreditPriceCents(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  dir="ltr"
                  min="0"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">
                  cent
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-white/70 block">
                قیمت دستی اعتبار (تومان)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={creditPriceToman}
                  onChange={(e) => setCreditPriceToman(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  dir="ltr"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">
                  تومان
                </span>
              </div>
            </div>
          </div>

          {/* Profit Ratio */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white/70 flex justify-between">
              <span>ضریب سود پلتفرم (Profit Ratio)</span>
              <span className="text-amber-400">{profitRatio}x</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={profitRatio}
                onChange={(e) => setProfitRatio(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <input
                type="number"
                value={profitRatio}
                onChange={(e) => setProfitRatio(Number(e.target.value))}
                className="w-24 bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-center text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                dir="ltr"
                step="0.1"
              />
            </div>
            <p className="text-xs text-white/40">
              ضریب ۱ یعنی فروش به قیمت تمام شده. ضریب ۲ یعنی دو برابر.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <FiSave className="text-lg" />
            )}
            ذخیره تنظیمات مالی
          </button>
        </div>
      </div>

      {/* Simulator Panel */}
      <div className="lg:w-80 shrink-0 glass-panel rounded-3xl border border-white/8 p-6 shadow-xl flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden bg-slate-900/60">
        <div className="absolute -top-10 -right-10 text-[100px] text-white/5 opacity-50 rotate-12">
          <FiPercent />
        </div>

        <div className="z-10 bg-white/5 border border-white/10 p-3 rounded-full mb-2">
          <FiInfo className="text-2xl text-amber-400" />
        </div>

        <h3 className="z-10 text-lg font-bold text-white">شبیه‌ساز قیمت‌گذاری</h3>
        <p className="z-10 text-xs text-white/50 leading-relaxed max-w-[200px]">
          بررسی قیمت ثبت شده به نسبت قیمت مورد انتظار پلتفرم.
        </p>

        <div className="z-10 w-full mt-4 space-y-3">
          <div className="flex justify-between items-center bg-slate-950/50 rounded-xl p-3 border border-white/5">
            <span className="text-xs text-white/40">قیمت دستی ثبت شده:</span>
            <span className="text-sm font-bold text-white/80">
              {creditPriceToman.toLocaleString()} تومان
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-950/50 rounded-xl p-3 border border-white/5">
            <span className="text-xs text-white/40">قیمت مورد انتظار (محاسبه شده):</span>
            <span className="text-sm font-bold text-white/80">
              {Math.round(expectedTomanPrice).toLocaleString()} تومان
            </span>
          </div>
          
          <div className={`flex justify-between items-center rounded-xl p-3 border ${isProfitable ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
            <span className={`text-[10px] sm:text-xs ${isProfitable ? "text-emerald-400/80" : "text-rose-400/80"}`}>
              وضعیت قیمت‌گذاری:
            </span>
            <span className={`text-xs sm:text-sm font-black ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfitable ? "سودآور / استاندارد" : "کمتر از حد انتظار (زیان)"}
            </span>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-[10px] text-white/40 mb-2">هزینه نهایی کاربر (مثال برای 2K = {gptCosts.res2K} اعتبار):</p>
            <div className="flex justify-center items-center bg-white/5 rounded-xl p-3 border border-white/10">
              <span className="text-xl font-black text-amber-400">
                {Math.round(creditPriceToman * gptCosts.res2K).toLocaleString()} تومان
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
