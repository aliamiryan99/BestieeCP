"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiUsers,
  FiScissors,
  FiUserCheck,
  FiStar,
  FiArrowUp,
  FiInbox,
  FiChevronRight,
} from "react-icons/fi";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type AggregateItem = {
  count: number;
  cursor: number;
};

type NotifEvent = {
  _id: string;
  type: string;
  actorId: string;
  actorName: string;
  actorLevel: number;
  metadata?: { oldLevel?: number; newLevel?: number };
  seen: boolean;
  createdAt: number;
};

type NotificationData = {
  role: string;
  aggregates: {
    newTenants?: AggregateItem;
    newMembers?: AggregateItem;
    newUsers?: AggregateItem;
  };
  events: NotifEvent[];
  totalUnread: number;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} روز پیش`;
  if (hours > 0) return `${hours} ساعت پیش`;
  if (minutes > 0) return `${minutes} دقیقه پیش`;
  return "همین الان";
}

function levelColor(level: number): string {
  if (level >= 9) return "from-amber-500 to-rose-500";
  if (level >= 7) return "from-purple-500 to-pink-500";
  if (level >= 5) return "from-blue-500 to-cyan-500";
  if (level >= 3) return "from-emerald-500 to-teal-500";
  return "from-slate-600 to-slate-500";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AggregateRow({
  icon,
  label,
  count,
  category,
  linkHref,
  onMarkSeen,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  category: string;
  linkHref?: string;
  onMarkSeen: (cat: string) => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent px-4 py-3 transition hover:bg-orange-500/15 shadow-[0_4px_12px_-2px_rgba(249,115,22,0.08)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 text-orange-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">
          {count} {label} جدید
        </p>
        {linkHref && (
          <Link href={linkHref} className="text-[11px] text-white/40 hover:text-orange-300 transition">
            مشاهده &rarr;
          </Link>
        )}
      </div>
      <button
        onClick={() => onMarkSeen(category)}
        title="علامت به عنوان خوانده شده"
        className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
      >
        <FiCheck className="text-sm" />
      </button>
    </div>
  );
}

function EventRow({
  event,
  onDismiss,
}: {
  event: NotifEvent;
  onDismiss: (id: string) => void;
}) {
  const initials = event.actorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const newLevel = event.metadata?.newLevel ?? event.actorLevel;
  const oldLevel = event.metadata?.oldLevel ?? newLevel - 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-start gap-3 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent px-4 py-3 transition hover:bg-purple-500/15 shadow-[0_4px_12px_-2px_rgba(168,85,247,0.08)]"
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${levelColor(newLevel)} text-black text-xs font-black shadow-md`}
      >
        {initials}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">
          <span className="font-bold">{event.actorName}</span>
          <span className="text-white/60"> به </span>
          <span className="font-black text-amber-400">سطح {newLevel}</span>
          <span className="text-white/60"> رسید</span>
          <span className="mr-1.5 inline-flex items-center gap-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
            <FiArrowUp className="text-[9px]" />
            {oldLevel} ← {newLevel}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] text-white/30">{timeAgo(event.createdAt)}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(event._id)}
        className="cursor-pointer mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/25 transition hover:border-white/20 hover:text-white/60"
      >
        <FiX className="text-xs" />
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const totalCount = useQuery(api.notifications.notifications.getTotalUnreadCount);
  const notifData = useQuery(
    api.notifications.notifications.getMyNotifications
  ) as NotificationData | null | undefined;

  const markCategorySeen = useMutation(api.notifications.notifications.markCategorySeen);
  const markNotifSeen = useMutation(api.notifications.notifications.markNotificationSeen);
  const markAllSeen = useMutation(api.notifications.notifications.markAllSeen);

  const hasUnread = (totalCount ?? 0) > 0;
  const loading = notifData === undefined;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkCategory = async (category: string) => {
    await markCategorySeen({ category });
  };

  const handleDismissEvent = async (id: string) => {
    await markNotifSeen({ notificationId: id as any });
  };

  const handleMarkAll = async () => {
    await markAllSeen({});
  };

  const aggregates = notifData?.aggregates ?? {};
  const events = notifData?.events ?? [];
  const role = notifData?.role;

  const hasAnyContent =
    (aggregates as any).newTenants?.count > 0 ||
    (aggregates as any).newMembers?.count > 0 ||
    (aggregates as any).newUsers?.count > 0 ||
    events.length > 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell"
        onClick={() => setOpen((v) => !v)}
        className={`cursor-pointer relative flex h-10 w-10 items-center justify-center rounded-2xl border transition md:h-11 md:w-11 ${
          open
            ? "border-orange-500/40 bg-orange-500/15 text-orange-400 shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)]"
            : (hasUnread
              ? "border-amber-500/40 bg-amber-500/10 text-amber-500/90 shadow-[0_0_15px_-5px_rgba(245,158,11,0.5)] hover:border-amber-500/60 hover:bg-amber-500/15"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white")
        }`}
        aria-label="اعلان‌ها"
      >
        <motion.span
          animate={hasUnread && !open ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ repeat: Infinity, repeatDelay: 5, duration: 0.5 }}
        >
          <FiBell className="text-lg" />
        </motion.span>

        {/* Badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-900"
            >
              {(totalCount ?? 0) > 9 ? "9+" : totalCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[360px] max-h-[540px] overflow-hidden flex flex-col rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
            style={{ direction: "rtl" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <FiBell className="text-sm text-orange-400" />
                </div>
                <p className="text-sm font-black text-white">اعلان‌ها</p>
                {hasUnread && (
                  <span className="flex items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-black text-rose-400 shadow-[0_0_10px_-2px_rgba(244,63,94,0.3)]">
                    {totalCount} جدید
                  </span>
                )}
              </div>
              {hasAnyContent && (
                <button
                  onClick={handleMarkAll}
                  className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/50 transition hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"
                >
                  <FiCheckCircle className="text-xs" />
                  همه را خواندم
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {loading && (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && !hasAnyContent && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    <FiInbox className="text-2xl text-white/25" />
                  </div>
                  <p className="text-sm text-white/30">هیچ اعلان جدیدی ندارید</p>
                </div>
              )}

              {!loading && hasAnyContent && (
                <>
                  {/* ── Aggregate Section ── */}
                  {((aggregates as any).newTenants?.count > 0 ||
                    (aggregates as any).newMembers?.count > 0 ||
                    (aggregates as any).newUsers?.count > 0) && (
                    <div className="flex flex-col gap-2">
                      <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                        رویدادهای جدید
                      </p>

                      {role === "creator" && (
                        <>
                          <AggregateRow
                            icon={<FiScissors className="text-base" />}
                            label="شعبه"
                            count={(aggregates as any).newTenants?.count ?? 0}
                            category="tenants"
                            linkHref={`/tenants?since=${(aggregates as any).newTenants?.cursor ?? 0}`}
                            onMarkSeen={handleMarkCategory}
                          />
                          <AggregateRow
                            icon={<FiUsers className="text-base" />}
                            label="عضو"
                            count={(aggregates as any).newMembers?.count ?? 0}
                            category="members"
                            linkHref={`/members?since=${(aggregates as any).newMembers?.cursor ?? 0}`}
                            onMarkSeen={handleMarkCategory}
                          />
                          <AggregateRow
                            icon={<FiUserCheck className="text-base" />}
                            label="کاربر"
                            count={(aggregates as any).newUsers?.count ?? 0}
                            category="users"
                            linkHref={`/users?since=${(aggregates as any).newUsers?.cursor ?? 0}`}
                            onMarkSeen={handleMarkCategory}
                          />
                        </>
                      )}

                      {role === "promoter" && (
                        <AggregateRow
                          icon={<FiUserCheck className="text-base" />}
                          label="کاربر"
                          count={(aggregates as any).newUsers?.count ?? 0}
                          category="promoter_users"
                          linkHref={`/users?since=${(aggregates as any).newUsers?.cursor ?? 0}`}
                          onMarkSeen={handleMarkCategory}
                        />
                      )}
                    </div>
                  )}

                  {/* ── Events Section ── */}
                  {events.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-1.5">
                        <FiStar className="text-amber-400" />
                        ارتقاء سطح
                      </p>
                      <AnimatePresence mode="popLayout">
                        {events.map((event) => (
                          <EventRow
                            key={event._id}
                            event={event}
                            onDismiss={handleDismissEvent}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/8 px-5 py-3">
              <p className="text-center text-[10px] text-white/20">
                اعلان‌ها بلادرنگ به‌روزرسانی می‌شوند
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
