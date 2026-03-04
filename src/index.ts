import { listPagesForRole } from "./navigation/pages.js";
import { buildFishWiseProfitReport } from "./reports/report-engine.js";
import { FishOpsService } from "./services/fishops-service.js";
import { OPERATIONAL_BLUE_TEAL_THEME } from "./theme/operational-blue-teal.js";
import { SAMPLE_DATASET } from "./seed/sample-data.js";

const service = new FishOpsService(SAMPLE_DATASET);

const dashboard = service.getBranchDashboard({
  date: "2026-02-15",
  branch_id: "BR-001",
  user_id: "USR-ADMIN-001"
});

const pagesForUser = listPagesForRole("user", {
  allow_user_backup_export: false
});

const fishProfitRows = buildFishWiseProfitReport(dashboard.rows);

console.log("Theme:", OPERATIONAL_BLUE_TEAL_THEME.name);
console.log("Visible pages for role=user:", pagesForUser.map((page) => page.id));
console.log("Dashboard totals:", dashboard.totals);
console.log("Missing prices:", dashboard.missing_prices);
console.log("Low stock alerts:", dashboard.low_stock_alerts);
console.log("Tomorrow orders:", dashboard.tomorrow_order_list);
console.log("Fish profit rows:", fishProfitRows);
