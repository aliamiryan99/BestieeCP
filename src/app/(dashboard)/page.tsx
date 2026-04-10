"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { MainStatsCard, MetricGroup, AICreditBar } from "@/components/dashboard/DashboardCards";
import { FiUsers, FiUser, FiAward, FiStar, FiCpu, FiTrendingUp, FiActivity, FiGlobe, FiX } from "react-icons/fi";
import Link from "next/link";
import { Doc } from "@backend/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard/DashboardCharts").then(m => m.DashboardCharts),
  { ssr: false, loading: () => <div className="h-96 rounded-3xl border border-white/8 bg-white/3 animate-pulse" /> }
);

function AnnouncementModal({ announcement, onClose }: { announcement: Doc<"announcements"> | null, onClose: () => void }) {
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl p-8 flex flex-col gap-6"
      >
        <button 
          onClick={onClose}
          className="cursor-pointer absolute top-6 left-6 h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-300"
        >
          <FiX className="text-lg" />
        </button>

        <div className="flex flex-col gap-2 pt-2">
           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/80">
            اطلاعیه سیستم
          </span>
          <h2 className="text-2xl font-black text-white">{announcement.title}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-soft">
            <span>توسط سیستم</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>منتشر شده در تاریخ {new Date(announcement._creationTime).toLocaleDateString("fa-IR")}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 border-y border-white/5 py-6">
          <p className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        <div className="flex items-center justify-end pt-2">
           <button 
            onClick={onClose}
            className="cursor-pointer rounded-2xl bg-gradient-to-l from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-8 py-3 text-sm font-bold text-orange-300 hover:from-orange-500/30 hover:to-amber-500/30 transition-all duration-300"
           >
            متوجه شدم
           </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const data = useQuery(api.dashboard.getDashboardMetrics);
  const loading = data === undefined;
  
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Doc<"announcements"> | null>(null);

  // Announcements section remains at the top for all
  const announcements = useQuery(api.announcements.list) ?? [];
  const topAnnouncements = announcements.slice(0, 3);

  const timeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " روز پیش";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ساعت پیش";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " دقیقه پیش";
    return "همین الان";
  };

  const renderAnnouncements = () => (
    <section className="glass-panel flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 p-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">اطلاعیه‌ها</h2>
        <Link href="/announcements" className="cursor-pointer text-sm text-orange-200/80 hover:text-orange-300 transition-colors">
          مشاهده همه اطلاعیه‌ها
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {topAnnouncements.length === 0 ? (
          <p className="text-sm text-muted-soft pt-2">هیچ اطلاعیه‌ای وجود ندارد.</p>
        ) : (
          topAnnouncements.map((announcement: Doc<"announcements">) => (
            <div 
              key={announcement._id} 
              onClick={() => setSelectedAnnouncement(announcement)}
              className="cursor-pointer group relative z-10 hover:z-50 flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <p className="text-sm font-semibold text-white">{announcement.title}</p>
              <p className="text-xs text-muted-soft leading-relaxed line-clamp-2">{announcement.content}</p>
              <span className="mt-auto text-[10px] text-muted-soft pt-2">{timeSince(announcement._creationTime)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {renderAnnouncements()}
        <div className="h-64 bg-white/5 rounded-3xl border border-white/10"></div>
      </div>
    );
  }

  // Fallback for unauthorized/unhandled roles
  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        {renderAnnouncements()}
        <div className="glass-panel text-center p-12 rounded-3xl border border-white/10 text-white/50">
          دسترسی به آمار پیشرفته برای نقش شما محدود شده است.
        </div>
      </div>
    );
  }


  const role = data.role;
  const metrics = data.metrics as any;

  if (role === "creator") {
    return (
      <div className="flex flex-col gap-8 pb-12">
        {renderAnnouncements()}

        <MetricGroup title="آمار کلی سیستم" icon={<FiAward />}>
          <MainStatsCard
            title="کل شعب سیستم"
            value={metrics.tenants.total}
            icon={<FiAward />}
            gradient="from-emerald-500 to-teal-600"
            submetrics={[
              { label: "رایگان", value: metrics.tenants.free, color: "text-emerald-400" },
              { label: "حرفه‌ای", value: metrics.tenants.paid, color: "text-indigo-400" },
              { label: "اولترا", value: metrics.tenants.ultra, color: "text-amber-400" }
            ]}
          />
          <MainStatsCard
            title="همکاران (پلتفرم)"
            value={metrics.staff.total}
            icon={<FiUsers />}
            gradient="from-indigo-500 to-purple-600"
            submetrics={[
              { label: "توسعه‌دهندگان", value: metrics.staff.creators },
              { label: "پروموترها", value: metrics.staff.promoters }
            ]}
          />
          <MainStatsCard
            title="مجموع مشتریان شعبه‌ها"
            value={metrics.customers.total}
            icon={<FiActivity />}
            gradient="from-rose-500 to-pink-600"
            submetrics={[
              { label: "آقایان", value: metrics.customers.men, color: "text-blue-300" },
              { label: "بانوان", value: metrics.customers.women, color: "text-pink-300" }
            ]}
          />
          <MainStatsCard
            title="کاربران شعب (مدیران و پرسنل)"
            value={metrics.tenantStaff.total}
            icon={<FiUsers />}
            gradient="from-cyan-500 to-blue-600"
            submetrics={[
              { label: "مدیران", value: metrics.tenantStaff.owners, color: "text-cyan-300" },
              { label: "پرسنل", value: metrics.tenantStaff.staff, color: "text-blue-300" }
            ]}
          />
        </MetricGroup>

        <MetricGroup title="تفکیک بر اساس نوع تخصص" icon={<FiStar />}>
          <MainStatsCard
            title="آرایشگاه‌های مردانه"
            value={metrics.tenants.byType.barbers.total}
            icon={<FiUser />}
            gradient="from-blue-500 to-indigo-600"
            submetrics={[
              { label: "رایگان", value: metrics.tenants.byType.barbers.free, color: "text-blue-300" },
              { label: "حرفه‌ای", value: metrics.tenants.byType.barbers.paid, color: "text-indigo-300" },
              { label: "اولترا", value: metrics.tenants.byType.barbers.ultra, color: "text-violet-300" }
            ]}
          />
          <MainStatsCard
            title="آرایشگاه‌های زنانه"
            value={metrics.tenants.byType.barbies.total}
            icon={<FiUser />}
            gradient="from-pink-500 to-rose-600"
            submetrics={[
              { label: "رایگان", value: metrics.tenants.byType.barbies.free, color: "text-pink-300" },
              { label: "حرفه‌ای", value: metrics.tenants.byType.barbies.paid, color: "text-rose-300" },
              { label: "اولترا", value: metrics.tenants.byType.barbies.ultra, color: "text-orange-300" }
            ]}
          />
        </MetricGroup>

        <MetricGroup title="منابع و هوش مصنوعی" icon={<FiCpu />}>
          <MainStatsCard
            title="اعتبار کل سیستم"
            value={metrics.ai.availableCredit.toLocaleString()}
            icon={<FiStar />}
            gradient="from-amber-400 to-orange-500"
            submetrics={[
              { label: "مصرف شده", value: metrics.ai.cumulativeUsage.toLocaleString(), color: "text-rose-400" }
            ]}
          />

          <div className="glass-panel col-span-1 md:col-span-2 lg:col-span-3 rounded-[2rem] border border-white/5 bg-slate-900/60 p-6 shadow-2xl flex flex-col gap-6 lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-white/10">

            {/* Model Distribution */}
            <div className="flex-1 flex flex-col gap-6 lg:pl-6">
              <h4 className="text-sm font-bold text-white/60 mb-2">تخصیص اعتبار مدل‌ها</h4>
              <div className="flex flex-col gap-5">
                {metrics.ai.tools.map((t: any, i: number) => (
                  <AICreditBar key={i} name={t.name} credit={t.credit} maxCredit={25000} />
                ))}
              </div>
            </div>

            {/* Demographics Usage */}
            <div className="flex-1 flex flex-col gap-4 pt-6 lg:pt-0 lg:pr-6">
              <h4 className="text-sm font-bold text-white/60 mb-2">آمار مصرف به تفکیک جنسیت و شهر</h4>

              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50">آقایان</span>
                  <span className="text-sm font-black text-blue-400">{metrics.ai.usageByGender.male.toLocaleString()}</span>
                </div>
                <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50">بانوان</span>
                  <span className="text-sm font-black text-pink-400">{metrics.ai.usageByGender.female.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                {metrics.ai.usageByCity.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-xl">
                    <span className="text-white/40 font-bold flex items-center gap-1"><FiGlobe className="opacity-50" /> {c.city}</span>
                    <span className="text-indigo-300 font-bold">{c.usage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MetricGroup>

        {/* ── Analytics Charts ── */}
        <DashboardCharts />

        <AnimatePresence>
          {selectedAnnouncement && (
            <AnnouncementModal 
              announcement={selectedAnnouncement} 
              onClose={() => setSelectedAnnouncement(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Promoter View
  return (
    <div className="flex flex-col gap-8 pb-12">
      {renderAnnouncements()}

      <MetricGroup title="شاخص‌های عملکرد پروموتر" icon={<FiStar />}>
        <MainStatsCard
          title="امتیاز پروموتر (Score)"
          value={metrics.score}
          icon={<FiTrendingUp />}
          gradient="from-amber-400 to-orange-500"
        />

        <MainStatsCard
          title="شعب ارجاعی شما"
          value={metrics.tenants.total}
          icon={<FiAward />}
          gradient="from-emerald-500 to-teal-600"
          submetrics={[
            { label: "رایگان", value: metrics.tenants.free, color: "text-emerald-400" },
            { label: "حرفه‌ای", value: metrics.tenants.paid, color: "text-indigo-400" },
            { label: "اولترا", value: metrics.tenants.ultra, color: "text-amber-400" }
          ]}
        />

        <MainStatsCard
          title="مشتریان زیرمجموعه (از طریق شعب)"
          value={metrics.customers.total}
          icon={<FiUsers />}
          gradient="from-indigo-500 to-purple-600"
          submetrics={[
            { label: "آقایان", value: metrics.customers.men, color: "text-blue-300" },
            { label: "بانوان", value: metrics.customers.women, color: "text-pink-300" }
          ]}
        />

        <MainStatsCard
          title="کاربران شعب ارجاعی شما"
          value={metrics.tenantStaff.total}
          icon={<FiUsers />}
          gradient="from-cyan-500 to-blue-600"
          submetrics={[
            { label: "مدیران", value: metrics.tenantStaff.owners, color: "text-cyan-300" },
            { label: "پرسنل", value: metrics.tenantStaff.staff, color: "text-blue-300" }
          ]}
        />
      </MetricGroup>

      <MetricGroup title="تفکیک شعب ارجاعی بر اساس تخصص" icon={<FiStar />}>
        <MainStatsCard
          title="آرایشگاه‌های مردانه"
          value={metrics.tenants.byType.barbers.total}
          icon={<FiUser />}
          gradient="from-blue-500 to-indigo-600"
          submetrics={[
            { label: "رایگان", value: metrics.tenants.byType.barbers.free, color: "text-blue-300" },
            { label: "حرفه‌ای", value: metrics.tenants.byType.barbers.paid, color: "text-indigo-300" },
            { label: "اولترا", value: metrics.tenants.byType.barbers.ultra, color: "text-violet-300" }
          ]}
        />
        <MainStatsCard
          title="آرایشگاه‌های زنانه"
          value={metrics.tenants.byType.barbies.total}
          icon={<FiUser />}
          gradient="from-pink-500 to-rose-600"
          submetrics={[
            { label: "رایگان", value: metrics.tenants.byType.barbies.free, color: "text-pink-300" },
            { label: "حرفه‌ای", value: metrics.tenants.byType.barbies.paid, color: "text-rose-300" },
            { label: "اولترا", value: metrics.tenants.byType.barbies.ultra, color: "text-orange-300" }
          ]}
        />
      </MetricGroup>

      {/* ── Analytics Charts ───────────────────────────────── */}
      <DashboardCharts />

      <AnimatePresence>
        {selectedAnnouncement && (
          <AnnouncementModal 
            announcement={selectedAnnouncement} 
            onClose={() => setSelectedAnnouncement(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
