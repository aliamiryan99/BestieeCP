import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@backend/api";
import { FiCpu, FiSave, FiSliders, FiMaximize, FiBox, FiLayers } from "react-icons/fi";
import { useToastStore } from "@/store/toastStore";

export default function ModelsTab({ settings }: { settings: any }) {
  const [params, setParams] = useState({
    temperature: 0,
    resolution: "1K",
    aspectRatio: "1:1",
    outputs: 1,
  });
  const [isSaving, setIsSaving] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  const updateSettings = useMutation(api.ai.settings.update);

  useEffect(() => {
    if (settings && settings.nanoBananaDefaultParams) {
      setParams(settings.nanoBananaDefaultParams);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        nanoBananaDefaultParams: params,
      });
      pushToast({
        type: "success",
        title: "مدل دیفالت ذخیره شد",
        message: "تنظیمات مدل با موفقیت به‌روزرسانی شد.",
      });
    } catch (error: any) {
      console.error(error);
      pushToast({
        type: "error",
        title: "خطا در ذخیره",
        message: error.message || "مشکلی در ذخیره پارامترهای مدل ایجاد شد.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/8 p-6 shadow-xl max-w-4xl">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
          <FiCpu className="text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">پارامترهای پایه نانو بنانا (NanoBanana 2)</h3>
          <p className="text-sm text-white/40">تنظیمات پیش‌فرض برای اجرای مدل اصلی</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Temperature */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-white/80 flex items-center justify-between">
            <span className="flex items-center gap-2"><FiSliders className="text-orange-400/70" /> Temperature</span>
            <span className="bg-white/10 px-2 py-0.5 rounded text-orange-300 font-mono text-xs">{params.temperature}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={params.temperature}
            onChange={(e) => setParams({ ...params, temperature: Number(e.target.value) })}
            className="w-full accent-orange-500"
          />
          <p className="text-xs text-white/40">عددی بین ۰ و ۲. مقدار ۰ به معنای خروجی کاملاً قطعی (deterministic) است.</p>
        </div>

        {/* Resolution */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-white/80 flex items-center gap-2">
            <FiMaximize className="text-orange-400/70" /> Resolution
          </label>
          <div className="relative">
            <select
              value={params.resolution}
              onChange={(e) => setParams({ ...params, resolution: e.target.value })}
              className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-mono text-sm"
              dir="ltr"
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-white/50">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-white/80 flex items-center gap-2">
            <FiBox className="text-orange-400/70" /> Aspect Ratio
          </label>
          <div className="relative">
            <select
              value={params.aspectRatio}
              onChange={(e) => setParams({ ...params, aspectRatio: e.target.value })}
              className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-mono text-sm"
              dir="ltr"
            >
              <option value="auto">auto</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3 (Landscape)</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="3:4">3:4 (Portrait)</option>
              <option value="9:16">9:16 (Vertical)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-white/50">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Outputs Count */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-white/80 flex items-center gap-2">
            <FiLayers className="text-orange-400/70" /> Number of Outputs
          </label>
          <input
            type="number"
            min="1"
            max="4"
            value={params.outputs}
            onChange={(e) => setParams({ ...params, outputs: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors font-mono"
            dir="ltr"
          />
          <p className="text-xs text-white/40">تعداد تصاویر تولیدی در هر درخواست</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSaving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <FiSave className="text-lg" />
          )}
          ذخیره پارامترها
        </button>
      </div>
    </div>
  );
}
