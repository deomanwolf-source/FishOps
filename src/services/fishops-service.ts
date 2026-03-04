import { buildBranchDailySummary, type BranchDailySummary } from "../engine/daily-summary.js";
import {
  hasPermission,
  canAccessBranch,
  type PermissionContext,
  type PermissionKey
} from "../security/permissions.js";
import type {
  AuditLog,
  BranchFishSetting,
  DailyPrice,
  DailyStockEntry,
  FishOpsDataset,
  FishProfile,
  Id,
  ISODate,
  User
} from "../types/entities.js";

const EMPTY_DATASET: FishOpsDataset = {
  branches: [],
  users: [],
  fish_profiles: [],
  branch_fish_settings: [],
  daily_prices: [],
  daily_stock_entry: [],
  audit_logs: []
};

export interface DashboardRequest {
  date: ISODate;
  branch_id: Id;
  user_id: Id;
}

export interface BranchComparisonRow {
  branch_id: Id;
  branch_name: string;
  sold_qty: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface UpsertDailyPriceInput {
  date: ISODate;
  branch_id: Id;
  fish_id: Id;
  sell_price_per_unit: number;
  cost_price_per_unit: number;
  notes?: string;
}

export interface UpsertDailyStockInput {
  date: ISODate;
  branch_id: Id;
  fish_id: Id;
  opening_qty: number;
  purchase_qty?: number;
  closing_qty?: number;
  waste_qty?: number;
}

export interface CopyDailyPricesInput {
  branch_id: Id;
  source_date: ISODate;
  target_date: ISODate;
}

export interface BackupExportOptions {
  allow_user_backup_export?: boolean;
}

function cloneDataset(data: FishOpsDataset): FishOpsDataset {
  return JSON.parse(JSON.stringify(data)) as FishOpsDataset;
}

function assertDatasetShape(candidate: unknown): asserts candidate is FishOpsDataset {
  if (typeof candidate !== "object" || candidate === null) {
    throw new Error("Invalid backup payload: expected object");
  }

  const requiredArrays = [
    "branches",
    "users",
    "fish_profiles",
    "branch_fish_settings",
    "daily_prices",
    "daily_stock_entry",
    "audit_logs"
  ] as const;

  for (const key of requiredArrays) {
    const value = (candidate as Record<string, unknown>)[key];
    if (!Array.isArray(value)) {
      throw new Error(`Invalid backup payload: "${key}" must be an array`);
    }
  }
}

export class FishOpsService {
  private data: FishOpsDataset;
  private idCounter = 0;

  constructor(seed?: Partial<FishOpsDataset>) {
    this.data = {
      branches: seed?.branches ?? [],
      users: seed?.users ?? [],
      fish_profiles: seed?.fish_profiles ?? [],
      branch_fish_settings: seed?.branch_fish_settings ?? [],
      daily_prices: seed?.daily_prices ?? [],
      daily_stock_entry: seed?.daily_stock_entry ?? [],
      audit_logs: seed?.audit_logs ?? []
    };
  }

  setData(data: FishOpsDataset): void {
    this.data = cloneDataset(data);
  }

  getData(): FishOpsDataset {
    return cloneDataset(this.data);
  }

  exportBackup(user_id: Id, options: BackupExportOptions = {}): string {
    const user = this.getUserOrThrow(user_id);
    this.assertPermission(user, "backup_export", {
      allow_user_backup_export: options.allow_user_backup_export
    });
    return JSON.stringify(this.data, null, 2);
  }

  importBackup(user_id: Id, backupJson: string): void {
    const user = this.getUserOrThrow(user_id);
    this.assertPermission(user, "backup_restore_import");

    const parsed = JSON.parse(backupJson) as unknown;
    assertDatasetShape(parsed);
    this.data = cloneDataset(parsed);
    this.logAudit(user, "update", "settings", "BACKUP-IMPORT", {
      imported_at: new Date().toISOString()
    });
  }

  wipeAllData(user_id: Id): void {
    const user = this.getUserOrThrow(user_id);
    this.assertPermission(user, "delete_center");
    this.data = createEmptyDataset();
  }

  getBranchDashboard(request: DashboardRequest): BranchDailySummary {
    const user = this.getUserOrThrow(request.user_id);
    this.assertPermission(user, "view_dashboard");
    this.assertBranchAccess(user, request.branch_id);

    return buildBranchDailySummary({
      date: request.date,
      branch_id: request.branch_id,
      fish_profiles: this.data.fish_profiles,
      branch_fish_settings: this.data.branch_fish_settings,
      daily_prices: this.data.daily_prices,
      daily_stock_entry: this.data.daily_stock_entry
    });
  }

  getCompanyBranchComparison(date: ISODate, user_id: Id): BranchComparisonRow[] {
    const user = this.getUserOrThrow(user_id);
    this.assertPermission(user, "view_all_branches");

    return this.data.branches
      .filter((branch) => branch.status === "active")
      .map((branch) => {
        const summary = buildBranchDailySummary({
          date,
          branch_id: branch.id,
          fish_profiles: this.data.fish_profiles,
          branch_fish_settings: this.data.branch_fish_settings,
          daily_prices: this.data.daily_prices,
          daily_stock_entry: this.data.daily_stock_entry
        });

        return {
          branch_id: branch.id,
          branch_name: branch.name,
          sold_qty: summary.totals.sold_qty,
          revenue: summary.totals.revenue,
          cost: summary.totals.cost,
          profit: summary.totals.profit
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }

  upsertDailyPrice(actor_user_id: Id, input: UpsertDailyPriceInput): DailyPrice {
    const user = this.getUserOrThrow(actor_user_id);
    this.assertPermission(user, "set_daily_prices");
    this.assertBranchAccess(user, input.branch_id);

    const existing = this.data.daily_prices.find(
      (row) =>
        row.date === input.date &&
        row.branch_id === input.branch_id &&
        row.fish_id === input.fish_id
    );

    if (existing) {
      existing.sell_price_per_unit = input.sell_price_per_unit;
      existing.cost_price_per_unit = input.cost_price_per_unit;
      existing.updated_by = user.id;
      existing.updated_at = new Date().toISOString();
      existing.notes = input.notes;
      this.logAudit(user, "update", "daily_price", existing.id, {
        date: input.date,
        branch_id: input.branch_id,
        fish_id: input.fish_id
      });
      return existing;
    }

    const row: DailyPrice = {
      id: this.createId("PRC"),
      date: input.date,
      branch_id: input.branch_id,
      fish_id: input.fish_id,
      sell_price_per_unit: input.sell_price_per_unit,
      cost_price_per_unit: input.cost_price_per_unit,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      notes: input.notes
    };

    this.data.daily_prices.push(row);
    this.logAudit(user, "create", "daily_price", row.id, {
      date: input.date,
      branch_id: input.branch_id,
      fish_id: input.fish_id
    });
    return row;
  }

  copyDailyPrices(actor_user_id: Id, input: CopyDailyPricesInput): DailyPrice[] {
    const user = this.getUserOrThrow(actor_user_id);
    this.assertPermission(user, "set_daily_prices");
    this.assertBranchAccess(user, input.branch_id);

    const sourceRows = this.data.daily_prices.filter(
      (row) => row.branch_id === input.branch_id && row.date === input.source_date
    );

    const copiedRows: DailyPrice[] = [];
    for (const source of sourceRows) {
      const copied = this.upsertDailyPrice(actor_user_id, {
        date: input.target_date,
        branch_id: input.branch_id,
        fish_id: source.fish_id,
        sell_price_per_unit: source.sell_price_per_unit,
        cost_price_per_unit: source.cost_price_per_unit,
        notes: `Copied from ${input.source_date}`
      });
      copiedRows.push(copied);
    }

    return copiedRows;
  }

  getPriceHistory(branch_id: Id, fish_id: Id, user_id: Id): DailyPrice[] {
    const user = this.getUserOrThrow(user_id);
    this.assertPermission(user, "set_daily_prices");
    this.assertBranchAccess(user, branch_id);

    return this.data.daily_prices
      .filter((row) => row.branch_id === branch_id && row.fish_id === fish_id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  upsertDailyStockEntry(
    actor_user_id: Id,
    input: UpsertDailyStockInput
  ): DailyStockEntry {
    const user = this.getUserOrThrow(actor_user_id);
    this.assertPermission(user, "enter_opening_stock");
    this.assertPermission(user, "enter_closing_stock");
    this.assertPermission(user, "enter_waste");
    this.assertBranchAccess(user, input.branch_id);

    const existing = this.data.daily_stock_entry.find(
      (row) =>
        row.date === input.date &&
        row.branch_id === input.branch_id &&
        row.fish_id === input.fish_id
    );

    if (existing) {
      existing.opening_qty = input.opening_qty;
      existing.purchase_qty = input.purchase_qty;
      existing.closing_qty = input.closing_qty;
      existing.waste_qty = input.waste_qty;
      existing.updated_by = user.id;
      existing.updated_at = new Date().toISOString();
      this.logAudit(user, "update", "stock", existing.id, {
        date: input.date,
        branch_id: input.branch_id,
        fish_id: input.fish_id
      });
      return existing;
    }

    const row: DailyStockEntry = {
      id: this.createId("STK"),
      date: input.date,
      branch_id: input.branch_id,
      fish_id: input.fish_id,
      opening_qty: input.opening_qty,
      purchase_qty: input.purchase_qty,
      closing_qty: input.closing_qty,
      waste_qty: input.waste_qty,
      created_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    this.data.daily_stock_entry.push(row);
    this.logAudit(user, "create", "stock", row.id, {
      date: input.date,
      branch_id: input.branch_id,
      fish_id: input.fish_id
    });
    return row;
  }

  upsertBranchFishSetting(
    actor_user_id: Id,
    input: Omit<BranchFishSetting, "id">
  ): BranchFishSetting {
    const user = this.getUserOrThrow(actor_user_id);
    this.assertPermission(user, "set_branch_stock_levels");
    this.assertBranchAccess(user, input.branch_id);

    const existing = this.data.branch_fish_settings.find(
      (row) => row.branch_id === input.branch_id && row.fish_id === input.fish_id
    );

    if (existing) {
      existing.min_stock = input.min_stock;
      existing.target_stock = input.target_stock;
      existing.is_active = input.is_active;
      existing.notes = input.notes;
      this.logAudit(user, "update", "settings", existing.id, {
        branch_id: input.branch_id,
        fish_id: input.fish_id
      });
      return existing;
    }

    const row: BranchFishSetting = {
      id: this.createId("SET"),
      ...input
    };
    this.data.branch_fish_settings.push(row);
    this.logAudit(user, "create", "settings", row.id, {
      branch_id: input.branch_id,
      fish_id: input.fish_id
    });
    return row;
  }

  upsertFishProfile(actor_user_id: Id, input: Omit<FishProfile, "id">): FishProfile {
    const user = this.getUserOrThrow(actor_user_id);
    this.assertPermission(user, "upsert_fish_profile");

    const existing = this.data.fish_profiles.find(
      (row) => row.fish_code === input.fish_code
    );

    if (existing) {
      existing.name = input.name;
      existing.local_name = input.local_name;
      existing.category = input.category;
      existing.unit = input.unit;
      existing.photo = input.photo;
      existing.status = input.status;
      this.logAudit(user, "update", "fish_profile", existing.id, {
        fish_code: existing.fish_code
      });
      return existing;
    }

    const row: FishProfile = {
      id: this.createId("FSH"),
      ...input
    };
    this.data.fish_profiles.push(row);
    this.logAudit(user, "create", "fish_profile", row.id, {
      fish_code: row.fish_code
    });
    return row;
  }

  private assertPermission(
    user: User,
    permission: PermissionKey,
    context: PermissionContext = {}
  ): void {
    const allowed = hasPermission(user.role, permission, {
      user_branch_id: user.branch_id,
      allow_user_backup_export: false,
      allow_admin_fish_delete: false,
      ...context
    });

    if (!allowed) {
      throw new Error(`Permission denied: ${user.role} cannot ${permission}`);
    }
  }

  private assertBranchAccess(user: User, branch_id: Id): void {
    if (!canAccessBranch(user.role, user.branch_id, branch_id)) {
      throw new Error(`Branch access denied for user ${user.id} to branch ${branch_id}`);
    }
  }

  private getUserOrThrow(user_id: Id): User {
    const user = this.data.users.find((row) => row.id === user_id);
    if (!user) {
      throw new Error(`User not found: ${user_id}`);
    }
    if (user.status !== "active") {
      throw new Error(`User is inactive: ${user_id}`);
    }
    return user;
  }

  private logAudit(
    user: User,
    action: AuditLog["action"],
    entity: AuditLog["entity"],
    entity_id: Id,
    details_json: Record<string, unknown>
  ): void {
    const branch_id = user.branch_id ?? "GLOBAL";
    this.data.audit_logs.push({
      id: this.createId("AUD"),
      datetime: new Date().toISOString(),
      user_id: user.id,
      branch_id,
      action,
      entity,
      entity_id,
      details_json
    });
  }

  private createId(prefix: string): Id {
    this.idCounter += 1;
    return `${prefix}-${Date.now()}-${this.idCounter}`;
  }
}

export function createEmptyDataset(): FishOpsDataset {
  return cloneDataset(EMPTY_DATASET);
}
