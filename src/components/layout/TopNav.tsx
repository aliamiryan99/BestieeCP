"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBell,
  FiPlus,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiHome,
  FiScissors,
  FiUsers,
  FiChevronLeft,
  FiAward,
  FiUserCheck,
  FiGrid,
  FiGlobe,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@backend/api";
import { translateRole } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "داشبورد", icon: FiHome },
  { href: "/tenants", label: "شعب", icon: FiScissors },
  { href: "/members", label: "اعضا", icon: FiUsers },
];

export function TopNav() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.auth.me);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  const dynamicNavLinks = [
    ...navLinks,
    ...(user?.role === "creator" ? [{ href: "/users", label: "کاربران", icon: FiUserCheck }] : []),
    ...(user?.role === "creator" ? [{ href: "/plans", label: "پلان‌ها", icon: FiAward }] : []),
    ...(user?.role === "creator" ? [{ href: "/services", label: "سرویس‌ها", icon: FiGrid }] : []),
    ...(user?.role === "creator" ? [{ href: "/domains", label: "دامنه‌ها", icon: FiGlobe }] : []),
  ];

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close drawer on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* ── TopNav Bar ── */}
      <header className="glass-panel sticky top-4 z-30 mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3 rounded-[2rem] border border-white/10 bg-slate-900/60 px-4 py-3 shadow-xl backdrop-blur-xl md:px-6 md:py-4">

        {/* Right Section: Logo & Brand */}
        <div className="flex items-center gap-3">
          {/* Hamburger — visible until xl breakpoint */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white xl:hidden cursor-pointer"
            aria-label="منو"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <FiX className="text-xl" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <FiMenu className="text-xl" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Logo mark */}
          <Link href="/" className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-lg xl:h-12 xl:w-12">
            <Image
              src="/BestieeLogo.webp"
              alt="Bestiee Logo"
              width={48}
              height={48}
              className="object-contain p-1.5"
            />
          </Link>

          <div className="hidden xs:block">
            <p className="text-sm font-bold text-white md:text-base xl:text-lg">پنل مدیریت</p>
            <p className="hidden text-[10px] text-white/50 md:block xl:text-xs">شعب، اعضا، کاربران، مالی و دیگر هیچ</p>
          </div>
        </div>

        {/* Center Section: Full nav — xl and above only */}
        <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 xl:flex">
          {dynamicNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`cursor-pointer flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <link.icon className="text-base shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Left Section: Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* New Tenant Button */}
          <button
            onClick={() => router.push("/tenants/new")}
            className="flex h-10 items-center gap-2 rounded-2xl bg-white px-3 text-sm font-bold text-slate-900 shadow-lg transition hover:scale-105 active:scale-95 md:h-11 md:px-5 cursor-pointer"
            title="شعبه جدید"
          >
            <FiPlus className="text-lg" />
            <span className="hidden sm:inline">شعبه جدید</span>
          </button>

          {/* Notifications */}
          <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white/70 transition hover:bg-white/10 md:h-11 md:w-11 cursor-pointer">
            <FiBell />
            <span className="absolute top-2 left-2 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-1 md:gap-3 md:bg-transparent md:p-0">
            <Link href="/profile" className="cursor-pointer hidden flex-col items-end text-right sm:flex hover:opacity-80 transition-opacity">
              <p className="max-w-[100px] truncate text-xs font-bold text-white md:max-w-[150px] md:text-sm">
                {user?.name ?? "ورود نکرده"}
              </p>
              <p className="text-[10px] text-white/40 md:text-xs">
                {translateRole(user?.role) || "مهمان"}
              </p>
            </Link>

            <Link href="/profile" className="group relative cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg text-white shadow-lg transition hover:ring-2 hover:ring-amber-500/50 md:h-11 md:w-11">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <FiUser className="text-base" />
                )}
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white/60 transition hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/20 md:h-11 md:w-11 cursor-pointer"
              title="خروج"
            >
              <FiLogOut className="text-base" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Backdrop — covers up to xl ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm xl:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Drawer — covers up to xl ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={drawerRef}
            key="drawer"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed top-[5.5rem] right-4 left-4 z-30 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl xl:hidden"
          >
            {/* User info strip */}
            <div className="flex items-center gap-4 border-b border-white/8 px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-md shrink-0">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <FiUser className="text-xl" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="truncate text-sm font-bold text-white">{user?.name ?? "ورود نکرده"}</p>
                <p className="text-xs text-white/40">{translateRole(user?.role) || "مهمان"}</p>
              </div>
              <Link
                href="/profile"
                className="cursor-pointer mr-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white shrink-0"
                onClick={() => setMobileOpen(false)}
              >
                پروفایل
                <FiChevronLeft className="text-xs" />
              </Link>
            </div>

            {/* Nav links — 2-column grid on tablet for compact layout */}
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3">
              {dynamicNavLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`cursor-pointer flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive
                        ? "bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-white border border-orange-500/20"
                        : "text-white/60 hover:bg-white/8 hover:text-white border border-transparent"
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-base transition ${isActive ? "bg-gradient-to-br from-orange-500/30 to-rose-500/30 text-orange-300" : "bg-white/5 text-white/50"}`}>
                          <link.icon />
                        </span>
                        {link.label}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Bottom strip: logout */}
            <div className="border-t border-white/8 p-3">
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 px-4 py-3 text-sm font-bold text-rose-400/80 transition hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-base">
                  <FiLogOut />
                </span>
                خروج از حساب
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
