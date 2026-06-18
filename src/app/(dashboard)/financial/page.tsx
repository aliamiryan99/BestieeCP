"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useRouter } from "next/navigation";
import {
  FiSettings,
  FiSlash,
  FiSave,
  FiCheckCircle,
  FiShield,
  FiCreditCard,
  FiZap,
  FiBarChart2,
  FiMessageSquare,
  FiAward,
} from "react-icons/fi";
import { useToastStore } from "@/store/toastStore";
import FinancialReportsTab from "./components/FinancialReportsTab";
import FinancialSmsTab from "./components/FinancialSmsTab";

export default function FinancialPage() {
  const me = useQuery(api.users.auth.me);
  const router = useRouter();
  const settings = useQuery(api.ai.settings.get);
  const updateSettings = useMutation(api.ai.settings.update);
  const pushToast = useToastStore((state) => state.push);

  const [activeTab, setActiveTab] = useState<"settings" | "reports" | "sms" | "promoter">("reports");
  const [defaultGateway, setDefaultGateway] = useState<"zarinpal" | "jibit" | "zibal">("zarinpal");
  const [scorePrice, setScorePrice] = useState<number>(1500000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.defaultGateway) {
      setDefaultGateway(settings.defaultGateway);
    }
    if (settings?.scorePrice !== undefined) {
      setScorePrice(settings.scorePrice);
    }
  }, [settings]);

  if (me === undefined || settings === undefined) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  // Only creators can manage financial gateway settings
  if (!me || me.role !== "creator") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی ندارید</p>
        <p className="text-sm text-white/40">
          این بخش مختص مدیران سیستم (Creator) است.
        </p>
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer mt-2 rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5 transition"
        >
          بازگشت
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        defaultGateway,
      });
      pushToast({
        type: "success",
        title: "تنظیمات ذخیره شد",
        message: "درگاه پرداخت پیش‌فرض با موفقیت تغییر یافت.",
      });
    } catch (error: unknown) {
      console.error(error);
      pushToast({
        type: "error",
        title: "خطا در ذخیره",
        message:
          error instanceof Error
            ? error.message
            : "مشکلی در ذخیره تنظیمات درگاه پرداخت رخ داد.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "reports", label: "گزارش‌های مالی", icon: FiBarChart2 },
    { id: "sms", label: "گزارش پیامک‌ها", icon: FiMessageSquare },
    { id: "settings", label: "تنظیمات درگاه", icon: FiSettings },
    { id: "promoter", label: "تنظیمات پشتیبان", icon: FiAward },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto transition-all duration-300" dir="rtl">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-5 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 shadow-inner">
            <FiSettings className="text-xl text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              مدیریت مالی پلتفرم
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              گزارش‌گیری تراکنش‌ها، مانیتورینگ درآمد و تنظیمات درگاه‌های فعال
            </p>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-hide border-t border-white/5 mt-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/5"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "reports" && <FinancialReportsTab />}

        {activeTab === "sms" && <FinancialSmsTab />}

        {activeTab === "settings" && (
          <div className="glass-panel rounded-3xl border border-white/8 p-8 shadow-xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <FiCreditCard className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">درگاه پرداخت پیش‌فرض (فعال)</h3>
                <p className="text-sm text-white/40">
                  درگاه انتخابی برای تمام پرداخت‌های مربوط به بسته‌های اعتباری هوش مصنوعی و اشتراک سالن‌ها استفاده خواهد شد.
                </p>
              </div>
            </div>

            {/* ── Gateway Grid Selector ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Zarinpal Card */}
              <div
                onClick={() => setDefaultGateway("zarinpal")}
                className={`cursor-pointer group relative flex flex-col gap-4 rounded-3xl border p-6 transition-all duration-300 overflow-hidden ${
                  defaultGateway === "zarinpal"
                    ? "border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20"
                }`}
              >
                {defaultGateway === "zarinpal" && (
                  <div className="absolute top-4 left-4 text-amber-400 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold animate-fade-in">
                    <FiCheckCircle />
                    درگاه فعال
                  </div>
                )}
                
                <div className="flex items-center gap-3 mt-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300 ${
                    defaultGateway === "zarinpal" ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-white/5 border border-white/10 text-white/40"
                  }`}>
                    <span className="font-extrabold text-xs">زرین‌پال</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">درگاه زرین‌پال (Zarinpal)</h4>
                    <p className="text-xs text-white/40 mt-0.5">درگاه پرداخت بین‌المللی ریالی/تومانی</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mt-2">
                  درگاه پرداخت زرین‌پال تراکنش‌ها را بر پایه **تومان (IRT)** انجام می‌دهد. از ویژگی‌های زرین‌پال، پایداری بالا در هدایت کاربر و قابلیت شبیه‌ساز پرداخت (Sandbox) روی لوکال‌هاست می‌باشد.
                </p>

                <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto text-xs text-white/40">
                  <FiShield />
                  <span>پشتیبانی از سوییچ هوشمند شاپرک</span>
                </div>
              </div>

              {/* Jibit Card */}
              <div
                onClick={() => setDefaultGateway("jibit")}
                className={`cursor-pointer group relative flex flex-col gap-4 rounded-3xl border p-6 transition-all duration-300 overflow-hidden ${
                  defaultGateway === "jibit"
                    ? "border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20"
                }`}
              >
                {defaultGateway === "jibit" && (
                  <div className="absolute top-4 left-4 text-amber-400 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold animate-fade-in">
                    <FiCheckCircle />
                    درگاه فعال
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300 ${
                    defaultGateway === "jibit" ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" : "bg-white/5 border border-white/10 text-white/40"
                  }`}>
                    <span className="font-extrabold text-xs">جیبیت</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">درگاه جیبیت (Jibit)</h4>
                    <p className="text-xs text-white/40 mt-0.5">درگاه پرداخت نسل جدید جیبیت</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mt-2">
                  درگاه پرداخت جیبیت تراکنش‌ها را بر پایه **ریال (IRR)** دریافت می‌کند (قیمت تومانی سیستم در پرداخت درگاه ضربدر ۱۰ می‌شود). این درگاه دارای سرعت لود بالا، کیف پول درگاه و تسویه‌های اتوماتیک است.
                </p>

                <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto text-xs text-white/40">
                  <FiZap />
                  <span>پشتیبانی از استعلام کارت پرداخت‌کننده و ثبت کارت شبا</span>
                </div>
              </div>

              {/* Zibal Card */}
              <div
                onClick={() => setDefaultGateway("zibal")}
                className={`cursor-pointer group relative flex flex-col gap-4 rounded-3xl border p-6 transition-all duration-300 overflow-hidden ${
                  defaultGateway === "zibal"
                    ? "border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/30"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20"
                }`}
              >
                {defaultGateway === "zibal" && (
                  <div className="absolute top-4 left-4 text-blue-400 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold animate-fade-in">
                    <FiCheckCircle />
                    درگاه فعال
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300 ${
                    defaultGateway === "zibal" ? "bg-blue-500/20 border border-blue-500/30 text-blue-400" : "bg-white/5 border border-white/10 text-white/40"
                  }`}>
                    <span className="font-extrabold text-xs">زیبال</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">درگاه زیبال (Zibal)</h4>
                    <p className="text-xs text-white/40 mt-0.5">درگاه پرداخت هوشمند و پایدار ریالی</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mt-2">
                  درگاه پرداخت زیبال تراکنش‌ها را بر پایه **ریال (IRR)** دریافت می‌کند (قیمت تومانی سیستم ضربدر ۱۰ می‌شود). زیبال با مسیردهی هوشمند تراکنش‌ها و تسویه حساب سریع، بالاترین درصد موفقیت پرداخت را ارائه می‌دهد.
                </p>

                <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-auto text-xs text-white/40">
                  <FiZap />
                  <span>مسیردهی هوشمند به بهترین درگاه بانکی فعال</span>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <FiSave className="text-lg" />
                )}
                <span>ذخیره تنظیمات درگاه</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "promoter" && (
          <div className="glass-panel rounded-3xl border border-white/8 p-8 shadow-xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <FiAward className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تنظیمات پاداش پشتیبانان</h3>
                <p className="text-sm text-white/40">
                  قیمت پایه هر امتیاز و فرمول محاسبه تسویه حساب نهایی پشتیبانان پلتفرم
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-white/70 block">
                    ارزش ریالی هر امتیاز (تومان)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={scorePrice}
                      onChange={(e) => setScorePrice(Number(e.target.value))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                      dir="ltr"
                      placeholder="1,500,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">
                      تومان
                    </span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    این قیمت مبنای پرداخت در فرمول محاسبه ارزش کل امتیازها قرار می‌گیرد.
                  </p>
                </div>
              </div>

              {/* Formula Simulator Card */}
              <div className="lg:w-80 shrink-0 bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-amber-400">فرمول جدید تسویه حساب</h4>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 font-mono text-[11px] text-white/70 text-center" dir="ltr">
                  (Score * (1 + 0.1 * Lvl)) * ScorePrice
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <span className="text-xs font-bold text-white/50 block">مثال فرضی محاسبه:</span>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">امتیاز پشتیبان (Score):</span>
                    <span className="text-white font-bold">10 امتیاز</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">سطح پشتیبان (Lvl):</span>
                    <span className="text-white font-bold">سطح 3</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">ضریب سطح:</span>
                    <span className="text-white font-bold">1.3x</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5 mt-2">
                    <span className="text-xs text-white/50">پاداش نهایی:</span>
                    <span className="text-sm font-black text-amber-300">
                      {Math.round(10 * (1 + 0.1 * 3) * scorePrice).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await updateSettings({
                      scorePrice,
                    });
                    pushToast({
                      type: "success",
                      title: "تنظیمات ذخیره شد",
                      message: "تنظیمات پاداش پشتیبانان با موفقیت به‌روزرسانی شد.",
                    });
                  } catch (error) {
                    console.error(error);
                    pushToast({
                      type: "error",
                      title: "خطا در ذخیره",
                      message: error instanceof Error ? error.message : "مشکلی در ذخیره تنظیمات رخ داد.",
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <FiSave className="text-lg" />
                )}
                <span>ذخیره تنظیمات پشتیبان</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
