"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { useToastStore } from "@/store/toastStore";
import { sanitizeError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  FiScissors,
  FiLink,
  FiMapPin,
  FiPhone,
  FiImage,
  FiCamera,
  FiCheck,
  FiX,
  FiLoader,
  FiArrowRight,
  FiArrowLeft,
  FiHash,
  FiType,
  FiGlobe,
  FiMessageCircle,
  FiSend,
  FiAlertCircle,
  FiClock,
  FiSettings,
  FiLayout,
  FiUser,
  FiFileText,
} from "react-icons/fi";

// Dynamically import the map component (Leaflet requires window)
const LocationPicker = dynamic(() => import("@/components/profile/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] items-center justify-center rounded-2xl bg-white/5 border border-white/10">
      <FiLoader className="animate-spin text-2xl text-white/40" />
    </div>
  ),
});

// ─── Step indicator config ────────────────────────────────────────────────────
const STEPS = [
  { key: "basic", label: "اطلاعات اصلی", icon: <FiHash /> },
  { key: "content", label: "محتوای سایت", icon: <FiLayout /> },
  { key: "location", label: "موقعیت و مجوز", icon: <FiMapPin /> },
  { key: "settings", label: "تنظیمات و شبکه‌ها", icon: <FiSettings /> },
] as const;

// ─── Persian weekday labels ───────────────────────────────────────────────────
const WEEKDAY_LABELS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

// ─── Input Field ──────────────────────────────────────────────────────────────
function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  required,
  dir,
  type = "text",
  error,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  dir?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
        {icon}
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:bg-white/8 hover:border-white/20 ${
          error ? "border-rose-500/50 focus:border-rose-400" : "border-white/10 focus:border-amber-500/40"
        }`}
      />
      {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function TextareaField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
        {icon}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-500/40 focus:bg-white/8"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewTenantPage() {
  const router = useRouter();
  const pushToast = useToastStore((state) => state.push);
  const createTenant = useMutation(api.tenants.tenants.create);
  const generateUploadUrl = useMutation(api.uploads.upload.generateUploadUrl);

  // Step control
  const [currentStep, setCurrentStep] = useState(0);

  // ── Step 1: Basic Info ─────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"barbers" | "barbies">("barbers");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Fetch available domains filtered by tenant type (reactive whenever type changes)
  const availableDomains = useQuery(api.tenants.tenants.listMainDomains, { tenantType: type });
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  // If selection no longer valid after type change, reset
  const activeDomain = availableDomains?.some((d: { domain: string }) => d.domain === selectedDomain)
    ? selectedDomain
    : (availableDomains?.[0]?.domain ?? null);
  const defaultMain = activeDomain ?? process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bestiee.ir";

  // ── Step 2: Content ────────────────────────────────────────────────────
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubTitle, setHeroSubTitle] = useState("");
  const [aboutUsText, setAboutUsText] = useState("");

  // ── Step 3: Location & Certificate ─────────────────────────────────────
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // ── Step 4: Settings & Socials ─────────────────────────────────────────
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(21);
  const [endMinute, setEndMinute] = useState(0);
  const [workingDays, setWorkingDays] = useState([true, true, true, true, true, true, false]);

  // ── UI State ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation per step
  const validateStep = (step: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) errs.name = "نام شعبه الزامی است";
      if (!subdomain.trim()) errs.subdomain = "زیر‌دامنه الزامی است";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain.trim()))
        errs.subdomain = "فقط حروف کوچک انگلیسی، اعداد و خط تیره";
      if (!title.trim()) errs.title = "عنوان سایت الزامی است";
    }
    if (step === 2) {
      if (!location) errs.location = "تعیین موقعیت مکانی اجباری است";
      if (!certificateFile && !certificatePreview) errs.certificate = "آپلود تصویر مجوز اجباری است";
    }
    return errs;
  };

  const canProceed = useMemo(() => {
    return Object.keys(validateStep(currentStep)).length === 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, name, subdomain, title, location, certificateFile, certificatePreview]);

  const handleNext = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  // Certificate upload handler
  const handleCertificateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, certificate: "فقط فایل تصویری مجاز است" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, certificate: "حداکثر ۵ مگابایت" }));
      return;
    }
    setCertificateFile(file);
    setErrors((prev) => { const { certificate, ...rest } = prev; return rest; });
    const reader = new FileReader();
    reader.onload = (ev) => setCertificatePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Submit
  const handleSubmit = async () => {
    // Final validation across all steps
    const allErrors: Record<string, string> = {};
    for (let i = 0; i < STEPS.length; i++) {
      Object.assign(allErrors, validateStep(i));
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Jump to first step with error
      if (allErrors.name || allErrors.subdomain || allErrors.title) setCurrentStep(0);
      else if (allErrors.location || allErrors.certificate) setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    try {
      // Upload certificate image
      let certificateImageId: string | undefined;
      if (certificateFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": certificateFile.type },
          body: certificateFile,
        });
        const { storageId } = await result.json();
        certificateImageId = storageId;
      }

      const payload: any = {
        name: name.trim(),
        type,
        subdomain: subdomain.trim(),
        mainDomain: defaultMain,
        title: title.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
        heroTitle: heroTitle.trim() || undefined,
        heroSubTitle: heroSubTitle.trim() || undefined,
        aboutUsText: aboutUsText.trim() || undefined,
        certificateImageId,
        socialLinks: {
          telegram: telegram.trim() || undefined,
          instagram: instagram.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        },
      };

      await createTenant(payload);
      pushToast({ type: "success", title: "موفق", message: `شعبه ${name} با موفقیت ایجاد شد` });
      router.push("/tenants");
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: sanitizeError(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkingDay = (index: number) => {
    setWorkingDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20">
            <FiScissors className="text-xl text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">ثبت شعبه جدید</h1>
            <p className="text-sm text-white/40 mt-0.5">تمامی اطلاعات لازم را وارد کنید</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/tenants")}
          className="cursor-pointer flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
        >
          <FiArrowRight />
          بازگشت به لیست
        </button>
      </div>

      {/* ── Steps Progress ────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <button
              key={step.key}
              onClick={() => {
                // Allow going back to completed steps
                if (i < currentStep) {
                  setCurrentStep(i);
                  setErrors({});
                }
              }}
              className={`cursor-pointer flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-300 shadow shadow-orange-500/10"
                  : isDone
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-white/40"
              }`}
            >
              {isDone ? <FiCheck className="text-xs" /> : step.icon}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── Step Content ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {/* ── Step 0: Basic Info ─────────────────────── */}
          {currentStep === 0 && (
            <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                  <FiHash className="text-lg text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">اطلاعات اصلی شعبه</h2>
                  <p className="text-xs text-white/40">نام، نوع و آدرس اینترنتی شعبه</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <InputField
                  label="نام شعبه"
                  icon={<FiHash />}
                  value={name}
                  onChange={setName}
                  placeholder="مثلاً: آرایشگاه فِید سیتی"
                  required
                  error={errors.name}
                />
                <InputField
                  label="عنوان سایت"
                  icon={<FiType />}
                  value={title}
                  onChange={setTitle}
                  placeholder="عنوانی که در سایت نمایش داده خواهد شد"
                  required
                  error={errors.title}
                />
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <FiLink />
                    زیر‌دامنه
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <input
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/20"
                      placeholder="fadecity"
                      dir="ltr"
                    />
                    <span className="shrink-0 bg-white/5 border-r border-white/10 px-3 py-3 text-xs text-white/40 font-mono" dir="ltr">
                      .{defaultMain}
                    </span>
                  </div>
                  {errors.subdomain && <p className="mt-1 text-[11px] text-rose-400">{errors.subdomain}</p>}
                  {subdomain && !errors.subdomain && (
                    <p className="mt-1 text-[11px] text-emerald-400/60 font-mono" dir="ltr">
                      {subdomain}.{defaultMain}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <FiScissors />
                    نوع شعبه
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setType("barbers"); setSelectedDomain(null); }}
                      className={`cursor-pointer flex flex-col gap-1 rounded-2xl border px-4 py-3 text-right transition ${type === "barbers"
                        ? "border-blue-500/40 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/8"
                      }`}
                    >
                      <span className="text-sm font-bold">آرایشگاه مردانه</span>
                      <span className="text-[10px] text-white/30">barbers</span>
                    </button>
                    <button
                      onClick={() => { setType("barbies"); setSelectedDomain(null); }}
                      className={`cursor-pointer flex flex-col gap-1 rounded-2xl border px-4 py-3 text-right transition ${type === "barbies"
                        ? "border-pink-500/40 bg-pink-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/8"
                      }`}
                    >
                      <span className="text-sm font-bold">آرایشگاه زنانه</span>
                      <span className="text-[10px] text-white/30">barbies</span>
                    </button>
                  </div>
                </div>

                {/* Main Domain Picker */}
                <div className="col-span-1 lg:col-span-2">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <FiGlobe />
                    دامنه اصلی
                    <span className="text-rose-400">*</span>
                  </label>
                  {!availableDomains ? (
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <FiLoader className="animate-spin text-xs" />
                      در حال بارگذاری دامنه‌ها...
                    </div>
                  ) : availableDomains.length === 0 ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                      هیچ دامنه‌ای برای این نوع شعبه تعریف نشده. لطفاً از صفحه دامنه‌ها اضافه کنید.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableDomains.map((d: any) => (
                        <button
                          key={d._id}
                          onClick={() => setSelectedDomain(d.domain)}
                          className={`cursor-pointer flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-mono font-bold transition ${
                            activeDomain === d.domain
                              ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                              : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                          }`}
                          dir="ltr"
                        >
                          {activeDomain === d.domain && <FiCheck className="text-xs" />}
                          {d.domain}
                          {d.description && <span className="text-[10px] text-white/30 font-normal">{d.description}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <InputField
                  label="تلفن شعبه"
                  icon={<FiPhone />}
                  value={phone}
                  onChange={setPhone}
                  placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                  dir="ltr"
                />
                <InputField
                  label="آدرس شعبه"
                  icon={<FiMapPin />}
                  value={address}
                  onChange={setAddress}
                  placeholder="آدرس کامل محل شعبه"
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Content ─────────────────────────── */}
          {currentStep === 1 && (
            <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
                  <FiLayout className="text-lg text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">محتوای صفحه اصلی</h2>
                  <p className="text-xs text-white/40">عنوان هیرو و متن درباره ما</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <InputField
                  label="عنوان هیرو (عنوان بزرگ بالای سایت)"
                  icon={<FiType />}
                  value={heroTitle}
                  onChange={setHeroTitle}
                  placeholder="مثلاً: بهترین سرویس آرایشگری شهر"
                />
                <InputField
                  label="زیرعنوان هیرو"
                  icon={<FiFileText />}
                  value={heroSubTitle}
                  onChange={setHeroSubTitle}
                  placeholder="توضیح کوتاه زیر عنوان اصلی"
                />
                <TextareaField
                  label="متن درباره ما"
                  icon={<FiFileText />}
                  value={aboutUsText}
                  onChange={setAboutUsText}
                  placeholder="معرفی کامل آرایشگاه برای بخش درباره ما..."
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Location & Certificate ──────────── */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6">
              {/* Location */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                    <FiMapPin className="text-lg text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">
                      موقعیت مکانی
                      <span className="text-rose-400 text-sm mr-1">*</span>
                    </h2>
                    <p className="text-xs text-white/40">موقعیت دقیق شعبه روی نقشه</p>
                  </div>
                  {location && (
                    <span className="text-xs font-mono text-white/30">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </span>
                  )}
                </div>

                <LocationPicker value={location} onChange={setLocation} />
                {errors.location && (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
                    <FiAlertCircle />
                    {errors.location}
                  </div>
                )}
              </div>

              {/* Certificate */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                    <FiImage className="text-lg text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      تصویر مجوز فعالیت
                      <span className="text-rose-400 text-sm mr-1">*</span>
                    </h2>
                    <p className="text-xs text-white/40">تصویر پروانه کسب یا مجوز بهداشت</p>
                  </div>
                </div>

                <div
                  onClick={() => certInputRef.current?.click()}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-all ${
                    certificatePreview
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : errors.certificate
                        ? "border-rose-500/40 bg-rose-500/5"
                        : "border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {certificatePreview ? (
                    <div className="relative">
                      <img
                        src={certificatePreview}
                        alt="Certificate preview"
                        className="max-h-48 rounded-xl border border-white/10 shadow-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCertificateFile(null);
                          setCertificatePreview(null);
                        }}
                        className="cursor-pointer absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs shadow-lg"
                      >
                        <FiX />
                      </button>
                      <p className="mt-3 text-xs text-emerald-400 text-center">
                        <FiCheck className="inline ml-1" />
                        تصویر مجوز انتخاب شد
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                        <FiCamera className="text-2xl text-white/30" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/50">تصویر مجوز را انتخاب کنید</p>
                        <p className="text-[10px] text-white/25 mt-1">PNG, JPG تا ۵ مگابایت</p>
                      </div>
                    </>
                  )}
                </div>

                <input
                  ref={certInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCertificateChange}
                  className="hidden"
                />

                {errors.certificate && (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
                    <FiAlertCircle />
                    {errors.certificate}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Settings & Socials ──────────────── */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              {/* Social links */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
                    <FiGlobe className="text-lg text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">شبکه‌های اجتماعی</h2>
                    <p className="text-xs text-white/40">لینک‌های ارتباطی شعبه</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <InputField
                    label="تلگرام"
                    icon={<FiSend />}
                    value={telegram}
                    onChange={setTelegram}
                    placeholder="@username"
                    dir="ltr"
                  />
                  <InputField
                    label="اینستاگرام"
                    icon={<FiCamera />}
                    value={instagram}
                    onChange={setInstagram}
                    placeholder="@username"
                    dir="ltr"
                  />
                  <InputField
                    label="واتساپ"
                    icon={<FiMessageCircle />}
                    value={whatsapp}
                    onChange={setWhatsapp}
                    placeholder="09123456789"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Working hours */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20">
                    <FiClock className="text-lg text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">ساعات کاری پیش‌فرض</h2>
                    <p className="text-xs text-white/40">قابل تغییر بعد از ایجاد شعبه</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                      <FiClock />
                      شروع کار
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0} max={23}
                        value={startHour}
                        onChange={(e) => setStartHour(Number(e.target.value))}
                        className="w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white text-center outline-none focus:border-amber-500/40"
                      />
                      <span className="text-white/30">:</span>
                      <input
                        type="number"
                        min={0} max={59}
                        value={startMinute}
                        onChange={(e) => setStartMinute(Number(e.target.value))}
                        className="w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white text-center outline-none focus:border-amber-500/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                      <FiClock />
                      پایان کار
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0} max={23}
                        value={endHour}
                        onChange={(e) => setEndHour(Number(e.target.value))}
                        className="w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white text-center outline-none focus:border-amber-500/40"
                      />
                      <span className="text-white/30">:</span>
                      <input
                        type="number"
                        min={0} max={59}
                        value={endMinute}
                        onChange={(e) => setEndMinute(Number(e.target.value))}
                        className="w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white text-center outline-none focus:border-amber-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Working days */}
                <div>
                  <label className="mb-3 flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <FiSettings />
                    روزهای کاری هفته
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_LABELS.map((day, i) => (
                      <button
                        key={i}
                        onClick={() => toggleWorkingDay(i)}
                        className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold transition ${workingDays[i]
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-white/30 hover:bg-white/8"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation Buttons ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="cursor-pointer flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FiArrowRight />
          مرحله قبل
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 via-amber-400 to-rose-500 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/40 hover:scale-105 active:scale-95"
          >
            مرحله بعد
            <FiArrowLeft />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                <FiCheck />
                ثبت نهایی شعبه
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
