import type { StockAlertLevel } from "../types/entities.js";

export interface StockFormulaInput {
  opening_qty: number;
  purchase_qty?: number;
  closing_qty: number;
  waste_qty?: number;
}

export interface DailyFishMetricsInput {
  fish_id: string;
  opening_qty: number;
  purchase_qty?: number;
  closing_qty: number;
  waste_qty?: number;
  min_stock: number;
  target_stock: number;
  sell_price_per_unit?: number;
  cost_price_per_unit?: number;
}

export interface DailyFishMetricsResult {
  fish_id: string;
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

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSoldQty(input: StockFormulaInput): number {
  const purchase = input.purchase_qty ?? 0;
  const waste = input.waste_qty ?? 0;
  return round2(input.opening_qty + purchase - input.closing_qty - waste);
}

export function assertNonNegativeSoldQty(sold_qty: number): void {
  if (sold_qty < 0) {
    throw new Error(`Invalid sold quantity: ${sold_qty}. Expected sold_qty >= 0.`);
  }
}

export function calculateRevenue(
  sold_qty: number,
  sell_price_per_unit: number
): number {
  return round2(sold_qty * sell_price_per_unit);
}

export function calculateCost(sold_qty: number, cost_price_per_unit: number): number {
  return round2(sold_qty * cost_price_per_unit);
}

export function calculateProfit(revenue: number, cost: number): number {
  return round2(revenue - cost);
}

export function calculateTomorrowOrderQty(
  target_stock: number,
  closing_qty: number
): number {
  return round2(Math.max(0, target_stock - closing_qty));
}

export function calculateStockAlertLevel(
  closing_qty: number,
  min_stock: number,
  target_stock: number
): StockAlertLevel {
  if (closing_qty < min_stock) {
    return "CRITICAL";
  }

  if (closing_qty < target_stock) {
    return "LOW";
  }

  return "OK";
}

export function computeDailyFishMetrics(
  input: DailyFishMetricsInput
): DailyFishMetricsResult {
  const sold_qty = calculateSoldQty({
    opening_qty: input.opening_qty,
    purchase_qty: input.purchase_qty,
    closing_qty: input.closing_qty,
    waste_qty: input.waste_qty
  });

  assertNonNegativeSoldQty(sold_qty);

  const stock_alert = calculateStockAlertLevel(
    input.closing_qty,
    input.min_stock,
    input.target_stock
  );

  const order_qty = calculateTomorrowOrderQty(input.target_stock, input.closing_qty);
  const waste_qty = round2(input.waste_qty ?? 0);

  if (
    input.sell_price_per_unit === undefined ||
    input.cost_price_per_unit === undefined
  ) {
    return {
      fish_id: input.fish_id,
      sold_qty,
      revenue: null,
      cost: null,
      profit: null,
      closing_qty: input.closing_qty,
      waste_qty,
      order_qty,
      stock_alert,
      price_missing: true
    };
  }

  const revenue = calculateRevenue(sold_qty, input.sell_price_per_unit);
  const cost = calculateCost(sold_qty, input.cost_price_per_unit);
  const profit = calculateProfit(revenue, cost);

  return {
    fish_id: input.fish_id,
    sold_qty,
    revenue,
    cost,
    profit,
    closing_qty: input.closing_qty,
    waste_qty,
    order_qty,
    stock_alert,
    price_missing: false
  };
}
