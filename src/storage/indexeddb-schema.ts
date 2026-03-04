import type {
  AuditLog,
  Branch,
  BranchFishSetting,
  DailyPrice,
  DailyStockEntry,
  FishProfile,
  User
} from "../types/entities.js";

export const DB_NAME = "rtx_fishops";
export const DB_VERSION = 1;

export const TABLE_SCHEMAS = {
  branches: "id, status, name, location",
  users: "id, &username, role, branch_id, status",
  fish_profiles: "id, &fish_code, category, status, name",
  branch_fish_settings: "id, [branch_id+fish_id], branch_id, fish_id, is_active",
  daily_prices: "id, [date+branch_id+fish_id], date, branch_id, fish_id, updated_at",
  daily_stock_entry:
    "id, [date+branch_id+fish_id], date, branch_id, fish_id, updated_at",
  audit_logs: "id, datetime, user_id, branch_id, action, entity, entity_id"
} as const;

export type TableName = keyof typeof TABLE_SCHEMAS;

export interface FishOpsCollections {
  branches: Branch;
  users: User;
  fish_profiles: FishProfile;
  branch_fish_settings: BranchFishSetting;
  daily_prices: DailyPrice;
  daily_stock_entry: DailyStockEntry;
  audit_logs: AuditLog;
}
