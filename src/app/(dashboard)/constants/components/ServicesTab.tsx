"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/api";
import { Id } from "@backend/dataModel";
import { FiPlus, FiImage, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiAlertCircle, FiInfo, FiFolder } from "react-icons/fi";
import { useToastStore } from "@/store/toastStore";
import { motion } from "framer-motion";

type TenantType = "barbers" | "barbies";
const adminServices = (api as any).services.adminServices;

export default function ServicesTab() {
  const [activeTab, setActiveTab] = useState<TenantType>("barbers");
  const [selectedServiceId, setSelectedServiceId] = useState<Id<"services"> | null>(null);
  const [isManagingGroups, setIsManagingGroups] = useState(false);

  const handleTenantChange = (tenantType: TenantType) => {
    setActiveTab(tenantType);
    setSelectedServiceId(null);
    setIsManagingGroups(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {!selectedServiceId && !isManagingGroups ? (
        <>
          <div className="flex w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
            {(["barbers", "barbies"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTenantChange(tab)}
                className={`cursor-pointer flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white shadow-lg"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab === "barbers" ? "آرایشگاه مردانه (Barbers)" : "سالن زیبایی (Barbies)"}
              </button>
            ))}
          </div>
          <ServicesList
            tenantType={activeTab}
            onSelectService={setSelectedServiceId}
            onManageGroups={() => setIsManagingGroups(true)}
          />
        </>
      ) : isManagingGroups ? (
        <GroupsList tenantType={activeTab} onBack={() => setIsManagingGroups(false)} />
      ) : selectedServiceId ? (
        <ModelsList tenantType={activeTab} serviceId={selectedServiceId} onBack={() => setSelectedServiceId(null)} />
      ) : null}
    </div>
  );
}

function GroupsList({ tenantType, onBack }: { tenantType: TenantType, onBack: () => void }) {
  const groups = useQuery(adminServices.listGroups, { tenantType });
  const services = useQuery(adminServices.listServices, { tenantType });
  const pushToast = useToastStore((s) => s.push);
  const removeGroup = useMutation(adminServices.removeGroup);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const handleDelete = async (id: Id<"model_groups">) => {
    if (!confirm("آیا از حذف این گروه اطمینان دارید؟ مدل‌های این گروه بدون گروه خواهند شد.")) return;
    try {
      await removeGroup({ targetId: id });
      pushToast({ type: "success", title: "موفق", message: "گروه حذف شد" });
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    }
  };

  const openEdit = (group: any) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="cursor-pointer flex w-fit items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
        >
          <FiChevronRight />
          بازگشت به خدمات
        </button>
        <button
          onClick={openCreate}
          className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <FiPlus className="text-lg" />
          افزودن گروه مدل
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups === undefined ? (
          <div className="col-span-full py-10 text-center text-white/50">در حال بارگذاری...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-10 text-center text-white/50">هیچ گروهی برای این بخش تعریف نشده است.</div>
        ) : (
          groups.map((group: any) => (
            <motion.div
              key={group._id}
              layoutId={group._id}
              className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl transition-all hover:border-purple-400/30 hover:bg-slate-800/80"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/20">
                  <FiFolder className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-white">{group.name}</h3>
                  <p className="truncate text-sm text-white/50">{group.enName || "بدون نام انگلیسی"}</p>
                  <p className="mt-2 truncate text-xs font-bold text-purple-200/80">
                    خدمت: {group.serviceName || "بدون خدمت"}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                <button onClick={() => openEdit(group)} className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => handleDelete(group._id)} className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <GroupModal
          tenantType={tenantType}
          services={services?.filter((service: any) => service.hasModels) || []}
          initialData={editingGroup}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ServicesList({ tenantType, onSelectService, onManageGroups }: { tenantType: TenantType, onSelectService: (id: Id<"services">) => void, onManageGroups: () => void }) {
  const services = useQuery(adminServices.listServices, { tenantType });
  const pushToast = useToastStore((s) => s.push);
  const removeService = useMutation(adminServices.removeService);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const handleDelete = async (id: Id<"services">) => {
    if (!confirm("آیا از حذف این خدمت اطمینان دارید؟ تمامی مدل‌های زیرمجموعه نیز حذف خواهند شد.")) return;
    try {
      await removeService({ targetId: id });
      pushToast({ type: "success", title: "موفق", message: "خدمت حذف شد" });
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    }
  };

  const openEdit = (service: any) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <button
          onClick={onManageGroups}
          className="cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/15 active:scale-95"
        >
          <FiFolder className="text-lg" />
          مدیریت گروه‌های مدل
        </button>
        <button
          onClick={openCreate}
          className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <FiPlus className="text-lg" />
          افزودن خدمت جدید
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services === undefined ? (
          <div className="col-span-full py-10 text-center text-white/50">در حال بارگذاری...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-10 text-center text-white/50">هیچ خدمتی یافت نشد.</div>
        ) : (
          services.map((svc: any) => (
            <motion.div
              key={svc._id}
              layoutId={svc._id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl transition-all hover:border-white/20 hover:bg-slate-800/80"
            >
              <div className="relative h-40 w-full overflow-hidden bg-white/5">
                {svc.imageUrl ? (
                  <img src={svc.imageUrl} alt={svc.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FiImage className="text-4xl text-white/20" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold backdrop-blur-md ${svc.hasModels ? "bg-amber-500/80 text-white" : "bg-blue-500/80 text-white"}`}>
                    {svc.hasModels ? "دارای مدل" : "بدون مدل"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-lg font-bold text-white truncate">
                  {svc.name} {svc.enName && <span className="text-xs text-white/50 font-normal ml-1">({svc.enName})</span>}
                </h3>
                {svc.description && <p className="text-sm text-white/60 line-clamp-2">{svc.description}</p>}
                
                <div className="mt-4 flex items-center justify-between gap-2">
                  {svc.hasModels ? (
                    <button
                      onClick={() => onSelectService(svc._id)}
                      className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      مدیریت مدل‌ها
                      <FiChevronLeft />
                    </button>
                  ) : (
                    <div className="flex-1"></div>
                  )}
                  
                  <button onClick={() => openEdit(svc)} className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(svc._id)} className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ServiceModal
          tenantType={tenantType}
          initialData={editingService}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ModelsList({ tenantType, serviceId, onBack }: { tenantType: TenantType, serviceId: Id<"services">, onBack: () => void }) {
  const models = useQuery(adminServices.listModels, { serviceId });
  const pushToast = useToastStore((s) => s.push);
  const removeModel = useMutation(adminServices.removeModel);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);

  const handleDelete = async (id: Id<"models">) => {
    if (!confirm("آیا از حذف این مدل اطمینان دارید؟")) return;
    try {
      await removeModel({ targetId: id });
      pushToast({ type: "success", title: "موفق", message: "مدل حذف شد" });
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    }
  };

  const openEdit = (model: any) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingModel(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={onBack}
          className="cursor-pointer flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
        >
          <FiChevronRight />
          بازگشت به خدمات
        </button>
        <button
          onClick={openCreate}
          className="cursor-pointer flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <FiPlus className="text-lg" />
          افزودن مدل جدید
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {models === undefined ? (
          <div className="col-span-full py-10 text-center text-white/50">در حال بارگذاری...</div>
        ) : models.length === 0 ? (
          <div className="col-span-full py-10 text-center text-white/50">هیچ مدلی یافت نشد.</div>
        ) : (
          models.map((mod: any) => (
            <motion.div
              key={mod._id}
              layoutId={mod._id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl transition-all hover:border-white/20 hover:bg-slate-800/80"
            >
              <div className="relative h-48 w-full overflow-hidden bg-white/5">
                {mod.imageUrl ? (
                  <img src={mod.imageUrl} alt={mod.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FiImage className="text-4xl text-white/20" />
                  </div>
                )}
                {mod.groupName && (
                  <div className="absolute top-3 left-3">
                    <span className="rounded-xl px-2.5 py-1 text-xs font-bold bg-purple-500/80 text-white backdrop-blur-md">
                      {mod.groupName}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {mod.difficultyLevel && (
                    <span className="rounded-lg px-2 py-1 text-[10px] font-bold bg-black/50 text-white backdrop-blur-md border border-white/10" title="سطح دشواری">
                      <FiAlertCircle className="inline mr-1" />
                      {mod.difficultyLevel}
                    </span>
                  )}
                  {mod.maintenanceLevel && (
                    <span className="rounded-lg px-2 py-1 text-[10px] font-bold bg-black/50 text-white backdrop-blur-md border border-white/10" title="میزان نگهداری">
                      <FiInfo className="inline mr-1" />
                      {mod.maintenanceLevel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 p-5 flex-1">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {mod.name} {mod.enName && <span className="text-xs text-white/50 font-normal">({mod.enName})</span>}
                  </h3>
                  {mod.description && <p className="text-xs text-white/60 line-clamp-2 mt-1">{mod.description}</p>}
                </div>
                
                <div className="flex-1 text-xs space-y-1.5 text-white/50 border-t border-white/5 pt-3 mt-1">
                  {mod.suitableFor && <p><span className="text-white/80 font-semibold">مناسب برای: </span><span className="line-clamp-1">{mod.suitableFor}</span></p>}
                  {mod.conditions && <p><span className="text-white/80 font-semibold">شرایط: </span><span className="line-clamp-1">{mod.conditions}</span></p>}
                  {mod.tips && <p><span className="text-white/80 font-semibold">نکات: </span><span className="line-clamp-1">{mod.tips}</span></p>}
                </div>

                <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button onClick={() => openEdit(mod)} className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(mod._id)} className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ModelModal
          tenantType={tenantType}
          serviceId={serviceId}
          initialData={editingModel}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function GroupModal({ tenantType, services, initialData, onClose }: { tenantType: TenantType, services: any[], initialData: any, onClose: () => void }) {
  const [serviceId, setServiceId] = useState<Id<"services"> | "">(initialData?.serviceId || services[0]?._id || "");
  const [name, setName] = useState(initialData?.name || "");
  const [enName, setEnName] = useState(initialData?.enName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pushToast = useToastStore((s) => s.push);
  const createGroup = useMutation(adminServices.createGroup);
  const updateGroup = useMutation(adminServices.updateGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return pushToast({ type: "error", title: "خطا", message: "نام گروه الزامی است" });
    if (!serviceId) return pushToast({ type: "error", title: "خطا", message: "انتخاب خدمت الزامی است" });

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateGroup({
          targetId: initialData._id,
          serviceId,
          name,
          enName: enName || undefined,
        });
        pushToast({ type: "success", title: "موفق", message: "گروه بروزرسانی شد" });
      } else {
        await createGroup({
          tenantType,
          serviceId,
          name,
          enName: enName || undefined,
        });
        pushToast({ type: "success", title: "موفق", message: "گروه با موفقیت ایجاد شد" });
      }
      onClose();
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg my-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col"
      >
        <div className="border-b border-white/10 bg-white/5 p-5 shrink-0">
          <h2 className="text-xl font-bold text-white">{initialData ? "ویرایش گروه مدل" : "افزودن گروه مدل"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">خدمت مربوطه</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value as Id<"services">)}
              className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">انتخاب خدمت...</option>
              {services.map((service: any) => (
                <option key={service._id} value={service._id}>
                  {service.name} {service.enName ? `(${service.enName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">نام گروه (فارسی)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="مثال: فید و تیپر"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">نام انگلیسی (EnName)</label>
              <input
                type="text"
                value={enName}
                onChange={(e) => setEnName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white placeholder-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Fade & Taper"
                dir="ltr"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-white/10 pt-5 shrink-0">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition">
              انصراف
            </button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50">
              {isSubmitting ? "در حال ذخیره..." : "ذخیره گروه"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ServiceModal({ tenantType, initialData, onClose }: { tenantType: TenantType, initialData: any, onClose: () => void }) {
  const [name, setName] = useState(initialData?.name || "");
  const [enName, setEnName] = useState(initialData?.enName || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [hasModels, setHasModels] = useState(initialData?.hasModels || false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pushToast = useToastStore((s) => s.push);
  const createService = useMutation(adminServices.createService);
  const updateService = useMutation(adminServices.updateService);
  const generateUploadUrl = useMutation(api.uploads.upload.generateUploadUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return pushToast({ type: "error", title: "خطا", message: "نام الزامی است" });
    
    setIsSubmitting(true);
    try {
      let imageId = initialData?.imageId;

      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        if (!result.ok) throw new Error("آپلود تصویر شکست خورد");
        const { storageId } = await result.json();
        imageId = storageId;
      }

      if (initialData) {
        await updateService({
          targetId: initialData._id,
          name,
          enName: enName || undefined,
          description: description || undefined,
          hasModels,
          imageId,
        });
        pushToast({ type: "success", title: "موفق", message: "خدمت بروزرسانی شد" });
      } else {
        await createService({
          tenantType,
          name,
          enName: enName || undefined,
          description: description || undefined,
          hasModels,
          imageId,
        });
        pushToast({ type: "success", title: "موفق", message: "خدمت با موفقیت ایجاد شد" });
      }
      onClose();
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg my-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col"
      >
        <div className="border-b border-white/10 bg-white/5 p-5 shrink-0">
          <h2 className="text-xl font-bold text-white">{initialData ? "ویرایش خدمت" : "افزودن خدمت جدید"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">نام خدمت (فارسی)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="مثال: کوتاهی مو"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">نام انگلیسی (EnName)</label>
              <input
                type="text"
                value={enName}
                onChange={(e) => setEnName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="مثال: Haircut"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">توضیحات (اختیاری)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder="توضیحاتی درباره این خدمت بنویسید..."
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col">
              <span className="font-bold text-white">دارای مدل‌های زیرمجموعه</span>
              <span className="text-xs text-white/50">آیا برای این خدمت مدل‌های مختلفی (مثل مدل موی مختلف) وجود دارد؟</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={hasModels} onChange={(e) => setHasModels(e.target.checked)} />
              <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">تصویر خدمت</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/10 pt-5 shrink-0">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition">
              انصراف
            </button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50">
              {isSubmitting ? "در حال ذخیره..." : "ذخیره خدمت"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ModelModal({ tenantType, serviceId, initialData, onClose }: { tenantType: TenantType, serviceId: Id<"services">, initialData: any, onClose: () => void }) {
  const groups = useQuery(adminServices.listGroups, { tenantType, serviceId });
  
  const [name, setName] = useState(initialData?.name || "");
  const [enName, setEnName] = useState(initialData?.enName || "");
  const [catalogId, setCatalogId] = useState(initialData?.id || "");
  const [groupId, setGroupId] = useState<Id<"model_groups"> | "">(initialData?.groupId || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [suitableFor, setSuitableFor] = useState(initialData?.suitableFor || "");
  const [conditions, setConditions] = useState(initialData?.conditions || "");
  const [difficultyLevel, setDifficultyLevel] = useState(initialData?.difficultyLevel || "");
  const [maintenanceLevel, setMaintenanceLevel] = useState(initialData?.maintenanceLevel || "");
  const [tips, setTips] = useState(initialData?.tips || "");
  const [promptDesc, setPromptDesc] = useState(initialData?.promptDesc || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pushToast = useToastStore((s) => s.push);
  const createModel = useMutation(adminServices.createModel);
  const updateModel = useMutation(adminServices.updateModel);
  const generateUploadUrl = useMutation(api.uploads.upload.generateUploadUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return pushToast({ type: "error", title: "خطا", message: "نام الزامی است" });
    
    setIsSubmitting(true);
    try {
      let imageId = initialData?.imageId;

      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        if (!result.ok) throw new Error("آپلود تصویر شکست خورد");
        const { storageId } = await result.json();
        imageId = storageId;
      }

      const modelData = {
        name,
        id: catalogId || undefined,
        enName: enName || undefined,
        groupId: groupId || undefined,
        description: description || undefined,
        suitableFor: suitableFor || undefined,
        conditions: conditions || undefined,
        difficultyLevel: difficultyLevel || undefined,
        maintenanceLevel: maintenanceLevel || undefined,
        tips: tips || undefined,
        promptDesc: promptDesc || undefined,
        imageId,
      };

      if (initialData) {
        await updateModel({ targetId: initialData._id, ...modelData });
        pushToast({ type: "success", title: "موفق", message: "مدل بروزرسانی شد" });
      } else {
        await createModel({ serviceId, ...modelData });
        pushToast({ type: "success", title: "موفق", message: "مدل با موفقیت ایجاد شد" });
      }
      onClose();
    } catch (e: any) {
      pushToast({ type: "error", title: "خطا", message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl my-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="border-b border-white/10 bg-white/5 p-5 shrink-0">
          <h2 className="text-xl font-bold text-white">{initialData ? "ویرایش مدل" : "افزودن مدل جدید"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">نام مدل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="مثال: فید کلاسیک"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">نام انگلیسی (EnName)</label>
              <input
                type="text"
                value={enName}
                onChange={(e) => setEnName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="مثال: Classic Fade"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">شناسه کاتالوگ (ID)</label>
            <input
              type="text"
              value={catalogId}
              onChange={(e) => setCatalogId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="buzz-cut"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">گروه‌بندی</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value as Id<"model_groups">)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">(بدون گروه)</option>
                {groups?.map((g: any) => (
                  <option key={g._id} value={g._id}>{g.name} {g.enName ? `(${g.enName})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">سطح دشواری</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">انتخاب کنید...</option>
                <option value="آسان">آسان</option>
                <option value="متوسط">متوسط</option>
                <option value="دشوار">دشوار</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">میزان نگهداری</label>
              <select
                value={maintenanceLevel}
                onChange={(e) => setMaintenanceLevel(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">انتخاب کنید...</option>
                <option value="آسان">آسان</option>
                <option value="متوسط">متوسط</option>
                <option value="دشوار">دشوار</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white/80">شرایط</label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="مثال: موهای ضخیم و صاف"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">مناسب برای</label>
            <input
              type="text"
              value={suitableFor}
              onChange={(e) => setSuitableFor(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="مثال: محیط‌های رسمی"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">نکات (Tips)</label>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              className="w-full min-h-[80px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder="نکات نگهداری یا پیشنهاد..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">توضیح پرامپت تصویر (Prompt Description)</label>
            <textarea
              value={promptDesc}
              onChange={(e) => setPromptDesc(e.target.value)}
              className="w-full min-h-[80px] rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-emerald-100 placeholder-white/30 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-left dir-ltr"
              placeholder="clean buzz cut"
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">توضیحات کلی</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder="توضیحاتی درباره این مدل بنویسید..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white/80">تصویر مدل</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
            />
          </div>
          
          <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/10 pt-5 shrink-0">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition">
              انصراف
            </button>
            <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50">
              {isSubmitting ? "در حال ذخیره..." : "ذخیره مدل"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
