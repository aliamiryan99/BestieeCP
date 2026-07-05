"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import dynamic from "next/dynamic";

const RequestPreviewMap = dynamic(
  () => import("@/components/support/RequestPreviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
        <span className="text-[10px] font-bold text-white/40">در حال بارگذاری نقشه...</span>
      </div>
    ),
  }
);
import { useToastStore } from "@/store/toastStore";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiMessageSquare,
  FiMail,
  FiPhone,
  FiUser,
  FiClock,
  FiLoader,
  FiAlertTriangle,
  FiExternalLink,
  FiSend,
  FiX,
  FiCheckCircle,
  FiSearch,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";

const socialLabels: Record<string, string> = {
  telegram: "تلگرام",
  bale: "بله",
  whatsapp: "واتس‌اپ",
  eitaa: "ایتا",
  rubika: "روبیکا",
};

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = useQuery(api.users.auth.me);
  const contactMessages = useQuery(api.support.listContactMessages);
  const tenantRequests = useQuery(api.support.listTenantRequests);
  const supportTickets = useQuery(api.support.listSupportTickets);
  const tenants = useQuery(api.tenants.tenants.listAll);
  
  const updateRequestStatus = useMutation(api.support.updateTenantRequestStatus);
  const replyToTicket = useMutation(api.support.replyToTicket);
  const resolveTicket = useMutation(api.support.resolveSupportTicket);
  const pushToast = useToastStore((state) => state.push);

  const isAuthorized = me?.role === "creator" || me?.role === "promoter";
  const isCreator = me?.role === "creator";

  const hasActiveCall = useMemo(() => {
    if (isCreator || !me?._id || !tenantRequests) return false;
    return tenantRequests.some((req: any) => req.status === "contacted" && req.contactedById === me._id);
  }, [tenantRequests, isCreator, me]);

  const [activeTab, setActiveTab] = useState<"requests" | "messages" | "tickets">((() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "requests" || tabParam === "messages" || tabParam === "tickets") {
      return tabParam;
    }
    return "requests";
  })());

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "requests" || tabParam === "messages" || tabParam === "tickets") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === "requests") {
      params.delete("tab");
    } else {
      params.set("tab", activeTab);
    }
    const newQuery = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${newQuery}`);
  }, [activeTab]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // State for "It's Added" modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // State for searchable tenant selector inside link modal
  const [tenantSearch, setTenantSearch] = useState("");
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const tenantSelectRef = useRef<HTMLDivElement>(null);

  const selectedTenant = useMemo(() => {
    if (!tenants || !selectedTenantId) return null;
    return tenants.find((t: any) => t._id === selectedTenantId) ?? null;
  }, [tenants, selectedTenantId]);

  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    
    let list = tenants;
    if (!isCreator && me?._id) {
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      list = tenants.filter((t: any) => {
        const isSelfCreated = t.createdBy === me._id;
        const isRecent = (now - t._creationTime) <= twoDaysMs;
        return isSelfCreated && isRecent;
      });
    }

    const q = tenantSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t: any) => 
      t.name.toLowerCase().includes(q) ||
      (t.domains?.[0]?.hostname || "").toLowerCase().includes(q)
    );
  }, [tenants, tenantSearch, isCreator, me]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tenantSelectRef.current && !tenantSelectRef.current.contains(event.target as Node)) {
        setIsTenantDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // State for Request Preview Modal
  const [previewRequest, setPreviewRequest] = useState<any | null>(null);

  // State for support tickets drawer
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const activeTicketDetails = useQuery(
    api.support.getTicketDetails,
    activeTicketId ? { ticketId: activeTicketId as any } : "skip"
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const loading =
    contactMessages === undefined ||
    tenantRequests === undefined ||
    supportTickets === undefined ||
    me === undefined;

  if (!loading && !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 space-y-4">
        <FiAlertTriangle className="text-5xl text-rose-500 animate-pulse" />
        <h2 className="text-xl font-bold text-white">عدم دسترسی</h2>
        <p className="text-sm text-white/50 max-w-sm">
          شما دسترسی لازم برای مشاهده پیام‌های پشتیبانی و درخواست‌های ثبت‌نام را ندارید.
        </p>
      </div>
    );
  }

  const handleCallRequest = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      await updateRequestStatus({
        requestId: requestId as any,
        status: "contacted",
      });
      pushToast({
        type: "success",
        title: "بروزرسانی وضعیت",
        message: "وضعیت درخواست به «در حال تماس» تغییر یافت.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در بروزرسانی",
        message: err.message || "خطایی رخ داد.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("آیا از عدم تایید و اضافه نشدن این شعبه اطمینان دارید؟")) return;
    setUpdatingId(requestId);
    try {
      await updateRequestStatus({
        requestId: requestId as any,
        status: "rejected",
      });
      pushToast({
        type: "success",
        title: "رد درخواست",
        message: "وضعیت درخواست به «اضافه نشد» تغییر یافت.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در بروزرسانی",
        message: err.message || "خطایی رخ داد.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openAddedModal = (request: any) => {
    setSelectedRequest(request);
    
    let initialTenantId = "";
    if (tenants) {
      let eligibleTenants = tenants;
      if (!isCreator && me?._id) {
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        eligibleTenants = tenants.filter((t: any) => 
          t.createdBy === me._id && (now - t._creationTime) <= twoDaysMs
        );
      }
      initialTenantId = eligibleTenants[0]?._id || "";
    }
    
    setSelectedTenantId(initialTenantId);
    setIsSubmitModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedTenantId) return;

    setUpdatingId(selectedRequest._id);
    setIsSubmitModalOpen(false);

    try {
      await updateRequestStatus({
        requestId: selectedRequest._id as any,
        status: "added",
        tenantId: selectedTenantId as any,
      });
      pushToast({
        type: "success",
        title: "تایید درخواست",
        message: "درخواست به عنوان «شعبه ساخته شد» تایید و شعبه متصل شد.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در بروزرسانی",
        message: err.message || "خطایی رخ داد.",
      });
    } finally {
      setUpdatingId(null);
      setSelectedRequest(null);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;

    setSendingReply(true);
    try {
      await replyToTicket({
        ticketId: activeTicketId as any,
        message: replyMessage.trim(),
      });
      setReplyMessage("");
      pushToast({
        type: "success",
        title: "ارسال پاسخ",
        message: "پاسخ شما به تیکت پشتیبانی ارسال شد.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در ارسال",
        message: err.message || "خطایی رخ داد.",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    if (!confirm("آیا از حل تیکت و بستن آن اطمینان دارید؟")) return;
    setUpdatingId(ticketId);
    try {
      await resolveTicket({ ticketId: ticketId as any });
      pushToast({
        type: "success",
        title: "حل تیکت",
        message: "تیکت پشتیبانی با موفقیت به عنوان حل شده ثبت شد.",
      });
    } catch (err: any) {
      pushToast({
        type: "error",
        title: "خطا در بستن تیکت",
        message: err.message || "خطایی رخ داد.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 px-4 py-8 text-right rtl">
      {/* Header Panel */}
      <div className="glass-panel flex flex-col justify-between gap-6 rounded-[2rem] border border-white/5 bg-slate-900/40 p-4 md:p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans" style={{ fontFamily: "'Lalezar', cursive" }}>
            پشتیبانی  
          </h1>
          <p className="text-xs text-white/40 mt-1">
            پیام‌های دریافتی، تیکت‌های پشتیبانی شعب و درخواست‌های سالن‌داران جهت پیوستن به پلتفرم
          </p>
        </div>
        
        {/* Tab Switchers */}
        <div className="flex w-full md:w-fit rounded-2xl border border-white/5 bg-white/5 p-1">
          <button
            onClick={() => setActiveTab("requests")}
            className={`cursor-pointer flex-1 md:flex-none text-center px-2 md:px-5 py-2 text-[11px] sm:text-xs md:text-sm font-semibold rounded-xl transition ${
              activeTab === "requests"
                ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white border border-orange-500/20"
                : "text-white/50 hover:text-white border border-transparent"
            }`}
          >
            <span className="hidden sm:inline">درخواست‌های ثبت‌نام</span>
            <span className="sm:hidden">درخواست‌ها</span>
            {" "}
            <span>({tenantRequests?.length ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`cursor-pointer flex-1 md:flex-none text-center px-2 md:px-5 py-2 text-[11px] sm:text-xs md:text-sm font-semibold rounded-xl transition ${
              activeTab === "tickets"
                ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white border border-orange-500/20"
                : "text-white/50 hover:text-white border border-transparent"
            }`}
          >
            <span className="hidden sm:inline">تیکت‌های شعب</span>
            <span className="sm:hidden">تیکت‌ها</span>
            {" "}
            <span>({supportTickets?.length ?? 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`cursor-pointer flex-1 md:flex-none text-center px-2 md:px-5 py-2 text-[11px] sm:text-xs md:text-sm font-semibold rounded-xl transition ${
              activeTab === "messages"
                ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white border border-orange-500/20"
                : "text-white/50 hover:text-white border border-transparent"
            }`}
          >
            <span className="hidden sm:inline">پیام‌های کاربران</span>
            <span className="sm:hidden">پیام‌ها</span>
            {" "}
            <span>({contactMessages?.length ?? 0})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 w-full items-center justify-center">
          <FiLoader className="text-3xl text-orange-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab 1: Onboarding Requests */}
          {activeTab === "requests" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tenantRequests?.length === 0 ? (
                <div className="col-span-full py-16 text-center text-white/30 text-sm">
                  هیچ درخواست ثبت‌نامی در سیستم وجود ندارد.
                </div>
              ) : (
                tenantRequests?.map((req: any) => {
                  const dateStr = new Date(req.createdAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isActing = updatingId === req._id;
                  const isRejectDisabled = !isCreator && req.status === "contacted" && req.contactedAt && (Date.now() - req.contactedAt < 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={req._id}
                      className="group flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/4 p-6 transition duration-300 hover:bg-white/7 hover:shadow-xl"
                    >
                      {/* Top Header */}
                      <div className="flex justify-between items-start">
                        <div className="text-right">
                          <h3 className="font-bold text-white text-base leading-none">{req.tenantName}</h3>
                          <span className="text-[10px] text-white/40 block mt-1.5">
                            دسته‌بندی: {req.tenantType === "barbers" ? "آرایشگاه مردانه" : "آرایشگاه زنانه"}
                            {req.cityName && ` • شهر: ${req.cityName}`}
                          </span>
                        </div>
                        {/* Status Badges */}
                        <div>
                          {req.status === "pending" && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                              در انتظار بررسی
                            </span>
                          )}
                          {req.status === "contacted" && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              در حال تماس
                            </span>
                          )}
                          {req.status === "added" && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              شعبه ساخته شد
                            </span>
                          )}
                          {req.status === "rejected" && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              ساخته نشد
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="space-y-2 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-white/30 shrink-0" />
                          <span>نام متقاضی: <strong>{req.ownerName}</strong></span>
                        </div>
                        {!isCreator && req.status === "pending" ? (
                          <div className="flex items-center gap-2 text-white/30 italic text-[11px] bg-white/2 border border-white/5 p-2 rounded-xl w-full">
                            <span>📞 شماره‌های تماس: 🔒 پس از کلیک روی «تماس می‌گیرم» نمایش داده می‌شود</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <FiPhone className="text-white/30 shrink-0" />
                              <span>تلفن متقاضی: <a href={`tel:${req.ownerPhone}`} className="hover:text-amber-400 font-mono" dir="ltr">{req.ownerPhone}</a></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiPhone className="text-white/30 shrink-0" />
                              <span>تلفن سالن: <a href={`tel:${req.tenantPhone}`} className="hover:text-amber-400 font-mono" dir="ltr">{req.tenantPhone}</a></span>
                            </div>
                            {req.preferredSocial && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/30 shrink-0">📱</span>
                                <span>شبکه اجتماعی: <strong>{socialLabels[req.preferredSocial]} ({req.socialId || "بدون آیدی"})</strong></span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-white/30 shrink-0">📍</span>
                          <span>آدرس: {req.address}</span>
                        </div>
                        {req.cityName && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/30 shrink-0">🏙️</span>
                            <span>شهر: <strong>{req.cityName}</strong></span>
                          </div>
                        )}
                        {req.location && (isCreator || req.status !== "pending") && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/30 shrink-0">🗺️</span>
                            <span>
                              موقعیت:{" "}
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${req.location.lat},${req.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:underline"
                              >
                                مشاهده روی نقشه
                              </a>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-white/40 pt-1 border-t border-t-white/5">
                          <FiClock className="shrink-0 text-white/20" />
                          <span>
                            {isCreator
                              ? `ثبت شده توسط ${req.user?.name || "کاربر ناشناس"} در ${dateStr}`
                              : `ثبت شده در ${dateStr}`}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-white/5">
                        {!isCreator && req.status === "pending" ? (
                          <>
                            {hasActiveCall ? (
                              <div className="w-full text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/10 px-3 py-2.5 rounded-xl text-center">
                                ⚠️ شما یک تماس تکمیل نشده دارید. ابتدا آن را تعیین تکلیف کنید.
                              </div>
                            ) : (
                              <div className="w-full text-[10px] text-amber-400/80 font-medium bg-amber-500/5 border border-amber-500/10 px-3 py-2 rounded-xl text-center">
                                🔒 برای مشاهده اطلاعات تماس و نقشه ابتدا دکمه زیر را بزنید.
                              </div>
                            )}
                            <button
                              onClick={() => handleCallRequest(req._id)}
                              disabled={isActing || hasActiveCall}
                              title={hasActiveCall ? "ابتدا باید تماس در جریان خود را تکمیل کنید" : undefined}
                              className={`cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-xs font-bold transition disabled:opacity-50 ${
                                hasActiveCall
                                  ? "border-blue-500/10 bg-blue-500/5 text-blue-400/30 cursor-not-allowed"
                                  : "border-blue-500/30 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300"
                              }`}
                            >
                               {isActing ? <FiLoader className="animate-spin" /> : <FiPhone />}
                               تماس می‌گیرم
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setPreviewRequest(req)}
                              className="cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition"
                            >
                              🔍 مشاهده کامل
                            </button>
                            {req.status === "pending" && (
                              <button
                                onClick={() => handleCallRequest(req._id)}
                                disabled={isActing || hasActiveCall}
                                title={hasActiveCall ? "ابتدا باید تماس در جریان خود را تکمیل کنید" : undefined}
                                className={`cursor-pointer flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl border text-xs font-bold transition disabled:opacity-50 ${
                                  hasActiveCall
                                    ? "border-blue-500/10 bg-blue-500/5 text-blue-400/30 cursor-not-allowed"
                                    : "border-blue-500/30 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300"
                                }`}
                              >
                                {isActing ? <FiLoader className="animate-spin" /> : <FiPhone />}
                                تماس می‌گیرم
                              </button>
                            )}
                          </>
                        )}
                        {req.status === "contacted" && (
                           <>
                             <button
                               onClick={() => openAddedModal(req)}
                               disabled={isActing}
                               className="cursor-pointer flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl border border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs transition disabled:opacity-50"
                             >
                               ساخته شد
                             </button>
                             <button
                               onClick={() => handleRejectRequest(req._id)}
                               disabled={isActing || isRejectDisabled}
                               title={isRejectDisabled ? "رد درخواست تا ۲۴ ساعت پس از شروع تماس امکان‌پذیر نیست" : undefined}
                               className={`cursor-pointer flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl border font-bold text-xs transition disabled:opacity-50 ${
                                 isRejectDisabled
                                   ? "border-rose-500/10 bg-rose-500/5 text-rose-400/30 cursor-not-allowed"
                                   : "border-rose-500/30 hover:border-rose-400 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300"
                               }`}
                             >
                               رد
                             </button>
                           </>
                        )}
                        {req.status === "added" && (
                          isCreator && req.tenant ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-400/90 font-semibold bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex-1 justify-between">
                              <span>شعبه: <strong>{req.tenant.name}</strong></span>
                              <button
                                onClick={() => router.push(`/tenants/${req.tenantId}/edit`)}
                                className="text-[10px] text-amber-400 flex items-center gap-0.5 hover:underline shrink-0"
                              >
                                ویرایش
                                <FiExternalLink />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-400/70 font-semibold italic flex-1 text-center">
                              شعبه ساخته شد
                            </span>
                          )
                        )}
                        {req.status === "rejected" && (
                          <span className="text-xs text-rose-400/70 font-semibold italic flex-1 text-center">
                            درخواست رد شد
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Support Tickets */}
          {activeTab === "tickets" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {supportTickets?.length === 0 ? (
                <div className="col-span-full py-16 text-center text-white/30 text-sm">
                  هیچ تیکت پشتیبانی مربوط به شعب یافت نشد.
                </div>
              ) : (
                supportTickets?.map((ticket: any) => {
                  const dateStr = new Date(ticket.createdAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={ticket._id}
                      className="group flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/4 p-6 transition duration-300 hover:bg-white/7 hover:shadow-xl text-right"
                    >
                      {/* Ticket Header */}
                      <div className="flex justify-between items-start w-full">
                        <div className="text-right">
                          <h3 className="font-bold text-white text-base leading-none">{ticket.title}</h3>
                          <span className="text-[10px] text-orange-400 font-semibold block mt-2">
                            شعبه: {ticket.tenant?.name || "شعبه نامشخص"}
                          </span>
                        </div>
                        <div>
                          {ticket.status === "open" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              باز
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              حل شده
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ticket Submitter Info */}
                      <div className="space-y-1.5 text-xs text-white/50 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-white/30 shrink-0" />
                          <span>ارسال کننده: {ticket.user?.name || "پرسنل سالن"}</span>
                        </div>
                        {ticket.user?.phone && (
                          <div className="flex items-center gap-2">
                            <FiPhone className="text-white/30 shrink-0" />
                            <span>تلفن تماس: <span className="font-mono text-white/70">{ticket.user.phone}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                          <FiClock className="shrink-0 text-white/20" />
                          <span>تاریخ ثبت: {dateStr}</span>
                        </div>
                      </div>

                      {/* Action buttons inside Ticket Card */}
                      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                        <button
                          onClick={() => setActiveTicketId(ticket._id)}
                          className="cursor-pointer flex items-center justify-center gap-2 flex-1 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition"
                        >
                          <FiMessageSquare />
                          نمایش گفتگو
                        </button>

                        {ticket.status === "open" && (
                          <button
                            onClick={() => handleResolveTicket(ticket._id)}
                            className="cursor-pointer flex items-center justify-center gap-2 flex-1 py-2 rounded-xl border border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs transition"
                          >
                            <FiCheckCircle />
                            حل شد
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Contact Messages */}
          {activeTab === "messages" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contactMessages?.length === 0 ? (
                <div className="col-span-full py-16 text-center text-white/30 text-sm">
                  هیچ پیامی از کاربران در پلتفرم وجود ندارد.
                </div>
              ) : (
                contactMessages?.map((msg: any) => {
                  const dateStr = new Date(msg.createdAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={msg._id}
                      className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/4 p-6 transition duration-300 hover:bg-white/7 hover:shadow-xl"
                    >
                      {/* Message Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-md">
                          <FiMail />
                        </div>
                        <div className="text-right min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{msg.user?.name || "کاربر ناشناس"}</h4>
                          <span className="text-[10px] text-white/40 block mt-1.5 font-mono truncate" dir="ltr">
                            {msg.user?.phone || msg.user?.email || "بدون مشخصات تماس"}
                          </span>
                        </div>
                      </div>

                      {/* Content Message */}
                      <div className="flex-1 bg-white/2 border border-white/5 p-4 rounded-2xl text-sm text-white/80 leading-relaxed min-h-[80px]">
                        {msg.message}
                      </div>

                      {/* Date details */}
                      <div className="flex items-center gap-2 text-[10px] text-white/40 pt-1 border-t border-t-white/5">
                        <FiClock className="shrink-0 text-white/20" />
                        <span>ارسال شده در {dateStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: select tenant for added request */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Lalezar', cursive" }}>
              انتخاب شعبه متصل
            </h3>
            <p className="text-xs text-white/40 mb-6 leading-relaxed">
              لطفا شعبه‌ای که به تازگی در سیستم برای سالن «{selectedRequest?.tenantName}» ایجاد کرده‌اید را انتخاب کنید تا به این درخواست متصل شود.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="relative" ref={tenantSelectRef}>
                <span className="text-xs text-white/50 block mb-1.5">شعبه ایجاد شده</span>
                
                <button
                  type="button"
                  onClick={() => setIsTenantDropdownOpen((prev) => !prev)}
                  className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all text-right ${
                    isTenantDropdownOpen
                      ? "border-orange-500/50 bg-slate-850 ring-2 ring-orange-500/10"
                      : "border-white/10 bg-slate-800 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedTenant ? (
                      <>
                        <span className="truncate font-bold text-white">{selectedTenant.name}</span>
                        <span className="truncate text-[10px] text-white/40">
                          ({selectedTenant.domains?.[0]?.hostname || "بدون دامنه"})
                        </span>
                      </>
                    ) : (
                      <span className="text-white/30">جستجو و انتخاب شعبه...</span>
                    )}
                  </div>
                  <FiChevronDown
                    className={`text-white/30 transition-transform duration-300 ${
                      isTenantDropdownOpen ? "rotate-180 text-orange-400" : "group-hover:text-white/50"
                    }`}
                  />
                </button>

                {isTenantDropdownOpen && (
                  <div
                    className="absolute z-[100] mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl"
                    style={{ maxHeight: "300px", top: "100%", left: 0 }}
                  >
                    <div className="sticky top-0 z-10 mb-2 px-1">
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-850 px-3 py-2">
                        <FiSearch className="text-white/20 shrink-0" />
                        <input
                          autoFocus
                          value={tenantSearch}
                          onChange={(e) => setTenantSearch(e.target.value)}
                          placeholder="جستجوی نام یا دامنه سالن..."
                          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="max-h-[200px] space-y-1 overflow-y-auto px-1 pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                      {filteredTenants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-white/30 text-xs italic">
                          شعبه‌ای یافت نشد
                        </div>
                      ) : (
                        filteredTenants.map((tenant: any) => {
                          const isSelected = selectedTenantId === tenant._id;
                          return (
                            <button
                              key={tenant._id}
                              type="button"
                              onClick={() => {
                                setSelectedTenantId(tenant._id);
                                setIsTenantDropdownOpen(false);
                                setTenantSearch("");
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition text-right ${
                                isSelected
                                  ? "bg-orange-500/20 text-orange-100 font-bold"
                                  : "text-white/60 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <div className="flex flex-col text-right">
                                <span className="text-sm">{tenant.name}</span>
                                <span className="text-[10px] text-white/30">
                                  {tenant.domains?.[0]?.hostname || "بدون دامنه"}
                                </span>
                              </div>
                              {isSelected && <FiCheck className="text-orange-400 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    setSelectedRequest(null);
                  }}
                  className="cursor-pointer rounded-2xl border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!selectedTenantId}
                  className="cursor-pointer rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 px-5 py-2 text-xs font-bold text-black shadow-lg disabled:opacity-50"
                >
                  ثبت و تایید نهایی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Preview Tenant Request details & location map */}
      {previewRequest && (isCreator || previewRequest.status !== "pending") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-right rtl">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-slate-950/40">
              <div>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wide leading-none block mb-1">
                  پیش‌نمایش درخواست عضویت
                </span>
                <h3 className="font-bold text-white text-lg leading-tight">
                  {previewRequest.tenantName}
                </h3>
              </div>
              <button
                onClick={() => setPreviewRequest(null)}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Detailed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                <div className="bg-white/3 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="font-bold text-white text-xs text-white/40 mb-2">اطلاعات سالن</h4>
                  <p><strong>نام سالن:</strong> {previewRequest.tenantName}</p>
                  <p><strong>نوع سالن:</strong> {previewRequest.tenantType === "barbers" ? "آرایشگاه آقایان" : "سالن زیبایی بانوان"}</p>
                  <p><strong>تلفن سالن:</strong> <a href={`tel:${previewRequest.tenantPhone}`} className="text-orange-400 hover:underline font-mono" dir="ltr">{previewRequest.tenantPhone}</a></p>
                  <p><strong>شهر:</strong> {previewRequest.cityName || "نامشخص"}</p>
                </div>

                <div className="bg-white/3 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="font-bold text-white text-xs text-white/40 mb-2">اطلاعات مالک</h4>
                  <p><strong>نام مالک:</strong> {previewRequest.ownerName}</p>
                  <p><strong>تلفن مالک:</strong> <a href={`tel:${previewRequest.ownerPhone}`} className="text-orange-400 hover:underline font-mono" dir="ltr">{previewRequest.ownerPhone}</a></p>
                  {previewRequest.preferredSocial && (
                    <p><strong>شبکه اجتماعی:</strong> {socialLabels[previewRequest.preferredSocial]} ({previewRequest.socialId || "بدون آیدی"})</p>
                  )}
                  <p><strong>ثبت شده در:</strong> {new Date(previewRequest.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}</p>
                  {isCreator && previewRequest.user && (
                    <p><strong>ثبت شده توسط:</strong> {previewRequest.user.name}</p>
                  )}
                  {isCreator && previewRequest.tenant && (
                    <p><strong>شعبه متصل:</strong> {previewRequest.tenant.name}</p>
                  )}
                  <p><strong>وضعیت درخواست:</strong>{" "}
                    {previewRequest.status === "pending" && <span className="text-amber-400 font-bold">در انتظار بررسی</span>}
                    {previewRequest.status === "contacted" && <span className="text-blue-400 font-bold">در حال تماس</span>}
                    {previewRequest.status === "added" && <span className="text-emerald-400 font-bold">شعبه ساخته شد</span>}
                    {previewRequest.status === "rejected" && <span className="text-rose-400 font-bold">ساخته نشد</span>}
                  </p>
                </div>

                <div className="bg-white/3 p-4 rounded-2xl border border-white/5 col-span-full space-y-1">
                  <h4 className="font-bold text-white text-xs text-white/40 mb-2">نشانی دقیق</h4>
                  <p className="leading-relaxed">{previewRequest.address}</p>
                </div>
              </div>

              {/* Map Preview */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs text-white/40">موقعیت جغرافیایی روی نقشه</h4>
                {previewRequest.location ? (
                  <RequestPreviewMap location={previewRequest.location} />
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-2xl border border-white/5 bg-white/2 text-white/30 text-xs italic">
                    موقعیت جغرافیایی برای این درخواست ثبت نشده است.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-white/5 p-4 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setPreviewRequest(null)}
                className="cursor-pointer rounded-2xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal/Drawer Dialog: chat support ticket details */}
      {activeTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-right">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Chat header */}
            {activeTicketDetails === undefined ? (
              <div className="flex h-32 items-center justify-center">
                <FiLoader className="text-2xl text-orange-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-slate-900">
                  <div className="text-right">
                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wide leading-none block mb-1">
                      تیکت پشتیبانی: {activeTicketDetails.tenantName}
                    </span>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {activeTicketDetails.ticket.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTicketId(null);
                      setReplyMessage("");
                    }}
                    className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <FiX />
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-white/2 space-y-4 min-h-[300px]">
                  {activeTicketDetails.messages.map((msg: any) => {
                    const isSupport =
                      msg.sender?.role === "creator" ||
                      msg.sender?.role === "promoter";
                    
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg._id}
                        className={`flex w-full ${isSupport ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl border text-sm leading-relaxed ${
                            isSupport
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 border-orange-500 rounded-tr-none text-white shadow-md shadow-orange-500/10"
                              : "bg-slate-800 border-white/5 rounded-tl-none text-slate-200"
                          }`}
                        >
                          <span
                            className={`text-[9px] block mb-1 font-bold uppercase ${
                              isSupport ? "text-orange-100" : "text-orange-400"
                            }`}
                          >
                            {isSupport ? "پاسخ شما" : `کاربر سالن (${msg.sender?.name || "پرسنل"})`}
                          </span>
                          <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                          <span
                            className={`text-[8px] block text-left mt-1 font-semibold ${
                              isSupport ? "text-white/40" : "text-white/20"
                            }`}
                          >
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Reply Form */}
                <div className="border-t border-white/5 p-4 bg-slate-900/60 flex flex-col gap-3">
                  <form onSubmit={handleReplySubmit} className="flex gap-2 items-center">
                    <input
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="پاسخ خود را به عنوان پشتیبان بنویسید..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition placeholder:text-white/20"
                      disabled={sendingReply}
                      required
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyMessage.trim()}
                      className="cursor-pointer flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold disabled:opacity-40 shadow-md"
                    >
                      {sendingReply ? (
                        <FiLoader className="animate-spin text-sm" />
                      ) : (
                        <FiSend className="text-sm -scale-x-100" />
                      )}
                    </button>
                  </form>
                  
                  {activeTicketDetails.ticket.status === "open" && (
                    <div className="flex justify-start">
                      <button
                        onClick={() => {
                          handleResolveTicket(activeTicketDetails.ticket._id);
                          setActiveTicketId(null);
                        }}
                        className="cursor-pointer flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
                      >
                        <FiCheckCircle />
                        علامت‌گذاری به عنوان حل شده و بستن تیکت
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
