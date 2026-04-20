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
import type * as announcements_announcements from "../announcements/announcements.js";
import type * as auth from "../auth.js";
import type * as bookings_bookings from "../bookings/bookings.js";
import type * as bookings_mutations from "../bookings/mutations.js";
import type * as bookings_queries from "../bookings/queries.js";
import type * as cities from "../cities.js";
import type * as communications_sms from "../communications/sms.js";
import type * as crons from "../crons.js";
import type * as dashboard_dashboard from "../dashboard/dashboard.js";
import type * as data_iran_cities from "../data/iran_cities.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as notifications_notifications from "../notifications/notifications.js";
import type * as orders_cart from "../orders/cart.js";
import type * as orders_orders from "../orders/orders.js";
import type * as orders_payments from "../orders/payments.js";
import type * as products_products from "../products/products.js";
import type * as products_variants from "../products/variants.js";
import type * as services_predefined from "../services/predefined.js";
import type * as services_staffServices from "../services/staffServices.js";
import type * as services_tenantServices from "../services/tenantServices.js";
import type * as sweepers_activity from "../sweepers/activity.js";
import type * as tenants_comments from "../tenants/comments.js";
import type * as tenants_gallery from "../tenants/gallery.js";
import type * as tenants_migrations from "../tenants/migrations.js";
import type * as tenants_plans from "../tenants/plans.js";
import type * as tenants_settings from "../tenants/settings.js";
import type * as tenants_site_content from "../tenants/site_content.js";
import type * as tenants_tenants from "../tenants/tenants.js";
import type * as testConfig from "../testConfig.js";
import type * as uploads_upload from "../uploads/upload.js";
import type * as users_auth from "../users/auth.js";
import type * as users_authConfig from "../users/authConfig.js";
import type * as users_auth_adapters from "../users/auth_adapters.js";
import type * as users_credits from "../users/credits.js";
import type * as users_levels from "../users/levels.js";
import type * as users_migrations from "../users/migrations.js";
import type * as users_promoterScore from "../users/promoterScore.js";
import type * as users_reputation from "../users/reputation.js";
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
  "announcements/announcements": typeof announcements_announcements;
  auth: typeof auth;
  "bookings/bookings": typeof bookings_bookings;
  "bookings/mutations": typeof bookings_mutations;
  "bookings/queries": typeof bookings_queries;
  cities: typeof cities;
  "communications/sms": typeof communications_sms;
  crons: typeof crons;
  "dashboard/dashboard": typeof dashboard_dashboard;
  "data/iran_cities": typeof data_iran_cities;
  http: typeof http;
  myFunctions: typeof myFunctions;
  "notifications/notifications": typeof notifications_notifications;
  "orders/cart": typeof orders_cart;
  "orders/orders": typeof orders_orders;
  "orders/payments": typeof orders_payments;
  "products/products": typeof products_products;
  "products/variants": typeof products_variants;
  "services/predefined": typeof services_predefined;
  "services/staffServices": typeof services_staffServices;
  "services/tenantServices": typeof services_tenantServices;
  "sweepers/activity": typeof sweepers_activity;
  "tenants/comments": typeof tenants_comments;
  "tenants/gallery": typeof tenants_gallery;
  "tenants/migrations": typeof tenants_migrations;
  "tenants/plans": typeof tenants_plans;
  "tenants/settings": typeof tenants_settings;
  "tenants/site_content": typeof tenants_site_content;
  "tenants/tenants": typeof tenants_tenants;
  testConfig: typeof testConfig;
  "uploads/upload": typeof uploads_upload;
  "users/auth": typeof users_auth;
  "users/authConfig": typeof users_authConfig;
  "users/auth_adapters": typeof users_auth_adapters;
  "users/credits": typeof users_credits;
  "users/levels": typeof users_levels;
  "users/migrations": typeof users_migrations;
  "users/promoterScore": typeof users_promoterScore;
  "users/reputation": typeof users_reputation;
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
