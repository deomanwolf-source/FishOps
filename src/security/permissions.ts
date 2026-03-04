import type { ReportScope, Role } from "../types/entities.js";

export type PermissionKey =
  | "view_dashboard"
  | "manage_users_roles"
  | "manage_theme_branding"
  | "backup_export"
  | "backup_restore_import"
  | "delete_center"
  | "view_all_branches"
  | "switch_branch"
  | "view_fish_profiles"
  | "upsert_fish_profile"
  | "delete_fish_profile"
  | "set_branch_stock_levels"
  | "set_daily_prices"
  | "enter_opening_stock"
  | "enter_closing_stock"
  | "enter_waste"
  | "view_reports_today"
  | "view_reports_full"
  | "manage_branches"
  | "manage_settings";

export interface PermissionContext {
  user_branch_id?: string | null;
  target_branch_id?: string | null;
  allow_admin_fish_delete?: boolean;
  allow_user_backup_export?: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, readonly PermissionKey[]> = {
  master: [
    "view_dashboard",
    "manage_users_roles",
    "manage_theme_branding",
    "backup_export",
    "backup_restore_import",
    "delete_center",
    "view_all_branches",
    "switch_branch",
    "view_fish_profiles",
    "upsert_fish_profile",
    "delete_fish_profile",
    "set_branch_stock_levels",
    "set_daily_prices",
    "enter_opening_stock",
    "enter_closing_stock",
    "enter_waste",
    "view_reports_today",
    "view_reports_full",
    "manage_branches",
    "manage_settings"
  ],
  admin: [
    "view_dashboard",
    "backup_export",
    "switch_branch",
    "view_fish_profiles",
    "upsert_fish_profile",
    "set_branch_stock_levels",
    "set_daily_prices",
    "enter_opening_stock",
    "enter_closing_stock",
    "enter_waste",
    "view_reports_today",
    "view_reports_full",
    "manage_branches"
  ],
  user: [
    "view_dashboard",
    "backup_export",
    "view_fish_profiles",
    "enter_opening_stock",
    "enter_closing_stock",
    "enter_waste",
    "view_reports_today"
  ]
};

export function hasPermission(
  role: Role,
  permission: PermissionKey,
  context: PermissionContext = {}
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions.includes(permission)) {
    return false;
  }

  if (permission === "switch_branch" && role === "admin") {
    return (
      Boolean(context.user_branch_id) &&
      Boolean(context.target_branch_id) &&
      context.user_branch_id === context.target_branch_id
    );
  }

  if (permission === "delete_fish_profile" && role === "admin") {
    return Boolean(context.allow_admin_fish_delete);
  }

  if (permission === "backup_export" && role === "user") {
    return Boolean(context.allow_user_backup_export);
  }

  return true;
}

export function canEditRecords(role: Role): boolean {
  return role === "master" || role === "admin";
}

export function canAccessBranch(
  role: Role,
  user_branch_id: string | null,
  branch_id: string
): boolean {
  if (role === "master") {
    return true;
  }

  return user_branch_id === branch_id;
}

export function getReportScope(role: Role): ReportScope {
  return role === "user" ? "today_only" : "full_range";
}
