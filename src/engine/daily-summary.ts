import { computeDailyFishMetrics } from "./calculations.js";
import type {
  BranchFishSetting,
  DailyPrice,
  DailyStockEntry,
  FishProfile,
  Id,
  ISODate,
  StockAlertLevel
} from "../types/entities.js";

export interface DailySummaryFishRow {
  fish_id: Id;
  fish_code: string;
  fish_name: string;
  fish_local_name?: string;
  unit: "kg" | "pcs";
  sold_qty: number;
  revenue: number | null;
  cost: number | null;
  profit: number | null;
  closing_qty: number;
  waste_qty: number;
  order_qty: number;
  stock_alert: StockAlertLevel;
  price_missing: boolean;
}

export interface BranchDailyTotals {
  sold_qty: number;
  revenue: number;
  cost: number;
  profit: number;
  closing_qty: number;
  waste_qty: number;
  unpriced_sold_qty: number;
}

export interface TomorrowOrderRow {
  fish_id: Id;
  fish_code: string;
  fish_name: string;
  unit: "kg" | "pcs";
  order_qty: number;
  stock_alert: StockAlertLevel;
}

export interface BranchDailySummary {
  date: ISODate;
  branch_id: Id;
  totals: BranchDailyTotals;
  rows: DailySummaryFishRow[];
  low_stock_alerts: TomorrowOrderRow[];
  missing_prices: Pick<DailySummaryFishRow, "fish_id" | "fish_code" | "fish_name">[];
  tomorrow_order_list: TomorrowOrderRow[];
  missing_stock_entries: Id[];
  validation_errors: string[];
}

export interface BuildBranchDailySummaryInput {
  date: ISODate;
  branch_id: Id;
  fish_profiles: FishProfile[];
  branch_fish_settings: BranchFishSetting[];
  daily_prices: DailyPrice[];
  daily_stock_entry: DailyStockEntry[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildBranchDailySummary(
  input: BuildBranchDailySummaryInput
): BranchDailySummary {
  const fishById = new Map(input.fish_profiles.map((fish) => [fish.id, fish]));
  const settings = input.branch_fish_settings.filter(
    (setting) => setting.branch_id === input.branch_id && setting.is_active
  );

  const entriesByFishId = new Map(
    input.daily_stock_entry
      .filter(
        (entry) => entry.branch_id === input.branch_id && entry.date === input.date
      )
      .map((entry) => [entry.fish_id, entry])
  );

  const pricesByFishId = new Map(
    input.daily_prices
      .filter(
        (price) => price.branch_id === input.branch_id && price.date === input.date
      )
      .map((price) => [price.fish_id, price])
  );

  const rows: DailySummaryFishRow[] = [];
  const missing_stock_entries: Id[] = [];
  const validation_errors: string[] = [];

  for (const setting of settings) {
    const fish = fishById.get(setting.fish_id);
    if (!fish || fish.status !== "active") {
      continue;
    }

    const entry = entriesByFishId.get(setting.fish_id);
    if (!entry || entry.closing_qty === undefined) {
      missing_stock_entries.push(setting.fish_id);
      continue;
    }

    const price = pricesByFishId.get(setting.fish_id);

    try {
      const metrics = computeDailyFishMetrics({
        fish_id: setting.fish_id,
        opening_qty: entry.opening_qty,
        purchase_qty: entry.purchase_qty,
        closing_qty: entry.closing_qty,
        waste_qty: entry.waste_qty,
        min_stock: setting.min_stock,
        target_stock: setting.target_stock,
        sell_price_per_unit: price?.sell_price_per_unit,
        cost_price_per_unit: price?.cost_price_per_unit
      });

      rows.push({
        fish_id: fish.id,
        fish_code: fish.fish_code,
        fish_name: fish.name,
        fish_local_name: fish.local_name,
        unit: fish.unit,
        sold_qty: metrics.sold_qty,
        revenue: metrics.revenue,
        cost: metrics.cost,
        profit: metrics.profit,
        closing_qty: metrics.closing_qty,
        waste_qty: metrics.waste_qty,
        order_qty: metrics.order_qty,
        stock_alert: metrics.stock_alert,
        price_missing: metrics.price_missing
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown calculation error";
      validation_errors.push(`fish_id=${setting.fish_id}: ${reason}`);
    }
  }

  const totals: BranchDailyTotals = rows.reduce(
    (acc, row) => {
      acc.sold_qty = round2(acc.sold_qty + row.sold_qty);
      acc.closing_qty = round2(acc.closing_qty + row.closing_qty);
      acc.waste_qty = round2(acc.waste_qty + row.waste_qty);

      if (row.revenue === null || row.cost === null || row.profit === null) {
        acc.unpriced_sold_qty = round2(acc.unpriced_sold_qty + row.sold_qty);
      } else {
        acc.revenue = round2(acc.revenue + row.revenue);
        acc.cost = round2(acc.cost + row.cost);
        acc.profit = round2(acc.profit + row.profit);
      }

      return acc;
    },
    {
      sold_qty: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      closing_qty: 0,
      waste_qty: 0,
      unpriced_sold_qty: 0
    }
  );

  rows.sort((a, b) => a.fish_name.localeCompare(b.fish_name));

  const low_stock_alerts: TomorrowOrderRow[] = rows
    .filter((row) => row.stock_alert !== "OK")
    .map((row) => ({
      fish_id: row.fish_id,
      fish_code: row.fish_code,
      fish_name: row.fish_name,
      unit: row.unit,
      order_qty: row.order_qty,
      stock_alert: row.stock_alert
    }));

  const missing_prices = rows
    .filter((row) => row.price_missing)
    .map((row) => ({
      fish_id: row.fish_id,
      fish_code: row.fish_code,
      fish_name: row.fish_name
    }));

  const tomorrow_order_list: TomorrowOrderRow[] = rows
    .filter((row) => row.order_qty > 0)
    .map((row) => ({
      fish_id: row.fish_id,
      fish_code: row.fish_code,
      fish_name: row.fish_name,
      unit: row.unit,
      order_qty: row.order_qty,
      stock_alert: row.stock_alert
    }));

  return {
    date: input.date,
    branch_id: input.branch_id,
    totals,
    rows,
    low_stock_alerts,
    missing_prices,
    tomorrow_order_list,
    missing_stock_entries,
    validation_errors
  };
}
