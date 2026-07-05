"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { useRouter } from "next/navigation";
import {
  FiBookOpen,
  FiSearch,
  FiX,
  FiInfo,
  FiUsers,
  FiScissors,
  FiDollarSign,
  FiMessageSquare,
  FiChevronLeft,
  FiSlash,
  FiImage,
} from "react-icons/fi";

const iconMap: Record<string, any> = {
  general: FiInfo,
  tenants: FiScissors,
  tickets: FiMessageSquare,
  earnings: FiDollarSign,
  networks: FiUsers,
  prompts: FiImage,
};

export default function SupportHelpPage() {
  const me = useQuery(api.users.auth.me);
  const helpDocs = useQuery(api.ai.chat.getSupportHelpDocs);
  const router = useRouter();

  const [activeTopic, setActiveTopic] = useState<string>("general");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    if (!helpDocs) return {};
    if (!searchQuery.trim()) return helpDocs;

    const query = searchQuery.toLowerCase();
    const result: Record<string, any> = {};

    Object.entries(helpDocs).forEach(([key, topic]: [string, any]) => {
      const matchTitle = topic.title.toLowerCase().includes(query);
      const matchDesc = topic.description.toLowerCase().includes(query);
      const matchContent = topic.content.toLowerCase().includes(query);

      if (matchTitle || matchDesc || matchContent) {
        result[key] = topic;
      }
    });

    return result;
  }, [helpDocs, searchQuery]);

  // Active topic data
  const activeTopicData = useMemo(() => {
    if (!helpDocs) return null;
    if (filteredTopics[activeTopic]) {
      return filteredTopics[activeTopic];
    }
    const firstKey = Object.keys(filteredTopics)[0];
    return firstKey ? filteredTopics[firstKey] : null;
  }, [helpDocs, filteredTopics, activeTopic]);

  // Helper to parse bold (**), inline code (`), and links ([text](url))
  const parseInlineElements = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-xs text-amber-300 border border-white/5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            download
            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold underline transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  // Helper to parse lists and paragraphs
  const formatContent = (text: string) => {
    return text.split("\n").map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-4" />;

      if (trimmed.startsWith("- ")) {
        return (
          <li
            key={index}
            className="mr-6 list-disc text-sm text-white/70 leading-relaxed mb-2.5"
          >
            {parseInlineElements(trimmed.substring(2))}
          </li>
        );
      }

      const numberedMatch = trimmed.match(/^([۰-۹\d]+)[\.-]\s*(.*)$/);
      if (numberedMatch) {
        return (
          <div
            key={index}
            className="flex gap-2 text-sm text-white/70 leading-relaxed mb-3 pr-2"
          >
            <span className="font-extrabold text-amber-400">
              {numberedMatch[1]}.
            </span>
            <span>{parseInlineElements(numberedMatch[2])}</span>
          </div>
        );
      }

      return (
        <p
          key={index}
          className="text-sm text-white/70 leading-relaxed mb-4"
        >
          {parseInlineElements(trimmed)}
        </p>
      );
    });
  };

  // Loading state
  if (me === undefined || helpDocs === undefined) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  // Role Restriction: ONLY promoter (supports) can access
  if (!me || me.role !== "promoter") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی محدود</p>
        <p className="text-sm text-white/40">
          این بخش مختص پشتیبانان سیستم (Promoter) است.
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

  return (
    <div className="flex flex-col gap-6 text-right font-vazir pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/20 animate-pulse">
            <FiBookOpen size={22} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-white">راهنما و آموزش پشتیبانان</h1>
            <p className="text-xs text-muted-soft">
              مستندات، آموزش وظایف و راهنمای کسب درآمد و پاسخگویی به تیکت‌های شعب
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            placeholder="جستجو در سرفصل‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full text-white/40 transition-colors cursor-pointer"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      {Object.keys(filteredTopics).length === 0 ? (
        <div className="glass-panel text-center p-16 rounded-3xl border border-white/5 bg-slate-900/60">
          <p className="text-white/50 text-sm mb-2">
            موردی مطابق با جستجوی شما پیدا نشد.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-sm text-amber-400 hover:underline cursor-pointer"
          >
            پاک کردن فیلتر جستجو
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Navigation Sidebar (Right Pane) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-2 leading-none mb-1">
              سرفصل‌های پشتیبانی
            </span>
            <div className="flex flex-col gap-2">
              {Object.entries(filteredTopics).map(([key, topic]: [string, any]) => {
                const TopicIcon = iconMap[key] || FiInfo;
                const isSelected = activeTopicData && activeTopic === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTopic(key)}
                    className={`
                      w-full text-right p-4 rounded-2xl border flex items-center gap-3.5 transition-all duration-200 cursor-pointer group relative overflow-hidden
                      ${
                        isSelected
                          ? "bg-slate-800/80 border-amber-500/30 text-white font-bold"
                          : "bg-white/3 border-white/5 text-white/60 hover:text-white hover:border-white/10 hover:bg-white/5"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
                    )}
                    <div
                      className={`
                        p-2.5 rounded-xl transition-colors
                        ${
                          isSelected
                            ? "bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg"
                            : "bg-white/5 text-white/40 group-hover:text-white"
                        }
                      `}
                    >
                      <TopicIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate leading-snug">
                        {topic.title}
                      </h4>
                      <p className="text-[10px] text-white/40 truncate mt-1 font-normal leading-normal">
                        {topic.description}
                      </p>
                    </div>
                    <FiChevronLeft
                      size={16}
                      className={`
                        text-white/30 transition-transform duration-200 ml-1
                        ${isSelected ? "translate-x-1 text-amber-400" : "group-hover:-translate-x-0.5"}
                      `}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Pane (Left Pane) */}
          <div className="lg:col-span-8 glass-panel bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 md:p-8 min-h-[450px] shadow-2xl">
            {activeTopicData ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {activeTopicData.title}
                  </h2>
                  <p className="text-xs text-muted-soft mt-1.5 font-bold">
                    {activeTopicData.description}
                  </p>
                </div>

                <hr className="border-white/5" />

                <div className="leading-relaxed">
                  {formatContent(activeTopicData.content)}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                موردی انتخاب نشده است.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
