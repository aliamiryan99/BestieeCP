export const ROLE_TRANSLATIONS: Record<string, string> = {
  creator: "خالق",
  promoter: "پشتیبان",
  owner: "مالک",
  staff: "کارمند",
  customer: "مشتری",
};

export const translateRole = (role: string | undefined): string => {
  if (!role) return "";
  return ROLE_TRANSLATIONS[role] || role;
};
