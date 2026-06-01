import React from "react";
import { getLevelInfo } from "@/lib/levels";
import { FiAward, FiStar } from "react-icons/fi";

export default function LevelProgressBar({ xp, level }: { xp?: number; level?: number }) {
  const info = getLevelInfo(xp || 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/80 p-5 mt-4">
      {/* Decorative Background Elements */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
      <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl" />

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 border-2 border-indigo-300/30">
            <span className="text-xl font-black text-white">{info.level}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-300 mb-0.5">سطح پشتیبان</p>
            <p className="text-xs text-white/50">{info.isMaxLevel ? "حداکثر سطح" : "مسیر پیشرفت"}</p>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <p className="text-sm font-black text-white flex items-center gap-1.5 flex-row-reverse">
            <FiStar className="text-amber-400 fill-amber-400" />
            <span dir="ltr">{info.currentXp.toLocaleString()} XP</span>
          </p>
          {!info.isMaxLevel && (
            <p className="text-[10px] text-white/40 font-mono mt-0.5" dir="ltr">
              / {info.nextThreshold.toLocaleString()} XP
            </p>
          )}
        </div>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/40 border border-white/5 shadow-inner">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
          style={{ width: `${info.progressPercent}%` }}
        />
        {/* Shimmer effect */}
        <div className="absolute top-0 inset-x-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
      </div>
      
      {!info.isMaxLevel && (
        <p className="text-[10px] text-center text-white/40 mt-2">
          {info.xpRequiredForNext.toLocaleString()} XP تا سطح {info.level + 1}
        </p>
      )}
    </div>
  );
}
