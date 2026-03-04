import type { PermissionKey } from "../security/permissions.js";
import type { Role } from "../types/entities.js";

export type WorkflowWindow = "morning" | "evening";

export interface WorkflowStep {
  id: string;
  window: WorkflowWindow;
  title: string;
  owner_roles: Role[];
  required_permission: PermissionKey;
  description: string;
}

export const DAILY_WORKFLOW: readonly WorkflowStep[] = [
  {
    id: "set_prices",
    window: "morning",
    title: "Set daily prices",
    owner_roles: ["master", "admin"],
    required_permission: "set_daily_prices",
    description: "Set sell and cost prices for each active fish. Optionally copy yesterday."
  },
  {
    id: "opening_stock",
    window: "morning",
    title: "Enter opening stock",
    owner_roles: ["master", "admin", "user"],
    required_permission: "enter_opening_stock",
    description: "Enter opening quantity and optional purchase quantity for each fish."
  },
  {
    id: "closing_stock",
    window: "evening",
    title: "Enter closing stock",
    owner_roles: ["master", "admin", "user"],
    required_permission: "enter_closing_stock",
    description: "Enter closing quantity and waste quantity, then close daily records."
  },
  {
    id: "daily_summary",
    window: "evening",
    title: "Review daily summary",
    owner_roles: ["master", "admin", "user"],
    required_permission: "view_dashboard",
    description: "Review sold, revenue, cost, profit, alerts, and tomorrow order quantities."
  }
];
