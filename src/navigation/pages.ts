import {
  hasPermission,
  type PermissionContext,
  type PermissionKey
} from "../security/permissions.js";
import type { Role } from "../types/entities.js";

export type PageId =
  | "dashboard"
  | "users_roles"
  | "fish_profiles"
  | "branch_fish_settings"
  | "daily_prices"
  | "morning_opening_stock"
  | "night_closing_stock"
  | "daily_summary"
  | "reports"
  | "settings";

export interface AppPage {
  id: PageId;
  title: string;
  path: string;
  required_permission: PermissionKey;
  note?: string;
}

export const APP_PAGES: readonly AppPage[] = [
  {
    id: "dashboard",
    title: "Branch Dashboard",
    path: "/dashboard",
    required_permission: "view_dashboard"
  },
  {
    id: "users_roles",
    title: "Users & Roles",
    path: "/users",
    required_permission: "manage_users_roles"
  },
  {
    id: "fish_profiles",
    title: "Fish Profiles",
    path: "/fish-profiles",
    required_permission: "view_fish_profiles",
    note: "Edit buttons only for admin/master."
  },
  {
    id: "branch_fish_settings",
    title: "Branch Fish Settings",
    path: "/branch-fish-settings",
    required_permission: "set_branch_stock_levels"
  },
  {
    id: "daily_prices",
    title: "Daily Prices",
    path: "/daily-prices",
    required_permission: "set_daily_prices"
  },
  {
    id: "morning_opening_stock",
    title: "Morning Opening Stock",
    path: "/stock/opening",
    required_permission: "enter_opening_stock"
  },
  {
    id: "night_closing_stock",
    title: "Night Closing Stock",
    path: "/stock/closing",
    required_permission: "enter_closing_stock"
  },
  {
    id: "daily_summary",
    title: "Daily Summary",
    path: "/summary/daily",
    required_permission: "view_dashboard"
  },
  {
    id: "reports",
    title: "Reports",
    path: "/reports",
    required_permission: "view_reports_today",
    note: "Users are restricted to today-only report scope."
  },
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    required_permission: "manage_branches"
  }
];

export function listPagesForRole(
  role: Role,
  context: PermissionContext = {}
): AppPage[] {
  return APP_PAGES.filter((page) =>
    hasPermission(role, page.required_permission, context)
  );
}
