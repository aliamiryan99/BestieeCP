/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_ai from "../ai/ai.js";
import type * as bookings_bookings from "../bookings/bookings.js";
import type * as bookings_mutations from "../bookings/mutations.js";
import type * as bookings_queries from "../bookings/queries.js";
import type * as communications_sms from "../communications/sms.js";
import type * as crons from "../crons.js";
import type * as myFunctions from "../myFunctions.js";
import type * as orders_cart from "../orders/cart.js";
import type * as orders_orders from "../orders/orders.js";
import type * as orders_payments from "../orders/payments.js";
import type * as products_products from "../products/products.js";
import type * as products_variants from "../products/variants.js";
import type * as services_predefined from "../services/predefined.js";
import type * as services_staffServices from "../services/staffServices.js";
import type * as services_tenantServices from "../services/tenantServices.js";
import type * as tenants_comments from "../tenants/comments.js";
import type * as tenants_gallery from "../tenants/gallery.js";
import type * as tenants_settings from "../tenants/settings.js";
import type * as tenants_site_content from "../tenants/site_content.js";
import type * as tenants_tenants from "../tenants/tenants.js";
import type * as uploads_upload from "../uploads/upload.js";
import type * as users_auth from "../users/auth.js";
import type * as users_authConfig from "../users/authConfig.js";
import type * as users_auth_adapters from "../users/auth_adapters.js";
import type * as users_staffSettings from "../users/staffSettings.js";
import type * as users_users from "../users/users.js";
import type * as utils_sms from "../utils/sms.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/ai": typeof ai_ai;
  "bookings/bookings": typeof bookings_bookings;
  "bookings/mutations": typeof bookings_mutations;
  "bookings/queries": typeof bookings_queries;
  "communications/sms": typeof communications_sms;
  crons: typeof crons;
  myFunctions: typeof myFunctions;
  "orders/cart": typeof orders_cart;
  "orders/orders": typeof orders_orders;
  "orders/payments": typeof orders_payments;
  "products/products": typeof products_products;
  "products/variants": typeof products_variants;
  "services/predefined": typeof services_predefined;
  "services/staffServices": typeof services_staffServices;
  "services/tenantServices": typeof services_tenantServices;
  "tenants/comments": typeof tenants_comments;
  "tenants/gallery": typeof tenants_gallery;
  "tenants/settings": typeof tenants_settings;
  "tenants/site_content": typeof tenants_site_content;
  "tenants/tenants": typeof tenants_tenants;
  "uploads/upload": typeof uploads_upload;
  "users/auth": typeof users_auth;
  "users/authConfig": typeof users_authConfig;
  "users/auth_adapters": typeof users_auth_adapters;
  "users/staffSettings": typeof users_staffSettings;
  "users/users": typeof users_users;
  "utils/sms": typeof utils_sms;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
