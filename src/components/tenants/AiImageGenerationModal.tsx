"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiZap,
  FiUploadCloud,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiUsers,
  FiImage,
  FiRefreshCw,
  FiDownload,
} from "react-icons/fi";

export interface AiImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: "team" | "interior" | "outside";
  tenantType: "barbers" | "barbies";
  tenantName: string;
  isGenerating: boolean;
  progress: number;
  statusMessage?: string;
  errorMessage?: string;
  generatedPreviewUrl?: string | null;
  onStartGeneration: (files: File[]) => Promise<void>;
  onApplyImage: () => void;
  onReset: () => void;
}

export default function AiImageGenerationModal({
  isOpen,
  onClose,
  target,
  tenantType,
  tenantName,
  isGenerating,
  progress,
  statusMessage,
  errorMessage,
  generatedPreviewUrl,
  onStartGeneration,
  onApplyImage,
  onReset,
}: AiImageGenerationModalProps) {
  const [mounted, setMounted] = useState(false);
  // Local state for raw files uploaded by operator
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  const isTeam = target === "team";
  const isBarbers = tenantType === "barbers";

  const targetTitles: Record<string, string> = {
    team: "تصویر اعضای تیم پرسنل",
    interior: "تصویر فضای داخلی شعبه",
    outside: "تصویر نمای بیرونی و ورودی",
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: Array<{ file: File; preview: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newItems.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    if (isTeam) {
      setSelectedFiles((prev) => [...prev, ...newItems]);
    } else {
      // Single file only for interior / outside
      setSelectedFiles(newItems.slice(0, 1));
    }

    // Reset input so re-selecting same file triggers event
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleStart = async () => {
    if (selectedFiles.length === 0) return;
    await onStartGeneration(selectedFiles.map((item) => item.file));
  };

  const handleModalClose = () => {
    onClose();
  };

  const handleDownload = async (url: string, filename?: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || `bestiee-${target}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("Direct download failed, falling back to window open:", err);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = filename || `bestiee-${target}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#0f172a]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 my-auto overflow-hidden z-10"
            dir="rtl"
          >
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 text-violet-400">
                  <FiZap className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>فیلتر هوشمند: {targetTitles[target]}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      نسبت ۲:۱
                    </span>
                  </h3>
                  {tenantName && (
                    <p className="text-xs text-white/40 mt-0.5 font-medium">
                      شعبه: {tenantName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleModalClose}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition"
              >
                <FiX className="text-base" />
              </button>
            </div>

            {/* Body */}
            <div className="py-5 flex flex-col gap-5 overflow-y-auto pr-1">
              {/* Guidance Notice */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-xs text-white/70 leading-relaxed flex items-start gap-3 shrink-0">
                <div className="mt-0.5 text-amber-400 shrink-0">
                  {isTeam ? <FiUsers className="text-base" /> : <FiImage className="text-base" />}
                </div>
                <div className="flex-1">
                  {isTeam ? (
                    <div>
                      <span className="font-bold text-white">راهنمای تصویر تیم:</span> شما می‌توانید عکس تک‌تک پرسنل را به صورت جداگانه (هر عکس یک نفر) بارگذاری کنید. هوش مصنوعی چهره و هویت همه افراد را بدون اضافه کردن شخص غریبه در یک عکس گروهی لوکس و پرستیژ بالا با استایل هماهنگ ترکیب می‌کند.
                      {!isBarbers && (
                        <div className="mt-2 text-pink-300 font-medium bg-pink-500/10 border border-pink-500/20 rounded-xl px-2.5 py-1.5">
                          ✓ در سالن‌های بانوان، شال و پوشش موی بسیار شیک و آراسته به صورت خودکار به تمام پرسنل افزوده خواهد شد.
                        </div>
                      )}
                    </div>
                  ) : target === "interior" ? (
                    <div>
                      <span className="font-bold text-white">راهنمای فضای داخلی:</span> یک عکس واقعی از سالن آپلود کنید. هوش مصنوعی بدون دستکاری چیدمان صندلی‌ها و معماری سالن، وسایل اضافه و بازتاب افراد را حذف کرده و نورپردازی را به کیفیت تبلیغاتی برند تبدیل می‌کند.
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-white">راهنمای نمای بیرونی:</span> یک عکس از تابلوی ورودی یا نمای بیرون شعبه آپلود کنید. هوش مصنوعی افراد و شلوغی‌های خیابان را حذف کرده و نمای مغازه را به صورت یک هیرو بنر عریض ۲:۱ شیک بازسازی می‌کند.
                    </div>
                  )}
                </div>
              </div>

              {/* Status or Result View */}
              {generatedPreviewUrl ? (
                /* ── Result Ready State ── */
                <div className="flex flex-col gap-4">
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black/40 shadow-xl group">
                    <img
                      src={generatedPreviewUrl}
                      alt="Generated Preview"
                      className="w-full max-h-[300px] object-cover rounded-2xl"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/90 text-white text-xs font-bold shadow-lg">
                      <FiCheck />
                      <span>تولید هوش مصنوعی تکمیل شد</span>
                    </div>

                    {/* Quick Download Overlay Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          generatedPreviewUrl,
                          `bestiee-${tenantName || "salon"}-${target}-2x1.jpg`
                        )
                      }
                      className="cursor-pointer absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 border border-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                      title="دانلود مستقیم فایل تصویر"
                    >
                      <FiDownload className="text-sm text-cyan-400" />
                      <span>دانلود تصویر</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(
                            generatedPreviewUrl,
                            `bestiee-${tenantName || "salon"}-${target}-2x1.jpg`
                          )
                        }
                        className="cursor-pointer flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-3 text-xs font-bold text-cyan-300 transition"
                        title="دانلود تصویر با کیفیت اصلی"
                      >
                        <FiDownload />
                        <span>دانلود تصویر</span>
                      </button>
                      <button
                        type="button"
                        onClick={onReset}
                        className="cursor-pointer flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs font-bold text-white/70 hover:text-white transition"
                      >
                        <FiRefreshCw />
                        <span>تولید مجدد</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onApplyImage}
                      className="cursor-pointer flex-1 min-w-[200px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition"
                    >
                      <FiCheck />
                      <span>اعمال و تایید به عنوان تصویر اصلی</span>
                    </button>
                  </div>
                </div>
              ) : isGenerating ? (
                /* ── Generation In Progress State ── */
                <div className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 text-center">
                  <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
                    <FiZap className="text-3xl text-violet-400 animate-pulse" />
                  </div>

                  <h4 className="text-base font-bold text-white mb-2">در حال پردازش هوش مصنوعی...</h4>
                  <p className="text-xs text-white/50 max-w-md mb-6 leading-relaxed">
                    {statusMessage || "هوش مصنوعی در حال پردازش چهره‌ها، رتوش تخصصی و تطبیق استایل با کاتالوگ است..."}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md bg-white/5 border border-white/10 h-3 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-amber-400 rounded-full"
                      initial={{ width: "10%" }}
                      animate={{ width: `${Math.max(10, Math.min(100, progress))}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-white/40">{Math.round(progress)}٪</span>

                  <p className="text-[11px] text-white/30 mt-6 bg-white/5 px-3 py-1.5 rounded-xl">
                    💡 می‌توانید این پنجره را ببندید؛ پردازش در پس‌زمینه ادامه می‌یابد و نتیجه به صورت خودکار ثبت خواهد شد.
                  </p>
                </div>
              ) : (
                /* ── Upload Raw Reference Images State ── */
                <div className="flex flex-col gap-4">
                  {errorMessage && (
                    <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <FiAlertCircle className="shrink-0 text-sm" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* File Selection Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/3 hover:border-violet-500/40 hover:bg-violet-500/5 p-6 text-center transition-all"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40">
                      <FiUploadCloud className="text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/80">
                        {isTeam ? "برای انتخاب عکس اعضای تیم کلیک کنید" : "برای انتخاب عکس مرجع کلیک کنید"}
                      </p>
                      <p className="text-[11px] text-white/30 mt-1">
                        {isTeam ? "می‌توانید چند عکس به طور همزمان انتخاب کنید (JPG یا PNG)" : "یک تصویر باکیفیت انتخاب کنید (JPG یا PNG)"}
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={isTeam}
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  {/* Selected Files Grid */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white/60">
                        <span>عکس‌های انتخاب شده ({selectedFiles.length})</span>
                        {isTeam && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300"
                          >
                            <FiPlus />
                            <span>افزودن عضو دیگر</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedFiles.map((item, index) => (
                          <div
                            key={index}
                            className="relative group rounded-2xl border border-white/10 bg-white/5 p-2 overflow-hidden flex flex-col items-center"
                          >
                            <img
                              src={item.preview}
                              alt={`Ref ${index + 1}`}
                              className="h-24 w-full object-cover rounded-xl"
                            />
                            <div className="w-full flex items-center justify-between mt-2 px-1">
                              <span className="text-[10px] text-white/50 font-medium">
                                {isTeam ? `عضو ${index + 1}` : "تصویر ورودی"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(index);
                                }}
                                className="cursor-pointer text-white/30 hover:text-rose-400 transition"
                                title="حذف"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-white/60 hover:text-white transition"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={selectedFiles.length === 0}
                      className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiZap className="text-amber-300" />
                      <span>شروع پردازش و تولید با هوش مصنوعی</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
