export type SupportRole = "creator" | "owner" | "staff" | "promoter" | "customer";

export type TenantStatus = "alive" | "dead";

export type DomainType = "subdomain" | "custom";

export type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type CPUser = {
  id: number;
  email: string;
  phone?: string | null;
  name: string;
  birthdate?: string | null;
  address?: string | null;
  role: SupportRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Domain = {
  id: number;
  tenantId: string;
  type: DomainType;
  host: string;
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantSettings = {
  id: number;
  tenantId: string;
  startWorkingTime: string;
  endWorkingTime: string;
  workingWeekdays: boolean[];
  verifyBookingsByDefault: boolean;
  restStart?: string | null;
  restEnd?: string | null;
};

export type TenantSiteContent = {
  id: number;
  tenantId: string;
  title: string;
  phone: string;
  address: string;
  socialLinks: Record<string, string>;
  latitude?: number | null;
  longitude?: number | null;
  certificateImage?: string | null;
  heroTitle?: string | null;
  heroSubTitle?: string | null;
  aboutUsText?: string | null;
  aboutUsCards?: unknown[] | null;
  aboutUsImage?: string | null;
};

export type Tenant = {
  id: string;
  name: string;
  schema: string;
  status: TenantStatus;
  subscriptionExpireAt: string;
  supportId?: number | null;
  support?: CPUser;
  domains?: Domain[];
  settings?: TenantSettings;
  content?: TenantSiteContent;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantFilters = {
  q?: string;
  status?: TenantStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  supportId?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};
