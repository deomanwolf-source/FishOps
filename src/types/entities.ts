export type Id = string;
export type ISODate = string;
export type ISODateTime = string;

export type Role = "master" | "admin" | "user";

export type BranchStatus = "active" | "inactive";
export type UserStatus = "active" | "inactive";
export type FishStatus = "active" | "inactive";
export type FishCategory = "Sea" | "Lagoon" | "Freshwater";
export type FishUnit = "kg" | "pcs";

export type StockAlertLevel = "CRITICAL" | "LOW" | "OK";
export type ReportScope = "today_only" | "full_range";

export type AuditAction = "create" | "update" | "delete" | "login";
export type AuditEntity =
  | "fish_profile"
  | "daily_price"
  | "stock"
  | "user"
  | "branch"
  | "settings";

export interface Branch {
  id: Id;
  name: string;
  location: string;
  phone: string;
  status: BranchStatus;
}

export interface User {
  id: Id;
  username: string;
  password: string;
  role: Role;
  branch_id: Id | null;
  status: UserStatus;
}

export interface FishProfile {
  id: Id;
  fish_code: string;
  name: string;
  local_name?: string;
  category: FishCategory;
  unit: FishUnit;
  photo?: string;
  status: FishStatus;
}

export interface BranchFishSetting {
  id: Id;
  branch_id: Id;
  fish_id: Id;
  min_stock: number;
  target_stock: number;
  is_active: boolean;
  notes?: string;
}

export interface DailyPrice {
  id: Id;
  date: ISODate;
  branch_id: Id;
  fish_id: Id;
  sell_price_per_unit: number;
  cost_price_per_unit: number;
  updated_by: Id;
  updated_at: ISODateTime;
  notes?: string;
}

export interface DailyStockEntry {
  id: Id;
  date: ISODate;
  branch_id: Id;
  fish_id: Id;
  opening_qty: number;
  purchase_qty?: number;
  closing_qty?: number;
  waste_qty?: number;
  created_by: Id;
  updated_by: Id;
  updated_at: ISODateTime;
}

export interface AuditLog {
  id: Id;
  datetime: ISODateTime;
  user_id: Id;
  branch_id: Id;
  action: AuditAction;
  entity: AuditEntity;
  entity_id: Id;
  details_json: Record<string, unknown>;
}

export interface FishOpsDataset {
  branches: Branch[];
  users: User[];
  fish_profiles: FishProfile[];
  branch_fish_settings: BranchFishSetting[];
  daily_prices: DailyPrice[];
  daily_stock_entry: DailyStockEntry[];
  audit_logs: AuditLog[];
}
