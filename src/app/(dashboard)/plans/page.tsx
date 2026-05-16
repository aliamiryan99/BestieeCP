"use client";

import { useState } from "react";
import {
  FiArrowRight, FiPlus, FiTrash2, FiAward, FiEdit2,
  FiX, FiCheck, FiTag, FiDollarSign, FiUsers, FiStar
} from "react-icons/fi";
import Link from "next/link";
import { AiPlansTab } from "./AiPlansTab";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { Doc, Id } from "@backend/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/store/toastStore";

export default function PlansPage() {
  const me = useQuery(api.users.auth.me);
  const plans = useQuery(api.tenants.plans.list);
  const createPlan = useMutation(api.tenants.plans.create);
  const updatePlan = useMutation(api.tenants.plans.update);
  const removePlan = useMutation(api.tenants.plans.remove);

  const pushToast = useToastStore((state) => state.push);

  const [activeTab, setActiveTab] = useState<"tenants" | "ai">("tenants");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"plans"> | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [priceMonthly, setPriceMonthly] = useState<number | "">("");
  const [priceYearly, setPriceYearly] = useState<number | "">("");
  const [maxStaff, setMaxStaff] = useState<number | "">("");
  const [features, setFeatures] = useState<{ key: string, title: string }[]>([]);
  const [featureKeyInput, setFeatureKeyInput] = useState("");
  const [featureTitleInput, setFeatureTitleInput] = useState("");
  const [isBase, setIsBase] = useState(false);
  const [parentId, setParentId] = useState<Id<"plans"> | "">("");
  const [editingFeatureKey, setEditingFeatureKey] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<Id<"plans"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreator = me?.role === "creator";

  if (me !== undefined && !isCreator) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FiX className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">عدم دسترسی</h2>
        <p className="text-white/60">شما مجوز لازم برای مشاهده این صفحه را ندارید.</p>
      </div>
    );
  }

  const resetForm = () => {
    setKey("");
    setName("");
    setPriceMonthly("");
    setPriceYearly("");
    setMaxStaff("");
    setFeatures([]);
    setFeatureKeyInput("");
    setFeatureTitleInput("");
    setIsBase(false);
    setParentId("");
    setEditingFeatureKey(null);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (plan: Doc<"plans">) => {
    setKey(plan.key);
    setName(plan.name);
    setPriceMonthly(plan.priceMonthly);
    setPriceYearly(plan.priceYearly);
    setMaxStaff(plan.maxStaff);
    setFeatures([...plan.features]);
    setIsBase(plan.is_base || false);
    setParentId(plan.parent || "");
    setEditingId(plan._id);
    setIsFormOpen(true);
  };

  const handleAddFeature = () => {
    const featureKey = featureKeyInput.trim();
    const featureTitle = featureTitleInput.trim();
    
    if (featureKey && featureTitle) {
      if (editingFeatureKey) {
        // Update existing
        setFeatures(features.map(f => f.key === editingFeatureKey ? { key: featureKey, title: featureTitle } : f));
        setEditingFeatureKey(null);
      } else if (!features.find(f => f.key === featureKey)) {
        // Add new
        setFeatures([...features, { key: featureKey, title: featureTitle }]);
      }
      setFeatureKeyInput("");
      setFeatureTitleInput("");
    }
  };

  const handleEditFeature = (feat: { key: string, title: string }) => {
    setFeatureKeyInput(feat.key);
    setFeatureTitleInput(feat.title);
    setEditingFeatureKey(feat.key);
  };

  const handleRemoveFeature = (featureKey: string) => {
    setFeatures(features.filter(f => f.key !== featureKey));
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !name || priceMonthly === "" || priceYearly === "" || maxStaff === "") return;

    setLoading(true);
    try {
      if (editingId) {
        await updatePlan({
          id: editingId,
          name,
          priceMonthly: Number(priceMonthly),
          priceYearly: Number(priceYearly),
          maxStaff: Number(maxStaff),
          features,
          is_base: isBase,
          parent: parentId || undefined
        });
        pushToast({
          type: "success",
          title: "پلان بروزرسانی شد",
          message: "تغییرات شما با موفقیت ذخیره گردید.",
        });
      } else {
        await createPlan({
          key,
          name,
          priceMonthly: Number(priceMonthly),
          priceYearly: Number(priceYearly),
          maxStaff: Number(maxStaff),
          features,
          is_base: isBase,
          parent: parentId || undefined
        });
        pushToast({
          type: "success",
          title: "پلان ایجاد شد",
          message: "پلان جدید با موفقیت به سیستم اضافه گردید.",
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
        title: "پلان حذف شد",
        message: "پلان مورد نظر با موفقیت از سیستم حذف شد.",
      });
    } catch (error: any) {
      console.error("Failed to remove plan", error);
      pushToast({
        type: "error",
        title: "خطا",
        message: error.message || "حذف پلان با خطا مواجه شد.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white transition hover:bg-white/10 hover:border-white/20 active:scale-95"
          >
            <FiArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight md:text-3xl">پلان‌های اشتراک و اعتبار</h1>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">مدیریت سطوح دسترسی و قیمت‌ها</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "tenants" 
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          اشتراک شعب
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "ai" 
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" 
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          بسته‌های هوش مصنوعی
        </button>
      </div>

      {activeTab === "tenants" ? (
        <>
          <div className="flex justify-end">
            {isCreator && (
              <button
                onClick={isFormOpen ? resetForm : openAddForm}
                className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg ${isFormOpen
                    ? "bg-white/5 text-white/60 border border-white/10"
                    : "bg-gradient-to-l from-indigo-500 to-purple-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  }`}
              >
                {isFormOpen ? <FiArrowRight className="rotate-180" /> : <FiPlus />}
                {isFormOpen ? "انصراف" : "افزودن پلان"}
              </button>
            )}
          </div>

      {/* ── Add/Edit Document Form ── */}
      <AnimatePresence>
        {isFormOpen && isCreator && (
          <motion.form
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            onSubmit={handleSubmit}
            className="glass-panel overflow-hidden relative flex flex-col gap-6 rounded-[2rem] border border-indigo-500/20 bg-slate-900/60 p-6 md:p-8 shadow-2xl"
          >
            <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-indigo-500 to-purple-500 opacity-50" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                {editingId ? <FiEdit2 /> : <FiAward />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {editingId ? "ویرایش پلان" : "ثبت پلان جدید"}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Name field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">نام پلان</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                  <FiTag className="text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    placeholder="مثلا: پروپلن"
                    required
                  />
                </div>
              </div>

              {/* Key field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">کلید سیستم (Key)</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                  <FiStar className="text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    disabled={!!editingId}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20 disabled:opacity-50"
                    placeholder="مثلا: pro"
                    required
                  />
                </div>
              </div>

              {/* Max Staff */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-white/50">حداکثر تعداد پرسنل</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-indigo-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maxStaff === -1}
                      onChange={(e) => {
                        if (e.target.checked) setMaxStaff(-1);
                        else setMaxStaff("");
                      }}
                      className="accent-indigo-500 rounded"
                    />
                    نامحدود
                  </label>
                </div>
                <div className={`group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition ${maxStaff === -1 ? 'opacity-50 pointer-events-none' : 'focus-within:border-indigo-500/50 focus-within:bg-white/10'}`}>
                  <FiUsers className="text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="number"
                    value={maxStaff === -1 ? "" : maxStaff}
                    onChange={(e) => setMaxStaff(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    placeholder="مثلا: 10"
                    min="1"
                    disabled={maxStaff === -1}
                    required={maxStaff !== -1}
                  />
                </div>
              </div>

              {/* Price Monthly */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">قیمت ماهانه (تومان)</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                  <FiDollarSign className="text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    placeholder="299,000"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Price Yearly */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">قیمت سالانه (تومان)</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                  <FiDollarSign className="text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="number"
                    value={priceYearly}
                    onChange={(e) => setPriceYearly(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    placeholder="2,990,000"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Parent Plan Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 px-1">پایه از سطح (ارث‌بری ویژگی‌ها)</label>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                  <FiAward className="text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value as Id<"plans"> | "")}
                    className="w-full bg-transparent text-sm text-white outline-none cursor-pointer [&>option]:bg-slate-900"
                  >
                    <option value="">(بدون والد)</option>
                    {plans?.filter((p: Doc<"plans">) => p._id !== editingId).map((p: Doc<"plans">) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Is Base Toggle */}
              <div className="flex flex-col justify-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer w-max text-sm font-bold text-white/70">
                  <input
                    type="checkbox"
                    checked={isBase}
                    onChange={(e) => setIsBase(e.target.checked)}
                    className="accent-indigo-500 rounded h-5 w-5"
                  />
                  محصول پایه سیستم (غیرقابل حذف)
                </label>
              </div>

              {/* Dynamic Features List */}
              <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                <label className="text-xs font-bold text-white/50 px-1">ویژگی‌های پلان (Features)</label>

                <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-12 border border-white/5 rounded-xl bg-black/20">
                  <div className="w-full flex items-center h-full text-xs text-white/30 px-2" style={{ display: features.length === 0 ? "flex" : "none" }}>
                    هیچ ویژگی اضافه‌ای ثبت نشده است
                  </div>
                  {features.map((feat: { key: string, title: string }, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        editingFeatureKey === feat.key 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      <FiCheck className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{feat.title}</span>
                      <div className="flex items-center gap-1 ml-1 border-r border-white/10 pr-1 mr-1">
                        <button
                          type="button"
                          onClick={() => handleEditFeature(feat)}
                          className={`p-1 rounded-full transition-colors ${
                            editingFeatureKey === feat.key ? "hover:bg-white/20 text-white" : "hover:bg-white/10 text-white/40 hover:text-white"
                          }`}
                          title="ویرایش ویژگی"
                        >
                          <FiEdit2 className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(feat.key)}
                          className={`p-1 rounded-full transition-colors ${
                            editingFeatureKey === feat.key ? "hover:bg-white/20 text-rose-200" : "hover:bg-white/10 text-rose-400 hover:text-rose-300"
                          }`}
                          title="حذف ویژگی"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3 flex-col sm:flex-row">
                  <div className="group flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                    <input
                      type="text"
                      value={featureKeyInput}
                      onChange={(e) => setFeatureKeyInput(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                      placeholder="کلید سیستم (مثلا sms)"
                    />
                  </div>
                  <div className="group flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition focus-within:border-indigo-500/50 focus-within:bg-white/10">
                    <input
                      type="text"
                      value={featureTitleInput}
                      onChange={(e) => setFeatureTitleInput(e.target.value)}
                      onKeyDown={handleFeatureKeyDown}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                      placeholder="عنوان نمایشی (مثلا پیامک)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className={`flex items-center justify-center rounded-2xl px-6 py-3 sm:py-0 text-sm font-bold text-white transition active:scale-95 shrink-0 ${
                      editingFeatureKey 
                      ? "bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/20" 
                      : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {editingFeatureKey ? "بروزرسانی" : "افزودن"}
                  </button>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative self-end flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {editingId ? "ثبت تغییرات" : "ایجاد پلان"}
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
            <div key={i} className="glass-panel h-[320px] rounded-[2.5rem] border border-white/5 bg-slate-900/30 animate-pulse" />
          ))
        ) : plans.length === 0 ? (
          <div className="glass-panel col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/50 p-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-white/20 mb-4 border border-white/5">
              <FiAward className="h-8 w-8" />
            </div>
            <p className="text-white/40 font-bold">پلانی در سیستم ثبت نشده است.</p>
          </div>
        ) : (
          plans.map((plan: Doc<"plans">) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              key={plan._id}
              className="glass-panel group relative flex h-full flex-col rounded-[2.5rem] border border-white/5 bg-slate-900/60 p-6 md:p-8 shadow-2xl transition-all hover:border-indigo-500/30 hover:shadow-indigo-500/10 active:scale-[0.995]"
            >
              {plan.is_base && (
                <div className="absolute -top-3 -right-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1 font-black text-xs text-slate-900 shadow-lg shadow-emerald-500/20 transform -rotate-6 border border-emerald-300/50">
                  پایه
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl md:text-2xl font-black text-white">{plan.name}</h2>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-white/50 lowercase tracking-widest">
                  {plan.key}
                </div>
              </div>

              <div className="flex items-end gap-1 mb-6 mt-3">
                <span className="text-3xl font-black text-indigo-400 tracking-tighter">
                  {plan.priceMonthly.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-white/40 mb-1.5">تومان / ماه</span>
              </div>

              <div className="flex-1 flex flex-col gap-3 pb-8 border-b border-white/10 mb-5 relative">
                {plan.parent && (
                  <div className="flex items-center gap-3 text-sm text-indigo-300 font-bold mb-1">
                    <FiAward className="opacity-80 shrink-0" />
                    شامل تمامی ویژگی‌های {plans?.find((p: Doc<"plans">) => p._id === plan.parent)?.name}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <FiUsers className="text-indigo-400 opacity-60 shrink-0" />
                  حداکثر <strong className="text-white">{plan.maxStaff === -1 ? "نامحدود" : plan.maxStaff}</strong> پرسنل مجاز
                </div>
                {plan.features.map((f: { key: string, title: string }, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                    <FiCheck className="text-emerald-400 opacity-80 shrink-0" />
                    <span className="font-bold text-white/90">{f.title}</span>
                  </div>
                ))}
                {plan.features.length === 0 && (
                  <div className="flex items-center gap-3 text-sm text-white/30 italic">
                    بدون ویژگی‌های پیشرفته
                  </div>
                )}
              </div>

              {isCreator && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(plan)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-sm font-bold text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer border border-white/10"
                  >
                    <FiEdit2 className="h-4 w-4" />
                    ویرایش
                  </button>

                  {!plan.is_base && (
                    <button
                      onClick={() => setDeleteId(plan._id)}
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 cursor-pointer"
                      title="حذف پلان"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))
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
                <h3 className="text-xl font-black text-white">حذف سیستماتیک پلان</h3>
                <p className="text-sm text-white/50 mt-3 leading-relaxed font-medium">
                  آیا اطمینان کامل به حذف این پلان دارید؟ تمام شعباتی که این پلان را خریداری کرده‌اند دچار اختلال خواهند شد!
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
        </>
      ) : (
        <AiPlansTab isCreator={isCreator} />
      )}
    </div>
  );
}
