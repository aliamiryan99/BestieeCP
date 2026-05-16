"use client";

import { useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiCpu, FiPercent, FiDatabase, FiEyeOff } from "react-icons/fi";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { Doc, Id } from "@backend/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/store/toastStore";

export function AiPlansTab({ isCreator }: { isCreator: boolean }) {
  const plans = useQuery(api.ai.credit_plans.list);
  const aiSettings = useQuery(api.ai.settings.getPublic);
  const createPlan = useMutation(api.ai.credit_plans.create);
  const updatePlan = useMutation(api.ai.credit_plans.update);
  const removePlan = useMutation(api.ai.credit_plans.remove);

  const pushToast = useToastStore((state) => state.push);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"ai_credit_plans"> | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [credits, setCredits] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [active, setActive] = useState(true);

  const [deleteId, setDeleteId] = useState<Id<"ai_credit_plans"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const creditPriceToman = aiSettings?.creditPriceToman || 0;

  const resetForm = () => {
    setCredits("");
    setDiscountPercent("");
    setActive(true);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (plan: Doc<"ai_credit_plans">) => {
    setCredits(plan.credits);
    setDiscountPercent(plan.discountPercent || "");
    setActive(plan.active);
    setEditingId(plan._id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credits === "") return;

    setLoading(true);
    try {
      if (editingId) {
        await updatePlan({
          id: editingId,
          credits: Number(credits),
          discountPercent: discountPercent === "" ? undefined : Number(discountPercent),
          active,
        });
        pushToast({
          type: "success",
          title: "بسته بروزرسانی شد",
          message: "تغییرات شما با موفقیت ذخیره گردید.",
        });
      } else {
        await createPlan({
          credits: Number(credits),
          discountPercent: discountPercent === "" ? undefined : Number(discountPercent),
          active,
        });
        pushToast({
          type: "success",
          title: "بسته ایجاد شد",
          message: "بسته جدید با موفقیت به سیستم اضافه گردید.",
        });
      }
      resetForm();
    } catch (error: any) {
      console.error("Failed to save plan", error);
      pushToast({
        type: "error",
        title: "خطا",
        message: error.message || "مشکلی در ذخیره اطلاعات به وجود آمد.",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmRemove = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await removePlan({ id: deleteId });
      setDeleteId(null);
      pushToast({
        type: "success",
        title: "بسته حذف شد",
        message: "بسته مورد نظر با موفقیت از سیستم حذف شد.",
      });
    } catch (error: any) {
      console.error("Failed to remove plan", error);
      pushToast({
        type: "error",
        title: "خطا",
        message: error.message || "حذف بسته با خطا مواجه شد.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">بسته‌های هوش مصنوعی</h2>
          <p className="text-sm text-white/50">مدیریت بسته‌های اعتباری قابل خرید توسط مشتریان</p>
        </div>
        {isCreator && (
          <button
            onClick={isFormOpen ? resetForm : openAddForm}
            className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg ${isFormOpen
                ? "bg-white/5 text-white/60 border border-white/10"
                : "bg-gradient-to-l from-purple-600 to-pink-500 text-white shadow-purple-500/20 hover:shadow-purple-500/40"
              }`}
          >
            {isFormOpen ? <FiPlus className="rotate-45" /> : <FiPlus />}
            {isFormOpen ? "انصراف" : "افزودن بسته"}
          </button>
        )}
      </div>

      {/* ── Form Section ── */}
      <AnimatePresence>
        {isFormOpen && isCreator && (
          <motion.form
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            onSubmit={handleSubmit}
            className="glass-panel overflow-hidden relative flex flex-col gap-6 rounded-[2rem] border border-purple-500/20 bg-slate-900/60 p-6 md:p-8 shadow-2xl"
          >
            <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-purple-600 to-pink-500 opacity-50" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
                {editingId ? <FiEdit2 /> : <FiCpu />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {editingId ? "ویرایش بسته" : "ثبت بسته جدید"}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Credits field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">تعداد اعتبار</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-purple-500/50 focus-within:bg-white/10">
                  <FiDatabase className="text-white/30 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    placeholder="مثلا: 1000"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Discount field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">درصد تخفیف (اختیاری)</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-purple-500/50 focus-within:bg-white/10">
                  <FiPercent className="text-white/30 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    placeholder="مثلا: 10"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex flex-col justify-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer w-max text-sm font-bold text-white/70">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-purple-500 rounded h-5 w-5"
                  />
                  فعال و قابل خرید
                </label>
              </div>
            </div>

            {/* Price Preview */}
            <div className="flex flex-col p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <p className="text-xs text-white/50 mb-2">پیش‌نمایش قیمت (براساس تنظیمات: {creditPriceToman.toLocaleString()} تومان به ازای هر اعتبار)</p>
              <div className="flex gap-4 items-center">
                {credits !== "" ? (
                  <>
                    {discountPercent !== "" && Number(discountPercent) > 0 ? (
                      <>
                        <span className="text-sm text-white/30 line-through">{(Number(credits) * creditPriceToman).toLocaleString()} تومان</span>
                        <span className="text-lg font-black text-white">{(Number(credits) * creditPriceToman * (1 - Number(discountPercent) / 100)).toLocaleString()} تومان</span>
                      </>
                    ) : (
                      <span className="text-lg font-black text-white">{(Number(credits) * creditPriceToman).toLocaleString()} تومان</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-white/30">-</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative self-end flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500 hover:shadow-purple-500/50 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {editingId ? "ثبت تغییرات" : "ایجاد بسته"}
                  <FiCheck className="transition-transform group-hover:scale-125 duration-300" />
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── List Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans === undefined ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-panel h-[220px] rounded-[2.5rem] border border-white/5 bg-slate-900/30 animate-pulse" />
          ))
        ) : plans.length === 0 ? (
          <div className="glass-panel col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/50 p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-white/20 mb-4 border border-white/5">
              <FiCpu className="h-8 w-8" />
            </div>
            <p className="text-white/40 font-bold">بسته‌ای در سیستم ثبت نشده است.</p>
          </div>
        ) : (
          plans.map((plan: Doc<"ai_credit_plans">) => {
            const rawPrice = plan.credits * creditPriceToman;
            const finalPrice = plan.discountPercent ? rawPrice * (1 - plan.discountPercent / 100) : rawPrice;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                key={plan._id}
                className={`glass-panel group relative flex h-full flex-col rounded-[2.5rem] border bg-slate-900/60 p-6 md:p-8 shadow-2xl transition-all hover:shadow-purple-500/10 active:scale-[0.995] ${
                  !plan.active ? 'border-white/5 opacity-70 grayscale-[0.3]' : 'border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                {!plan.active && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold text-white/40 border border-white/5">
                    <FiEyeOff /> غیرفعال
                  </div>
                )}
                {plan.discountPercent && plan.discountPercent > 0 && plan.active && (
                  <div className="absolute -top-3 -right-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 font-black text-xs text-white shadow-lg shadow-pink-500/20 transform rotate-3 border border-pink-400/50">
                    {plan.discountPercent}% تخفیف
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 text-purple-400">
                    <FiCpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">{plan.credits.toLocaleString()}</h2>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">اعتبار هوش مصنوعی</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 pb-6 mb-5">
                  {plan.discountPercent && plan.discountPercent > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white/30 line-through decoration-rose-500/50">
                        {rawPrice.toLocaleString()} تومان
                      </span>
                      <div className="flex items-end gap-1.5 mt-1">
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tighter">
                          {finalPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-white/40 mb-1.5">تومان</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5 mt-4">
                      <span className="text-3xl font-black text-white tracking-tighter">
                        {finalPrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-white/40 mb-1.5">تومان</span>
                    </div>
                  )}
                </div>

                {isCreator && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(plan)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-sm font-bold text-white hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95 cursor-pointer border border-white/10"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      ویرایش
                    </button>
                    <button
                      onClick={() => setDeleteId(plan._id)}
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 cursor-pointer"
                      title="حذف بسته"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="flex w-full max-w-sm flex-col gap-6 rounded-[2.5rem] border border-rose-500/20 bg-slate-950 p-8 shadow-[0_32px_64px_-16px_rgba(225,29,72,0.15)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-rose-500/10 text-rose-500 border border-rose-500/10 mx-auto">
                <FiTrash2 className="h-8 w-8 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white">حذف بسته اعتباری</h3>
                <p className="text-sm text-white/50 mt-3 leading-relaxed font-medium">
                  آیا اطمینان کامل به حذف این بسته دارید؟
                </p>
                <p className="mt-2 text-xs font-bold text-rose-400 bg-rose-500/10 py-1 px-3 rounded-lg inline-block border border-rose-500/20">
                  این عملیات غیرقابل بازگشت است.
                </p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteId(null)}
                  className="flex-1 rounded-2xl bg-white/5 py-4 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white border border-white/5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmRemove}
                  className="flex-1 rounded-2xl bg-gradient-to-l from-rose-600 to-red-500 py-4 text-sm font-black text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "حذف تایید"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
