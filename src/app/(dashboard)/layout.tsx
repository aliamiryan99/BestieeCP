import { TopNav } from "@/components/layout/TopNav";
import { AuthGuard } from "@/components/system/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TopNav />
      <div className="app-layout">
        <main className="glass-panel content-surface flex-1 rounded-3xl p-6 lg:p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
