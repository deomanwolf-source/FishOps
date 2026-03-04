import type { DailyPrice, DailyStockEntry, Id } from "../types/entities.js";
import type { DailySummaryFishRow } from "../engine/daily-summary.js";

export interface FishWiseProfitRow {
  fish_id: Id;
  fish_code: string;
  fish_name: string;
  sold_qty: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface WasteTrendRow {
  date: string;
  total_waste_qty: number;
}

export interface PriceChangeRow {
  date: string;
  branch_id: Id;
  fish_id: Id;
  sell_price_per_unit: number;
  cost_price_per_unit: number;
  sell_change: number;
  cost_change: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildFishWiseProfitReport(rows: DailySummaryFishRow[]): FishWiseProfitRow[] {
  const grouped = new Map<Id, FishWiseProfitRow>();

  for (const row of rows) {
    if (row.revenue === null || row.cost === null || row.profit === null) {
      continue;
    }

    const existing = grouped.get(row.fish_id);
    if (existing) {
      existing.sold_qty = round2(existing.sold_qty + row.sold_qty);
      existing.revenue = round2(existing.revenue + row.revenue);
      existing.cost = round2(existing.cost + row.cost);
      existing.profit = round2(existing.profit + row.profit);
      continue;
    }

    grouped.set(row.fish_id, {
      fish_id: row.fish_id,
      fish_code: row.fish_code,
      fish_name: row.fish_name,
      sold_qty: row.sold_qty,
      revenue: row.revenue,
      cost: row.cost,
      profit: row.profit
    });
  }

  return [...grouped.values()].sort((a, b) => b.profit - a.profit);
}

export function buildWasteTrend(
  entries: DailyStockEntry[],
  branch_id?: Id
): WasteTrendRow[] {
  const wasteByDate = new Map<string, number>();

  for (const entry of entries) {
    if (branch_id && entry.branch_id !== branch_id) {
      continue;
    }

    const waste = entry.waste_qty ?? 0;
    wasteByDate.set(entry.date, round2((wasteByDate.get(entry.date) ?? 0) + waste));
  }

  return [...wasteByDate.entries()]
    .map(([date, total_waste_qty]) => ({ date, total_waste_qty }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPriceChangeReport(prices: DailyPrice[]): PriceChangeRow[] {
  const sorted = [...prices].sort((a, b) => {
    if (a.branch_id !== b.branch_id) {
      return a.branch_id.localeCompare(b.branch_id);
    }

    if (a.fish_id !== b.fish_id) {
      return a.fish_id.localeCompare(b.fish_id);
    }

    return a.date.localeCompare(b.date);
  });

  const lastPriceByKey = new Map<string, DailyPrice>();
  const rows: PriceChangeRow[] = [];

  for (const price of sorted) {
    const key = `${price.branch_id}::${price.fish_id}`;
    const previous = lastPriceByKey.get(key);

    rows.push({
      date: price.date,
      branch_id: price.branch_id,
      fish_id: price.fish_id,
      sell_price_per_unit: price.sell_price_per_unit,
      cost_price_per_unit: price.cost_price_per_unit,
      sell_change: previous
        ? round2(price.sell_price_per_unit - previous.sell_price_per_unit)
        : 0,
      cost_change: previous
        ? round2(price.cost_price_per_unit - previous.cost_price_per_unit)
        : 0
    });

    lastPriceByKey.set(key, price);
  }

  return rows;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const raw = row[header];
      const value = raw === null || raw === undefined ? "" : String(raw);
      const escaped = value.replaceAll('"', '""');
      return `"${escaped}"`;
    });
    lines.push(values.join(","));
  }

  return lines.join("\n");
}
