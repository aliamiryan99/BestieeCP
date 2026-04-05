'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiLogIn, FiUser } from 'react-icons/fi';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useToastStore } from '@/store/toastStore';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [loading, setLoading] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signIn("password", { phone, password, flow: "signIn" });
      pushToast({
        type: 'success',
        title: 'ورود موفق',
        message: 'در حال انتقال به داشبورد',
      });
      router.replace('/');
    } catch (e: any) {
      pushToast({
        type: 'error',
        title: 'ورود ناموفق',
        message: e?.message ?? 'اطلاعات ورود صحیح نیست',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
      <div>
        <p className="text-sm text-orange-200/80">پنل پشتیبانی</p>
        <h1 className="mt-1 text-2xl font-bold text-white">ورود به سیستم</h1>
        <p className="text-sm text-muted-soft">
          با شماره کاربری/موبایل و رمز عبور وارد شوید تا دسترسی شعبات خود را مدیریت کنید.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">نام کاربری یا موبایل</span>
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
            <FiUser className="text-muted" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-white outline-none"
              placeholder="مثال: 0912..."
            />
          </div>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-muted">رمز عبور</span>
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-3">
            <FiLock className="text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-white outline-none"
              placeholder="••••••••"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:shadow-orange-500/40 disabled:opacity-70"
        >
          {loading ? 'در حال ورود...' : 'ورود به پنل'}
          <FiLogIn />
        </button>
      </form>
    </div>
  );
}
