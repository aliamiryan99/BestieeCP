"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import {
  FiClock,
  FiCheck,
  FiAlertTriangle,
  FiLoader,
  FiImage,
  FiServer,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
} from "react-icons/fi";

const statusConfig = {
  submitted: { icon: FiLoader, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "ارسال شده" },
  processing: { icon: FiLoader, color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20", label: "در پردازش" },
  completed: { icon: FiCheck, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "انجام شده" },
  failed: { icon: FiAlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", label: "خطا" },
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

export default function TasksTab() {
  const tasks = useQuery(api.ai.ai.listAllTasks);
  const retryTask = useMutation(api.ai.ai.retryTask);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<Record<string, boolean>>({});

  const handleRetry = async (taskId: any) => {
    try {
      setIsRetrying((prev) => ({ ...prev, [taskId]: true }));
      await retryTask({ taskId });
    } catch (e) {
      console.error("Failed to retry task", e);
    } finally {
      setIsRetrying((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  if (tasks === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800/50 border border-white/5">
          <FiImage className="text-2xl text-white/30" />
        </div>
        <p className="text-white/50">هنوز درخواستی ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task: any) => {
        const isExpanded = expandedTask === task._id;
        const cfg = statusConfig[task.status as keyof typeof statusConfig];
        const StatusIcon = cfg.icon;

        return (
          <div
            key={task._id}
            className={`rounded-2xl border transition-all duration-300 ${
              isExpanded
                ? "border-amber-500/30 bg-slate-800/80 shadow-lg"
                : "border-white/10 bg-slate-800/40 hover:bg-slate-800/60 hover:border-white/20"
            }`}
          >
            {/* Header / Summary */}
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpandedTask(isExpanded ? null : task._id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.border}`}
                >
                  <StatusIcon
                    className={`text-xl ${cfg.color} ${
                      task.status === "submitted" || task.status === "processing"
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {task.userName}
                    </span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/40">
                      {task.userPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                    <span className="flex items-center gap-1">
                      <FiClock className="opacity-70" />
                      {formatTimeAgo(task.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiServer className="opacity-70" />
                      {task.provider}
                    </span>
                    {task.title && (
                      <span className="flex items-center gap-1 text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">
                        {task.title}
                      </span>
                    )}
                    {task.referenceImageUrls && task.referenceImageUrls.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap" title="دارای مدل مرجع">
                        <FiImage className="text-[10px]" />
                        مرجع
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={`rounded-full px-3 py-1 text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                >
                  {cfg.label}
                </div>
                <div className="text-white/30">
                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>
            </div>

            {/* Details (Expanded) */}
            {isExpanded && (
              <div className="border-t border-white/5 p-4 bg-black/20 rounded-b-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Details */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-xs text-white/40 mb-1 block">پرامپت:</span>
                      <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                        {task.prompt}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-xs text-white/40 block mb-1">نسبت تصویر</span>
                        <span className="text-sm font-bold text-white">{task.aspectRatio}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-white/30 block">سرویس</span>
                        <span className="text-xs font-medium text-white/70">{task.serviceType}</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-white/30 block">محیط</span>
                        <span className="text-xs font-medium text-white/70">{task.environmentId}</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-white/30 block">دوربین</span>
                        <span className="text-xs font-medium text-white/70">{task.cameraPosition}</span>
                      </div>
                    </div>
                    {(task.errorMessage || task.status === "failed") && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex flex-col gap-3">
                        {task.errorMessage && (
                          <div>
                            <span className="text-xs text-rose-400/70 block mb-1">خطای سرویس:</span>
                            <p className="text-sm text-rose-400">{task.errorMessage}</p>
                          </div>
                        )}
                        {task.status === "failed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(task._id);
                            }}
                            disabled={isRetrying[task._id]}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition disabled:opacity-50 mt-auto"
                          >
                            <FiRefreshCw className={isRetrying[task._id] ? "animate-spin" : ""} />
                            تلاش مجدد
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Images */}
                  <div className="flex flex-col gap-4">
                    {task.resultUrls && task.resultUrls.length > 0 && (
                      <div>
                        <span className="text-xs text-emerald-400/70 mb-2 block">نتایج (خروجی):</span>
                        <div className="flex flex-wrap gap-2">
                          {task.resultUrls.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-24 w-24 overflow-hidden rounded-xl border border-emerald-500/30 hover:border-emerald-400 transition"
                            >
                              <img src={url} alt="Result" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {task.imageInputs && task.imageInputs.length > 0 && (
                      <div>
                        <span className="text-xs text-white/40 mb-2 block">تصاویر ورودی:</span>
                        <div className="flex flex-wrap gap-2">
                          {task.imageInputs.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-16 w-16 overflow-hidden rounded-lg border border-white/10 hover:border-white/30 transition"
                            >
                              <img src={url} alt="Input" className="h-full w-full object-cover opacity-80 hover:opacity-100" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.referenceImageUrls && task.referenceImageUrls.length > 0 && (
                      <div>
                        <span className="text-xs text-amber-400/70 mb-2 block">مدل‌های مرجع (Reference):</span>
                        <div className="flex flex-wrap gap-2">
                          {task.referenceImageUrls.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-16 w-16 overflow-hidden rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition bg-amber-500/5"
                            >
                              <img src={url} alt="Reference" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
