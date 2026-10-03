"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@backend/api";
import type { Id } from "@backend/dataModel";
import { useToastStore } from "@/store/toastStore";
import { sanitizeError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import CitySelect from "@/components/common/CitySelect";
import AiImageGenerationModal from "@/components/tenants/AiImageGenerationModal";
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
  FiPlus,
  FiTrash2,
  FiUsers,
  FiSearch,
  FiList,
  FiRefreshCw,
  FiZap,
  FiDownload,
} from "react-icons/fi";

const LocationPicker = dynamic(() => import("@/components/profile/LocationPicker"), { ssr: false });
const MAIN_DOMAIN = "bestiee.ir";

// ─── Step indicator config ────────────────────────────────────────────────────
const STEPS = [
  { key: "basic", label: "اطلاعات اصلی و آدرس", icon: <FiHash /> },
  { key: "settings", label: "تنظیمات و شبکه‌ها", icon: <FiSettings /> },
  { key: "members", label: "مدیران و پرسنل", icon: <FiUsers /> },
  { key: "services", label: "خدمات و مدل‌ها", icon: <FiList /> },
  { key: "content", label: "محتوای سایت و شعبه", icon: <FiLayout /> },
] as const;


const WEEKDAY_LABELS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

interface MemberState {
  type: "existing" | "new";
  userId?: string;
  name?: string; // Cache existing name for display
  searchQuery?: string;
  newUser: {
    name: string;
    phone: string;
    email: string;
    gender: "male" | "female";
    cityId: string;
  };
}

const createEmptyMember = (tenantType: "barbers" | "barbies" = "barbers", defaultCityId: string = ""): MemberState => ({
  type: "new",
  newUser: {
    name: "",
    phone: "",
    email: "",
    gender: tenantType === "barbies" ? "female" : "male",
    cityId: defaultCityId || "",
  },
});

type SiteImageField = "certificate" | "interior" | "outside" | "team" | "interiorMobile" | "outsideMobile" | "teamMobile";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewTenantPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const pushToast = useToastStore((state) => state.push);
  const createTenant = useMutation(api.tenants.tenants.create);
  const generateUploadUrl = useMutation(api.uploads.upload.generateUploadUrl);
  const generateAiContent = useAction(api.ai.tenantContent.generateTenantContent);
  const startTenantImageTask = useMutation(api.ai.tenantImages.startTenantImageTask);
  const cities = useQuery(api.cities.listActive);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("Direct download failed, opening in new tab:", err);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Step control
  const [currentStep, setCurrentStep] = useState(0);

  // ... (previous state)
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [debouncedSubdomain, setDebouncedSubdomain] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSubdomain(subdomain.trim());
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [subdomain]);

  const subdomainCheck = useQuery(
    api.tenants.tenants.checkSubdomain,
    debouncedSubdomain ? { subdomain: debouncedSubdomain } : "skip"
  );

  const isCheckingSubdomain = subdomain.trim() !== "" && (subdomain.trim() !== debouncedSubdomain || subdomainCheck === undefined);
  const [title, setTitle] = useState("");
  const [cityId, setCityId] = useState("");
  const [type, setType] = useState<"barbers" | "barbies">("barbers");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubTitle, setHeroSubTitle] = useState("");
  const [aboutUsText, setAboutUsText] = useState("");

  const selectedCityName = useMemo(() => {
    if (!cities || !cityId) return "";
    const found = cities.find((c: any) => c._id === cityId);
    return found?.name || "";
  }, [cities, cityId]);

  const [generatingField, setGeneratingField] = useState<"all" | "heroTitle" | "heroSubTitle" | "aboutUsText" | null>(null);
  const [overwriteConfirm, setOverwriteConfirm] = useState<"all" | "heroTitle" | "heroSubTitle" | "aboutUsText" | null>(null);

  const executeAiGeneration = async (target: "all" | "heroTitle" | "heroSubTitle" | "aboutUsText") => {
    setGeneratingField(target);
    try {
      const res = await generateAiContent({
        name: name.trim(),
        type,
        city: selectedCityName,
        address: address.trim(),
        targetField: target,
      });

      if (target === "all") {
        if (res.heroTitle) setHeroTitle(res.heroTitle);
        if (res.heroSubTitle) setHeroSubTitle(res.heroSubTitle);
        if (res.aboutUsText) setAboutUsText(res.aboutUsText);
        pushToast({
          type: "success",
          title: "هوش مصنوعی",
          message: "متن‌های هیرو و درباره ما با موفقیت تولید شدند.",
        });
      } else if (target === "heroTitle" && res.heroTitle) {
        setHeroTitle(res.heroTitle);
        pushToast({
          type: "success",
          title: "هوش مصنوعی",
          message: "عنوان هیرو با موفقیت بازتولید شد.",
        });
      } else if (target === "heroSubTitle" && res.heroSubTitle) {
        setHeroSubTitle(res.heroSubTitle);
        pushToast({
          type: "success",
          title: "هوش مصنوعی",
          message: "زیرعنوان هیرو با موفقیت بازتولید شد.",
        });
      } else if (target === "aboutUsText" && res.aboutUsText) {
        setAboutUsText(res.aboutUsText);
        pushToast({
          type: "success",
          title: "هوش مصنوعی",
          message: "متن درباره ما با موفقیت بازتولید شد.",
        });
      }
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در هوش مصنوعی",
        message: sanitizeError(err),
      });
    } finally {
      setGeneratingField(null);
    }
  };

  const handleAiClick = (target: "all" | "heroTitle" | "heroSubTitle" | "aboutUsText") => {
    if (!name.trim()) {
      pushToast({
        type: "error",
        title: "اطلاعات ناقص",
        message: "لطفاً ابتدا نام شعبه را در مرحله اول وارد کنید.",
      });
      return;
    }
    if (!selectedCityName) {
      pushToast({
        type: "error",
        title: "اطلاعات ناقص",
        message: "لطفاً ابتدا شهر شعبه را در مرحله اول انتخاب کنید.",
      });
      return;
    }
    if (!address.trim()) {
      pushToast({
        type: "error",
        title: "اطلاعات ناقص",
        message: "لطفاً ابتدا آدرس کامل شعبه را وارد یا از روی نقشه دریافت کنید.",
      });
      return;
    }

    let hasExistingContent = false;
    if (target === "all") {
      hasExistingContent = Boolean(heroTitle.trim() || heroSubTitle.trim() || aboutUsText.trim());
    } else if (target === "heroTitle") {
      hasExistingContent = Boolean(heroTitle.trim());
    } else if (target === "heroSubTitle") {
      hasExistingContent = Boolean(heroSubTitle.trim());
    } else if (target === "aboutUsText") {
      hasExistingContent = Boolean(aboutUsText.trim());
    }

    if (hasExistingContent) {
      setOverwriteConfirm(target);
    } else {
      executeAiGeneration(target);
    }
  };

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const [interiorPreview, setInteriorPreview] = useState<string | null>(null);
  const interiorInputRef = useRef<HTMLInputElement>(null);
  const [outsideFile, setOutsideFile] = useState<File | null>(null);
  const [outsidePreview, setOutsidePreview] = useState<string | null>(null);
  const outsideInputRef = useRef<HTMLInputElement>(null);
  const [teamFile, setTeamFile] = useState<File | null>(null);
  const [teamPreview, setTeamPreview] = useState<string | null>(null);
  const teamInputRef = useRef<HTMLInputElement>(null);

  const [interiorMobileFile, setInteriorMobileFile] = useState<File | null>(null);
  const [interiorMobilePreview, setInteriorMobilePreview] = useState<string | null>(null);
  const interiorMobileInputRef = useRef<HTMLInputElement>(null);
  const [outsideMobileFile, setOutsideMobileFile] = useState<File | null>(null);
  const [outsideMobilePreview, setOutsideMobilePreview] = useState<string | null>(null);
  const outsideMobileInputRef = useRef<HTMLInputElement>(null);
  const [teamMobileFile, setTeamMobileFile] = useState<File | null>(null);
  const [teamMobilePreview, setTeamMobilePreview] = useState<string | null>(null);
  const teamMobileInputRef = useRef<HTMLInputElement>(null);

  // ── AI Image Generation States & Tasks ─────────────────────────────
  const [teamStorageId, setTeamStorageId] = useState<string | null>(null);
  const [teamMobileStorageId, setTeamMobileStorageId] = useState<string | null>(null);
  const [interiorStorageId, setInteriorStorageId] = useState<string | null>(null);
  const [interiorMobileStorageId, setInteriorMobileStorageId] = useState<string | null>(null);
  const [outsideStorageId, setOutsideStorageId] = useState<string | null>(null);
  const [outsideMobileStorageId, setOutsideMobileStorageId] = useState<string | null>(null);

  const [teamTaskId, setTeamTaskId] = useState<Id<"ai_tasks"> | null>(null);
  const [interiorTaskId, setInteriorTaskId] = useState<Id<"ai_tasks"> | null>(null);
  const [outsideTaskId, setOutsideTaskId] = useState<Id<"ai_tasks"> | null>(null);
  const [teamMobileTaskId, setTeamMobileTaskId] = useState<Id<"ai_tasks"> | null>(null);
  const [interiorMobileTaskId, setInteriorMobileTaskId] = useState<Id<"ai_tasks"> | null>(null);
  const [outsideMobileTaskId, setOutsideMobileTaskId] = useState<Id<"ai_tasks"> | null>(null);

  const teamTask = useQuery(api.ai.tenantImages.getTenantImageTask, teamTaskId ? { taskId: teamTaskId } : "skip");
  const interiorTask = useQuery(api.ai.tenantImages.getTenantImageTask, interiorTaskId ? { taskId: interiorTaskId } : "skip");
  const outsideTask = useQuery(api.ai.tenantImages.getTenantImageTask, outsideTaskId ? { taskId: outsideTaskId } : "skip");
  const teamMobileTask = useQuery(api.ai.tenantImages.getTenantImageTask, teamMobileTaskId ? { taskId: teamMobileTaskId } : "skip");
  const interiorMobileTask = useQuery(api.ai.tenantImages.getTenantImageTask, interiorMobileTaskId ? { taskId: interiorMobileTaskId } : "skip");
  const outsideMobileTask = useQuery(api.ai.tenantImages.getTenantImageTask, outsideMobileTaskId ? { taskId: outsideMobileTaskId } : "skip");

  const [activeModalTarget, setActiveModalTarget] = useState<"team" | "interior" | "outside" | null>(null);

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await res.json();
    return storageId as string;
  };

  // Live progress and status per track
  const teamAiGenerating = Boolean(teamTask && (teamTask.status === "submitted" || teamTask.status === "processing"));
  const teamAiProgress = teamTask?.progress ?? 0;

  const interiorAiGenerating = Boolean(interiorTask && (interiorTask.status === "submitted" || interiorTask.status === "processing"));
  const interiorAiProgress = interiorTask?.progress ?? 0;

  const outsideAiGenerating = Boolean(outsideTask && (outsideTask.status === "submitted" || outsideTask.status === "processing"));
  const outsideAiProgress = outsideTask?.progress ?? 0;

  const teamMobileAiGenerating = Boolean(teamMobileTask && (teamMobileTask.status === "submitted" || teamMobileTask.status === "processing"));
  const teamMobileAiProgress = teamMobileTask?.progress ?? 0;

  const interiorMobileAiGenerating = Boolean(interiorMobileTask && (interiorMobileTask.status === "submitted" || interiorMobileTask.status === "processing"));
  const interiorMobileAiProgress = interiorMobileTask?.progress ?? 0;

  const outsideMobileAiGenerating = Boolean(outsideMobileTask && (outsideMobileTask.status === "submitted" || outsideMobileTask.status === "processing"));
  const outsideMobileAiProgress = outsideMobileTask?.progress ?? 0;

  // React to completed AI tasks
  useEffect(() => {
    if (!teamTask) return;
    if (teamTask.status === "completed" && teamTask.resultUrls?.[0]) {
      const url = teamTask.resultUrls[0];
      const sid = teamTask.resultStorageIds?.[0] || null;
      if (teamPreview !== url) {
        setTeamPreview(url);
        if (sid) setTeamStorageId(sid);
        setTeamFile(null);
        pushToast({ type: "success", title: "هوش مصنوعی", message: "تصویر تیم پرسنل با موفقیت تولید شد." });
      }
    } else if (teamTask.status === "failed") {
      pushToast({ type: "error", title: "خطا در تولید تصویر تیم", message: teamTask.errorMessage || "خطای ناشناخته رخ داد." });
    }
  }, [teamTask?.status, teamTask?.resultUrls]);

  useEffect(() => {
    if (!interiorTask) return;
    if (interiorTask.status === "completed" && interiorTask.resultUrls?.[0]) {
      const url = interiorTask.resultUrls[0];
      const sid = interiorTask.resultStorageIds?.[0] || null;
      if (interiorPreview !== url) {
        setInteriorPreview(url);
        if (sid) setInteriorStorageId(sid);
        setInteriorFile(null);
        pushToast({ type: "success", title: "هوش مصنوعی", message: "تصویر فضای داخلی با موفقیت تولید شد." });
      }
    } else if (interiorTask.status === "failed") {
      pushToast({ type: "error", title: "خطا در تولید فضای داخلی", message: interiorTask.errorMessage || "خطای ناشناخته رخ داد." });
    }
  }, [interiorTask?.status, interiorTask?.resultUrls]);

  useEffect(() => {
    if (!outsideTask) return;
    if (outsideTask.status === "completed" && outsideTask.resultUrls?.[0]) {
      const url = outsideTask.resultUrls[0];
      const sid = outsideTask.resultStorageIds?.[0] || null;
      if (outsidePreview !== url) {
        setOutsidePreview(url);
        if (sid) setOutsideStorageId(sid);
        setOutsideFile(null);
        pushToast({ type: "success", title: "هوش مصنوعی", message: "تصویر نمای بیرونی با موفقیت تولید شد." });
      }
    } else if (outsideTask.status === "failed") {
      pushToast({ type: "error", title: "خطا در تولید نمای بیرونی", message: outsideTask.errorMessage || "خطای ناشناخته رخ داد." });
    }
  }, [outsideTask?.status, outsideTask?.resultUrls]);

  useEffect(() => {
    if (!teamMobileTask) return;
    if (teamMobileTask.status === "completed" && teamMobileTask.resultUrls?.[0]) {
      const url = teamMobileTask.resultUrls[0];
      const sid = teamMobileTask.resultStorageIds?.[0] || null;
      if (teamMobilePreview !== url) {
        setTeamMobilePreview(url);
        if (sid) setTeamMobileStorageId(sid);
        setTeamMobileFile(null);
        pushToast({ type: "success", title: "هوش مصنوعی", message: "نسخه موبایل (۱:۱) تصویر تیم تولید شد." });
      }
    } else if (teamMobileTask.status === "failed") {
      pushToast({ type: "error", title: "خطا در تولید موبایل تیم", message: teamMobileTask.errorMessage || "خطای ناشناخته رخ داد." });
    }
  }, [teamMobileTask?.status, teamMobileTask?.resultUrls]);

  useEffect(() => {
    if (!interiorMobileTask) return;
    if (interiorMobileTask.status === "completed" && interiorMobileTask.resultUrls?.[0]) {
      const url = interiorMobileTask.resultUrls[0];
      const sid = interiorMobileTask.resultStorageIds?.[0] || null;
      if (interiorMobilePreview !== url) {
        setInteriorMobilePreview(url);
        if (sid) setInteriorMobileStorageId(sid);
        setInteriorMobileFile(null);
        pushToast({ type: "success", title: "هوش مصنوعی", message: "نسخه موبایل (۱:۱) فضای داخلی تولید شد." });
      }
    } else if (interiorMobileTask.status === "failed") {
      pushToast({ type: "error", title: "خطا در تولید موبایل داخلی", message: interiorMobileTask.errorMessage || "خطای ناشناخته رخ داد." });
    }
  }, [interiorMobileTask?.status, interiorMobileTask?.resultUrls]);

  useEffect(() => {
    if (!outsideMobileTask) return;
    if (outsideMobileTask.status === "completed" && outsideMobileTask.resultUrls?.[0]) {
      const url = outsideMobileTask.resultUrls[0];
      const sid = outsideMobileTask.resultStorageIds?.[0] || null;
      if (outsideMobilePreview !== url) {
        setOutsideMobilePreview(url);
        if (sid) setOutsideMobileStorageId(sid);
        setOutsideMobileFile(null);
        pushToast({ type: "success", title: "هوش مصنوعی", message: "نسخه موبایل (۱:۱) نمای بیرونی تولید شد." });
      }
    } else if (outsideMobileTask.status === "failed") {
      pushToast({ type: "error", title: "خطا در تولید موبایل بیرونی", message: outsideMobileTask.errorMessage || "خطای ناشناخته رخ داد." });
    }
  }, [outsideMobileTask?.status, outsideMobileTask?.resultUrls]);

  // Handlers for starting AI tasks
  const handleStartDesktopAi = async (modalTarget: "team" | "interior" | "outside", files: File[]) => {
    try {
      const rawStorageIds: string[] = [];
      for (const f of files) {
        const sid = await uploadFileToStorage(f);
        rawStorageIds.push(sid);
      }

      const taskId = await startTenantImageTask({
        salonType: type,
        target: modalTarget,
        rawStorageIds: rawStorageIds as any,
        salonName: name.trim() || undefined,
      });

      if (modalTarget === "team") setTeamTaskId(taskId);
      if (modalTarget === "interior") setInteriorTaskId(taskId);
      if (modalTarget === "outside") setOutsideTaskId(taskId);

      pushToast({
        type: "info",
        title: "هوش مصنوعی",
        message: "پردازش تصویر با هوش مصنوعی آغاز شد.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در شروع پردازش",
        message: sanitizeError(err),
      });
      throw err;
    }
  };

  const handleStartMobileAi = async (baseTarget: "team" | "interior" | "outside") => {
    const mobileTarget = `${baseTarget}Mobile` as "teamMobile" | "interiorMobile" | "outsideMobile";

    let refStorageId: string | null = null;
    if (baseTarget === "team") refStorageId = teamStorageId;
    if (baseTarget === "interior") refStorageId = interiorStorageId;
    if (baseTarget === "outside") refStorageId = outsideStorageId;

    let desktopFile: File | null = null;
    if (baseTarget === "team") desktopFile = teamFile;
    if (baseTarget === "interior") desktopFile = interiorFile;
    if (baseTarget === "outside") desktopFile = outsideFile;

    let desktopPreview: string | null = null;
    if (baseTarget === "team") desktopPreview = teamPreview;
    if (baseTarget === "interior") desktopPreview = interiorPreview;
    if (baseTarget === "outside") desktopPreview = outsidePreview;

    if (!refStorageId && !desktopFile && !desktopPreview) {
      pushToast({
        type: "error",
        title: "خطا",
        message: "ابتدا باید تصویر دسکتاپ را بارگذاری یا با هوش مصنوعی تولید کنید.",
      });
      return;
    }

    try {
      if (!refStorageId && desktopFile) {
        refStorageId = await uploadFileToStorage(desktopFile);
        if (baseTarget === "team") setTeamStorageId(refStorageId);
        if (baseTarget === "interior") setInteriorStorageId(refStorageId);
        if (baseTarget === "outside") setOutsideStorageId(refStorageId);
      } else if (!refStorageId && desktopPreview) {
        const res = await fetch(desktopPreview);
        const blob = await res.blob();
        const f = new File([blob], `${baseTarget}_source.jpg`, { type: blob.type || "image/jpeg" });
        refStorageId = await uploadFileToStorage(f);
        if (baseTarget === "team") setTeamStorageId(refStorageId);
        if (baseTarget === "interior") setInteriorStorageId(refStorageId);
        if (baseTarget === "outside") setOutsideStorageId(refStorageId);
      }

      if (!refStorageId) {
        throw new Error("امکان خواندن تصویر دسکتاپ وجود ندارد.");
      }

      const taskId = await startTenantImageTask({
        salonType: type,
        target: mobileTarget,
        rawStorageIds: [refStorageId as any],
        salonName: name.trim() || undefined,
      });

      if (mobileTarget === "teamMobile") setTeamMobileTaskId(taskId);
      if (mobileTarget === "interiorMobile") setInteriorMobileTaskId(taskId);
      if (mobileTarget === "outsideMobile") setOutsideMobileTaskId(taskId);

      pushToast({
        type: "info",
        title: "هوش مصنوعی موبایل",
        message: "تولید نسخه موبایل (۱:۱) آغاز شد.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در تولید نسخه موبایل",
        message: sanitizeError(err),
      });
    }
  };

  const activeTask =
    activeModalTarget === "team"
      ? teamTask
      : activeModalTarget === "interior"
      ? interiorTask
      : activeModalTarget === "outside"
      ? outsideTask
      : null;

  const isModalTargetGenerating =
    Boolean(activeTask && (activeTask.status === "submitted" || activeTask.status === "processing"));
  const modalTargetProgress = activeTask?.progress ?? 0;
  const modalTargetPreviewUrl = activeTask?.status === "completed" ? activeTask.resultUrls?.[0] : null;
  const modalTargetErrorMessage = activeTask?.status === "failed" ? activeTask.errorMessage : undefined;

  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(21);
  const [endMinute, setEndMinute] = useState(0);
  const [workingDays, setWorkingDays] = useState([true, true, true, true, true, true, false]);
  const [breaks, setBreaks] = useState([{ startTime: { hour: 14, minute: 0 }, endTime: { hour: 17, minute: 0 } }]);

  // ── Step 5: Members ──────────────────────────────────────────────────
  const [owners, setOwners] = useState<MemberState[]>([createEmptyMember("barbers", "")]);
  const [staff, setStaff] = useState<MemberState[]>([]);


  // ── Step 5: Services & Models ───────────────────────────────────────
  const [tenantServices, setTenantServices] = useState<Array<{ serviceId: string, modelId?: string, price: number, duration: number }>>([]);
  const servicesQuery = useQuery(api.services.adminServices.listServices, { tenantType: type });

  // ── UI State ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fetchingAddress, setFetchingAddress] = useState(false);

  // ── Local Storage Draft State & Effects ──────────────────────────────
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resetForm = () => {
    setCurrentStep(0);
    setName("");
    setSubdomain("");
    setDebouncedSubdomain("");
    setTitle("");
    setCityId("");
    setType("barbers");
    setPhone("");
    setAddress("");
    setHeroTitle("");
    setHeroSubTitle("");
    setAboutUsText("");
    setLocation(null);
    setCertificateFile(null);
    setCertificatePreview(null);
    setInteriorFile(null);
    setInteriorPreview(null);
    setOutsideFile(null);
    setOutsidePreview(null);
    setTeamFile(null);
    setTeamPreview(null);
    setInteriorMobileFile(null);
    setInteriorMobilePreview(null);
    setOutsideMobileFile(null);
    setOutsideMobilePreview(null);
    setTeamMobileFile(null);
    setTeamMobilePreview(null);
    setTeamStorageId(null);
    setTeamMobileStorageId(null);
    setInteriorStorageId(null);
    setInteriorMobileStorageId(null);
    setOutsideStorageId(null);
    setOutsideMobileStorageId(null);
    setTeamTaskId(null);
    setTeamMobileTaskId(null);
    setInteriorTaskId(null);
    setInteriorMobileTaskId(null);
    setOutsideTaskId(null);
    setOutsideMobileTaskId(null);
    setTelegram("");
    setInstagram("");
    setWhatsapp("");
    setStartHour(9);
    setStartMinute(0);
    setEndHour(21);
    setEndMinute(0);
    setWorkingDays([true, true, true, true, true, true, false]);
    setBreaks([{ startTime: { hour: 14, minute: 0 }, endTime: { hour: 17, minute: 0 } }]);
    setOwners([createEmptyMember("barbers", "")]);
    setStaff([]);
    setTenantServices([]);
    setIsDraftRestored(false);
    setErrors({});
    if (typeof window !== "undefined") {
      localStorage.removeItem("bestieecp_new_tenant_draft");
    }
  };

  // Load draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("bestieecp_new_tenant_draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);

        const base64ToFile = (dataurl: string, filename: string): File => {
          const arr = dataurl.split(",");
          const mime = arr[0].match(/:(.*?);/)?.[1] || "";
          const bstr = atob(arr[arr.length - 1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new File([u8arr], filename, { type: mime });
        };

        if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
        if (data.name !== undefined) setName(data.name);
        if (data.subdomain !== undefined) setSubdomain(data.subdomain);
        if (data.title !== undefined) setTitle(data.title);
        if (data.cityId !== undefined) setCityId(data.cityId);
        if (data.type !== undefined) setType(data.type);
        if (data.phone !== undefined) setPhone(data.phone);
        if (data.address !== undefined) setAddress(data.address);
        if (data.heroTitle !== undefined) setHeroTitle(data.heroTitle);
        if (data.heroSubTitle !== undefined) setHeroSubTitle(data.heroSubTitle);
        if (data.aboutUsText !== undefined) setAboutUsText(data.aboutUsText);
        if (data.location !== undefined) setLocation(data.location);
        if (data.telegram !== undefined) setTelegram(data.telegram);
        if (data.instagram !== undefined) setInstagram(data.instagram);
        if (data.whatsapp !== undefined) setWhatsapp(data.whatsapp);
        if (data.startHour !== undefined) setStartHour(data.startHour);
        if (data.startMinute !== undefined) setStartMinute(data.startMinute);
        if (data.endHour !== undefined) setEndHour(data.endHour);
        if (data.endMinute !== undefined) setEndMinute(data.endMinute);
        if (data.workingDays !== undefined) setWorkingDays(data.workingDays);
        if (data.breaks !== undefined) setBreaks(data.breaks);
        if (data.owners !== undefined) setOwners(data.owners);
        if (data.staff !== undefined) setStaff(data.staff);
        if (data.tenantServices !== undefined) setTenantServices(data.tenantServices);

        if (data.certificatePreview) {
          setCertificatePreview(data.certificatePreview);
          try { setCertificateFile(base64ToFile(data.certificatePreview, "certificate.png")); } catch (e) {}
        }
        if (data.interiorPreview) {
          setInteriorPreview(data.interiorPreview);
          try { setInteriorFile(base64ToFile(data.interiorPreview, "interior.png")); } catch (e) {}
        }
        if (data.outsidePreview) {
          setOutsidePreview(data.outsidePreview);
          try { setOutsideFile(base64ToFile(data.outsidePreview, "outside.png")); } catch (e) {}
        }
        if (data.teamPreview) {
          setTeamPreview(data.teamPreview);
          try { setTeamFile(base64ToFile(data.teamPreview, "team.png")); } catch (e) {}
        }
        if (data.interiorMobilePreview) {
          setInteriorMobilePreview(data.interiorMobilePreview);
          try { setInteriorMobileFile(base64ToFile(data.interiorMobilePreview, "interiorMobile.png")); } catch (e) {}
        }
        if (data.outsideMobilePreview) {
          setOutsideMobilePreview(data.outsideMobilePreview);
          try { setOutsideMobileFile(base64ToFile(data.outsideMobilePreview, "outsideMobile.png")); } catch (e) {}
        }
        if (data.teamMobilePreview) {
          setTeamMobilePreview(data.teamMobilePreview);
          try { setTeamMobileFile(base64ToFile(data.teamMobilePreview, "teamMobile.png")); } catch (e) {}
        }
        if (data.teamStorageId) setTeamStorageId(data.teamStorageId);
        if (data.teamMobileStorageId) setTeamMobileStorageId(data.teamMobileStorageId);
        if (data.interiorStorageId) setInteriorStorageId(data.interiorStorageId);
        if (data.interiorMobileStorageId) setInteriorMobileStorageId(data.interiorMobileStorageId);
        if (data.outsideStorageId) setOutsideStorageId(data.outsideStorageId);
        if (data.outsideMobileStorageId) setOutsideMobileStorageId(data.outsideMobileStorageId);

        setIsDraftRestored(true);
      } catch (e) {
        console.error("Error restoring new tenant draft:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save draft on changes
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    const data = {
      currentStep,
      name,
      subdomain,
      title,
      cityId,
      type,
      phone,
      address,
      heroTitle,
      heroSubTitle,
      aboutUsText,
      location,
      telegram,
      instagram,
      whatsapp,
      startHour,
      startMinute,
      endHour,
      endMinute,
      workingDays,
      breaks,
      owners,
      staff,
      tenantServices,
      certificatePreview,
      interiorPreview,
      outsidePreview,
      teamPreview,
      interiorMobilePreview,
      outsideMobilePreview,
      teamMobilePreview,
      teamStorageId,
      teamMobileStorageId,
      interiorStorageId,
      interiorMobileStorageId,
      outsideStorageId,
      outsideMobileStorageId,
    };

    try {
      localStorage.setItem("bestieecp_new_tenant_draft", JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save full draft to localStorage (quota likely exceeded):", e);
      try {
        const fallbackData = {
          ...data,
          certificatePreview: null,
          interiorPreview: null,
          outsidePreview: null,
          teamPreview: null,
          interiorMobilePreview: null,
          outsideMobilePreview: null,
          teamMobilePreview: null,
        };
        localStorage.setItem("bestieecp_new_tenant_draft", JSON.stringify(fallbackData));
      } catch (innerError) {
        console.error("Failed to save even basic metadata to localStorage:", innerError);
      }
    }
  }, [
    isLoaded,
    currentStep,
    name,
    subdomain,
    title,
    cityId,
    type,
    phone,
    address,
    heroTitle,
    heroSubTitle,
    aboutUsText,
    location,
    telegram,
    instagram,
    whatsapp,
    startHour,
    startMinute,
    endHour,
    endMinute,
    workingDays,
    breaks,
    owners,
    staff,
    tenantServices,
    certificatePreview,
    interiorPreview,
    outsidePreview,
    teamPreview,
    interiorMobilePreview,
    outsideMobilePreview,
    teamMobilePreview,
    teamStorageId,
    teamMobileStorageId,
    interiorStorageId,
    interiorMobileStorageId,
    outsideStorageId,
    outsideMobileStorageId,
  ]);

  // Validation per step
  const validateStep = (step: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) errs.name = "نام شعبه الزامی است";
      if (!subdomain.trim()) {
        errs.subdomain = "زیر‌دامنه الزامی است";
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain.trim())) {
        errs.subdomain = "فقط حروف کوچک انگلیسی، اعداد و خط تیره";
      } else if (subdomain.trim().toLowerCase() === "dash") {
        errs.subdomain = "استفاده از زیردامنه 'dash' مجاز نیست";
      } else if (subdomainCheck?.available === false) {
        errs.subdomain = subdomainCheck.error || "این زیر‌دامنه قبلاً ثبت شده است";
      } else if (isCheckingSubdomain) {
        errs.subdomain = "در حال بررسی زیر‌دامنه...";
      }
      if (!title.trim()) errs.title = "عنوان سایت الزامی است";
      if (!cityId) errs.cityId = "انتخاب شهر الزامی است";
      if (!location) errs.location = "تعیین موقعیت مکانی روی نقشه الزامی است";
      if (!address.trim()) errs.address = "آدرس کامل شعبه الزامی است";
    }
    // step === 1: settings & socials (optional)
    if (step === 2) {
      // step 2: members
      if (owners.length === 0) errs.owners = "حداقل یک مدیر برای شعبه الزامی است";
      owners.forEach((o, i) => {
        if (o.type === "new") {
          if (!o.newUser.name.trim()) errs[`owner_${i}_name`] = "نام مدیر الزامی است";
          if (!o.newUser.phone.trim()) errs[`owner_${i}_phone`] = "تلفن مدیر الزامی است";
        } else if (!o.userId) {
          errs[`owner_${i}_userId`] = "مدیر انتخاب نشده است";
        }
      });
      staff.forEach((s, i) => {
        if (s.type === "new") {
          if (!s.newUser.name.trim()) errs[`staff_${i}_name`] = "نام پرسنل الزامی است";
          if (!s.newUser.phone.trim()) errs[`staff_${i}_phone`] = "تلفن پرسنل الزامی است";
        } else if (!s.userId) {
          errs[`staff_${i}_userId`] = "پرسنل انتخاب نشده است";
        }
      });
    }
    // step === 3: services & models (optional)
    if (step === 4) {
      // step 4: content & media
      if (!certificateFile && !certificatePreview) errs.certificate = "آپلود تصویر مجوز اجباری است";
    }
    return errs;
  };

  const canProceed = useMemo(() => {
    return Object.keys(validateStep(currentStep)).length === 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, name, subdomain, title, cityId, location, address, certificateFile, certificatePreview, owners, staff, subdomainCheck, isCheckingSubdomain]);

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

  const createImageChangeHandler = useCallback((
    field: SiteImageField,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, [field]: "فقط فایل تصویری مجاز است" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [field]: "حداکثر ۵ مگابایت" }));
      return;
    }
    setFile(file);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleCertificateChange = createImageChangeHandler("certificate", setCertificateFile, setCertificatePreview);
  const handleInteriorChange = createImageChangeHandler("interior", setInteriorFile, setInteriorPreview);
  const handleOutsideChange = createImageChangeHandler("outside", setOutsideFile, setOutsidePreview);
  const handleTeamChange = createImageChangeHandler("team", setTeamFile, setTeamPreview);
  const handleInteriorMobileChange = createImageChangeHandler("interiorMobile", setInteriorMobileFile, setInteriorMobilePreview);
  const handleOutsideMobileChange = createImageChangeHandler("outsideMobile", setOutsideMobileFile, setOutsideMobilePreview);
  const handleTeamMobileChange = createImageChangeHandler("teamMobile", setTeamMobileFile, setTeamMobilePreview);

  // Submit
  const handleSubmit = async () => {
    const allErrors: Record<string, string> = {};
    for (let i = 0; i < STEPS.length; i++) {
      Object.assign(allErrors, validateStep(i));
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (allErrors.name || allErrors.subdomain || allErrors.title || allErrors.cityId || allErrors.location || allErrors.address) {
        setCurrentStep(0);
      } else if (allErrors.owners || allErrors.staff || Object.keys(allErrors).some(k => k.startsWith("owner_") || k.startsWith("staff_"))) {
        setCurrentStep(2);
      } else if (allErrors.certificate) {
        setCurrentStep(4);
      }
      return;
    }

    setSubmitting(true);
    try {
      const uploadImage = async (file: File | null) => {
        if (!file) return undefined;
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        return storageId as string;
      };

      const resolveFinalStorageId = async (file: File | null, existingSid?: string | null) => {
        if (existingSid) return existingSid;
        if (file) return await uploadImage(file);
        return undefined;
      };

      const [
        certificateImageId,
        interiorImageId,
        outsideImageId,
        teamImageId,
        interiorMobileImageId,
        outsideMobileImageId,
        teamMobileImageId
      ] = await Promise.all([
        uploadImage(certificateFile),
        resolveFinalStorageId(interiorFile, interiorStorageId),
        resolveFinalStorageId(outsideFile, outsideStorageId),
        resolveFinalStorageId(teamFile, teamStorageId),
        resolveFinalStorageId(interiorMobileFile, interiorMobileStorageId),
        resolveFinalStorageId(outsideMobileFile, outsideMobileStorageId),
        resolveFinalStorageId(teamMobileFile, teamMobileStorageId),
      ]);

      const mapMember = (m: MemberState) => ({
        userId: m.type === "existing" ? (m.userId as any) : undefined,
        newUser: m.type === "new" ? {
          ...m.newUser,
          password: m.newUser.phone, // Default password is phone for convenience
        } : undefined
      });

      const payload: any = {
        name: name.trim(),
        type,
        subdomain: subdomain.trim(),
        mainDomain: MAIN_DOMAIN,
        cityId: cityId || undefined,
        title: title.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
        heroTitle: heroTitle.trim() || undefined,
        heroSubTitle: heroSubTitle.trim() || undefined,
        aboutUsText: aboutUsText.trim() || undefined,
        certificateImageId,
        interiorImageId,
        outsideImageId,
        teamImageId,
        interiorMobileImageId,
        outsideMobileImageId,
        teamMobileImageId,
        socialLinks: {
          telegram: telegram.trim() || undefined,
          instagram: instagram.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        },
        startWorkingTime: { hour: startHour, minute: startMinute },
        endWorkingTime: { hour: endHour, minute: endMinute },
        workingWeekdays: workingDays,
        breaks: breaks.map(b => ({
          startTime: { hour: b.startTime.hour, minute: b.startTime.minute },
          endTime: { hour: b.endTime.hour, minute: b.endTime.minute }
        })),
        owners: owners.map(mapMember),
        staff: staff.map(mapMember),
        tenantServices: tenantServices.map(ts => ({
          serviceId: ts.serviceId as any,
          modelId: ts.modelId as any,
          price: ts.price,
          duration: ts.duration,
        })),
      };

      await createTenant(payload);
      if (typeof window !== "undefined") {
        localStorage.removeItem("bestieecp_new_tenant_draft");
      }
      pushToast({ type: "success", title: "موفق", message: `شعبه ${name} با موفقیت ایجاد شد` });
      router.push("/tenants");
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: sanitizeError(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchAddress = async () => {
    if (!location) {
      pushToast({ type: "error", title: "خطا", message: "ابتدا یک موقعیت روی نقشه انتخاب کنید." });
      return;
    }

    setFetchingAddress(true);
    try {
      const { lat, lng } = location;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fa`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const parts = [];

        // Build address hierarchy
        if (addr.country) parts.push(addr.country);
        if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
        if (addr.suburb || addr.neighbourhood || addr.district) parts.push(addr.suburb || addr.neighbourhood || addr.district);
        if (addr.road) parts.push(addr.road);

        const formattedAddress = parts.join(" ، ");
        setAddress(formattedAddress || data.display_name);
      }
    } catch (err: any) {
      pushToast({ type: "error", title: "خطا", message: "خطا در دریافت آدرس از نقشه!" });
    } finally {
      setFetchingAddress(false);
    }
  };

  const toggleWorkingDay = (index: number) => {
    setWorkingDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const addBreak = () => {
    setBreaks([...breaks, { startTime: { hour: 13, minute: 0 }, endTime: { hour: 14, minute: 0 } }]);
  };

  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const updateBreak = (index: number, field: "startTime" | "endTime", subField: "hour" | "minute", value: number) => {
    setBreaks(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: {
          ...next[index][field],
          [subField]: value
        }
      };
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

      {isDraftRestored && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-orange-300 shadow shadow-orange-500/5">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-xl shrink-0" />
            <div>
              <p className="text-sm font-bold">پیش‌نویس ذخیره شده بازیابی شد</p>
              <p className="text-xs text-orange-300/70 mt-0.5">شما در حال ادامه ثبت شعبه از پیش‌نویس قبلی هستید. برای شروع مجدد فرم را بازنشانی کنید.</p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="cursor-pointer shrink-0 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 px-4 py-2 text-xs font-black text-orange-300 transition-colors"
          >
            شروع مجدد
          </button>
        </div>
      )}

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
              className={`cursor-pointer flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${isActive
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
                  placeholder="مثلاً: رویال"
                  required
                  error={errors.name}
                />
                <InputField
                  label="عنوان سایت"
                  icon={<FiType />}
                  value={title}
                  onChange={setTitle}
                  placeholder="عنوانی که در سایت و پلتفرم نمایش داده خواهد شد"
                  required
                  error={errors.title}
                />
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <FiLink />
                    زیر‌دامنه
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className={`flex items-center rounded-2xl border bg-white/5 overflow-hidden focus-within:bg-white/8 transition-all ${errors.subdomain && !isCheckingSubdomain && subdomainCheck?.available === false
                    ? "border-rose-500/40 focus-within:border-rose-500/60"
                    : isCheckingSubdomain
                      ? "border-amber-500/30 focus-within:border-amber-500/50"
                      : subdomain && subdomainCheck?.available === true
                        ? "border-emerald-500/30 focus-within:border-emerald-500/50"
                        : "border-white/10 focus-within:border-orange-500/40"
                    }`}>
                    <div className="flex items-center pl-3">
                      {isCheckingSubdomain ? (
                        <FiLoader className="animate-spin text-amber-400 text-sm" />
                      ) : subdomain && subdomainCheck?.available === true ? (
                        <FiCheck className="text-emerald-400 text-sm" />
                      ) : subdomain && subdomainCheck?.available === false ? (
                        <FiX className="text-rose-400 text-sm" />
                      ) : null}
                    </div>
                    <input
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/20"
                      placeholder="fadecity"
                      dir="ltr"
                    />
                    <span className="shrink-0 bg-white/5 border-r border-white/10 px-3 py-3 text-xs text-white/40 font-mono" dir="ltr">
                      .{MAIN_DOMAIN}
                    </span>
                  </div>
                  {errors.subdomain && <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
                    {!isCheckingSubdomain && <FiAlertCircle className="shrink-0" />}
                    <span>{errors.subdomain}</span>
                  </p>}
                  {subdomain && !errors.subdomain && subdomainCheck?.available === true && (
                    <p className="mt-1.5 text-[11px] text-emerald-400/80 flex items-center gap-1 font-medium">
                      <FiCheck className="shrink-0 text-emerald-400" />
                      <span>آدرس اینترنتی آزاد است:</span>
                      <span className="font-mono text-emerald-300 ml-1" dir="ltr">
                        {subdomain}.{MAIN_DOMAIN}
                      </span>
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
                      onClick={() => setType("barbers")}
                      className={`cursor-pointer flex flex-col gap-1 rounded-2xl border px-4 py-3 text-right transition ${type === "barbers"
                        ? "border-blue-500/40 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/8"
                        }`}
                    >
                      <span className="text-sm font-bold">آرایشگاه مردانه</span>
                      <span className="text-[10px] text-white/30">barbers</span>
                    </button>
                    <button
                      onClick={() => setType("barbies")}
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

                <CitySelect
                  label="شهر شعبه"
                  value={cityId}
                  onChange={setCityId}
                  error={errors.cityId}
                  required
                />

                <InputField
                  label="تلفن شعبه"
                  icon={<FiPhone />}
                  value={phone}
                  onChange={setPhone}
                  placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                  dir="ltr"
                />
              </div>

              {/* Location & Address Section (Full Width & Centered) */}
              <div className="mt-8 border-t border-white/10 pt-6 w-full">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                      <FiMapPin className="text-lg text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        موقعیت مکانی و آدرس شعبه
                        <span className="text-rose-400 text-sm">*</span>
                      </h3>
                      <p className="text-xs text-white/40">تعیین دقیق لوکیشن روی نقشه و ثبت نشانی فیزیکی شعبه (هر دو الزامی)</p>
                    </div>
                  </div>
                  {location && (
                    <span className="text-xs font-mono text-white/50 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 self-start sm:self-auto flex items-center gap-1.5" dir="ltr">
                      <FiMapPin className="text-amber-400 text-xs shrink-0" />
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </span>
                  )}
                </div>

                <LocationPicker
                  value={location}
                  onChange={(loc) => {
                    setLocation(loc);
                    if (errors.location) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.location;
                        return next;
                      });
                    }
                  }}
                  error={errors.location}
                  mapHeight="380px"
                  addressSlot={
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white/50 flex items-center gap-1.5">
                          <FiMapPin className="text-orange-400" />
                          آدرس کامل شعبه
                          <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleFetchAddress}
                          disabled={fetchingAddress || !location}
                          className="cursor-pointer text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl px-2.5 py-1"
                        >
                          {fetchingAddress ? <FiLoader className="animate-spin text-xs" /> : <FiMapPin className="text-xs" />}
                          دریافت از نقشه
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            if (errors.address) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.address;
                                return next;
                              });
                            }
                          }}
                          placeholder="آدرس کامل را وارد کنید یا از دکمه دریافت از نقشه استفاده نمایید"
                          className={`w-full h-[46px] rounded-2xl border bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/20 ${
                            errors.address
                              ? "border-rose-500/40 focus:border-rose-500/60"
                              : "border-white/10 focus:border-orange-500/40 focus:bg-white/8"
                          }`}
                        />
                      </div>
                      {errors.address && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1">
                          <FiAlertCircle className="shrink-0" />
                          <span>{errors.address}</span>
                        </p>
                      )}
                    </div>
                  }
                />
              </div>
            </div>
          )}

          
          {/* ── Step 1: Settings & Socials ──────────────── */}
          {currentStep === 1 && (
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

                {/* Break times */}
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                        <FiClock className="text-amber-400/60" />
                        زمان استراحت
                      </label>
                      <p className="text-[10px] text-white/20 mt-0.5">ساعاتی که نوبت‌دهی متوقف می‌شود</p>
                    </div>
                    <button
                      onClick={addBreak}
                      className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      <FiPlus />
                      افزودن استراحت
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {breaks.length === 0 && (
                      <div className="rounded-2xl border border-white/5 bg-white/2 p-4 text-center">
                        <p className="text-xs text-white/20">هیچ زمان استراحتی تنظیم نشده است</p>
                      </div>
                    )}
                    {breaks.map((b, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="flex-1 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/3 p-3 transition group-hover:border-white/20">
                          {/* Break Start */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 whitespace-nowrap">شروع:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0} max={24}
                                value={b.startTime.hour}
                                onChange={(e) => updateBreak(i, "startTime", "hour", Number(e.target.value))}
                                className="w-12 rounded-xl border border-white/5 bg-white/5 px-2 py-1.5 text-xs text-white text-center outline-none focus:border-amber-500/40"
                              />
                              <span className="text-white/20">:</span>
                              <input
                                type="number"
                                min={0} max={59}
                                value={b.startTime.minute}
                                onChange={(e) => updateBreak(i, "startTime", "minute", Number(e.target.value))}
                                className="w-12 rounded-xl border border-white/5 bg-white/5 px-2 py-1.5 text-xs text-white text-center outline-none focus:border-amber-500/40"
                              />
                            </div>
                          </div>
                          {/* Break End */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 whitespace-nowrap">پایان:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0} max={23}
                                value={b.endTime.hour}
                                onChange={(e) => updateBreak(i, "endTime", "hour", Number(e.target.value))}
                                className="w-12 rounded-xl border border-white/5 bg-white/5 px-2 py-1.5 text-xs text-white text-center outline-none focus:border-amber-500/40"
                              />
                              <span className="text-white/20">:</span>
                              <input
                                type="number"
                                min={0} max={59}
                                value={b.endTime.minute}
                                onChange={(e) => updateBreak(i, "endTime", "minute", Number(e.target.value))}
                                className="w-12 rounded-xl border border-white/5 bg-white/5 px-2 py-1.5 text-xs text-white text-center outline-none focus:border-amber-500/40"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBreak(i)}
                          className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 opacity-0 group-hover:opacity-100 transition hover:bg-rose-500 hover:text-white"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ── Step 2: Members ──────────────────────────── */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-8">
              {/* Owners Section */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                      <FiUser className="text-lg text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">مدیران شعبه (Owners)</h2>
                      <p className="text-xs text-white/40">حداقل یک مدیر برای مدیریت شعبه الزامی است</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOwners([...owners, createEmptyMember(type, cityId)])}
                    className="cursor-pointer flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                  >
                    <FiPlus />
                    افزودن مدیر جدید
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {owners.map((owner, idx) => (
                    <MemberCard
                      key={idx}
                      label="مدیر"
                      member={owner}
                      index={idx}
                      errors={errors}
                      prefix="owner"
                      tenantType={type}
                      defaultCityId={cityId}
                      onRemove={() => setOwners(owners.filter((_, i) => i !== idx))}
                      onChange={(updated) => {
                        const next = [...owners];
                        next[idx] = updated;
                        setOwners(next);
                      }}
                    />
                  ))}
                  {errors.owners && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-400/5 p-3 rounded-xl border border-rose-400/10">
                      <FiAlertCircle />
                      {errors.owners}
                    </p>
                  )}
                </div>
              </div>

              {/* Staff Section */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                      <FiUsers className="text-lg text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">پرسنل و آرایشگران (Staff)</h2>
                      <p className="text-xs text-white/40">لیست نفراتی که خدمات ارائه می‌دهند</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStaff([...staff, createEmptyMember(type, cityId)])}
                    className="cursor-pointer flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                  >
                    <FiPlus />
                    افزودن پرسنل
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/2">
                      <FiUsers className="text-3xl text-white/10 mb-2" />
                      <p className="text-sm text-white/20">هیچ پرسنلی اضافه نشده است</p>
                    </div>
                  ) : (
                    staff.map((s, idx) => (
                      <MemberCard
                        key={idx}
                        label="پرسنل"
                        member={s}
                        index={idx}
                        errors={errors}
                        prefix="staff"
                        tenantType={type}
                        defaultCityId={cityId}
                        onRemove={() => setStaff(staff.filter((_, i) => i !== idx))}
                        onChange={(updated) => {
                          const next = [...staff];
                          next[idx] = updated;
                          setStaff(next);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* ── Step 3: Services & Models ──────────────────────────── */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-8">
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/20">
                      <FiList className="text-lg text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">خدمات و مدل‌های شعبه</h2>
                      <p className="text-xs text-white/40">خدماتی که این شعبه ارائه می‌دهد را انتخاب کنید. این خدمات به صورت خودکار به پرسنل اختصاص داده می‌شود.</p>
                    </div>
                  </div>
                </div>

                {!servicesQuery ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader className="animate-spin text-3xl text-white/30" />
                  </div>
                ) : servicesQuery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/2">
                    <FiList className="text-3xl text-white/10 mb-2" />
                    <p className="text-sm text-white/20">هیچ خدمتی برای این نوع شعبه یافت نشد</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {servicesQuery.map((service: any) => (
                      <ServiceSelectionCard
                        key={service._id}
                        service={service}
                        tenantServices={tenantServices}
                        setTenantServices={setTenantServices}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        
          {/* ── Step 4: Content & Media ──────────────────── */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
                    <FiLayout className="text-lg text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">محتوای سایت و تصاویر شعبه</h2>
                    <p className="text-xs text-white/40">تولید هوشمند متون با هوش مصنوعی و آپلود تصاویر شعبه</p>
                  </div>
                </div>

                {/* Hero and About Us */}
                <div className="flex flex-col gap-5 mt-6 border-t border-white/10 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400">
                        <FiZap className="text-base" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">تولید هوشمند متون و درباره ما</h3>
                        <p className="text-[11px] text-white/40">تولید شعارهای جذاب و معرفی با هوش مصنوعی (Gemini 3.8 Flash)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAiClick("all")}
                      disabled={generatingField !== null}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-500/30"
                    >
                      {generatingField === "all" ? (
                        <>
                          <FiLoader className="animate-spin text-sm" />
                          <span>در حال نگارش با هوش مصنوعی...</span>
                        </>
                      ) : (
                        <>
                          <FiZap className="text-amber-300 text-sm animate-pulse" />
                          <span>تولید خودکار محتوا با هوش مصنوعی</span>
                        </>
                      )}
                    </button>
                  </div>

                  <InputField
                    label="عنوان هیرو (عنوان بزرگ بالای سایت)"
                    icon={<FiType />}
                    value={heroTitle}
                    onChange={setHeroTitle}
                    placeholder="مثلاً: آرایشگاه رویال - همه روزه در خدمت شما"
                    action={
                      <button
                        type="button"
                        onClick={() => handleAiClick("heroTitle")}
                        disabled={generatingField !== null}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 text-[11px] font-medium text-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="بازتولید عنوان هیرو با هوش مصنوعی"
                      >
                        {generatingField === "heroTitle" ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>در حال تولید...</span>
                          </>
                        ) : (
                          <>
                            <FiRefreshCw className="text-xs" />
                            <span>بازتولید با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />
                  <InputField
                    label="زیرعنوان هیرو"
                    icon={<FiFileText />}
                    value={heroSubTitle}
                    onChange={setHeroSubTitle}
                    placeholder="توضیح کوتاه زیر عنوان اصلی"
                    action={
                      <button
                        type="button"
                        onClick={() => handleAiClick("heroSubTitle")}
                        disabled={generatingField !== null}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 text-[11px] font-medium text-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="بازتولید زیرعنوان با هوش مصنوعی"
                      >
                        {generatingField === "heroSubTitle" ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>در حال تولید...</span>
                          </>
                        ) : (
                          <>
                            <FiRefreshCw className="text-xs" />
                            <span>بازتولید با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />
                  <TextareaField
                    label="متن درباره ما"
                    icon={<FiFileText />}
                    value={aboutUsText}
                    onChange={setAboutUsText}
                    placeholder="معرفی کامل آرایشگاه برای بخش درباره ما..."
                    rows={5}
                    action={
                      <button
                        type="button"
                        onClick={() => handleAiClick("aboutUsText")}
                        disabled={generatingField !== null}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 text-[11px] font-medium text-violet-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="بازتولید متن درباره ما با هوش مصنوعی"
                      >
                        {generatingField === "aboutUsText" ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>در حال تولید...</span>
                          </>
                        ) : (
                          <>
                            <FiRefreshCw className="text-xs" />
                            <span>بازتولید با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Images */}
              <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80 p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                    <FiImage className="text-lg text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">تصاویر شعبه و مجوز</h2>
                    <p className="text-xs text-white/40">بارگذاری تصاویر لازم برای سایت</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-5">
                  <div className="col-span-1 lg:col-span-2">
                    <label className="mb-2 block text-xs font-bold text-white/50">
                      تصویر مجوز فعالیت
                      <span className="text-rose-400 text-sm mr-1">*</span>
                    </label>
                    <div
                      onClick={() => certInputRef.current?.click()}
                      className={`cursor-pointer flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 transition-all min-h-[200px] ${certificatePreview
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : errors.certificate
                          ? "border-rose-500/40 bg-rose-500/5"
                          : "border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/5"
                        }`}
                    >
                      {certificatePreview ? (
                        <div className="relative flex flex-col items-center justify-center max-w-full">
                          <img
                            src={certificatePreview}
                            alt="Certificate preview"
                            className="max-h-[150px] max-w-full object-contain rounded-xl shadow-lg"
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
                        </div>
                      ) : (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                            <FiCamera className="text-xl text-white/30" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-white/50">انتخاب تصویر</p>
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
                      <p className="mt-2 text-xs text-rose-400">{errors.certificate}</p>
                    )}
                  </div>

                  <ImageUploadCard
                    title="تصویر تیم"
                    description="یک تصویر عریض ۲:۱ از اعضای تیم شعبه"
                    preview={teamPreview}
                    onTrigger={() => teamInputRef.current?.click()}
                    onRemove={() => {
                      setTeamFile(null);
                      setTeamPreview(null);
                      setTeamStorageId(null);
                      setTeamTaskId(null);
                    }}
                    onDownload={() =>
                      teamPreview &&
                      handleDownloadImage(
                        teamPreview,
                        `bestiee-${name.trim() || "salon"}-team-2x1.jpg`
                      )
                    }
                    inputRef={teamInputRef}
                    onChange={handleTeamChange}
                    error={errors.team}
                    isAiGenerating={teamAiGenerating}
                    aiProgress={teamAiProgress}
                    aiAction={
                      <button
                        type="button"
                        onClick={() => setActiveModalTarget("team")}
                        disabled={teamAiGenerating}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/40 px-3 py-1.5 text-[11px] font-bold text-violet-200 transition shadow-sm disabled:opacity-40"
                      >
                        {teamAiGenerating ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>در حال پردازش ({Math.round(teamAiProgress)}٪)</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="text-amber-300 text-xs" />
                            <span>فیلتر با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <ImageUploadCard
                    title="تصویر تیم (نسخه موبایل)"
                    description="نسخه مربعی ۱:۱ از اعضای تیم برای دستگاه‌های موبایل"
                    preview={teamMobilePreview}
                    onTrigger={() => teamMobileInputRef.current?.click()}
                    onRemove={() => {
                      setTeamMobileFile(null);
                      setTeamMobilePreview(null);
                      setTeamMobileStorageId(null);
                      setTeamMobileTaskId(null);
                    }}
                    onDownload={() =>
                      teamMobilePreview &&
                      handleDownloadImage(
                        teamMobilePreview,
                        `bestiee-${name.trim() || "salon"}-team-1x1.jpg`
                      )
                    }
                    inputRef={teamMobileInputRef}
                    onChange={handleTeamMobileChange}
                    error={errors.teamMobile}
                    isAiGenerating={teamMobileAiGenerating}
                    aiProgress={teamMobileAiProgress}
                    aiAction={
                      <button
                        type="button"
                        onClick={() => handleStartMobileAi("team")}
                        disabled={!teamPreview || teamMobileAiGenerating}
                        title={!teamPreview ? "ابتدا تصویر دسکتاپ را بارگذاری یا با هوش مصنوعی تولید کنید" : "تولید نسخه مربعی ۱:۱ از تصویر دسکتاپ"}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-blue-600/30 hover:from-indigo-600/50 hover:to-blue-600/50 border border-indigo-500/40 px-3 py-1.5 text-[11px] font-bold text-indigo-200 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {teamMobileAiGenerating ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>تولید ۱:۱ ({Math.round(teamMobileAiProgress)}٪)</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="text-cyan-300 text-xs" />
                            <span>تولید نسخه موبایل (۱:۱) با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <ImageUploadCard
                    title="تصویر فضای داخلی"
                    description="نمایی عریض ۲:۱ از فضای داخل شعبه"
                    preview={interiorPreview}
                    onTrigger={() => interiorInputRef.current?.click()}
                    onRemove={() => {
                      setInteriorFile(null);
                      setInteriorPreview(null);
                      setInteriorStorageId(null);
                      setInteriorTaskId(null);
                    }}
                    onDownload={() =>
                      interiorPreview &&
                      handleDownloadImage(
                        interiorPreview,
                        `bestiee-${name.trim() || "salon"}-interior-2x1.jpg`
                      )
                    }
                    inputRef={interiorInputRef}
                    onChange={handleInteriorChange}
                    error={errors.interior}
                    isAiGenerating={interiorAiGenerating}
                    aiProgress={interiorAiProgress}
                    aiAction={
                      <button
                        type="button"
                        onClick={() => setActiveModalTarget("interior")}
                        disabled={interiorAiGenerating}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/40 px-3 py-1.5 text-[11px] font-bold text-violet-200 transition shadow-sm disabled:opacity-40"
                      >
                        {interiorAiGenerating ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>در حال پردازش ({Math.round(interiorAiProgress)}٪)</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="text-amber-300 text-xs" />
                            <span>فیلتر با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <ImageUploadCard
                    title="تصویر فضای داخلی (نسخه موبایل)"
                    description="نسخه مربعی ۱:۱ از فضای داخل شعبه برای دستگاه‌های موبایل"
                    preview={interiorMobilePreview}
                    onTrigger={() => interiorMobileInputRef.current?.click()}
                    onRemove={() => {
                      setInteriorMobileFile(null);
                      setInteriorMobilePreview(null);
                      setInteriorMobileStorageId(null);
                      setInteriorMobileTaskId(null);
                    }}
                    onDownload={() =>
                      interiorMobilePreview &&
                      handleDownloadImage(
                        interiorMobilePreview,
                        `bestiee-${name.trim() || "salon"}-interior-1x1.jpg`
                      )
                    }
                    inputRef={interiorMobileInputRef}
                    onChange={handleInteriorMobileChange}
                    error={errors.interiorMobile}
                    isAiGenerating={interiorMobileAiGenerating}
                    aiProgress={interiorMobileAiProgress}
                    aiAction={
                      <button
                        type="button"
                        onClick={() => handleStartMobileAi("interior")}
                        disabled={!interiorPreview || interiorMobileAiGenerating}
                        title={!interiorPreview ? "ابتدا تصویر دسکتاپ را بارگذاری یا با هوش مصنوعی تولید کنید" : "تولید نسخه مربعی ۱:۱ از تصویر دسکتاپ"}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-blue-600/30 hover:from-indigo-600/50 hover:to-blue-600/50 border border-indigo-500/40 px-3 py-1.5 text-[11px] font-bold text-indigo-200 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {interiorMobileAiGenerating ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>تولید ۱:۱ ({Math.round(interiorMobileAiProgress)}٪)</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="text-cyan-300 text-xs" />
                            <span>تولید نسخه موبایل (۱:۱) با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <ImageUploadCard
                    title="تصویر نمای بیرونی"
                    description="نمایی عریض ۲:۱ از ورودی یا نمای بیرون شعبه"
                    preview={outsidePreview}
                    onTrigger={() => outsideInputRef.current?.click()}
                    onRemove={() => {
                      setOutsideFile(null);
                      setOutsidePreview(null);
                      setOutsideStorageId(null);
                      setOutsideTaskId(null);
                    }}
                    onDownload={() =>
                      outsidePreview &&
                      handleDownloadImage(
                        outsidePreview,
                        `bestiee-${name.trim() || "salon"}-outside-2x1.jpg`
                      )
                    }
                    inputRef={outsideInputRef}
                    onChange={handleOutsideChange}
                    error={errors.outside}
                    isAiGenerating={outsideAiGenerating}
                    aiProgress={outsideAiProgress}
                    aiAction={
                      <button
                        type="button"
                        onClick={() => setActiveModalTarget("outside")}
                        disabled={outsideAiGenerating}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/40 px-3 py-1.5 text-[11px] font-bold text-violet-200 transition shadow-sm disabled:opacity-40"
                      >
                        {outsideAiGenerating ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>در حال پردازش ({Math.round(outsideAiProgress)}٪)</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="text-amber-300 text-xs" />
                            <span>فیلتر با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  <ImageUploadCard
                    title="تصویر نمای بیرونی (نسخه موبایل)"
                    description="نسخه مربعی ۱:۱ از ورودی یا بیرون شعبه برای دستگاه‌های موبایل"
                    preview={outsideMobilePreview}
                    onTrigger={() => outsideMobileInputRef.current?.click()}
                    onRemove={() => {
                      setOutsideMobileFile(null);
                      setOutsideMobilePreview(null);
                      setOutsideMobileStorageId(null);
                      setOutsideMobileTaskId(null);
                    }}
                    onDownload={() =>
                      outsideMobilePreview &&
                      handleDownloadImage(
                        outsideMobilePreview,
                        `bestiee-${name.trim() || "salon"}-outside-1x1.jpg`
                      )
                    }
                    inputRef={outsideMobileInputRef}
                    onChange={handleOutsideMobileChange}
                    error={errors.outsideMobile}
                    isAiGenerating={outsideMobileAiGenerating}
                    aiProgress={outsideMobileAiProgress}
                    aiAction={
                      <button
                        type="button"
                        onClick={() => handleStartMobileAi("outside")}
                        disabled={!outsidePreview || outsideMobileAiGenerating}
                        title={!outsidePreview ? "ابتدا تصویر دسکتاپ را بارگذاری یا با هوش مصنوعی تولید کنید" : "تولید نسخه مربعی ۱:۱ از تصویر دسکتاپ"}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-blue-600/30 hover:from-indigo-600/50 hover:to-blue-600/50 border border-indigo-500/40 px-3 py-1.5 text-[11px] font-bold text-indigo-200 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {outsideMobileAiGenerating ? (
                          <>
                            <FiLoader className="animate-spin text-xs" />
                            <span>تولید ۱:۱ ({Math.round(outsideMobileAiProgress)}٪)</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="text-cyan-300 text-xs" />
                            <span>تولید نسخه موبایل (۱:۱) با هوش مصنوعی</span>
                          </>
                        )}
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          )}

          </motion.div>
      </AnimatePresence>

      {/* ── Navigation Buttons ────────────────────────────── */}
      <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0 || submitting}
          className="cursor-pointer flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <FiArrowRight />
          مرحله قبل
        </button>

        <div className="flex items-center gap-3">
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed || submitting}
              className="cursor-pointer group flex items-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-black text-slate-900 transition hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
            >
              مرحله بعد
              <FiArrowLeft className="transition-transform group-hover:-translate-x-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || submitting}
              className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 px-10 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  ثبت نهایی شعبه
                  <FiCheck />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Overwrite Confirmation Modal */}
      {mounted && typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {overwriteConfirm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-amber-400 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <FiAlertCircle className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">جایگزینی متن با هوش مصنوعی</h3>
                    <p className="text-xs text-white/50">تایید بازنویسی فیلدهای تکمیل‌شده</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-6">
                  فیلدهای مورد نظر در حال حاضر دارای متن هستند. در صورت ادامه، متن‌های جدید تولید شده توسط هوش مصنوعی جایگزین متن‌های فعلی خواهند شد. آیا مطمئن هستید؟
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOverwriteConfirm(null)}
                    className="cursor-pointer rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-white/70 transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = overwriteConfirm;
                      setOverwriteConfirm(null);
                      executeAiGeneration(target);
                    }}
                    className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition"
                  >
                    تایید و جایگزینی
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* AI Image Generation Modal */}
      {activeModalTarget && (
        <AiImageGenerationModal
          isOpen={activeModalTarget !== null}
          onClose={() => setActiveModalTarget(null)}
          target={activeModalTarget}
          tenantType={type}
          tenantName={name.trim()}
          isGenerating={isModalTargetGenerating}
          progress={modalTargetProgress}
          statusMessage={
            activeTask?.status === "submitted"
              ? "درخواست به سرور هوش مصنوعی ارسال شد..."
              : activeTask?.status === "processing"
              ? "در حال رتوش چهره‌ها، تنظیم نور و اصلاح استایل..."
              : undefined
          }
          errorMessage={modalTargetErrorMessage}
          generatedPreviewUrl={modalTargetPreviewUrl}
          onStartGeneration={(files) => handleStartDesktopAi(activeModalTarget, files)}
          onApplyImage={() => setActiveModalTarget(null)}
          onReset={() => {
            if (activeModalTarget === "team") {
              setTeamTaskId(null);
              setTeamPreview(null);
              setTeamStorageId(null);
            } else if (activeModalTarget === "interior") {
              setInteriorTaskId(null);
              setInteriorPreview(null);
              setInteriorStorageId(null);
            } else if (activeModalTarget === "outside") {
              setOutsideTaskId(null);
              setOutsidePreview(null);
              setOutsideStorageId(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function MemberCard({
  label,
  member,
  index,
  errors,
  prefix,
  tenantType,
  defaultCityId,
  onRemove,
  onChange,
}: {
  label: string;
  member: MemberState;
  index: number;
  errors: Record<string, string>;
  prefix: string;
  tenantType: "barbers" | "barbies";
  defaultCityId: string;
  onRemove: () => void;
  onChange: (m: MemberState) => void;
}) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/60">
            {index + 1}
          </div>
          <h3 className="text-sm font-bold text-white/80">{label} {member.name || ""}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Type Toggle */}
          <div className="flex rounded-lg bg-white/5 p-1">
            <button
              onClick={() => onChange({ ...member, type: "existing", searchQuery: "" })}
              className={`cursor-pointer px-3 py-1.5 text-[10px] font-bold transition rounded-md ${member.type === "existing" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/50"
                }`}
            >
              کاربر موجود
            </button>
            <button
              onClick={() => onChange({
                ...member,
                type: "new",
                newUser: {
                  name: member.name || member.newUser?.name || "",
                  phone: member.newUser?.phone || "",
                  email: member.newUser?.email || "",
                  gender: member.newUser?.gender || (tenantType === "barbies" ? "female" : "male"),
                  cityId: member.newUser?.cityId || defaultCityId || "",
                }
              })}
              className={`cursor-pointer px-3 py-1.5 text-[10px] font-bold transition rounded-md ${member.type === "new" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/50"
                }`}
            >
              کاربر جدید
            </button>
          </div>
          <button
            onClick={onRemove}
            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {member.type === "existing" ? (
        <UserSearchField
          value={member.searchQuery || ""}
          selectedUserName={member.name}
          onSelect={(user: any) => onChange({ ...member, userId: user._id, name: user.name, searchQuery: user.name })}
          onChange={(q: string) => onChange({ ...member, searchQuery: q })}
          error={errors[`${prefix}_${index}_userId`]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="نام و نام خانوادگی"
            icon={<FiUser />}
            value={member.newUser.name}
            onChange={(v: string) => onChange({ ...member, name: v, newUser: { ...member.newUser, name: v } })}
            placeholder="مثلاً: علی رضایی"
            error={errors[`${prefix}_${index}_name`]}
            required
          />
          <InputField
            label="شماره موبایل"
            icon={<FiPhone />}
            value={member.newUser.phone}
            onChange={(v: string) => onChange({ ...member, newUser: { ...member.newUser, phone: v } })}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            dir="ltr"
            error={errors[`${prefix}_${index}_phone`]}
            required
          />
          <InputField
            label="ایمیل (اختیاری)"
            icon={<FiMessageCircle />}
            value={member.newUser.email}
            onChange={(v: string) => onChange({ ...member, newUser: { ...member.newUser, email: v } })}
            placeholder="info@example.com"
            dir="ltr"
          />
          <div className="md:col-span-1">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/50">
              <FiUser />
              جنسیت
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...member, newUser: { ...member.newUser, gender: "male" } })}
                className={`cursor-pointer flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${member.newUser.gender === "male" ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/5 text-white/30"
                  }`}
              >
                آقا
              </button>
              <button
                onClick={() => onChange({ ...member, newUser: { ...member.newUser, gender: "female" } })}
                className={`cursor-pointer flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${member.newUser.gender === "female" ? "border-pink-500/40 bg-pink-500/10 text-pink-300" : "border-white/10 bg-white/5 text-white/30"
                  }`}
              >
                خانم
              </button>
            </div>
          </div>
          <CitySelect
            label="شهر"
            value={member.newUser.cityId}
            onChange={(v: string) => onChange({ ...member, newUser: { ...member.newUser, cityId: v } })}
          />
        </div>
      )}
    </div>
  );
}

function UserSearchField({
  value,
  selectedUserName,
  onSelect,
  onChange,
  error,
}: {
  value: string;
  selectedUserName?: string;
  onSelect: (user: any) => void;
  onChange: (q: string) => void;
  error?: string;
}) {
  const [showResults, setShowResults] = useState(false);
  const results = useQuery(api.tenants.tenants.searchUsers, { query: value });

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3 transition focus-within:bg-white/8 ${error ? "border-rose-500/50" : "border-white/10 focus-within:border-orange-500/40"
        }`}>
        <FiSearch className="text-white/30" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="جستجو با نام یا شماره تلفن (حداقل ۳ حرف)..."
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
        />
        {selectedUserName && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            <FiCheck />
            {selectedUserName}
          </div>
        )}
      </div>

      {showResults && value.length >= 3 && (
        <div className="absolute top-full left-0 right-0 z-[100] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b]/90 shadow-2xl backdrop-blur-3xl ring-1 ring-white/5">
          {!results ? (
            <div className="p-4 text-center text-xs text-white/30 italic">در حال جستجو...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-white/30 italic">کاربری یافت نشد</div>
          ) : (
            <div className="max-h-60 overflow-y-auto p-2">
              {results.map((user: any) => (
                <button
                  key={user._id}
                  onClick={() => {
                    onSelect(user);
                    setShowResults(false);
                  }}
                  className="cursor-pointer flex w-full items-center justify-between rounded-xl px-4 py-3 text-right transition hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs text-white/40">
                      <FiUser />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="text-[10px] text-white/30 font-mono" dir="ltr">{user.phone}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2 py-1 text-[9px] font-bold text-white/40 uppercase">
                    {user.role}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}

      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  dir?: "ltr" | "rtl";
  type?: string;
  action?: React.ReactNode;
}

function InputField({ label, icon, value, onChange, placeholder, required, error, dir, type = "text", action }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold text-white/50">
          <span className="text-orange-400/60">{icon}</span>
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
        {action}
      </div>
      <div className={`flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3 transition focus-within:bg-white/8 ${error ? "border-rose-500/50" : "border-white/10 focus-within:border-orange-500/40"
        }`}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
        />
      </div>
      {error && <p className="text-[10px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
  action?: React.ReactNode;
}

function TextareaField({ label, icon, value, onChange, placeholder, required, error, rows = 3, action }: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold text-white/50">
          <span className="text-orange-400/60">{icon}</span>
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
        {action}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:bg-white/8 min-h-[100px] ${error ? "border-rose-500/50" : "border-white/10 focus:border-orange-500/40"
          } placeholder:text-white/20`}
      />
      {error && <p className="text-[10px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

function ImageUploadCard({
  title,
  description,
  preview,
  onTrigger,
  onRemove,
  onDownload,
  inputRef,
  onChange,
  error,
  aiAction,
  isAiGenerating,
  aiProgress,
}: {
  title: string;
  description: string;
  preview: string | null;
  onTrigger: () => void;
  onRemove: () => void;
  onDownload?: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  aiAction?: React.ReactNode;
  isAiGenerating?: boolean;
  aiProgress?: number;
}) {
  return (
    <div className={`rounded-2xl border bg-white/5 p-4 flex flex-col justify-between transition-all ${
      isAiGenerating ? "border-violet-500/40 ring-1 ring-violet-500/20 shadow-lg shadow-violet-500/10" : "border-white/10"
    }`}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-1 text-[11px] text-white/35 leading-relaxed">{description}</p>
        </div>
        {aiAction && <div className="shrink-0">{aiAction}</div>}
      </div>

      <div
        onClick={isAiGenerating ? undefined : onTrigger}
        className={`flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isAiGenerating
            ? "cursor-wait border-violet-500/40 bg-violet-500/5"
            : preview
            ? "cursor-pointer border-emerald-500/30 bg-emerald-500/5"
            : error
            ? "cursor-pointer border-rose-500/40 bg-rose-500/5"
            : "cursor-pointer border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/5"
        }`}
      >
        {isAiGenerating ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
              <FiZap className="text-xl text-violet-400 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-white mb-2">در حال پردازش هوش مصنوعی...</p>
            <div className="w-36 bg-white/10 h-2 rounded-full overflow-hidden mb-1.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(10, Math.min(100, aiProgress || 0))}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-mono">{Math.round(aiProgress || 0)}٪</span>
          </div>
        ) : preview ? (
          <div className="relative flex flex-col items-center justify-center max-w-full group">
            <img
              src={preview}
              alt={title}
              className="max-h-44 max-w-full object-contain rounded-xl border border-white/10 shadow-lg"
            />
            <div className="absolute -top-2 -right-2 flex items-center gap-1.5">
              {onDownload && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs shadow-lg transition"
                  title="دانلود تصویر"
                >
                  <FiDownload size={11} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs shadow-lg transition"
                title="حذف تصویر"
              >
                <FiX size={12} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <p className="text-xs text-emerald-400">
                <FiCheck className="ml-1 inline" />
                تصویر انتخاب شد
              </p>
              {onDownload && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="cursor-pointer text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  title="دانلود تصویر"
                >
                  <FiDownload className="text-xs" />
                  <span>دانلود فایل</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <FiCamera className="text-2xl text-white/30" />
            </div>
            <div>
              <p className="text-sm text-white/50">برای انتخاب تصویر کلیک کنید</p>
              <p className="mt-1 text-[10px] text-white/25">PNG, JPG تا ۵ مگابایت</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          <FiAlertCircle />
          {error}
        </div>
      )}
    </div>
  );
}

const formatNumber = (val: number | string | undefined) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "";
  const parts = String(val).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};


function ServiceSelectionCard({
  service,
  tenantServices,
  setTenantServices
}: {
  service: any;
  tenantServices: Array<{ serviceId: string, modelId?: string, price: number, duration: number }>;
  setTenantServices: React.Dispatch<React.SetStateAction<Array<{ serviceId: string, modelId?: string, price: number, duration: number }>>>;
}) {
  const modelsQuery = useQuery(api.services.adminServices.listModels, service.hasModels ? { serviceId: service._id } : "skip");
  const [expanded, setExpanded] = useState(false);

  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkDuration, setBulkDuration] = useState<number>(30);

  const isServiceSelected = tenantServices.some(ts => ts.serviceId === service._id && !ts.modelId);
  const selectedModelsCount = tenantServices.filter(ts => ts.serviceId === service._id && ts.modelId).length;
  const totalModelsCount = modelsQuery ? modelsQuery.length : 0;
  const isAllModelsSelected = totalModelsCount > 0 && selectedModelsCount === totalModelsCount;

  const toggleService = () => {
    if (isServiceSelected) {
      setTenantServices(prev => prev.filter(ts => !(ts.serviceId === service._id && !ts.modelId)));
    } else {
      setTenantServices(prev => [...prev, { serviceId: service._id, price: 0, duration: 30 }]);
    }
  };

  const toggleModel = (modelId: string) => {
    const isModelSelected = tenantServices.some(ts => ts.serviceId === service._id && ts.modelId === modelId);
    if (isModelSelected) {
      setTenantServices(prev => prev.filter(ts => !(ts.serviceId === service._id && ts.modelId === modelId)));
    } else {
      setTenantServices(prev => [...prev, {
        serviceId: service._id,
        modelId,
        price: bulkPrice > 0 ? bulkPrice : 0,
        duration: bulkDuration > 0 ? bulkDuration : 30
      }]);
    }
  };

  const toggleAllModels = () => {
    if (!modelsQuery || modelsQuery.length === 0) return;
    if (isAllModelsSelected) {
      setTenantServices(prev => prev.filter(ts => !(ts.serviceId === service._id && ts.modelId)));
    } else {
      setTenantServices(prev => {
        const next = [...prev];
        modelsQuery.forEach((model: any) => {
          const alreadyExists = next.some(ts => ts.serviceId === service._id && ts.modelId === model._id);
          if (!alreadyExists) {
            next.push({
              serviceId: service._id,
              modelId: model._id,
              price: bulkPrice > 0 ? bulkPrice : 0,
              duration: bulkDuration > 0 ? bulkDuration : 30,
            });
          }
        });
        return next;
      });
    }
  };

  const toggleGroupModels = (models: any[]) => {
    if (!models || models.length === 0) return;
    const groupModelIds = new Set(models.map(m => m._id));
    const isAllGroupSelected = models.every(m => tenantServices.some(ts => ts.serviceId === service._id && ts.modelId === m._id));

    if (isAllGroupSelected) {
      setTenantServices(prev => prev.filter(ts => !(ts.serviceId === service._id && ts.modelId && groupModelIds.has(ts.modelId))));
    } else {
      setTenantServices(prev => {
        const next = [...prev];
        models.forEach((model: any) => {
          const alreadyExists = next.some(ts => ts.serviceId === service._id && ts.modelId === model._id);
          if (!alreadyExists) {
            next.push({
              serviceId: service._id,
              modelId: model._id,
              price: bulkPrice > 0 ? bulkPrice : 0,
              duration: bulkDuration > 0 ? bulkDuration : 30,
            });
          }
        });
        return next;
      });
    }
  };

  const updatePriceDuration = (modelId: string | undefined, field: "price" | "duration", value: number) => {
    setTenantServices(prev => prev.map(ts => {
      if (ts.serviceId === service._id && ts.modelId === modelId) {
        return { ...ts, [field]: value };
      }
      return ts;
    }));
  };

  const handleSyncModels = () => {
    setTenantServices(prev => prev.map(ts => {
      if (ts.serviceId === service._id && ts.modelId) {
        return { ...ts, price: bulkPrice, duration: bulkDuration };
      }
      return ts;
    }));
  };

  const groupedModels = useMemo(() => {
    if (!modelsQuery) return null;
    const groups: Record<string, any[]> = {};
    modelsQuery.forEach((model: any) => {
      const gName = model.groupName || "سایر مدل‌ها";
      if (!groups[gName]) {
        groups[gName] = [];
      }
      groups[gName].push(model);
    });
    return groups;
  }, [modelsQuery]);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isServiceSelected || selectedModelsCount > 0
      ? "border-indigo-500/30 shadow-lg shadow-indigo-500/10"
      : "border-white/10"
      }`}>
      {/* ── Service Header ───────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 ${isServiceSelected || selectedModelsCount > 0
          ? "bg-indigo-500/10"
          : "bg-white/3 hover:bg-white/6"
          }`}
        onClick={() => service.hasModels ? setExpanded(!expanded) : toggleService()}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 overflow-hidden border border-white/10">
            {service.imageUrl ? (
              <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
            ) : (
              <FiList className="text-white/30 text-xl" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{service.name}</h3>
            {service.hasModels ? (
              <div className="flex items-center gap-2 mt-1">
                {selectedModelsCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                    <FiCheck className="text-[10px]" />
                    {selectedModelsCount} از {totalModelsCount} مدل انتخاب شده
                  </span>
                ) : (
                  <span className="text-xs text-white/35">برای انتخاب مدل‌ها کلیک کنید</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/40 mt-1">خدمت ساده بدون مدل</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!service.hasModels && (
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200 ${isServiceSelected
              ? "border-indigo-500 bg-indigo-500 shadow-md shadow-indigo-500/30"
              : "border-white/20 bg-transparent hover:border-white/40"
              }`}>
              {isServiceSelected && <FiCheck className="text-white text-xs" />}
            </div>
          )}
          {service.hasModels && (
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${expanded ? "bg-indigo-500/20 rotate-90" : "bg-white/5 hover:bg-white/10"
              }`}>
              <FiArrowLeft className={`text-sm transition-colors ${expanded ? "text-indigo-300" : "text-white/40"}`} />
            </div>
          )}
        </div>
      </div>

      {/* ── Simple service price/duration (no models) ────────────────── */}
      {!service.hasModels && isServiceSelected && (
        <div className="px-5 py-4 border-t border-white/10 bg-gradient-to-br from-indigo-500/5 to-transparent grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-indigo-300/70 mb-1.5 block">قیمت (تومان)</label>
            <input
              type="text"
              placeholder="0"
              value={tenantServices.find(ts => ts.serviceId === service._id && !ts.modelId)?.price === 0 ? "" : formatNumber(tenantServices.find(ts => ts.serviceId === service._id && !ts.modelId)?.price)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                if (rawValue === "" || /^\d+$/.test(rawValue)) {
                  updatePriceDuration(undefined, "price", rawValue === "" ? 0 : Number(rawValue));
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/8 transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-indigo-300/70 mb-1.5 block">مدت (دقیقه)</label>
            <input
              type="number"
              value={tenantServices.find(ts => ts.serviceId === service._id && !ts.modelId)?.duration || 30}
              onChange={(e) => updatePriceDuration(undefined, "duration", Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/8 transition"
            />
          </div>
        </div>
      )}

      {/* ── Models card grid ─────────────────────────────────────────── */}
      {service.hasModels && expanded && (
        <div className="p-5 border-t border-white/10 bg-gradient-to-b from-black/30 to-black/10">
          {/* Bulk set price and duration */}
          {groupedModels && Object.keys(groupedModels).length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-white/5 border border-white/10 rounded-2xl p-4 mb-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 w-full">
                <label className="text-[11px] font-bold text-indigo-300/80 mb-1.5 block">قیمت همگانی مدل‌ها (تومان)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={bulkPrice === 0 ? "" : formatNumber(bulkPrice)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    if (rawValue === "" || /^\d+$/.test(rawValue)) {
                      setBulkPrice(rawValue === "" ? 0 : Number(rawValue));
                    }
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/5 transition"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-[11px] font-bold text-indigo-300/80 mb-1.5 block">مدت همگانی مدل‌ها (دقیقه)</label>
                <input
                  type="number"
                  placeholder="30"
                  value={bulkDuration || ""}
                  onChange={(e) => setBulkDuration(e.target.value === "" ? 0 : Number(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/5 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={toggleAllModels}
                  className={`cursor-pointer flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 h-[38px] border ${
                    isAllModelsSelected
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                      : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {isAllModelsSelected ? (
                    <>
                      <FiX className="text-xs text-rose-400" />
                      <span>لغو انتخاب همه</span>
                    </>
                  ) : (
                    <>
                      <FiCheck className="text-xs text-indigo-400" />
                      <span>انتخاب همه ({totalModelsCount})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSyncModels}
                  disabled={selectedModelsCount === 0}
                  className="cursor-pointer flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0 h-[38px]"
                >
                  <FiRefreshCw className="text-xs" />
                  <span>همگام‌سازی ({selectedModelsCount})</span>
                </button>
              </div>
            </div>
          )}

          {!groupedModels ? (
            <div className="flex items-center justify-center gap-3 py-10">
              <FiLoader className="animate-spin text-2xl text-indigo-400" />
              <span className="text-sm text-white/30">در حال بارگذاری مدل‌ها...</span>
            </div>
          ) : Object.keys(groupedModels).length === 0 ? (
            <div className="text-center py-10 text-sm text-white/30">هیچ مدلی برای این خدمت یافت نشد</div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(groupedModels).map(([groupName, models]) => (
                <div key={groupName} className="flex flex-col gap-3">
                  {/* Group header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/80" />
                      <h4 className="text-xs font-black text-indigo-300">{groupName}</h4>
                      <span className="text-[10px] text-white/30 font-bold">({models.length} مدل)</span>
                    </div>

                    {(() => {
                      const isGroupAllSelected = models.every(m => tenantServices.some(ts => ts.serviceId === service._id && ts.modelId === m._id));
                      const groupSelectedCount = models.filter(m => tenantServices.some(ts => ts.serviceId === service._id && ts.modelId === m._id)).length;
                      return (
                        <button
                          type="button"
                          onClick={() => toggleGroupModels(models)}
                          className={`cursor-pointer flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition border ${
                            isGroupAllSelected
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                              : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {isGroupAllSelected ? (
                            <>
                              <FiX className="text-xs text-rose-400" />
                              <span>لغو همه</span>
                            </>
                          ) : (
                            <>
                              <FiCheck className="text-xs text-indigo-400" />
                              <span>
                                انتخاب همه
                                {groupSelectedCount > 0 ? ` (${groupSelectedCount}/${models.length})` : ""}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {models.map((model: any) => {
                      const isModelSelected = tenantServices.some(ts => ts.serviceId === service._id && ts.modelId === model._id);
                      const tsRecord = tenantServices.find(ts => ts.serviceId === service._id && ts.modelId === model._id);
                      return (
                        <div
                          key={model._id}
                          className={`group relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 ${isModelSelected
                            ? "border-indigo-500/60 shadow-lg shadow-indigo-500/20 scale-[1.01]"
                            : "border-white/8 hover:border-white/20 hover:shadow-md"
                            }`}
                          onClick={() => toggleModel(model._id)}
                        >
                          {/* Image */}
                          <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
                            {model.imageUrl ? (
                              <img
                                src={model.imageUrl}
                                alt={model.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <FiList className="text-3xl text-white/20" />
                              </div>
                            )}

                            {/* Selection overlay */}
                            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isModelSelected
                              ? "bg-indigo-500/40 backdrop-blur-[1px]"
                              : "bg-black/0 group-hover:bg-black/20"
                              }`}>
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 ${isModelSelected
                                ? "border-white bg-indigo-500 scale-110 shadow-xl"
                                : "border-white/40 bg-black/30 scale-0 group-hover:scale-100"
                                }`}>
                                <FiCheck className="text-white text-sm" />
                              </div>
                            </div>

                            {/* Selected badge */}
                            {isModelSelected && (
                              <div className="absolute top-2 right-2 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                                ✓
                              </div>
                            )}
                          </div>

                          {/* Model name */}
                          <div className={`px-3 py-2.5 transition-colors duration-200 ${isModelSelected ? "bg-indigo-500/15" : "bg-white/3 group-hover:bg-white/6"
                            }`}>
                            <p className="text-xs font-bold text-white text-center leading-tight truncate">{model.name}</p>
                            {model.nameEn && (
                              <p className="text-[10px] text-white/30 text-center font-mono mt-0.5 truncate" dir="ltr">{model.nameEn}</p>
                            )}
                          </div>

                          {/* Price / Duration inputs – shown when selected */}
                          {isModelSelected && (
                            <div
                              className="px-3 pb-3 pt-1 bg-indigo-500/10 border-t border-indigo-500/20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[9px] font-bold text-indigo-300/60 mb-1 block">قیمت (ت)</label>
                                  <input
                                    type="text"
                                    placeholder="0"
                                    value={tsRecord?.price === 0 ? "" : formatNumber(tsRecord?.price)}
                                    onChange={(e) => {
                                      const rawValue = e.target.value.replace(/,/g, '');
                                      if (rawValue === "" || /^\d+$/.test(rawValue)) {
                                        updatePriceDuration(model._id, "price", rawValue === "" ? 0 : Number(rawValue));
                                      }
                                    }}
                                    className="w-full bg-black/20 border border-indigo-500/20 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-400/60 text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-indigo-300/60 mb-1 block">مدت (دق)</label>
                                  <input
                                    type="number"
                                    value={tsRecord?.duration || 30}
                                    onChange={(e) => updatePriceDuration(model._id, "duration", Number(e.target.value))}
                                    className="w-full bg-black/20 border border-indigo-500/20 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-400/60 text-center"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
