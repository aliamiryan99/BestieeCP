"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiX,
  FiUser,
  FiUsers,
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiShield,
  FiStar,
  FiAlertTriangle,
  FiToggleRight,
  FiToggleLeft,
  FiFilter,
  FiChevronDown,
  FiHash,
  FiActivity,
  FiAward,
  FiUserCheck,
  FiUserX,
  FiSlash,
  FiHome,
} from "react-icons/fi";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { translateRole } from "@/lib/translations";

// ─── Types ───────────────────────────────────────────────────────────────────
type UserRole = "creator" | "promoter" | "owner" | "staff" | "customer";
type Gender = "male" | "female";

type EnrichedUser = {
  _id: string;
  _creationTime: number;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  active: boolean;
  ban: boolean;
  privilege: boolean;
  reputation: number;
  credit: number;
  score?: number;
  city: string;
  gender: Gender;
  job?: string;
  address?: string;
  tenantId?: string;
  profilePictureUrl?: string | null;
  tenantName?: string | null;
};

// ─── Role Configuration ───────────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, {
  label: string;
  gradient: string;
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
}> = {
  creator: {
    label: "خالق",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-300",
    icon: <FiShield />,
  },
  promoter: {
    label: "پروموتر",
    gradient: "from-indigo-400 to-violet-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-300",
    icon: <FiStar />,
  },
  owner: {
    label: "مدیر شعبه",
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-300",
    icon: <FiHome />,
  },
  staff: {
    label: "پرسنل",
    gradient: "from-cyan-400 to-blue-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-300",
    icon: <FiUserCheck />,
  },
  customer: {
    label: "مشتری",
    gradient: "from-rose-400 to-pink-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-300",
    icon: <FiUser />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeSince(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "همین الان";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  return `${Math.floor(h / 24)} روز پیش`;
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 px-3 py-1.5">
      <span className={`text-sm font-black ${color}`}>{value}</span>
      <span className="text-[10px] text-white/30">{label}</span>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ user, size = "md" }: { user: EnrichedUser; size?: "sm" | "md" | "lg" }) {
  const role = ROLE_CONFIG[user.role];
  const dims = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-xs";
  return (
    <div className={`relative shrink-0 ${dims} overflow-hidden rounded-2xl bg-gradient-to-br ${role.gradient} font-bold text-black shadow flex items-center justify-center`}>
      {user.profilePictureUrl
        ? <img src={user.profilePictureUrl} alt={user.name} className="h-full w-full object-cover" />
        : getInitials(user.name)
      }
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, selected, onClick }: { user: EnrichedUser; selected: boolean; onClick: () => void }) {
  const role = ROLE_CONFIG[user.role];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer group flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all duration-200 ${
        selected
          ? "border-orange-500/30 bg-orange-500/8 shadow-lg shadow-orange-500/5"
          : "border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10"
      }`}
    >
      {/* Avatar */}
      <UserAvatar user={user} size="md" />

      {/* Name + role */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white text-sm truncate">{user.name}</p>
          {user.ban && <FiSlash className="text-rose-400 text-xs shrink-0" title="مسدود" />}
          {user.privilege && <FiShield className="text-violet-400 text-xs shrink-0" title="امتیازی" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`flex items-center gap-1 text-[10px] font-bold ${role.text}`}>
            {role.icon}
            {role.label}
          </span>
          {user.tenantName && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-[10px] text-white/40 truncate">{user.tenantName}</span>
            </>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="hidden md:flex items-center gap-1.5 text-xs text-white/40">
        <FiPhone className="text-white/20 shrink-0" />
        <span dir="ltr">{user.phone}</span>
      </div>

      {/* City */}
      <div className="hidden lg:flex items-center gap-1 text-xs text-white/40">
        <FiMapPin className="text-white/20 shrink-0 text-xs" />
        {user.city}
      </div>

      {/* Status */}
      <div className="shrink-0">
        {user.active ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <FiToggleRight className="text-xs" />
            فعال
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
            <FiToggleLeft className="text-xs" />
            غیرفعال
          </span>
        )}
      </div>

      {/* Time */}
      <span className="hidden xl:block shrink-0 text-[10px] text-white/25">{timeSince(user._creationTime)}</span>
    </div>
  );
}

// ─── User Detail Panel ────────────────────────────────────────────────────────
function UserDetailPanel({ user, onClose }: { user: EnrichedUser; onClose: () => void }) {
  const role = ROLE_CONFIG[user.role];

  const infoRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <FiPhone />, label: "موبایل", value: user.phone },
    ...(user.email ? [{ icon: <FiMail />, label: "ایمیل", value: user.email }] : []),
    { icon: <FiMapPin />, label: "شهر", value: user.city },
    { icon: <FiClock />, label: "عضویت", value: new Date(user._creationTime).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) },
    ...(user.tenantName ? [{ icon: <FiHome />, label: "شعبه", value: user.tenantName }] : []),
    ...(user.job ? [{ icon: <FiActivity />, label: "شغل", value: user.job }] : []),
    ...(user.address ? [{ icon: <FiMapPin />, label: "آدرس", value: user.address }] : []),
  ];

  return (
    <div className="sticky top-4 flex flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl">
      {/* Close */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">جزئیات کاربر</p>
        <button onClick={onClose} className="cursor-pointer h-7 w-7 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all">
          <FiX className="text-sm" />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 text-center pt-2">
        <div className={`relative h-20 w-20 overflow-hidden rounded-3xl bg-gradient-to-br ${role.gradient} font-black text-black text-xl shadow-lg flex items-center justify-center`}>
          {user.profilePictureUrl
            ? <img src={user.profilePictureUrl} alt={user.name} className="h-full w-full object-cover" />
            : getInitials(user.name)
          }
        </div>
        <div>
          <h3 className="text-lg font-black text-white">{user.name}</h3>
          <span className={`inline-flex items-center gap-1.5 mt-1 rounded-full px-3 py-1 text-xs font-bold ${role.bg} ${role.text} border ${role.border}`}>
            {role.icon}
            {role.label}
          </span>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${user.active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border-rose-500/20 text-rose-300"}`}>
          {user.active ? <FiToggleRight /> : <FiToggleLeft />}
          {user.active ? "فعال" : "غیرفعال"}
        </span>
        {user.ban && (
          <span className="flex items-center gap-1 rounded-full bg-red-900/30 border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-300">
            <FiAlertTriangle className="text-xs" />
            مسدود
          </span>
        )}
        {user.privilege && (
          <span className="flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-[11px] font-bold text-violet-300">
            <FiShield className="text-xs" />
            امتیازی
          </span>
        )}
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border ${user.gender === "male" ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-pink-500/10 border-pink-500/20 text-pink-300"}`}>
          {user.gender === "male" ? "آقا" : "خانم"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="اعتبار" value={user.credit.toLocaleString()} color="text-emerald-400" />
        <StatPill label="شهرت" value={`${user.reputation} ★`} color="text-amber-400" />
        {user.role === "promoter" && (
          <StatPill label="امتیاز" value={user.score ?? 0} color="text-indigo-400" />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Info rows */}
      <div className="flex flex-col gap-3">
        {infoRows.map((row, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-white/25 mt-0.5 shrink-0 text-sm">{row.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-white/30 leading-none mb-0.5">{row.label}</p>
              <p className="text-xs text-white/80 break-all" dir={row.label === "موبایل" || row.label === "ایمیل" ? "ltr" : "rtl"}>{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ID */}
      <div className="mt-auto rounded-xl bg-white/3 border border-white/5 p-3">
        <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1">User ID</p>
        <p className="text-[10px] font-mono text-white/40 break-all">{user._id}</p>
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
        active
          ? "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow shadow-orange-500/10"
          : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-4 rounded-2xl border border-white/5 bg-white/3 px-4 py-3">
      <div className="h-10 w-10 rounded-2xl bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-white/10" />
        <div className="h-2.5 w-20 rounded bg-white/10" />
      </div>
      <div className="h-3 w-24 rounded bg-white/10 hidden md:block" />
      <div className="h-5 w-14 rounded-full bg-white/10" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const router = useRouter();
  const me = useQuery(api.users.auth.me);
  const rawUsers = useQuery(api.users.users.listAllUsers);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "banned">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const users = rawUsers as EnrichedUser[] | undefined;

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!users) return [];
    let list = [...users];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email?.toLowerCase().includes(q)) ||
        (u.city?.toLowerCase().includes(q)) ||
        (u.tenantName?.toLowerCase().includes(q))
      );
    }
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (statusFilter === "active") list = list.filter(u => u.active && !u.ban);
    if (statusFilter === "inactive") list = list.filter(u => !u.active);
    if (statusFilter === "banned") list = list.filter(u => u.ban);
    if (genderFilter !== "all") list = list.filter(u => u.gender === genderFilter);

    return list;
  }, [users, search, roleFilter, statusFilter, genderFilter]);

  // ── Summary Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!users) return null;
    return {
      total: users.length,
      active: users.filter(u => u.active && !u.ban).length,
      banned: users.filter(u => u.ban).length,
      customers: users.filter(u => u.role === "customer").length,
      owners: users.filter(u => u.role === "owner").length,
      tenantStaff: users.filter(u => u.role === "staff").length,
      creators: users.filter(u => u.role === "creator").length,
      promoters: users.filter(u => u.role === "promoter").length,
    };
  }, [users]);

  const loading = me === undefined || rawUsers === undefined;

  if (!loading && me?.role !== "creator") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 border border-rose-500/20">
          <FiSlash className="text-2xl text-rose-400" />
        </div>
        <p className="text-lg font-bold text-white">دسترسی ندارید</p>
        <p className="text-sm text-white/40">مدیریت کاربران فقط برای نقش خالق قابل دسترس است.</p>
        <button onClick={() => router.push("/")} className="cursor-pointer mt-4 rounded-2xl border border-white/10 px-6 py-2.5 text-sm text-white/60 hover:bg-white/5 transition">
          بازگشت به داشبورد
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
              <FiUsers className="text-xl text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">مدیریت کاربران</h1>
              <p className="text-sm text-white/40 mt-0.5">مشتریان، پرسنل شعب، مدیران و همکاران پلتفرم</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "کل کاربران", value: stats.total, color: "text-white" },
              { label: "فعال", value: stats.active, color: "text-emerald-400" },
              { label: "مسدود", value: stats.banned, color: "text-rose-400" },
              { label: "مشتری", value: stats.customers, color: "text-rose-300" },
              { label: "مدیر شعبه", value: stats.owners, color: "text-emerald-300" },
              { label: "پرسنل", value: stats.tenantStaff, color: "text-cyan-300" },
              { label: "خالق/پروموتر", value: stats.creators + stats.promoters, color: "text-amber-300" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
                <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] text-white/35">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filter toggle */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange-400/50 focus:bg-white/8"
              placeholder="جستجو نام، موبایل، ایمیل، شهر، شعبه..."
            />
            {search && (
              <button onClick={() => setSearch("")} className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition">
                <FiX className="text-sm" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`cursor-pointer flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${showFilters ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"}`}
          >
            <FiFilter className="text-base" />
            فیلتر
            <FiChevronDown className={`text-xs transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filter rows */}
        {showFilters && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/3 p-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">نقش</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="همه" active={roleFilter === "all"} onClick={() => setRoleFilter("all")} />
                <FilterChip label="مشتری" active={roleFilter === "customer"} onClick={() => setRoleFilter("customer")} />
                <FilterChip label="پرسنل" active={roleFilter === "staff"} onClick={() => setRoleFilter("staff")} />
                <FilterChip label="مدیر شعبه" active={roleFilter === "owner"} onClick={() => setRoleFilter("owner")} />
                <FilterChip label="پروموتر" active={roleFilter === "promoter"} onClick={() => setRoleFilter("promoter")} />
                <FilterChip label="خالق" active={roleFilter === "creator"} onClick={() => setRoleFilter("creator")} />
              </div>
            </div>
            <div className="border-t border-white/5" />
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">وضعیت</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="همه" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <FilterChip label="فعال" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
                <FilterChip label="غیرفعال" active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")} />
                <FilterChip label="مسدود" active={statusFilter === "banned"} onClick={() => setStatusFilter("banned")} />
              </div>
            </div>
            <div className="border-t border-white/5" />
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">جنسیت</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip label="همه" active={genderFilter === "all"} onClick={() => setGenderFilter("all")} />
                <FilterChip label="آقا" active={genderFilter === "male"} onClick={() => setGenderFilter("male")} />
                <FilterChip label="خانم" active={genderFilter === "female"} onClick={() => setGenderFilter("female")} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className={`grid gap-6 ${selectedUser ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1"}`}>

        {/* User list */}
        <div className="flex flex-col gap-3">

          {/* Result count */}
          {!loading && (
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-white/40">
                نمایش <span className="font-bold text-white">{filtered.length}</span> کاربر
                {users && filtered.length !== users.length && (
                  <span className="text-white/25"> از {users.length}</span>
                )}
              </p>
              {(search || roleFilter !== "all" || statusFilter !== "all" || genderFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setGenderFilter("all"); }}
                  className="cursor-pointer text-xs text-orange-400/70 hover:text-orange-300 transition"
                >
                  پاکسازی فیلترها
                </button>
              )}
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center rounded-3xl border border-white/5 bg-white/3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                <FiUserX className="text-2xl text-white/30" />
              </div>
              <p className="text-white/40 text-sm">کاربری با این مشخصات یافت نشد.</p>
              <button onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setGenderFilter("all"); }} className="cursor-pointer text-xs text-orange-400/60 hover:text-orange-300 transition">
                پاکسازی فیلترها
              </button>
            </div>
          )}

          {/* User rows */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {filtered.map((user) => (
                <UserRow
                  key={user._id}
                  user={user}
                  selected={selectedUser?._id === user._id}
                  onClick={() => setSelectedUser(prev => prev?._id === user._id ? null : user)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedUser && (
          <div className="lg:block">
            <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
