"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { translateRole } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCamera,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiBriefcase,
  FiHome,
  FiSave,
  FiLock,
  FiShield,
  FiStar,
  FiCheck,
  FiX,
  FiLoader,
  FiEdit3,
} from "react-icons/fi";
import { sanitizeError } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import the map component (Leaflet requires window)
const LocationPicker = dynamic(() => import("@/components/profile/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-2xl bg-white/5 border border-white/10">
      <FiLoader className="animate-spin text-2xl text-white/40" />
    </div>
  ),
});

export default function ProfilePage() {
  const user = useQuery(api.users.auth.me);
  const updateProfile = useMutation(api.users.auth.updateProfile);
  const changePassword = useMutation(api.users.auth.changePassword);
  const generateUploadUrl = useMutation(api.uploads.upload.generateUploadUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [job, setJob] = useState("");
  const [homePhone, setHomePhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Password form
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setBirthdate(user.birthdate || "");
      setNationalCode(user.nationalCode || "");
      setJob(user.job || "");
      setHomePhone(user.homePhone || "");
      setAddress(user.address || "");
      setLocation(user.homeLocation || null);
    }
  }, [user]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // Image upload handler
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type and size
      if (!file.type.startsWith("image/")) {
        showToast("لطفاً یک فایل تصویری انتخاب کنید.", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.", "error");
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);

      setUploadingImage(true);
      try {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();
        // Upload the file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();

        // Update profile with new image
        await updateProfile({ profilePicture: storageId });
        showToast("تصویر پروفایل با موفقیت بروزرسانی شد.", "success");
      } catch (err: any) {
        showToast("خطا در آپلود تصویر: " + sanitizeError(err), "error");
        setPreviewUrl(null);
      } finally {
        setUploadingImage(false);
      }
    },
    [generateUploadUrl, updateProfile]
  );

  // Save profile handler
  const handleSave = async () => {
    setSaving(true);
    try {
      const data: any = {
        name,
        email: email || undefined,
        birthdate: birthdate || undefined,
        nationalCode: nationalCode || undefined,
        job: job || undefined,
        homePhone: homePhone || undefined,
        address: address || undefined,
      };
      if (location) {
        data.homeLocation = location;
      }
      await updateProfile(data);
      showToast("اطلاعات پروفایل با موفقیت ذخیره شد.", "success");
    } catch (err: any) {
      showToast("خطا در ذخیره: " + sanitizeError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  // Change password handler
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("رمز عبور جدید و تکرار آن مطابقت ندارند.", "error");
      return;
    }
    if (newPassword.length < 4) {
      showToast("رمز عبور جدید باید حداقل ۴ کاراکتر باشد.", "error");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      showToast("رمز عبور با موفقیت تغییر یافت.", "success");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(sanitizeError(err), "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="flex h-96 items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-white/30" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-white/50">کاربر یافت نشد.</p>
      </div>
    );
  }

  const avatarUrl = previewUrl || user.profilePictureUrl;

  return (
    <div className="profile-page flex flex-col gap-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 z-[100] -translate-x-1/2 rounded-2xl px-6 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border border-emerald-500/30 bg-emerald-900/80 text-emerald-200"
                : "border border-rose-500/30 bg-rose-900/80 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? <FiCheck /> : <FiX />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────── Profile Header ───────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="profile-header relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950 p-8"
      >
        {/* Background decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-rose-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-amber-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          {/* Avatar */}
          <div className="group relative">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-2 border-white/15 shadow-2xl transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500">
                  <FiUser className="text-4xl text-white/90 sm:text-5xl" />
                </div>
              )}

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
              >
                {uploadingImage ? (
                  <FiLoader className="animate-spin text-2xl text-white" />
                ) : (
                  <FiCamera className="text-2xl text-white" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* User info */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{user.name}</h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-300">
                <FiShield className="text-xs" />
                {translateRole(user.role)}
              </span>
              {user.active && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-xs font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  فعال
                </span>
              )}
              {user.privilege && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-violet-500/15 border border-violet-500/25 px-3 py-1 text-xs font-bold text-violet-400">
                  <FiStar className="text-xs" />
                  ویژه
                </span>
              )}
            </div>
            <p className="text-sm text-white/40 mt-1">
              تلفن: <span className="font-mono text-white/60 direction-ltr inline-block">{user.phone}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 sm:mr-auto sm:self-start">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <FiLock className="text-base" />
              تغییر رمز عبور
            </button>
          </div>
        </div>
      </motion.section>

      {/* ───────────────── Form Sections ───────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Personal Info ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="profile-card rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/70 via-slate-900/80 to-slate-950/90 p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
              <FiUser className="text-lg text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white">اطلاعات شخصی</h2>
          </div>

          <div className="flex flex-col gap-4">
            <InputField
              label="نام و نام خانوادگی"
              icon={<FiUser />}
              value={name}
              onChange={setName}
              placeholder="نام کامل"
            />
            <InputField
              label="ایمیل"
              icon={<FiMail />}
              value={email}
              onChange={setEmail}
              placeholder="example@email.com"
              dir="ltr"
            />
            <InputField
              label="تاریخ تولد"
              icon={<FiCalendar />}
              value={birthdate}
              onChange={setBirthdate}
              placeholder="YYYY-MM-DD"
              dir="ltr"
            />
            <InputField
              label="کد ملی"
              icon={<FiCreditCard />}
              value={nationalCode}
              onChange={setNationalCode}
              placeholder="۰۰۰۰۰۰۰۰۰۰"
              dir="ltr"
            />
            <InputField
              label="شغل"
              icon={<FiBriefcase />}
              value={job}
              onChange={setJob}
              placeholder="عنوان شغلی"
            />
          </div>
        </motion.section>

        {/* ── Contact Info ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="profile-card rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/70 via-slate-900/80 to-slate-950/90 p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
              <FiPhone className="text-lg text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">اطلاعات تماس</h2>
          </div>

          <div className="flex flex-col gap-4">
            <InputField
              label="شماره موبایل"
              icon={<FiPhone />}
              value={user.phone}
              onChange={() => {}}
              readOnly
              dir="ltr"
            />
            <InputField
              label="تلفن منزل"
              icon={<FiHome />}
              value={homePhone}
              onChange={setHomePhone}
              placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
              dir="ltr"
            />
            <div>
              <label className="mb-2 block text-xs font-bold text-white/50">
                <FiMapPin className="inline ml-1" />
                آدرس
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="آدرس کامل محل سکونت"
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/40 focus:bg-white/8 placeholder:text-white/20"
              />
            </div>
          </div>
        </motion.section>
      </div>

      {/* ── Location Picker (Full Width) ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="profile-card rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/70 via-slate-900/80 to-slate-950/90 p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20">
            <FiMapPin className="text-lg text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">موقعیت مکانی منزل</h2>
          {location && (
            <span className="mr-auto text-xs font-mono text-white/30">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
          )}
        </div>

        <LocationPicker
          value={location}
          onChange={setLocation}
        />
      </motion.section>

      {/* ── Account Status (Read-only) ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="profile-card rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/70 via-slate-900/80 to-slate-950/90 p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
            <FiShield className="text-lg text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white">وضعیت حساب</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatusBadge label="نقش" value={translateRole(user.role)} color="orange" />
          <StatusBadge label="وضعیت" value={user.active ? "فعال" : "غیرفعال"} color={user.active ? "emerald" : "red"} />
          <StatusBadge label="مسدود" value={user.ban ? "بله" : "خیر"} color={user.ban ? "red" : "emerald"} />
          <StatusBadge label="ویژه" value={user.privilege ? "بله" : "خیر"} color={user.privilege ? "violet" : "slate"} />
        </div>
      </motion.section>

      {/* ── Save Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-center pb-8"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-orange-500/20 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <FiLoader className="animate-spin text-lg" />
          ) : (
            <FiSave className="text-lg transition-transform group-hover:-translate-y-0.5" />
          )}
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </motion.div>

      {/* ───────────────── Password Change Modal ───────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20">
                  <FiLock className="text-xl text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">تغییر رمز عبور</h3>
                  <p className="text-xs text-white/40">رمز عبور حساب خود را بروزرسانی کنید</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <InputField
                  label="رمز عبور فعلی"
                  icon={<FiLock />}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="••••••"
                  type="password"
                  dir="ltr"
                />
                <InputField
                  label="رمز عبور جدید"
                  icon={<FiLock />}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="••••••"
                  type="password"
                  dir="ltr"
                />
                <InputField
                  label="تکرار رمز عبور جدید"
                  icon={<FiLock />}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••"
                  type="password"
                  dir="ltr"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {savingPassword ? <FiLoader className="animate-spin" /> : <FiCheck />}
                  {savingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────── Reusable Components ─────────────────

function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  readOnly = false,
  dir,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  dir?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
        {icon}
        {label}
        {readOnly && (
          <span className="mr-1 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
            غیرقابل تغییر
          </span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        dir={dir}
        className={`w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 ${
          readOnly
            ? "cursor-not-allowed opacity-60"
            : "focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20"
        }`}
      />
    </div>
  );
}

function StatusBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    red: "from-rose-500/15 to-rose-500/5 border-rose-500/20 text-rose-400",
    orange: "from-orange-500/15 to-orange-500/5 border-orange-500/20 text-orange-400",
    violet: "from-violet-500/15 to-violet-500/5 border-violet-500/20 text-violet-400",
    slate: "from-slate-500/15 to-slate-500/5 border-slate-500/20 text-slate-400",
  };

  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-b p-4 ${colorMap[color] || colorMap.slate}`}>
      <span className="text-[11px] font-bold text-white/40">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
