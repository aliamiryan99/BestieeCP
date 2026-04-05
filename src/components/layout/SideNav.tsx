import Link from "next/link";
import {
  FiBarChart2,
  FiCalendar,
  FiHome,
  FiScissors,
  FiSettings,
  FiUsers,
} from "react-icons/fi";

const navSections = [
  {
    title: "مدیریت شعب",
    items: [
      { href: "/", label: "خانه", icon: FiHome },
      { href: "/tenants", label: "شعبه‌ها", icon: FiScissors },
      { href: "/members", label: "اعضا", icon: FiBarChart2 },
    ],
  },
];

export function SideNav() {
  return (
    <aside className="glass-panel side-rail flex w-full max-w-xs flex-col gap-6 rounded-3xl px-5 py-6 text-white/80 lg:max-w-sm">
      <div className="flex flex-col gap-5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-soft">
              {section.title}
            </p>
            <div className="flex flex-col gap-2">
              {section.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-white/0 px-4 py-3 text-sm font-medium transition hover:border-white/10 hover:bg-white/10 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-base text-white/70 transition group-hover:bg-gradient-to-br group-hover:from-orange-500/80 group-hover:to-rose-500/80 group-hover:text-white">
                      <Icon />
                    </span>
                    {label}
                  </span>
                  <span className="text-xs text-muted-soft transition group-hover:text-white">
                    مشاهده
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
