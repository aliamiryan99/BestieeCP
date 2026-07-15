"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import type { Id } from "@backend/dataModel";
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
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const statusConfig = {
  submitted: { icon: FiLoader, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "ارسال شده" },
  processing: { icon: FiLoader, color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20", label: "در پردازش" },
  completed: { icon: FiCheck, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "انجام شده" },
  failed: { icon: FiAlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", label: "خطا" },
};

interface TaskSelectionMeta {
  service: { id: string; name: string; nameEn?: string };
  group?: { id: string; name: string; nameEn?: string };
  model: { id: string; name: string; nameEn?: string; directive: string };
}

interface TaskPromptMetaV2 {
  schemaVersion: 2;
  type: "barbers" | "barbies";
  promptVersion: string;
  services: TaskSelectionMeta["service"][];
  selections: TaskSelectionMeta[];
  environment: { id: string; label: string; directive: string };
  figurePosition: "standing" | "sitting";
  composition: "2x2-multi-view-grid";
  aspectRatio: string;
  resolution: string;
}

interface AdminAiTask {
  _id: Id<"ai_tasks">;
  status: keyof typeof statusConfig;
  createdAt: number;
  provider: string;
  type?: "barbers" | "barbies";
  model?: string;
  promptVersion?: string;
  resolvedPromptMeta?: string;
  title?: string;
  userName: string;
  userPhone: string;
  prompt: string;
  aspectRatio: string;
  resolution?: string;
  serviceType: string;
  environmentId: string;
  cameraPosition?: string;
  figurePosition?: string;
  referenceImageUrls?: string[];
  resultUrls?: string[];
  imageInputs: string[];
  errorMessage?: string;
}

function parsePromptMeta(raw: unknown): TaskPromptMetaV2 | null {
  if (!raw) return null;

  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!value || typeof value !== "object") return null;

    const candidate = value as Partial<TaskPromptMetaV2>;
    if (
      candidate.schemaVersion !== 2 ||
      (candidate.type !== "barbers" && candidate.type !== "barbies") ||
      typeof candidate.promptVersion !== "string" ||
      !Array.isArray(candidate.services) ||
      !Array.isArray(candidate.selections) ||
      !candidate.environment ||
      typeof candidate.environment.id !== "string" ||
      typeof candidate.environment.label !== "string" ||
      typeof candidate.environment.directive !== "string" ||
      (candidate.figurePosition !== "standing" && candidate.figurePosition !== "sitting") ||
      candidate.composition !== "2x2-multi-view-grid" ||
      typeof candidate.aspectRatio !== "string" ||
      typeof candidate.resolution !== "string"
    ) {
      return null;
    }

    if (
      !candidate.services.every(
        (service) =>
          service &&
          typeof service.id === "string" &&
          typeof service.name === "string",
      )
    ) {
      return null;
    }

    const selections = candidate.selections.filter((selection) =>
      Boolean(
        selection &&
          selection.service &&
          typeof selection.service.id === "string" &&
          typeof selection.service.name === "string" &&
          selection.model &&
          typeof selection.model.id === "string" &&
          typeof selection.model.name === "string" &&
          typeof selection.model.directive === "string",
      ),
    );

    return { ...candidate, selections } as TaskPromptMetaV2;
  } catch {
    return null;
  }
}

function groupSelectionsByService(
  services: TaskSelectionMeta["service"][],
  selections: TaskSelectionMeta[],
) {
  const groups = new Map<
    string,
    { service: TaskSelectionMeta["service"]; selections: TaskSelectionMeta[] }
  >();

  for (const service of services) {
    groups.set(service.id, { service, selections: [] });
  }

  for (const selection of selections) {
    const existing = groups.get(selection.service.id);
    if (existing) {
      existing.selections.push(selection);
    } else {
      groups.set(selection.service.id, {
        service: selection.service,
        selections: [selection],
      });
    }
  }

  return Array.from(groups.values());
}

function taskTypeLabel(type: unknown) {
  return type === "barbies" ? "زیبایی بانوان" : "آرایشگری مردانه";
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 15;
  const tasksResponse = useQuery(api.ai.ai.listAllTasks, { page: currentPage, limit });
  const retryTask = useMutation(api.ai.ai.retryTask);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<Record<string, boolean>>({});

  const handleRetry = async (taskId: Id<"ai_tasks">) => {
    try {
      setIsRetrying((prev) => ({ ...prev, [taskId]: true }));
      await retryTask({ taskId });
    } catch (e) {
      console.error("Failed to retry task", e);
    } finally {
      setIsRetrying((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  if (tasksResponse === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const { data: tasks, totalPages } = tasksResponse;

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
      {tasks.map((task: AdminAiTask) => {
        const isExpanded = expandedTask === task._id;
        const cfg = statusConfig[task.status as keyof typeof statusConfig];
        const StatusIcon = cfg.icon;
        const promptMeta = parsePromptMeta(task.resolvedPromptMeta);
        const groupedSelections = promptMeta
          ? groupSelectionsByService(promptMeta.services, promptMeta.selections)
          : [];

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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 cursor-pointer"
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
                <div className="flex flex-col gap-1 min-w-0">
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
                    <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-300/80 border border-sky-500/20 whitespace-nowrap">
                      {taskTypeLabel(task.type)}
                    </span>
                    {task.model && (
                      <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-indigo-300/80 border border-indigo-500/20 whitespace-nowrap" dir="ltr">
                        {task.model}
                      </span>
                    )}
                    {(promptMeta?.promptVersion || task.promptVersion) && (
                      <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-violet-300/80 border border-violet-500/20 whitespace-nowrap" dir="ltr">
                        {promptMeta?.promptVersion || task.promptVersion}
                      </span>
                    )}
                    {task.title && (
                      <span className="flex items-center gap-1 text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-normal break-words text-right">
                        {task.title}
                      </span>
                    )}
                    {task.referenceImageUrls && task.referenceImageUrls.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap" title="دارای مدل مرجع">
                        <FiImage className="text-[10px]" />
                        مرجع
                      </span>
                    )}
                    {promptMeta?.selections.map((selection) => (
                      <span
                        key={`${selection.service.id}:${selection.group?.id ?? "general"}:${selection.model.id}`}
                        className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-300/90 border border-amber-500/20 whitespace-normal"
                        title={`${selection.service.nameEn || selection.service.name}${selection.group ? ` / ${selection.group.nameEn || selection.group.name}` : ""}`}
                      >
                        {selection.service.name}: {selection.model.name}
                      </span>
                    ))}
                    {promptMeta?.services
                      .filter(
                        (service) =>
                          !promptMeta.selections.some(
                            (selection) => selection.service.id === service.id,
                          ),
                      )
                      .map((service) => (
                        <span
                          key={service.id}
                          className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-300/90 border border-amber-500/20 whitespace-normal"
                        >
                          {service.name}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-white/5 sm:border-none pt-3 sm:pt-0">
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
                    {promptMeta ? (
                      <div className="flex flex-col gap-3">
                        <span className="text-xs text-white/40 block">سرویس‌ها و مدل‌های انتخابی:</span>
                        {groupedSelections.length > 0 ? (
                          groupedSelections.map((group) => (
                            <div
                              key={group.service.id}
                              className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3"
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-amber-300">
                                  {group.service.name}
                                </span>
                                {group.service.nameEn && (
                                  <span className="text-[10px] text-white/35" dir="ltr">
                                    {group.service.nameEn}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {group.selections.length > 0 ? group.selections.map((selection) => (
                                  <div
                                    key={`${selection.group?.id ?? "general"}:${selection.model.id}`}
                                    className="rounded-lg border border-white/5 bg-black/15 p-2.5"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      {selection.group && (
                                        <span className="text-[10px] text-white/40">
                                          {selection.group.name}
                                        </span>
                                      )}
                                      <span className="text-xs font-bold text-white/85">
                                        {selection.model.name}
                                      </span>
                                      {selection.model.nameEn && (
                                        <span className="text-[10px] text-white/35" dir="ltr">
                                          {selection.model.nameEn}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1.5 text-xs leading-relaxed text-white/55 text-left" dir="ltr">
                                      {selection.model.directive}
                                    </p>
                                  </div>
                                )) : (
                                  <span className="text-xs text-white/40">
                                    مدل مشخصی برای این سرویس ثبت نشده است.
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-white/45">
                            هیچ مدل تغییری برای این درخواست ثبت نشده است.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                        <span className="text-xs font-medium text-amber-300/80">
                          فراداده ساختاریافته برای این درخواست قدیمی یا نامعتبر در دسترس نیست.
                        </span>
                        <p className="mt-1 text-xs text-white/45">
                          {task.serviceType || task.title || "اطلاعات سرویس ثبت نشده است."}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-white/40 mb-1 block">پرامپت:</span>
                      <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 text-left whitespace-pre-wrap" dir="ltr">
                        {task.prompt}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-xs text-white/40 block mb-1">نسبت تصویر</span>
                        <span className="text-sm font-bold text-white">{promptMeta?.aspectRatio || task.aspectRatio}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-xs text-white/40 block mb-1">وضوح</span>
                        <span className="text-sm font-bold text-white">{promptMeta?.resolution || task.resolution || "—"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-white/30 block">سرویس</span>
                        <span className="text-xs font-medium text-white/70">{task.serviceType}</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-white/30 block">محیط</span>
                        <span className="text-xs font-medium text-white/70">{promptMeta?.environment.label || task.environmentId}</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-white/30 block">حالت سوژه</span>
                        <span className="text-xs font-medium text-white/70">{promptMeta?.figurePosition || task.figurePosition || task.cameraPosition}</span>
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

      {/* ── Pagination Controls ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8 border-t border-white/5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronRight className="text-lg" />
          </button>
          
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-slate-900/40 border border-white/5 shadow-inner">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              // Show limited pages if many
              if (totalPages > 7) {
                if (
                  pageNum !== 1 && 
                  pageNum !== totalPages && 
                  (pageNum < currentPage - 1 || pageNum > currentPage + 1)
                ) {
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="text-white/20 pb-1">.</span>;
                  }
                  return null;
                }
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[36px] h-8 rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-white/40 hover:bg-white/5 hover:text-white/60'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="text-lg" />
          </button>
        </div>
      )}
    </div>
  );
}
