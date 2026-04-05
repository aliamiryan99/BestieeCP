"use client";

import { useState } from "react";
import Link from "next/link";
import { FiBell, FiPlus } from "react-icons/fi";
import { AddTenantModal } from "@/components/dashboard/AddTenantModal";
import { useAuthStore } from "@/store/authStore";

const navLinks = [
  { href: "/", label: "داشبورد" },
  { href: "/customers", label: "شعبه‌ها" },
  { href: "/members", label: "اعضا" },
];

export function TopNav() {
  const [showAdd, setShowAdd] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="glass-panel sticky top-0 z-20 mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 rounded-3xl px-6 py-4 shadow-xl shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/90 via-amber-500/80 to-rose-500/80 text-xl font-bold text-white shadow-inner">
            CP
          </div>
          <div>
            <p className="text-lg font-semibold text-white">پنل مدیریت شعب</p>
            <p className="text-sm text-muted">مدیریت همه سالن‌ها</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="group flex items-center gap-2 rounded-full bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40"
          >
            <FiPlus className="text-lg transition group-hover:scale-110" />
            <span>افزودن شعبه جدید</span>
          </button>
          <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white/80 transition hover:bg-white/10">
            <FiBell />
            <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
              3
            </span>
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right text-white/80">
            <div>
              <p className="text-sm font-semibold text-white">
                {user?.name ?? "ورود نکرده"}
              </p>
              <p className="text-xs text-muted-soft">{user?.role ?? "Guest"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 text-base font-bold text-white transition hover:opacity-80"
              aria-label="خروج"
            >
              ⎋
            </button>
          </div>
        </div>
      </header>

      <AddTenantModal open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}
