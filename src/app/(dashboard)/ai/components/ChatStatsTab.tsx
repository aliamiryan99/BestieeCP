"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import {
  FiStar,
  FiCpu,
  FiActivity,
  FiMessageSquare,
  FiUser,
  FiLayers,
  FiX,
  FiSearch,
  FiInfo,
  FiTrendingUp,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SelectedTenant = {
  id: string;
  name: string;
  subdomain: string;
} | null;

type SelectedUser = {
  id: string;
  name: string;
  phone: string;
} | null;

export default function ChatStatsTab() {
  // Filter States
  const [tenantQuery, setTenantQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<SelectedTenant>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser>(null);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Suggestion Queries (skip if query is short to save performance, but search query matches are fast)
  const tenantSuggestions = useQuery(
    api.ai.stats.searchTenants,
    { query: tenantQuery }
  );

  const userSuggestions = useQuery(
    api.ai.stats.searchUsers,
    { query: userQuery }
  );

  // Stats Query
  const statsData = useQuery(api.ai.stats.getChatStats, {
    tenantId: selectedTenant ? (selectedTenant.id as any) : undefined,
    userId: selectedUser ? (selectedUser.id as any) : undefined,
  });

  // Refs for closing dropdowns when clicking outside
  const tenantRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tenantRef.current && !tenantRef.current.contains(event.target as Node)) {
        setTenantDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (statsData === undefined) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const { metrics, dailyData } = statsData;

  const handleClearTenant = () => {
    setSelectedTenant(null);
    setTenantQuery("");
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setUserQuery("");
  };

  const handleResetFilters = () => {
    handleClearTenant();
    handleClearUser();
  };

  return (
    <div className="flex flex-col gap-6 text-right font-vazir" style={{ direction: "rtl" }}>
      {/* ── Filter Controls Section ── */}
      <div className="glass-panel p-6 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/40 to-slate-900/60 shadow-xl flex flex-col gap-4">
        <h3 className="text-sm font-black text-white/80 flex items-center gap-2">
          <FiSearch className="text-emerald-400" />
          فیلتر آمار گفتگو
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tenant Search */}
          <div ref={tenantRef} className="relative">
            <label className="block text-xs font-bold text-white/50 mb-1.5 mr-1">سالن / پذیرنده (Tenant)</label>
            {selectedTenant ? (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-emerald-400 text-sm font-semibold">
                <span className="truncate">
                  {selectedTenant.name} ({selectedTenant.subdomain}.bestiee.ir)
                </span>
                <button
                  onClick={handleClearTenant}
                  className="p-1 hover:bg-emerald-500/20 rounded-lg transition cursor-pointer"
                  title="حذف فیلتر"
                >
                  <FiX size={15} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجوی نام سالن یا ساب‌دومین..."
                  value={tenantQuery}
                  onChange={(e) => {
                    setTenantQuery(e.target.value);
                    setTenantDropdownOpen(true);
                  }}
                  onFocus={() => setTenantDropdownOpen(true)}
                  className="w-full bg-white/5 hover:bg-white/8 focus:bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition text-right font-vazir"
                />
                <FiSearch className="absolute right-3.5 top-3.5 text-white/30" />
                
                {tenantDropdownOpen && tenantSuggestions && tenantSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto divide-y divide-white/5">
                    {tenantSuggestions.map((t: any) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTenant(t);
                          setTenantDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-right text-xs hover:bg-white/5 transition text-white/80 block cursor-pointer"
                      >
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{t.subdomain}.bestiee.ir</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Search */}
          <div ref={userRef} className="relative">
            <label className="block text-xs font-bold text-white/50 mb-1.5 mr-1">کاربر / شخص (Owner)</label>
            {selectedUser ? (
              <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-2.5 text-blue-400 text-sm font-semibold">
                <span className="truncate">
                  {selectedUser.name} ({selectedUser.phone})
                </span>
                <button
                  onClick={handleClearUser}
                  className="p-1 hover:bg-blue-500/20 rounded-lg transition cursor-pointer"
                  title="حذف فیلتر"
                >
                  <FiX size={15} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجوی نام یا شماره تلفن مدیر..."
                  value={userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setUserDropdownOpen(true);
                  }}
                  onFocus={() => setUserDropdownOpen(true)}
                  className="w-full bg-white/5 hover:bg-white/8 focus:bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-right font-vazir"
                />
                <FiSearch className="absolute right-3.5 top-3.5 text-white/30" />

                {userDropdownOpen && userSuggestions && userSuggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto divide-y divide-white/5">
                    {userSuggestions.map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-right text-xs hover:bg-white/5 transition text-white/80 block cursor-pointer"
                      >
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{u.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(selectedTenant || selectedUser) && (
          <div className="flex justify-start border-t border-white/5 pt-3.5 mt-1.5">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FiX />
              <span>بازنشانی فیلترها</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Metric Highlight Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><FiMessageSquare className="text-xl" /></div>
            <h3 className="text-sm font-bold text-white/80">تعداد کل پیام‌ها</h3>
          </div>
          <div className="text-3xl font-black text-white px-1">{metrics.totalMessages.toLocaleString()}</div>
          <div className="text-xs text-blue-400 mt-[-10px] px-1 font-bold">پاسخ‌های هوش مصنوعی (Completion)</div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-blue-500/5 rotate-12 pointer-events-none transition-transform group-hover:scale-110"><FiMessageSquare /></div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><FiCpu className="text-xl" /></div>
            <h3 className="text-sm font-bold text-white/80">توکن‌های مصرفی</h3>
          </div>
          <div className="text-3xl font-black text-white px-1">{metrics.totalTokens.toLocaleString()}</div>
          <div className="text-xs text-indigo-400 mt-[-10px] px-1 font-bold">
            ورودی: {metrics.totalPromptTokens.toLocaleString()} | خروجی: {metrics.totalCompletionTokens.toLocaleString()}
          </div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-indigo-500/5 rotate-12 pointer-events-none"><FiCpu /></div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><FiTrendingUp className="text-xl" /></div>
            <h3 className="text-sm font-bold text-white/80">میانگین توکن / پیام</h3>
          </div>
          <div className="text-3xl font-black text-white px-1">{metrics.averageTokens.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 mt-[-10px] px-1 font-bold">سرعت و حجم تراکنش پردازشی</div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-emerald-500/5 rotate-12 pointer-events-none"><FiTrendingUp /></div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex flex-col gap-4 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><FiStar className="text-xl" /></div>
            <h3 className="text-sm font-bold text-white/80">اعتبار مجازی مصرفی</h3>
          </div>
          <div className="text-3xl font-black text-white px-1">{metrics.totalVirtualCredits.toLocaleString()}</div>
          <div className="text-xs text-amber-400 mt-[-10px] px-1 font-bold">نرخ محاسبه: ۱ اعتبار به ازای ۱۰۰۰ توکن</div>
          <div className="absolute -bottom-6 -right-6 text-[100px] text-amber-500/5 rotate-12 pointer-events-none"><FiStar /></div>
        </div>
      </div>

      {/* ── Remaining Credits Card Row ── */}
      <div className="glass-panel rounded-3xl border border-white/8 p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/30">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 bg-slate-800 rounded-2xl text-emerald-400 border border-white/5">
            <FiInfo size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">اعتبار باقی‌مانده تامین‌کننده گفتگو (Gemini)</h4>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">
              میزان اعتبار باقی‌مانده در حساب تامین‌کننده KIE5 جهت پردازش درخواست‌های گفتگوی هوش مصنوعی.
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-8 py-3 text-center min-w-[200px]">
            <span className="text-[10px] font-bold text-white/40 block mb-1">باقی‌مانده تامین‌کننده (KIE5)</span>
            <span className="text-lg font-black text-emerald-400">
              {metrics.kie5ProviderRemainingCredit?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* ── Recharts Graphs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tokens consumption Chart */}
        <div className="glass-panel flex flex-col rounded-3xl border border-white/8 bg-white/5 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FiCpu className="text-indigo-400" />
              نمودار مصرف روزانه توکن‌ها
            </h3>
            <p className="text-xs text-white/40 mt-1">تعداد کل توکن‌های پردازش‌شده در ۳۰ روز گذشته</p>
          </div>

          <div className="flex-1 w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="15%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="85%" stopColor="#818cf8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickFormatter={(val) => new Intl.NumberFormat("fa-IR").format(val)}
                  orientation="right"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "16px",
                    textAlign: "right",
                    fontFamily: "Vazirmatn",
                    direction: "rtl",
                  }}
                  formatter={(val: number) => [
                    `${new Intl.NumberFormat("fa-IR").format(val)} توکن`,
                    "حجم مصرف",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tokenGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Virtual Credits consumed Chart */}
        <div className="glass-panel flex flex-col rounded-3xl border border-white/8 bg-white/5 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FiStar className="text-amber-400" />
              نمودار مصرف روزانه اعتبار
            </h3>
            <p className="text-xs text-white/40 mt-1">برآورد هزینه و مصرف به صورت روزانه در ۳۰ روز گذشته</p>
          </div>

          <div className="flex-1 w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="15%" stopColor="#fbbf24" stopOpacity={0.5} />
                    <stop offset="85%" stopColor="#fbbf24" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickFormatter={(val) => new Intl.NumberFormat("fa-IR").format(val)}
                  orientation="right"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "16px",
                    textAlign: "right",
                    fontFamily: "Vazirmatn",
                    direction: "rtl",
                  }}
                  formatter={(val: number) => [
                    `${new Intl.NumberFormat("fa-IR").format(val)} اعتبار`,
                    "هزینه تخمینی",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#creditGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
