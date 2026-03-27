const STORAGE_KEY = "fishops_demo_store_v3";
const STOCK_DATA_PURGE_MARKER_KEY = "fishops_stock_data_purge_v1";
const PDF_COPYRIGHT_LINE =
  "\u00A9 2026 RTX FishOps | 6.11.0 (Enterprise Release) | RUN by RTX Virual Engine Technology | Developed by Hasintha Arunalu | RTX Technologies. All rights reserved.";
const ALL_BRANCH_OPTION_VALUE = "__ALL_BRANCHES__";
const ALL_BRANCH_OPTION_LABEL = "All Branches";
const BACKUP_HANDLE_DB_NAME = "fishops_backup_handles_v1";
const BACKUP_HANDLE_STORE_NAME = "handles";
const DAILY_BACKUP_HANDLE_KEY = "daily_backup_directory";
const REMOTE_STORE_POLL_INTERVAL_MS = 15000;
const LOCAL_STORE_PERSISTENCE_ENABLED = false;
const FIREBASE_CONFIG = Object.freeze({
  enabled: Boolean(window.FISHOPS_FIREBASE_CONFIG?.enabled),
  databaseURL: String(window.FISHOPS_FIREBASE_CONFIG?.databaseURL || "").trim(),
  namespace: String(window.FISHOPS_FIREBASE_CONFIG?.namespace || "fishops").trim(),
  authToken: String(window.FISHOPS_FIREBASE_CONFIG?.authToken || "").trim()
});
const FIREBASE_NAMESPACE = FIREBASE_CONFIG.namespace.replace(/^\/+|\/+$/g, "") || "fishops";
const MAX_APP_ERROR_LOGS = 800;
const MAX_ACTIVITY_LOGS = 5000;
const ORDER_CHANNEL_SHOP = "shop_order";
const ORDER_CHANNEL_BILLING = "customer_bill";
const BILLING_CATEGORY_ALL = "__ALL__";

const DEFAULT_STORE = {
  data: {
    branches: [],
    users: [
      {
        id: "USR-MASTER-001",
        username: "HASINTHA0035",
        password: "g0irAbT6@",
        role: "master",
        branch_id: null,
        status: "active",
        photo: ""
      }
    ],
    fish_profiles: [],
    branch_fish_settings: [],
    daily_prices: [],
    daily_stock_entry: [],
    hold_stock_entry: [],
    shop_orders: [],
    customer_bills: [],
    app_error_logs: [],
    activity_logs: []
  },
  settings: {
    company_name: "RTX FishOps",
    logo_text: "RTx",
    company_logo: "",
    theme_primary: "#1e3a8a",
    theme_accent: "#0d9488",
    currency: "LKR",
    maintenance_mode: false,
    auto_backup_after_closing: false,
    auto_backup_location_label: ""
  }
};

const ROLE_PERMISSIONS = {
  master: [
    "view_dashboard",
    "manage_users_roles",
    "manage_theme_branding",
    "backup_send_server",
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
    "manage_hold_stock",
    "manage_shop_orders",
    "view_billing_progress",
    "enter_opening_stock",
    "enter_closing_stock",
    "enter_waste",
    "view_reports_today",
    "view_reports_full",
    "manage_branches",
    "manage_settings",
    "view_error_logs",
    "view_activity_logs"
  ],
  admin: [
    "view_dashboard",
    "backup_send_server",
    "backup_export",
    "view_all_branches",
    "switch_branch",
    "view_fish_profiles",
    "upsert_fish_profile",
    "set_branch_stock_levels",
    "set_daily_prices",
    "manage_hold_stock",
    "manage_shop_orders",
    "view_billing_progress",
    "enter_opening_stock",
    "enter_closing_stock",
    "enter_waste",
    "view_reports_today",
    "view_reports_full",
    "manage_branches"
  ],
  user: [
    "view_dashboard",
    "backup_send_server",
    "view_fish_profiles",
    "manage_hold_stock",
    "manage_shop_orders",
    "enter_opening_stock",
    "enter_closing_stock",
    "enter_waste",
    "view_reports_today"
  ]
};

const PAGES = [
  { id: "dashboard", title: "Branch Dashboard", permission: "view_dashboard" },
  { id: "users_roles", title: "Users & Roles", permission: "manage_users_roles" },
  { id: "fish_profiles", title: "Fish Profiles", permission: "view_fish_profiles" },
  { id: "branch_fish_settings", title: "Branch Fish Settings", permission: "set_branch_stock_levels" },
  { id: "daily_prices", title: "Daily Prices", permission: "set_daily_prices" },
  { id: "y_daily_prices", title: "Y- Daily Price", permission: "set_daily_prices" },
  { id: "hold_stock", title: "Hold Stock", permission: "manage_hold_stock" },
  { id: "shop_orders", title: "Shop Orders", permission: "manage_shop_orders" },
  { id: "shop_status", title: "Shop Status", permission: "manage_shop_orders" },
  { id: "billing", title: "Billing", permission: "manage_shop_orders" },
  { id: "billing_progress", title: "Billing Progress", permission: "view_billing_progress" },
  { id: "remaining_stock_holds", title: "Current Stocks & Holds", permission: "manage_hold_stock" },
  { id: "morning_opening_stock", title: "Morning Opening Stock", permission: "enter_opening_stock" },
  { id: "night_closing_stock", title: "Night Closing Stock", permission: "enter_closing_stock" },
  { id: "daily_summary", title: "Daily Summary", permission: "view_dashboard" },
  { id: "reports", title: "Reports", permission: "view_reports_today" },
  { id: "transfer_suggestions", title: "Transfer Suggestions", permission: "view_all_branches" },
  { id: "monthly_calculations", title: "Monthly Calculations", permission: "view_reports_full" },
  { id: "error_logs", title: "Error Logs", permission: "view_error_logs" },
  { id: "activity_logs", title: "Activity Logs", permission: "view_activity_logs" },
  { id: "about", title: "About", permission: "view_dashboard" },
  { id: "settings", title: "Settings", permission: "manage_branches" },
  { id: "delete_data", title: "Delete Data", permission: "delete_center" }
];

let DATA = null;
let dailyBackupDirectoryHandle = null;
let remoteStoreVersion = "";
let remoteStorePollTimerId = null;
let remoteStorePushTimerId = null;
let remoteStorePushInFlight = false;
let remoteSyncAvailable = false;
let storageQuotaTrimAlertShown = false;
let storageQuotaFailureAlertShown = false;
let clientErrorCaptureInstalled = false;

const clientErrorLogs = [];

function isRemoteSyncConfigured() {
  return FIREBASE_CONFIG.enabled && FIREBASE_CONFIG.databaseURL.length > 0;
}

function getRemoteSyncMissingConfigMessage() {
  return "Firebase sync is not configured. Update web/firebase-config.js and enable it.";
}

function buildFirebaseRemoteUrl(path = "") {
  const baseUrl = FIREBASE_CONFIG.databaseURL.replace(/\/+$/g, "");
  const cleanPath = String(path || "")
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "");
  const fullPath = cleanPath ? `${FIREBASE_NAMESPACE}/${cleanPath}` : FIREBASE_NAMESPACE;
  let url = `${baseUrl}/${fullPath}.json`;
  if (FIREBASE_CONFIG.authToken) {
    url += `?auth=${encodeURIComponent(FIREBASE_CONFIG.authToken)}`;
  }
  return url;
}

function normalizeRemoteStoreEnvelope(payload) {
  if (!payload || typeof payload !== "object") {
    return { store: null, updated_at: "" };
  }

  if (payload.store && typeof payload.store === "object") {
    return {
      store: payload.store,
      updated_at: String(payload.updated_at || "")
    };
  }

  if (payload.data && payload.settings) {
    return {
      store: payload,
      updated_at: String(payload.updated_at || "")
    };
  }

  return {
    store: null,
    updated_at: String(payload.updated_at || "")
  };
}

const state = {
  currentUser: null,
  branchId: "",
  date: isoDateToday(),
  monthlyViewMonth: isoDateToday().slice(0, 7),
  activePage: "dashboard",
  quickSearch: {
    fishProfiles: "",
    branchFishSettings: "",
    dailyPrices: "",
    yDailyPrices: "",
    transferSuggestions: "",
    errorLogs: "",
    activityLogs: "",
    holdStock: "",
    shopOrders: "",
    shopStatus: "",
    billing: "",
    remainingStocks: "",
    remainingHolds: "",
    morningOpeningStock: "",
    nightClosingStock: ""
  },
  shopOrderDraftBranchId: "",
  shopOrderDraftItems: [],
  billingDraftBranchId: "",
  billingDraftItems: [],
  billingDraftCategory: BILLING_CATEGORY_ALL,
  billingDraftSearch: "",
  billingDraftCustomerName: "",
  billingDraftInvoiceNo: "",
  billingDraftPaymentMethod: "cash",
  billingDraftPaymentTerms: "immediate",
  billingDraftAmountPaid: 0,
  billingDraftNotes: "",
  billingDraftRequests: "",
  billingRecentDetailsId: "",
  settings: {},
  deferredInstallPrompt: null
};

const ui = {
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  loginError: document.getElementById("loginError"),
  loginBrandMark: document.getElementById("loginBrandMark"),
  mainBrandMark: document.getElementById("mainBrandMark"),
  brandTitle: document.getElementById("brandTitle"),
  sessionAvatar: document.getElementById("sessionAvatar"),
  sessionUser: document.getElementById("sessionUser"),
  sessionRole: document.getElementById("sessionRole"),
  changePhotoBtn: document.getElementById("changePhotoBtn"),
  photoInput: document.getElementById("photoInput"),
  logoInput: document.getElementById("logoInput"),
  branchSelect: document.getElementById("branchSelect"),
  dateInput: document.getElementById("dateInput"),
  navMenu: document.getElementById("navMenu"),
  pageTitle: document.getElementById("pageTitle"),
  contextText: document.getElementById("contextText"),
  topbarActions: document.getElementById("topbarActions"),
  pageHost: document.getElementById("pageHost"),
  logoutBtn: document.getElementById("logoutBtn")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDefaultStore() {
  return clone(DEFAULT_STORE);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function nextBranchId() {
  const used = new Set(DATA.branches.map((branch) => String(branch.id || "").toUpperCase()));
  let max = 0;

  for (const branch of DATA.branches) {
    const match = String(branch.id || "").toUpperCase().match(/^BR-(\d+)$/);
    if (!match) {
      continue;
    }
    max = Math.max(max, Number(match[1]));
  }

  let next = max;
  while (true) {
    next += 1;
    const candidate = `BR-${String(next).padStart(3, "0")}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
}

function nextFishCode() {
  const used = new Set(
    DATA.fish_profiles.map((fish) => String(fish.fish_code || "").trim().toUpperCase())
  );
  let max = 0;

  for (const fish of DATA.fish_profiles) {
    const match = String(fish.fish_code || "")
      .trim()
      .toUpperCase()
      .match(/^F-(\d+)$/);
    if (!match) {
      continue;
    }
    max = Math.max(max, Number(match[1]));
  }

  let next = max;
  while (true) {
    next += 1;
    const candidate = `F-${String(next).padStart(4, "0")}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
}

function normalizeBranchId(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

function numberOr(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function truncateText(value, maxLength = 4000) {
  const text = String(value ?? "");
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

function getPageTitle(pageId) {
  const page = PAGES.find((item) => item.id === pageId);
  return page?.title || String(pageId || "Unknown");
}

function toLogText(value, maxLength = 1000) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return truncateText(value, maxLength);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return truncateText(JSON.stringify(value), maxLength);
  } catch {
    return truncateText(String(value), maxLength);
  }
}

function normalizeActivityLogEntry(rawEntry = {}) {
  const createdAtRaw = String(rawEntry.created_at || "").trim();
  const parsedTime = Date.parse(createdAtRaw);
  const createdAt = Number.isNaN(parsedTime) ? new Date().toISOString() : new Date(parsedTime).toISOString();
  const pageId = String(rawEntry.page_id || "").trim();
  const pageTitle = String(rawEntry.page_title || "").trim() || getPageTitle(pageId);

  return {
    id: String(rawEntry.id || makeId("ACT")),
    created_at: createdAt,
    username: toLogText(rawEntry.username || "", 120),
    role: toLogText(rawEntry.role || "", 60),
    category: toLogText(rawEntry.category || "data_change", 80),
    action: toLogText(rawEntry.action || "Saved changes", 280),
    page_id: pageId,
    page_title: toLogText(pageTitle, 160),
    branch_scope: toLogText(rawEntry.branch_scope || "", 120),
    date_scope: toLogText(rawEntry.date_scope || "", 40),
    details: toLogText(rawEntry.details || "", 1500)
  };
}

function addActivityLogEntry(activity = {}) {
  if (!state.currentUser) {
    return null;
  }
  if (!Array.isArray(DATA?.activity_logs)) {
    DATA.activity_logs = [];
  }

  const pageId = String(activity.pageId || state.activePage || "");
  const entry = normalizeActivityLogEntry({
    id: makeId("ACT"),
    created_at: new Date().toISOString(),
    username: state.currentUser.username || "",
    role: state.currentUser.role || "",
    category: activity.category || "data_change",
    action: activity.action || `Saved changes in ${getPageTitle(pageId)}`,
    page_id: pageId,
    page_title: getPageTitle(pageId),
    branch_scope:
      activity.branchScope === undefined ? getBranchScopeLabel(state.branchId) : activity.branchScope,
    date_scope: activity.dateScope === undefined ? state.date : activity.dateScope,
    details: activity.details || ""
  });

  DATA.activity_logs.unshift(entry);
  if (DATA.activity_logs.length > MAX_ACTIVITY_LOGS) {
    DATA.activity_logs.length = MAX_ACTIVITY_LOGS;
  }
  return entry;
}

function getActivityLogBucket(entry = {}) {
  const category = String(entry.category || "")
    .trim()
    .toLowerCase();
  const actionText = String(entry.action || "")
    .trim()
    .toLowerCase();

  if (
    category === "backup" ||
    /backup|import|restore|export|reload/.test(actionText)
  ) {
    return "backup_import";
  }
  if (
    category === "delete" ||
    /delete|wipe|remove|clear|purge/.test(actionText)
  ) {
    return "delete_wipe";
  }
  if (
    category === "data_change" ||
    /create|add|save|update|edit|set|toggle/.test(actionText)
  ) {
    return "create_update";
  }
  return "other";
}

function stringifyErrorReason(reason) {
  if (reason instanceof Error) {
    return {
      message: reason.message || String(reason),
      stack: String(reason.stack || "")
    };
  }

  if (typeof reason === "string") {
    return { message: reason, stack: "" };
  }

  try {
    return { message: JSON.stringify(reason), stack: "" };
  } catch {
    return { message: String(reason), stack: "" };
  }
}

function addClientErrorLog(details = {}) {
  const source = String(details.source || "").trim();
  const line = Number.isFinite(details.line) ? Math.trunc(Number(details.line)) : null;
  const column = Number.isFinite(details.column) ? Math.trunc(Number(details.column)) : null;
  const location = line === null ? source : `${source || "inline"}:${line}${column === null ? "" : `:${column}`}`;

  clientErrorLogs.unshift({
    id: makeId("ERR"),
    created_at: new Date().toISOString(),
    type: String(details.type || "runtime"),
    message: truncateText(details.message || "Unknown error", 2000),
    stack: truncateText(details.stack || "", 12000),
    source,
    line,
    column,
    location: truncateText(location, 300),
    page: String(state.activePage || ""),
    branch_id: String(state.branchId || ""),
    username: String(state.currentUser?.username || "")
  });

  if (clientErrorLogs.length > MAX_APP_ERROR_LOGS) {
    clientErrorLogs.length = MAX_APP_ERROR_LOGS;
  }
}

function installClientErrorCapture() {
  if (clientErrorCaptureInstalled) {
    return;
  }

  clientErrorCaptureInstalled = true;

  window.addEventListener("error", (event) => {
    const nativeError = event.error;
    addClientErrorLog({
      type: "window-error",
      message: nativeError?.message || event.message || "Unknown script error",
      stack: String(nativeError?.stack || ""),
      source: event.filename || "",
      line: event.lineno,
      column: event.colno
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = stringifyErrorReason(event.reason);
    addClientErrorLog({
      type: "unhandled-rejection",
      message: reason.message || "Unhandled promise rejection",
      stack: reason.stack || ""
    });
  });
}

function localIsoDateFromValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorActionLabel(type) {
  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType === "window-error") {
    return "Runtime Error";
  }
  if (normalizedType === "unhandled-rejection") {
    return "Promise Rejection";
  }
  return "Error";
}

function getErrorActionChipClass(type) {
  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType === "window-error") {
    return "critical";
  }
  if (normalizedType === "unhandled-rejection") {
    return "warning";
  }
  return "info";
}

function getInitials(value) {
  const parts = String(value ?? "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 1 && parts[0].length > 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts.map((part) => part[0].toUpperCase()).join("") || "RT";
}

function isoDateToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }
  const [year, month, day] = String(value).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() + 1 === month &&
    utc.getUTCDate() === day
  );
}

function isoDaysBetween(fromIso, toIso) {
  const [fromYear, fromMonth, fromDay] = fromIso.split("-").map(Number);
  const [toYear, toMonth, toDay] = toIso.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.floor((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

function normalizeIsoMonth(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}$/.test(text)) {
    return "";
  }
  const [year, month] = text.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return "";
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function getMonthDateRange(monthText) {
  const fallbackMonth = isoDateToday().slice(0, 7);
  const month = normalizeIsoMonth(monthText) || normalizeIsoMonth(fallbackMonth) || fallbackMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const startDate = `${String(year).padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}-01`;
  const nextMonthYear = monthNumber === 12 ? year + 1 : year;
  const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextMonthStartDate = `${String(nextMonthYear).padStart(4, "0")}-${String(nextMonthNumber).padStart(2, "0")}-01`;
  const endDate = shiftIsoDate(nextMonthStartDate, -1);
  const monthLabel = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  return { month, monthLabel, startDate, endDate };
}

function getMonthlyViewMonth() {
  const stateMonth = normalizeIsoMonth(state.monthlyViewMonth);
  if (stateMonth) {
    return stateMonth;
  }
  const fromDate = isIsoDate(state.date) ? state.date.slice(0, 7) : isoDateToday().slice(0, 7);
  return normalizeIsoMonth(fromDate) || isoDateToday().slice(0, 7);
}

function isWriteRestricted() {
  return false;
}

function ensureWriteAllowed() {
  return true;
}

function loadStore(overrideSnapshot = null) {
  const base = createDefaultStore();
  let parsed = null;

  if (overrideSnapshot && typeof overrideSnapshot === "object") {
    parsed = overrideSnapshot;
  } else if (LOCAL_STORE_PERSISTENCE_ENABLED) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) {
    DATA = base.data;
    state.settings = base.settings;
    return;
  }

  const parsedData = parsed?.data ?? {};
  const parsedShopOrders = Array.isArray(parsedData.shop_orders) ? parsedData.shop_orders : [];
  const parsedCustomerBills = Array.isArray(parsedData.customer_bills)
    ? parsedData.customer_bills
    : parsedShopOrders.filter((row) => isBillingRow(row));

  DATA = {
    branches: Array.isArray(parsedData.branches) ? parsedData.branches : base.data.branches,
    users: Array.isArray(parsedData.users) ? parsedData.users : base.data.users,
    fish_profiles: Array.isArray(parsedData.fish_profiles) ? parsedData.fish_profiles : base.data.fish_profiles,
    branch_fish_settings: Array.isArray(parsedData.branch_fish_settings)
      ? parsedData.branch_fish_settings
      : base.data.branch_fish_settings,
    daily_prices: Array.isArray(parsedData.daily_prices) ? parsedData.daily_prices : base.data.daily_prices,
    daily_stock_entry: Array.isArray(parsedData.daily_stock_entry)
      ? parsedData.daily_stock_entry
      : base.data.daily_stock_entry,
    hold_stock_entry: Array.isArray(parsedData.hold_stock_entry)
      ? parsedData.hold_stock_entry
      : base.data.hold_stock_entry,
    shop_orders: parsedShopOrders.filter((row) => isShopOrderRow(row)),
    customer_bills: parsedCustomerBills,
    app_error_logs: Array.isArray(parsedData.app_error_logs)
      ? parsedData.app_error_logs
      : base.data.app_error_logs,
    activity_logs: Array.isArray(parsedData.activity_logs)
      ? parsedData.activity_logs
      : base.data.activity_logs
  };

  state.settings = {
    ...base.settings,
    ...(parsed?.settings ?? {})
  };

  for (const branch of DATA.branches) {
    if (!branch.id) {
      branch.id = nextBranchId();
    }
    if (!branch.name) {
      branch.name = branch.id;
    }
    if (!branch.location) {
      branch.location = "-";
    }
    if (branch.status !== "active" && branch.status !== "inactive") {
      branch.status = "active";
    }
  }

  for (const user of DATA.users) {
    if (typeof user.photo !== "string") {
      user.photo = "";
    }
    if (!user.id) {
      user.id = makeId("USR");
    }
    user.branch_id = normalizeUserBranchScope(user.role, user.branch_id);
    user.hidden_page_ids = normalizeUserHiddenPageIds(user.role, user.hidden_page_ids, user.visible_page_ids);
    if (Object.prototype.hasOwnProperty.call(user, "visible_page_ids")) {
      delete user.visible_page_ids;
    }
  }

  for (const fish of DATA.fish_profiles) {
    if (!fish.id) {
      fish.id = makeId("FISH");
    }
    if (typeof fish.photo !== "string") {
      fish.photo = "";
    }
  }

  for (const row of DATA.branch_fish_settings) {
    if (!row.id) {
      row.id = makeId("SET");
    }
  }

  for (const row of DATA.daily_prices) {
    if (!row.id) {
      row.id = makeId("PRC");
    }
    if (typeof row.auto_price_from !== "string") {
      row.auto_price_from = "";
    }
    row.price_source = normalizePriceSource(row.price_source);
  }

  for (const row of DATA.daily_stock_entry) {
    if (!row.id) {
      row.id = makeId("STK");
    }
    if (typeof row.auto_opening_from !== "string") {
      row.auto_opening_from = "";
    }
  }

  for (const row of DATA.daily_stock_entry) {
    if (isIsoDate(row.auto_opening_from)) {
      continue;
    }

    const openingQty = Math.max(0, round2(numberOr(row.opening_qty, 0)));
    const purchaseQty = Math.max(0, round2(numberOr(row.purchase_qty, 0)));
    if (openingQty <= 0 || purchaseQty > 0 || !isIsoDate(row.date)) {
      continue;
    }

    const sourceDate = getYesterday(row.date);
    const sourceRow = DATA.daily_stock_entry.find(
      (entry) =>
        entry.branch_id === row.branch_id &&
        entry.date === sourceDate &&
        entry.fish_id === row.fish_id
    );
    if (!sourceRow) {
      continue;
    }

    const sourceClosing = Math.max(0, round2(numberOr(sourceRow.closing_qty, 0)));
    if (sourceClosing > 0 && sourceClosing === openingQty) {
      row.auto_opening_from = sourceDate;
    }
  }

  for (const row of DATA.hold_stock_entry) {
    if (!row.id) {
      row.id = makeId("HLD");
    }
    row.fish_count = Math.max(1, Math.round(numberOr(row.fish_count, 1)));
    row.full_qty_kg = Math.max(0, round2(numberOr(row.full_qty_kg, 0)));
    row.waste_qty_kg = Math.max(0, round2(numberOr(row.waste_qty_kg, 0)));
    if (row.waste_qty_kg > row.full_qty_kg) {
      row.waste_qty_kg = row.full_qty_kg;
    }
    row.total_cost_lkr = Math.max(0, round2(numberOr(row.total_cost_lkr, 0)));
    row.profit_margin_per_kg = Math.max(0, round2(numberOr(row.profit_margin_per_kg, 0)));

    const metrics = calculateHoldStockMetrics(
      row.full_qty_kg,
      row.waste_qty_kg,
      row.total_cost_lkr,
      row.profit_margin_per_kg
    );
    row.usable_qty_kg = metrics.usableQty;
    row.cost_per_kg = metrics.costPerKgLkr;
    row.sell_price_per_kg = metrics.sellPricePerKgLkr;

    const normalizedStatus = String(row.status || "").toLowerCase();
    if (normalizedStatus === "moved") {
      row.status = "moved";
    } else if (normalizedStatus === "cut") {
      row.status = "cut";
    } else if (normalizedStatus === "hold") {
      const hasCutData =
        row.waste_qty_kg > 0 || row.profit_margin_per_kg > 0 || numberOr(row.sell_price_per_kg, 0) > 0;
      row.status = hasCutData ? "cut" : "raw";
    } else {
      row.status = "raw";
    }
    if (typeof row.moved_to_date !== "string") {
      row.moved_to_date = "";
    }
  }

  for (const row of DATA.shop_orders) {
    if (!row.id) {
      row.id = makeId("ORD");
    }
    if (!isIsoDate(String(row.date || ""))) {
      row.date = isoDateToday();
    }
    if (typeof row.invoice_no !== "string") {
      row.invoice_no = "";
    }
    if (typeof row.shop_name !== "string") {
      row.shop_name = "";
    }
    if (typeof row.shop_status !== "string") {
      row.shop_status = "open";
    }
    row.shop_status = normalizeShopStatus(row.shop_status);
    if (typeof row.branch_id !== "string") {
      row.branch_id = "";
    }
    row.order_channel = normalizeOrderChannel(row.order_channel);
    if (typeof row.currency !== "string") {
      row.currency = state.settings.currency || "LKR";
    }
    if (typeof row.payment_method !== "string") {
      row.payment_method = "cash";
    }
    if (typeof row.payment_terms !== "string") {
      row.payment_terms = "immediate";
    }
    if (typeof row.notes !== "string") {
      row.notes = "";
    }
    if (typeof row.shop_requests !== "string") {
      row.shop_requests = "";
    }
    if (!Array.isArray(row.items)) {
      row.items = [];
    }
    row.items = row.items
      .map((item) => {
        const fishId = String(item?.fish_id || "");
        const fish = findFishById(fishId);
        const qtyKg = Math.max(0, round2(numberOr(item?.qty_kg, 0)));
        const specialPricePerKg = Math.max(0, round2(numberOr(item?.special_price_per_kg, 0)));
        const lineTotal = round2(qtyKg * specialPricePerKg);
        if (!fishId || qtyKg <= 0) {
          return null;
        }
        return {
          id: String(item?.id || makeId("ITM")),
          fish_id: fishId,
          fish_code: String(item?.fish_code || fish?.fish_code || fishId),
          fish_name: String(item?.fish_name || fish?.name || fishId),
          qty_kg: qtyKg,
          special_price_per_kg: specialPricePerKg,
          line_total: lineTotal
        };
      })
      .filter(Boolean);

    row.total_amount = round2(
      row.items.reduce((sum, item) => sum + round2(numberOr(item?.line_total, 0)), 0)
    );
    row.amount_paid = Math.max(0, round2(numberOr(row.amount_paid, 0)));
    row.balance_due = round2(Math.max(0, row.total_amount - row.amount_paid));
    if (row.amount_paid <= 0) {
      row.payment_status = "UNPAID";
    } else if (row.balance_due <= 0) {
      row.payment_status = "PAID";
    } else {
      row.payment_status = "PARTIAL";
    }
    if (typeof row.created_at !== "string") {
      row.created_at = new Date().toISOString();
    }
    if (typeof row.updated_at !== "string") {
      row.updated_at = row.created_at;
    }
  }

  for (const row of DATA.customer_bills) {
    if (!row.id) {
      row.id = makeId("BIL");
    }
    if (!isIsoDate(String(row.date || ""))) {
      row.date = isoDateToday();
    }
    if (typeof row.invoice_no !== "string") {
      row.invoice_no = "";
    }
    if (typeof row.shop_name !== "string") {
      row.shop_name = "";
    }
    if (typeof row.shop_status !== "string") {
      row.shop_status = "open";
    }
    row.shop_status = normalizeShopStatus(row.shop_status);
    if (typeof row.branch_id !== "string") {
      row.branch_id = "";
    }
    row.order_channel = ORDER_CHANNEL_BILLING;
    if (typeof row.currency !== "string") {
      row.currency = state.settings.currency || "LKR";
    }
    if (typeof row.payment_method !== "string") {
      row.payment_method = "cash";
    }
    if (typeof row.payment_terms !== "string") {
      row.payment_terms = "immediate";
    }
    if (typeof row.notes !== "string") {
      row.notes = "";
    }
    if (typeof row.shop_requests !== "string") {
      row.shop_requests = "";
    }
    if (typeof row.stock_applied !== "boolean") {
      row.stock_applied = false;
    }
    if (!Array.isArray(row.items)) {
      row.items = [];
    }
    row.items = row.items
      .map((item) => {
        const fishId = String(item?.fish_id || "");
        const fish = findFishById(fishId);
        const qtyKg = Math.max(0, round2(numberOr(item?.qty_kg, 0)));
        const specialPricePerKg = Math.max(0, round2(numberOr(item?.special_price_per_kg, 0)));
        const lineTotal = round2(qtyKg * specialPricePerKg);
        if (!fishId || qtyKg <= 0) {
          return null;
        }
        return {
          id: String(item?.id || makeId("ITM")),
          fish_id: fishId,
          fish_code: String(item?.fish_code || fish?.fish_code || fishId),
          fish_name: String(item?.fish_name || fish?.name || fishId),
          qty_kg: qtyKg,
          special_price_per_kg: specialPricePerKg,
          line_total: lineTotal
        };
      })
      .filter(Boolean);

    row.total_amount = round2(
      row.items.reduce((sum, item) => sum + round2(numberOr(item?.line_total, 0)), 0)
    );
    row.amount_paid = Math.max(0, round2(numberOr(row.amount_paid, 0)));
    row.balance_due = round2(Math.max(0, row.total_amount - row.amount_paid));
    if (row.amount_paid <= 0) {
      row.payment_status = "UNPAID";
    } else if (row.balance_due <= 0) {
      row.payment_status = "PAID";
    } else {
      row.payment_status = "PARTIAL";
    }
    if (typeof row.created_at !== "string") {
      row.created_at = new Date().toISOString();
    }
    if (typeof row.updated_at !== "string") {
      row.updated_at = row.created_at;
    }
  }

  for (const row of DATA.app_error_logs) {
    if (!row.id) {
      row.id = makeId("ERR");
    }
    if (typeof row.datetime !== "string") {
      row.datetime = new Date().toISOString();
    }
    if (typeof row.level !== "string") {
      row.level = "ERROR";
    }
    if (typeof row.message !== "string") {
      row.message = "Unknown error";
    }
    row.message = clampText(row.message, 600);
    if (typeof row.page !== "string") {
      row.page = "";
    }
    if (typeof row.branch_id !== "string") {
      row.branch_id = "";
    }
    if (typeof row.user_id !== "string") {
      row.user_id = "";
    }
    if (typeof row.user_role !== "string") {
      row.user_role = "";
    }
    if (typeof row.source !== "string") {
      row.source = "";
    }
    if (typeof row.stack !== "string") {
      row.stack = "";
    }
    row.stack = clampText(row.stack, 8000);
    if (typeof row.details !== "string") {
      row.details = "";
    }
    row.details = clampText(row.details, 2000);
    row.line = Number.isFinite(Number(row.line)) ? Number(row.line) : 0;
    row.column = Number.isFinite(Number(row.column)) ? Number(row.column) : 0;
  }

  for (const row of DATA.activity_logs) {
    if (!row.id) {
      row.id = makeId("ACT");
    }
    if (typeof row.datetime !== "string") {
      row.datetime = new Date().toISOString();
    }
    if (typeof row.action !== "string") {
      row.action = "UPDATE";
    }
    row.action = clampText(String(row.action || "UPDATE").toUpperCase(), 80);
    if (typeof row.summary !== "string") {
      row.summary = "";
    }
    row.summary = clampText(row.summary, 260);
    if (typeof row.details !== "string") {
      row.details = normalizeActivityDetails(row.details);
    }
    row.details = clampText(row.details, 2000);
    if (typeof row.page !== "string") {
      row.page = "";
    }
    if (typeof row.branch_id !== "string") {
      row.branch_id = "";
    }
    if (typeof row.user_id !== "string") {
      row.user_id = "";
    }
    if (typeof row.user_name !== "string") {
      row.user_name = "";
    }
    if (typeof row.user_role !== "string") {
      row.user_role = "";
    }
  }

  const movedHoldTotalsByStockKey = new Map();
  for (const row of DATA.hold_stock_entry) {
    if (String(row.status || "").toLowerCase() !== "moved") {
      continue;
    }

    const targetDate = isIsoDate(row.moved_to_date) ? row.moved_to_date : String(row.date || "");
    if (!targetDate) {
      continue;
    }

    const usableQty = Math.max(0, round2(numberOr(row.usable_qty_kg, 0)));
    const wasteQty = Math.max(0, round2(numberOr(row.waste_qty_kg, 0)));
    const fullQty = Math.max(0, round2(numberOr(row.full_qty_kg, 0)));
    const purchaseQty = Math.max(round2(usableQty + wasteQty), fullQty);
    const stockKey = `${row.branch_id}::${targetDate}::${row.fish_id}`;
    const existing = movedHoldTotalsByStockKey.get(stockKey) || {
      purchaseQty: 0,
      closingQty: 0,
      wasteQty: 0
    };

    existing.purchaseQty = round2(existing.purchaseQty + purchaseQty);
    existing.closingQty = round2(existing.closingQty + usableQty);
    existing.wasteQty = round2(existing.wasteQty + wasteQty);
    movedHoldTotalsByStockKey.set(stockKey, existing);
  }

  for (const [stockKey, totals] of movedHoldTotalsByStockKey.entries()) {
    const [branchId, dateText, fishId] = stockKey.split("::");
    if (!branchId || !dateText || !fishId) {
      continue;
    }

    const stockRow = DATA.daily_stock_entry.find(
      (entry) => entry.branch_id === branchId && entry.date === dateText && entry.fish_id === fishId
    );
    if (!stockRow) {
      continue;
    }

    const openingQty = Math.max(0, round2(numberOr(stockRow.opening_qty, 0)));
    const purchaseQty = Math.max(0, round2(numberOr(stockRow.purchase_qty, 0)));

    if (openingQty === 0 && purchaseQty === 0) {
      stockRow.purchase_qty = round2(totals.purchaseQty);
      stockRow.closing_qty = round2(totals.closingQty);
      stockRow.waste_qty = round2(totals.wasteQty);
    }
  }

  for (const stockRow of DATA.daily_stock_entry) {
    const sourceDate = String(stockRow.auto_opening_from || "");
    if (!isIsoDate(sourceDate) || numberOr(stockRow.opening_qty, 0) <= 0) {
      continue;
    }

    const hasNextDayMorningPrice = DATA.daily_prices.some(
      (row) =>
        row.branch_id === stockRow.branch_id &&
        row.date === stockRow.date &&
        row.fish_id === stockRow.fish_id &&
        normalizePriceSource(row.price_source) === "morning"
    );
    if (hasNextDayMorningPrice) {
      continue;
    }

    const sourcePrice = DATA.daily_prices.find(
      (row) =>
        row.branch_id === stockRow.branch_id &&
        row.date === sourceDate &&
        row.fish_id === stockRow.fish_id
    );
    if (!sourcePrice) {
      continue;
    }

    DATA.daily_prices.push({
      id: makeId("PRC"),
      date: stockRow.date,
      branch_id: stockRow.branch_id,
      fish_id: stockRow.fish_id,
      sell_price_per_unit: Math.round(numberOr(sourcePrice.sell_price_per_unit, 0)),
      cost_price_per_unit: Math.round(numberOr(sourcePrice.cost_price_per_unit, 0)),
      auto_price_from: sourceDate,
      price_source: "morning"
    });
  }

  if (!DATA.users.some((user) => user.role === "master")) {
    DATA.users.unshift(base.data.users[0]);
  }
}

function getCurrentStoreSnapshot() {
  return {
    data: DATA,
    settings: state.settings
  };
}

function isStorageQuotaError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const name = String(error.name || "");
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return true;
  }
  const message = String(error.message || "").toLowerCase();
  return message.includes("quota") || message.includes("exceeded");
}

function stripMediaFromStoreSnapshot(storeSnapshot) {
  const nextSnapshot = clone(storeSnapshot);
  let removedPhotoCount = 0;
  let removedLogo = false;

  if (Array.isArray(nextSnapshot?.data?.users)) {
    for (const user of nextSnapshot.data.users) {
      if (typeof user.photo === "string" && user.photo.length > 0) {
        user.photo = "";
        removedPhotoCount += 1;
      }
    }
  }

  if (
    nextSnapshot?.settings &&
    typeof nextSnapshot.settings.company_logo === "string" &&
    nextSnapshot.settings.company_logo.length > 0
  ) {
    nextSnapshot.settings.company_logo = "";
    removedLogo = true;
  }

  return { nextSnapshot, removedPhotoCount, removedLogo };
}

function showStorageTrimAlertOnce({ removedPhotoCount, removedLogo }) {
  if (storageQuotaTrimAlertShown) {
    return;
  }
  storageQuotaTrimAlertShown = true;

  const removedLabels = [];
  if (removedPhotoCount > 0) {
    removedLabels.push(`${removedPhotoCount} profile photo(s)`);
  }
  if (removedLogo) {
    removedLabels.push("company logo");
  }
  const removedText = removedLabels.length > 0 ? ` Removed: ${removedLabels.join(", ")}.` : "";
  alert(
    `Browser storage was full, so FishOps compacted media data to keep saving changes.${removedText}`
  );
}

function showStorageQuotaFailureAlertOnce() {
  if (storageQuotaFailureAlertShown) {
    return;
  }
  storageQuotaFailureAlertShown = true;
  alert(
    "Browser storage is full. Free browser site data or reduce records, then try saving again."
  );
}

function writeSnapshotToLocalStorage(storeSnapshot, options = {}) {
  if (!LOCAL_STORE_PERSISTENCE_ENABLED) {
    return {
      ok: true,
      savedSnapshot: storeSnapshot,
      mediaTrimmed: false
    };
  }

  const { notifyOnQuota = true } = options;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storeSnapshot));
    return {
      ok: true,
      savedSnapshot: storeSnapshot,
      mediaTrimmed: false
    };
  } catch (error) {
    if (!isStorageQuotaError(error)) {
      throw error;
    }

    const compacted = stripMediaFromStoreSnapshot(storeSnapshot);
    const canTrimMedia = compacted.removedPhotoCount > 0 || compacted.removedLogo;
    if (!canTrimMedia) {
      if (notifyOnQuota) {
        showStorageQuotaFailureAlertOnce();
      }
      return {
        ok: false,
        savedSnapshot: storeSnapshot,
        mediaTrimmed: false
      };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted.nextSnapshot));
      if (notifyOnQuota) {
        showStorageTrimAlertOnce(compacted);
      }
      return {
        ok: true,
        savedSnapshot: compacted.nextSnapshot,
        mediaTrimmed: true
      };
    } catch (retryError) {
      if (!isStorageQuotaError(retryError)) {
        throw retryError;
      }
      if (notifyOnQuota) {
        showStorageQuotaFailureAlertOnce();
      }
      return {
        ok: false,
        savedSnapshot: storeSnapshot,
        mediaTrimmed: false
      };
    }
  }
}

function syncRuntimeWithSavedSnapshot(savedSnapshot) {
  DATA = savedSnapshot.data;
  state.settings = savedSnapshot.settings;
  if (state.currentUser?.id) {
    const refreshedUser = DATA.users.find((user) => user.id === state.currentUser.id && user.status === "active");
    if (refreshedUser) {
      state.currentUser = refreshedUser;
    }
  }
}

function saveStore(options = {}) {
  if (options.logActivity !== false) {
    addActivityLogEntry({
      category: options.activityCategory || "data_change",
      action: options.activityAction || "",
      details: options.activityDetails || "",
      branchScope: options.activityBranchScope,
      dateScope: options.activityDateScope,
      pageId: options.activityPageId
    });
  }

  const persistResult = writeSnapshotToLocalStorage(getCurrentStoreSnapshot(), {
    notifyOnQuota: options.notifyOnQuota !== false
  });
  if (!persistResult.ok) {
    return false;
  }
  if (persistResult.mediaTrimmed) {
    syncRuntimeWithSavedSnapshot(persistResult.savedSnapshot);
    applyBranding();
  }
  if (options.syncRemote !== false) {
    scheduleRemoteStorePush();
  }
  return true;
}

function purgeStockDataIfNeeded() {
  if (localStorage.getItem(STOCK_DATA_PURGE_MARKER_KEY) === "done") {
    return false;
  }

  let changed = false;
  if (Array.isArray(DATA.daily_prices) && DATA.daily_prices.length > 0) {
    DATA.daily_prices = [];
    changed = true;
  }
  if (Array.isArray(DATA.daily_stock_entry) && DATA.daily_stock_entry.length > 0) {
    DATA.daily_stock_entry = [];
    changed = true;
  }
  if (Array.isArray(DATA.hold_stock_entry) && DATA.hold_stock_entry.length > 0) {
    DATA.hold_stock_entry = [];
    changed = true;
  }

  try {
    localStorage.setItem(STOCK_DATA_PURGE_MARKER_KEY, "done");
  } catch {
    // ignore marker write failures in storage-constrained browsers
  }
  return changed;
}

function readResponseJsonSafe(response) {
  return response
    .json()
    .catch(() => ({}));
}

async function uploadStoreSnapshot({
  showAlert = false,
  successMessage = "Backup sent to Firebase.",
  failureMessage = "Failed to send backup to Firebase"
} = {}) {
  if (!isRemoteSyncConfigured()) {
    remoteSyncAvailable = false;
    if (showAlert) {
      alert(getRemoteSyncMissingConfigMessage());
    }
    return false;
  }

  if (remoteStorePushInFlight) {
    return false;
  }

  remoteStorePushInFlight = true;
  try {
    const updatedAt = new Date().toISOString();
    const response = await fetch(buildFirebaseRemoteUrl(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        store: getCurrentStoreSnapshot(),
        updated_at: updatedAt
      })
    });
    const payload = await readResponseJsonSafe(response);
    if (!response.ok) {
      const detail = payload?.error ? ` ${payload.error}` : "";
      throw new Error(`${response.status}.${detail}`);
    }

    remoteSyncAvailable = true;
    remoteStoreVersion = updatedAt;

    if (showAlert) {
      alert(successMessage);
    }
    return true;
  } catch (error) {
    remoteSyncAvailable = false;
    if (showAlert) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      alert(`${failureMessage}. ${reason}`);
    }
    return false;
  } finally {
    remoteStorePushInFlight = false;
  }
}

async function flushScheduledRemoteStorePush() {
  if (remoteStorePushInFlight) {
    scheduleRemoteStorePush();
    return;
  }
  await uploadStoreSnapshot({ showAlert: false });
}

function scheduleRemoteStorePush() {
  if (remoteStorePushTimerId !== null) {
    clearTimeout(remoteStorePushTimerId);
  }
  remoteStorePushTimerId = window.setTimeout(() => {
    remoteStorePushTimerId = null;
    void flushScheduledRemoteStorePush();
  }, 800);
}

function refreshSessionFromCurrentData({ notifyOnLogout = false } = {}) {
  const previousUserId = state.currentUser?.id;
  if (!previousUserId) {
    return true;
  }

  const currentUser = DATA.users.find((user) => user.id === previousUserId && user.status === "active");
  if (!currentUser) {
    endSession();
    if (notifyOnLogout) {
      alert("Data updated from Firebase. Please log in again.");
    }
    return false;
  }

  state.currentUser = currentUser;
  populateBranchSelector();
  renderApp();
  return true;
}

function applyRemoteStorePayload(storePayload, options = {}) {
  const normalizedStore = normalizeImportedBackupPayload(storePayload);
  const persistResult = writeSnapshotToLocalStorage(normalizedStore, {
    notifyOnQuota: options.notifyOnQuota !== false
  });
  if (!persistResult.ok) {
    return false;
  }
  loadStore(persistResult.savedSnapshot);
  applyBranding();
  return refreshSessionFromCurrentData({
    notifyOnLogout: Boolean(options.notifyOnLogout)
  });
}

async function fetchRemoteStore() {
  if (!isRemoteSyncConfigured()) {
    throw new Error(getRemoteSyncMissingConfigMessage());
  }

  const response = await fetch(buildFirebaseRemoteUrl(), { cache: "no-store" });
  const payload = await readResponseJsonSafe(response);
  if (!response.ok) {
    const detail = payload?.error ? ` ${payload.error}` : "";
    throw new Error(`Unable to fetch Firebase store (${response.status}).${detail}`);
  }
  remoteSyncAvailable = true;
  return normalizeRemoteStoreEnvelope(payload);
}

async function reloadStoreFromServer(showAlert = false) {
  if (!isRemoteSyncConfigured()) {
    remoteSyncAvailable = false;
    if (showAlert) {
      alert(getRemoteSyncMissingConfigMessage());
    }
    return false;
  }

  try {
    const payload = await fetchRemoteStore();
    const nextStore = payload?.store;
    if (!nextStore || typeof nextStore !== "object") {
      if (showAlert) {
        alert("No Firebase backup found yet.");
      }
      return false;
    }

    if (payload?.updated_at) {
      remoteStoreVersion = String(payload.updated_at);
    }

    const sessionKept = applyRemoteStorePayload(nextStore, {
      notifyOnLogout: showAlert
    });
    if (!sessionKept) {
      return false;
    }

    if (showAlert) {
      saveStoreWithActivity("BACKUP_RELOAD_SERVER", "Reloaded latest backup from Firebase.", {
        details: { updatedAt: payload?.updated_at || "", source: "manual_reload_firebase" }
      });
      alert("Loaded latest backup from Firebase.");
    }
    return true;
  } catch (error) {
    remoteSyncAvailable = false;
    if (showAlert) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Reload failed. ${message}`);
    }
    return false;
  }
}

async function fetchRemoteStoreVersion() {
  if (!isRemoteSyncConfigured()) {
    remoteSyncAvailable = false;
    return "";
  }

  try {
    const response = await fetch(buildFirebaseRemoteUrl("updated_at"), { cache: "no-store" });
    const payload = await readResponseJsonSafe(response);
    if (!response.ok) {
      return "";
    }
    remoteSyncAvailable = true;
    if (payload === null || payload === undefined) {
      return "";
    }
    if (typeof payload === "string" || typeof payload === "number") {
      return String(payload);
    }
    if (typeof payload === "object") {
      return String(payload.updated_at || "");
    }
    return "";
  } catch {
    remoteSyncAvailable = false;
    return "";
  }
}

async function checkForRemoteStoreUpdate() {
  if (!isRemoteSyncConfigured() || !state.currentUser || document.visibilityState !== "visible") {
    return;
  }

  const latestVersion = await fetchRemoteStoreVersion();
  if (!latestVersion) {
    return;
  }

  if (!remoteStoreVersion) {
    remoteStoreVersion = latestVersion;
    return;
  }

  if (latestVersion === remoteStoreVersion) {
    return;
  }

  const previousVersion = remoteStoreVersion;
  const reloaded = await reloadStoreFromServer(false);
  if (reloaded && remoteStoreVersion === previousVersion) {
    remoteStoreVersion = latestVersion;
  }
}

function startRemoteStorePolling() {
  stopRemoteStorePolling();
  if (!isRemoteSyncConfigured()) {
    return;
  }
  remoteStorePollTimerId = window.setInterval(() => {
    void checkForRemoteStoreUpdate();
  }, REMOTE_STORE_POLL_INTERVAL_MS);
}

function stopRemoteStorePolling() {
  if (remoteStorePollTimerId !== null) {
    clearInterval(remoteStorePollTimerId);
    remoteStorePollTimerId = null;
  }
}

async function sendBackupToServer() {
  if (!state.currentUser || !hasPermission(state.currentUser, "backup_send_server")) {
    return;
  }

  const sent = await uploadStoreSnapshot({
    showAlert: true,
    successMessage: "Backup sent and saved in Firebase."
  });
  if (sent) {
    saveStoreWithActivity("BACKUP_SEND_SERVER", "Sent backup to Firebase.", {
      details: { source: "firebase" }
    });
  }
}

function getRolePermissions(role) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  if (normalizedRole === "master") {
    return [...new Set(PAGES.map((page) => page.permission).filter(Boolean))];
  }
  return Array.isArray(ROLE_PERMISSIONS[normalizedRole]) ? ROLE_PERMISSIONS[normalizedRole] : [];
}

function getRoleVisiblePageIds(role) {
  const permissionSet = new Set(getRolePermissions(role));
  return PAGES.filter((page) => permissionSet.has(page.permission)).map((page) => page.id);
}

function normalizeUserHiddenPageIds(role, value, fallbackVisiblePageIds = null) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  if (normalizedRole === "master") {
    return [];
  }

  const rolePageIds = getRoleVisiblePageIds(normalizedRole);
  const rolePageSet = new Set(rolePageIds);
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item || "").trim()).filter((item) => rolePageSet.has(item)))];
  }

  if (Array.isArray(fallbackVisiblePageIds)) {
    const visibleSet = new Set(
      fallbackVisiblePageIds
        .map((item) => String(item || "").trim())
        .filter((item) => rolePageSet.has(item))
    );
    return rolePageIds.filter((pageId) => !visibleSet.has(pageId));
  }

  return [];
}

function getUserHiddenPageIds(user) {
  if (!user) {
    return [];
  }
  return normalizeUserHiddenPageIds(user.role, user.hidden_page_ids, user.visible_page_ids);
}

function hasPermission(user, permission) {
  if (!user) {
    return false;
  }
  if (user.role === "master") {
    return true;
  }
  return getRolePermissions(user.role).includes(permission);
}

function normalizeUserBranchScope(role, branchId) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  const normalizedBranchId = String(branchId ?? "").trim();

  if (normalizedRole === "master") {
    return null;
  }
  if (normalizedRole === "admin" && !normalizedBranchId) {
    return null;
  }
  return normalizedBranchId || null;
}

function isGlobalAdminUser(user) {
  return user?.role === "admin" && !String(user?.branch_id ?? "").trim();
}

function canAccessPage(user, page) {
  if (!user || !page || !hasPermission(user, page.permission)) {
    return false;
  }
  if (page.id === "y_daily_prices" && user.role !== "master") {
    return false;
  }
  if (page.id === "activity_logs" && user.role !== "master") {
    return false;
  }
  return true;
}

function getVisiblePages(user) {
  const hiddenSet = new Set(getUserHiddenPageIds(user));
  return PAGES.filter((page) => hasPermission(user, page.permission) && !hiddenSet.has(page.id));
}

function canSelectAllBranches(user) {
  return Boolean(user) && hasPermission(user, "view_all_branches");
}

function isAllBranchesValue(value) {
  return String(value || "") === ALL_BRANCH_OPTION_VALUE;
}

function isAllBranchesSelected() {
  return canSelectAllBranches(state.currentUser) && isAllBranchesValue(state.branchId);
}

function getBranchScopeIds(branchId, user = state.currentUser) {
  if (isAllBranchesValue(branchId) && canSelectAllBranches(user)) {
    return getAccessibleBranches(user).map((branch) => branch.id);
  }
  return branchId ? [branchId] : [];
}

function getBranchScopeLabel(branchId) {
  if (isAllBranchesValue(branchId)) {
    return ALL_BRANCH_OPTION_LABEL;
  }
  const branch = findBranchById(branchId);
  return branch ? branch.name : branchId;
}

function getAccessibleBranches(user) {
  const activeBranches = DATA.branches.filter((branch) => branch.status === "active");
  if (hasPermission(user, "view_all_branches")) {
    return activeBranches;
  }
  const scopedBranchId = normalizeUserBranchScope(user.role, user.branch_id);
  return activeBranches.filter((branch) => branch.id === scopedBranchId);
}

function findBranchById(branchId) {
  return DATA.branches.find((branch) => branch.id === branchId);
}

function getBranchUsage(branchId) {
  return {
    users: DATA.users.filter((user) => user.branch_id === branchId).length,
    settings: DATA.branch_fish_settings.filter((row) => row.branch_id === branchId).length,
    prices: DATA.daily_prices.filter((row) => row.branch_id === branchId).length,
    stock: DATA.daily_stock_entry.filter((row) => row.branch_id === branchId).length,
    hold: DATA.hold_stock_entry.filter((row) => row.branch_id === branchId).length,
    orders: DATA.shop_orders.filter((row) => row.branch_id === branchId).length,
    bills: DATA.customer_bills.filter((row) => row.branch_id === branchId).length
  };
}

function normalizeErrorMessage(value) {
  if (value instanceof Error) {
    return String(value.message || value.name || "Unknown error");
  }
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "Unknown error";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeActivityDetails(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return clampText(value, 2000);
  }
  try {
    return clampText(JSON.stringify(value), 2000);
  } catch {
    return clampText(String(value), 2000);
  }
}

function clampText(value, maxLength = 2000) {
  const text = String(value || "");
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)} ...[truncated]`;
}

function normalizeErrorStack(value) {
  if (value instanceof Error && typeof value.stack === "string") {
    return clampText(value.stack, 8000);
  }
  return "";
}

function errorSeverityChip(levelText) {
  const level = String(levelText || "ERROR").toUpperCase();
  if (level === "PROMISE") {
    return "warning";
  }
  if (level === "INFO") {
    return "info";
  }
  return "critical";
}

function activityActionChip(actionText) {
  const action = String(actionText || "").toUpperCase();
  if (action.includes("DELETE") || action.includes("WIPE")) {
    return "critical";
  }
  if (action.includes("BACKUP") || action.includes("IMPORT") || action.includes("RESTORE")) {
    return "info";
  }
  if (
    action.includes("UPDATE") ||
    action.includes("EDIT") ||
    action.includes("SAVE") ||
    action.includes("SET")
  ) {
    return "warning";
  }
  return "ok";
}

function recordActivity(action, summary = "", options = {}) {
  try {
    if (!DATA) {
      return null;
    }
    if (!Array.isArray(DATA.activity_logs)) {
      DATA.activity_logs = [];
    }

    const actor = options.user || state.currentUser || null;
    const entry = {
      id: makeId("ACT"),
      datetime: new Date().toISOString(),
      action: clampText(String(action || "UPDATE").toUpperCase(), 80),
      summary: clampText(String(summary || ""), 260),
      details: normalizeActivityDetails(options.details),
      page: String(options.page || state.activePage || ""),
      branch_id: String(options.branchId ?? state.branchId ?? ""),
      user_id: String(actor?.id || ""),
      user_name: String(actor?.username || ""),
      user_role: String(actor?.role || "")
    };

    DATA.activity_logs.unshift(entry);
    if (DATA.activity_logs.length > MAX_ACTIVITY_LOGS) {
      DATA.activity_logs.splice(MAX_ACTIVITY_LOGS);
    }

    return entry;
  } catch {
    return null;
  }
}

function saveStoreWithActivity(action, summary, options = {}) {
  recordActivity(action, summary, options);
  return saveStore(options.saveOptions || {});
}

function captureAppError(error, context = {}) {
  try {
    if (!DATA || !Array.isArray(DATA.app_error_logs)) {
      return;
    }

    const message = clampText(normalizeErrorMessage(error).trim() || "Unknown error", 600);
    const lowMsg = message.toLowerCase();
    if (lowMsg.includes("resizeobserver loop limit exceeded")) {
      return;
    }
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }

    const level = String(context.level || "ERROR").toUpperCase();
    const source = String(context.source || "");
    const line = Number.isFinite(Number(context.line)) ? Number(context.line) : 0;
    const column = Number.isFinite(Number(context.column)) ? Number(context.column) : 0;
    const details = context.details
      ? clampText(normalizeErrorMessage(context.details), 2000)
      : "";

    const entry = {
      id: makeId("ERR"),
      datetime: new Date().toISOString(),
      level,
      message,
      stack: normalizeErrorStack(error),
      page: String(state.activePage || ""),
      branch_id: String(state.branchId || ""),
      user_id: String(state.currentUser?.id || ""),
      user_role: String(state.currentUser?.role || ""),
      source,
      line,
      column,
      details
    };

    DATA.app_error_logs.unshift(entry);
    if (DATA.app_error_logs.length > MAX_APP_ERROR_LOGS) {
      DATA.app_error_logs.splice(MAX_APP_ERROR_LOGS);
    }

    saveStore({ syncRemote: false, notifyOnQuota: false });
  } catch {
    // Never throw from error capture.
  }
}

function findFishById(fishId) {
  return DATA.fish_profiles.find((fish) => fish.id === fishId);
}

function findFishByCodeOrName(queryText) {
  const query = String(queryText || "").trim().toLowerCase();
  if (!query) {
    return null;
  }

  return (
    DATA.fish_profiles.find((fish) => String(fish.fish_code || "").toLowerCase() === query) ||
    DATA.fish_profiles.find((fish) => String(fish.name || "").toLowerCase() === query) ||
    DATA.fish_profiles.find(
      (fish) =>
        String(fish.fish_code || "").toLowerCase().includes(query) ||
        String(fish.name || "").toLowerCase().includes(query)
    ) ||
    null
  );
}

function fishSearchText(fish, fallbackValue = "") {
  return [fish?.fish_code, fish?.name, fallbackValue]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function fishDisplayLabel(fish, fallbackValue = "") {
  const name = String(fish?.name || fallbackValue || "").trim();
  const code = String(fish?.fish_code || fallbackValue || "").trim();

  if (!name) {
    return code || "-";
  }
  if (!code || code === name) {
    return name;
  }
  return `${name} (${code})`;
}

function normalizeSearchTokens(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function bindFishQuickSearch(inputId, tbodyId, emptyRowId, stateKey) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tbodyId);
  if (!input || !tbody) {
    return;
  }

  const rows = Array.from(tbody.querySelectorAll("tr[data-fish-search]"));
  if (!rows.length) {
    return;
  }

  const emptyRow = emptyRowId ? document.getElementById(emptyRowId) : null;
  const applySearch = () => {
    const query = String(input.value || "");
    if (stateKey && state.quickSearch[stateKey] !== undefined) {
      state.quickSearch[stateKey] = query;
    }

    const tokens = normalizeSearchTokens(query);
    let visibleRows = 0;

    for (const row of rows) {
      const rowSearchText = String(row.getAttribute("data-fish-search") || "");
      const match = tokens.every((token) => rowSearchText.includes(token));
      row.classList.toggle("hidden", !match);
      if (match) {
        visibleRows += 1;
      }
    }

    if (emptyRow) {
      emptyRow.classList.toggle("hidden", visibleRows !== 0);
    }
  };

  input.addEventListener("input", applySearch);
  input.addEventListener("search", applySearch);
  applySearch();
}

function findUserById(userId) {
  return DATA.users.find((user) => user.id === userId);
}

function money(amount) {
  return `${state.settings.currency} ${Math.round(amount).toLocaleString()}`;
}

function soldQty(entry) {
  return round2(
    (entry.opening_qty || 0) +
      (entry.purchase_qty || 0) -
      (entry.closing_qty || 0) -
      (entry.waste_qty || 0)
  );
}

function stockAlert(closing, min, target) {
  if (closing < min) {
    return "CRITICAL";
  }
  if (closing < target) {
    return "LOW";
  }
  return "OK";
}

function isStockRowUntouchedForAutoCarry(row) {
  return (
    numberOr(row?.purchase_qty, 0) === 0 &&
    numberOr(row?.closing_qty, 0) === 0 &&
    numberOr(row?.waste_qty, 0) === 0
  );
}

function calculateHoldStockMetrics(fullKg, wasteKg, totalCost, profitMarginPerKg) {
  const fullQty = Math.max(0, round2(numberOr(fullKg, 0)));
  const wasteQty = Math.max(0, round2(numberOr(wasteKg, 0)));
  const usableQty = Math.max(0, round2(fullQty - wasteQty));
  const totalCostLkr = Math.max(0, round2(numberOr(totalCost, 0)));
  const marginPerKgLkr = Math.max(0, round2(numberOr(profitMarginPerKg, 0)));
  const totalProfitLkr = round2(fullQty * marginPerKgLkr);
  const costPerKgLkr = usableQty > 0 ? Math.round(totalCostLkr / usableQty) : 0;
  const sellPricePerKgLkr =
    usableQty > 0 ? Math.round((totalCostLkr + totalProfitLkr) / usableQty) : 0;

  return {
    fullQty,
    wasteQty,
    usableQty,
    totalCostLkr,
    marginPerKgLkr,
    costPerKgLkr,
    sellPricePerKgLkr
  };
}

function shiftIsoDate(dateText, deltaDays) {
  if (!isIsoDate(dateText)) {
    return String(dateText || "");
  }
  const [year, month, day] = String(dateText).split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(shifted.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getYesterday(dateText) {
  return shiftIsoDate(dateText, -1);
}

function getTomorrow(dateText) {
  return shiftIsoDate(dateText, 1);
}

function normalizePriceSource(value) {
  const source = String(value || "").trim().toLowerCase();
  return source === "hold" ? "hold" : "morning";
}

function getStockEntry(branchId, dateText, fishId) {
  return DATA.daily_stock_entry.find(
    (entry) =>
      entry.branch_id === branchId && entry.date === dateText && entry.fish_id === fishId
  );
}

function upsertStockEntry(branchId, dateText, fishId, patch) {
  if (!ensureWriteAllowed()) {
    return null;
  }

  let row = getStockEntry(branchId, dateText, fishId);
  if (!row) {
    row = {
      id: makeId("STK"),
      date: dateText,
      branch_id: branchId,
      fish_id: fishId,
      opening_qty: 0,
      purchase_qty: 0,
      closing_qty: 0,
      waste_qty: 0
    };
    DATA.daily_stock_entry.push(row);
  }

  Object.assign(row, patch);
  return row;
}

function autoCarryClosingToNextDay(branchId, sourceDate) {
  if (!branchId || isAllBranchesValue(branchId) || isWriteRestricted()) {
    return { nextDate: getTomorrow(sourceDate), movedCount: 0 };
  }

  const nextDate = getTomorrow(sourceDate);
  const sourceRows = DATA.daily_stock_entry.filter(
    (entry) => entry.branch_id === branchId && entry.date === sourceDate
  );

  let movedCount = 0;
  for (const source of sourceRows) {
    const closingQty = Math.max(0, round2(numberOr(source.closing_qty, 0)));
    const nextRow = getStockEntry(branchId, nextDate, source.fish_id);
    let carried = false;

    if (!nextRow) {
      DATA.daily_stock_entry.push({
        id: makeId("STK"),
        date: nextDate,
        branch_id: branchId,
        fish_id: source.fish_id,
        opening_qty: closingQty,
        purchase_qty: 0,
        closing_qty: 0,
        waste_qty: 0,
        auto_opening_from: sourceDate
      });
      movedCount += 1;
      carried = true;
    } else {
      const autoSource = String(nextRow.auto_opening_from || "");
      const canAutoUpdate =
        autoSource === sourceDate ||
        (numberOr(nextRow.opening_qty, 0) === 0 && isStockRowUntouchedForAutoCarry(nextRow));

      if (!canAutoUpdate) {
        continue;
      }

      nextRow.opening_qty = closingQty;
      nextRow.auto_opening_from = sourceDate;
      movedCount += 1;
      carried = true;
    }

    if (!carried || closingQty <= 0) {
      continue;
    }

    const sourcePrice = getDailyPrice(branchId, sourceDate, source.fish_id);
    if (!sourcePrice) {
      continue;
    }

    const nextPrice = getDailyPrice(branchId, nextDate, source.fish_id, "morning");
    const nextAutoSource = String(nextPrice?.auto_price_from || "");
    const nextHasNoValues =
      numberOr(nextPrice?.sell_price_per_unit, 0) === 0 &&
      numberOr(nextPrice?.cost_price_per_unit, 0) === 0;
    const canAutoPriceUpdate =
      !nextPrice || nextAutoSource === sourceDate || (nextAutoSource === "" && nextHasNoValues);

    if (!canAutoPriceUpdate) {
      continue;
    }

    upsertDailyPrice(
      branchId,
      nextDate,
      source.fish_id,
      Math.round(numberOr(sourcePrice.sell_price_per_unit, 0)),
      Math.round(numberOr(sourcePrice.cost_price_per_unit, 0)),
      { auto_price_from: sourceDate, price_source: "morning" }
    );
  }

  return { nextDate, movedCount };
}

function getDailyPrice(branchId, dateText, fishId, source = "") {
  const rows = DATA.daily_prices.filter(
    (row) => row.branch_id === branchId && row.date === dateText && row.fish_id === fishId
  );
  if (rows.length === 0) {
    return null;
  }

  const normalizedSource = normalizePriceSource(source);
  if (source) {
    return rows.find((row) => normalizePriceSource(row.price_source) === normalizedSource) || null;
  }

  return (
    rows.find((row) => normalizePriceSource(row.price_source) === "morning") ||
    rows.find((row) => normalizePriceSource(row.price_source) === "hold") ||
    rows[0] ||
    null
  );
}

function upsertDailyPrice(branchId, dateText, fishId, sellPrice, costPrice, options = {}) {
  if (!ensureWriteAllowed()) {
    return null;
  }

  const hasAutoSource = Object.prototype.hasOwnProperty.call(options, "auto_price_from");
  const autoPriceFrom = hasAutoSource ? String(options.auto_price_from || "") : undefined;
  const priceSource = normalizePriceSource(options.price_source);
  let row = getDailyPrice(branchId, dateText, fishId, priceSource);
  if (!row) {
    row = {
      id: makeId("PRC"),
      date: dateText,
      branch_id: branchId,
      fish_id: fishId,
      sell_price_per_unit: sellPrice,
      cost_price_per_unit: costPrice,
      auto_price_from: autoPriceFrom === undefined ? "" : autoPriceFrom,
      price_source: priceSource
    };
    DATA.daily_prices.push(row);
  } else {
    row.sell_price_per_unit = sellPrice;
    row.cost_price_per_unit = costPrice;
    row.price_source = priceSource;
    if (autoPriceFrom !== undefined) {
      row.auto_price_from = autoPriceFrom;
    }
  }

  return row;
}

function moveHoldEntryToOperationalStock(entry) {
  if (!entry) {
    return "";
  }
  const status = String(entry.status || "").toLowerCase();
  if (status !== "cut") {
    return "";
  }

  const usableQty = Math.max(0, round2(numberOr(entry.usable_qty_kg, 0)));
  const wasteQty = Math.max(0, round2(numberOr(entry.waste_qty_kg, 0)));
  const fullQty = Math.max(0, round2(numberOr(entry.full_qty_kg, 0)));
  const purchaseQtyToAdd = Math.max(round2(usableQty + wasteQty), fullQty);
  if (usableQty <= 0) {
    return "";
  }

  const targetDate = isIsoDate(state.date) ? state.date : entry.date;
  if (!targetDate) {
    return "";
  }

  const stockRow = getStockEntry(entry.branch_id, targetDate, entry.fish_id);
  const currentOpening = numberOr(stockRow?.opening_qty, 0);
  const currentPurchase = numberOr(stockRow?.purchase_qty, 0);
  const currentClosing = numberOr(stockRow?.closing_qty, 0);
  const currentWaste = numberOr(stockRow?.waste_qty, 0);
  const shouldResetStaleCurrent =
    currentOpening === 0 && currentPurchase === 0 && (currentClosing > 0 || currentWaste > 0);

  const nextPurchase = shouldResetStaleCurrent
    ? purchaseQtyToAdd
    : round2(currentPurchase + purchaseQtyToAdd);
  const nextClosing = shouldResetStaleCurrent ? usableQty : round2(currentClosing + usableQty);
  const nextWaste = shouldResetStaleCurrent ? wasteQty : round2(currentWaste + wasteQty);

  upsertStockEntry(entry.branch_id, targetDate, entry.fish_id, {
    purchase_qty: nextPurchase,
    closing_qty: nextClosing,
    waste_qty: nextWaste
  });

  upsertDailyPrice(
    entry.branch_id,
    targetDate,
    entry.fish_id,
    Math.round(numberOr(entry.sell_price_per_kg, 0)),
    Math.round(numberOr(entry.cost_per_kg, 0)),
    { auto_price_from: "", price_source: "hold" }
  );

  entry.status = "moved";
  entry.moved_at = new Date().toISOString();
  entry.moved_to_date = targetDate;
  return targetDate;
}

function getBranchSetting(branchId, fishId) {
  return DATA.branch_fish_settings.find(
    (row) => row.branch_id === branchId && row.fish_id === fishId
  );
}

function upsertBranchSetting(branchId, fishId, minStock, targetStock, isActive) {
  if (!ensureWriteAllowed()) {
    return null;
  }

  let row = getBranchSetting(branchId, fishId);
  if (!row) {
    row = {
      id: makeId("SET"),
      branch_id: branchId,
      fish_id: fishId,
      min_stock: minStock,
      target_stock: targetStock,
      is_active: isActive
    };
    DATA.branch_fish_settings.push(row);
  } else {
    row.min_stock = minStock;
    row.target_stock = targetStock;
    row.is_active = isActive;
  }
}

function normalizeOrderChannel(value) {
  const channel = String(value || "")
    .trim()
    .toLowerCase();
  if (channel === ORDER_CHANNEL_BILLING) {
    return ORDER_CHANNEL_BILLING;
  }
  return ORDER_CHANNEL_SHOP;
}

function isShopOrderRow(row) {
  return normalizeOrderChannel(row?.order_channel) === ORDER_CHANNEL_SHOP;
}

function isBillingRow(row) {
  return normalizeOrderChannel(row?.order_channel) === ORDER_CHANNEL_BILLING;
}

function normalizePaymentMethod(value) {
  const method = String(value || "")
    .trim()
    .toLowerCase();
  if (["cash", "bank", "card", "online", "credit"].includes(method)) {
    return method;
  }
  return "cash";
}

function normalizePaymentTerms(value) {
  const terms = String(value || "")
    .trim()
    .toLowerCase();
  if (["immediate", "7_days", "15_days", "month_end"].includes(terms)) {
    return terms;
  }
  return "immediate";
}

function normalizeShopStatus(value) {
  const status = String(value || "")
    .trim()
    .toLowerCase();
  if (status === "closed") {
    return "closed";
  }
  return "open";
}

function shopStatusLabel(value) {
  return normalizeShopStatus(value) === "closed" ? "CLOSED" : "OPEN";
}

function resolvePaymentStatus(totalAmount, amountPaid) {
  const total = Math.max(0, round2(numberOr(totalAmount, 0)));
  const paid = Math.max(0, round2(numberOr(amountPaid, 0)));
  if (paid <= 0) {
    return "UNPAID";
  }
  if (paid >= total) {
    return "PAID";
  }
  return "PARTIAL";
}

function rebuildShopOrderFinancials(order) {
  const safeItems = Array.isArray(order.items) ? order.items : [];
  let totalAmount = 0;
  for (const item of safeItems) {
    const qtyKg = Math.max(0, round2(numberOr(item.qty_kg, 0)));
    const pricePerKg = Math.max(0, round2(numberOr(item.special_price_per_kg, 0)));
    item.qty_kg = qtyKg;
    item.special_price_per_kg = pricePerKg;
    item.line_total = round2(qtyKg * pricePerKg);
    totalAmount = round2(totalAmount + item.line_total);
  }

  order.total_amount = totalAmount;
  order.amount_paid = Math.max(0, round2(numberOr(order.amount_paid, 0)));
  order.balance_due = round2(Math.max(0, totalAmount - order.amount_paid));
  order.payment_status = resolvePaymentStatus(totalAmount, order.amount_paid);
  order.payment_method = normalizePaymentMethod(order.payment_method);
  order.payment_terms = normalizePaymentTerms(order.payment_terms);
  order.updated_at = new Date().toISOString();
  return order;
}

function nextShopInvoiceNo(dateText, branchId) {
  const normalizedDate = isIsoDate(dateText) ? dateText : isoDateToday();
  const dateToken = normalizedDate.replaceAll("-", "");
  const branchToken = sanitizeFileNameToken(branchId || "ALL", "ALL");
  const prefix = `INV-${branchToken}-${dateToken}-`;

  let max = 0;
  for (const row of DATA.shop_orders) {
    if (!isShopOrderRow(row)) {
      continue;
    }
    const invoiceNo = String(row.invoice_no || "").toUpperCase();
    if (!invoiceNo.startsWith(prefix.toUpperCase())) {
      continue;
    }
    const suffix = invoiceNo.slice(prefix.length);
    const value = Number(suffix);
    if (Number.isInteger(value)) {
      max = Math.max(max, value);
    }
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function nextCustomerBillNo(dateText, branchId) {
  const normalizedDate = isIsoDate(dateText) ? dateText : isoDateToday();
  const dateToken = normalizedDate.replaceAll("-", "");
  const branchToken = sanitizeFileNameToken(branchId || "ALL", "ALL");
  const prefix = `BILL-${branchToken}-${dateToken}-`;

  let max = 0;
  for (const row of DATA.customer_bills) {
    const invoiceNo = String(row.invoice_no || "").toUpperCase();
    if (!invoiceNo.startsWith(prefix.toUpperCase())) {
      continue;
    }
    const suffix = invoiceNo.slice(prefix.length);
    const value = Number(suffix);
    if (Number.isInteger(value)) {
      max = Math.max(max, value);
    }
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function nextBillingCustomerId(dateText, branchId) {
  const normalizedDate = isIsoDate(dateText) ? dateText : isoDateToday();
  const dateToken = normalizedDate.replaceAll("-", "");
  const branchToken = sanitizeFileNameToken(branchId || "ALL", "ALL");
  const prefix = `CUS-${branchToken}-${dateToken}-`;

  let max = 0;
  for (const row of DATA.customer_bills) {
    const customerId = String(row.shop_name || "").toUpperCase();
    if (!customerId.startsWith(prefix.toUpperCase())) {
      continue;
    }
    const suffix = customerId.slice(prefix.length);
    const value = Number(suffix);
    if (Number.isInteger(value)) {
      max = Math.max(max, value);
    }
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function paymentMethodLabel(value) {
  switch (normalizePaymentMethod(value)) {
    case "bank":
      return "BANK";
    case "card":
      return "CARD";
    case "online":
      return "ONLINE";
    case "credit":
      return "CREDIT";
    default:
      return "CASH";
  }
}

function paymentTermsLabel(value) {
  switch (normalizePaymentTerms(value)) {
    case "7_days":
      return "7 DAYS";
    case "15_days":
      return "15 DAYS";
    case "month_end":
      return "MONTH END";
    default:
      return "IMMEDIATE";
  }
}

function createShopOrderItemFromInput(fish, qtyKgValue, specialPriceValue) {
  const qtyKg = Math.max(0, round2(numberOr(qtyKgValue, 0)));
  const specialPricePerKg = Math.max(0, round2(numberOr(specialPriceValue, 0)));
  if (qtyKg <= 0 || specialPricePerKg <= 0) {
    return null;
  }
  return {
    id: makeId("ITM"),
    fish_id: fish.id,
    fish_code: String(fish.fish_code || fish.id),
    fish_name: String(fish.name || fish.id),
    qty_kg: qtyKg,
    special_price_per_kg: specialPricePerKg,
    line_total: round2(qtyKg * specialPricePerKg)
  };
}

function getBillingAvailableStockKg(branchId, dateText, fishId) {
  if (!branchId || !fishId) {
    return 0;
  }
  const stockRow = getStockEntry(branchId, dateText, fishId);
  return Math.max(0, round2(numberOr(stockRow?.closing_qty, 0)));
}

function applyBillingStockUpdate(order, direction = "decrease") {
  if (!order || !Array.isArray(order.items)) {
    return { ok: false, message: "Invalid bill stock payload." };
  }

  const change = direction === "increase" ? 1 : -1;
  const branchId = String(order.branch_id || "");
  const dateText = String(order.date || "");
  if (!branchId || !isIsoDate(dateText)) {
    return { ok: false, message: "Bill branch/date is invalid for stock update." };
  }

  if (change < 0) {
    for (const item of order.items) {
      const fishId = String(item?.fish_id || "");
      const qtyKg = Math.max(0, round2(numberOr(item?.qty_kg, 0)));
      if (!fishId || qtyKg <= 0) {
        continue;
      }
      const currentKg = getBillingAvailableStockKg(branchId, dateText, fishId);
      if (currentKg < qtyKg) {
        const label = String(item?.fish_name || item?.fish_code || fishId);
        return {
          ok: false,
          message: `${label} exceeds stock (${currentKg.toFixed(2)} kg available).`
        };
      }
    }
  }

  for (const item of order.items) {
    const fishId = String(item?.fish_id || "");
    const qtyKg = Math.max(0, round2(numberOr(item?.qty_kg, 0)));
    if (!fishId || qtyKg <= 0) {
      continue;
    }
    const row = getStockEntry(branchId, dateText, fishId) || upsertStockEntry(branchId, dateText, fishId, {});
    if (!row) {
      const label = String(item?.fish_name || item?.fish_code || fishId);
      return { ok: false, message: `Failed to update stock for ${label}.` };
    }
    const currentClosing = Math.max(0, round2(numberOr(row.closing_qty, 0)));
    const nextClosing =
      change < 0
        ? round2(Math.max(0, currentClosing - qtyKg))
        : round2(currentClosing + qtyKg);
    upsertStockEntry(branchId, dateText, fishId, { closing_qty: nextClosing });
  }

  return { ok: true };
}

function shopOrderScopeBranchIds() {
  return getBranchScopeIds(state.branchId);
}

function formatShopOrderItemLines(order) {
  const lines = Array.isArray(order.items) ? order.items : [];
  if (lines.length === 0) {
    return "-";
  }
  return lines
    .map(
      (item) =>
        `${String(item.fish_name || item.fish_id)} (${String(item.fish_code || item.fish_id)}): ${numberOr(
          item.qty_kg,
          0
        ).toFixed(2)}kg x ${money(numberOr(item.special_price_per_kg, 0))}`
    )
    .join(" | ");
}

function buildShopOrderInvoiceText(order) {
  const branch = findBranchById(order.branch_id);
  const header = [
    `${state.settings.company_name || "RTX FishOps"} - SHOP ORDER INVOICE`,
    `Invoice: ${order.invoice_no || order.id}`,
    `Date: ${order.date || "-"}`,
    `Branch: ${branch?.name || order.branch_id || "-"}`,
    `Shop: ${order.shop_name || "-"}`,
    `Shop Status: ${shopStatusLabel(order.shop_status)}`,
    `Payment Method: ${paymentMethodLabel(order.payment_method)}`,
    `Payment Terms: ${paymentTermsLabel(order.payment_terms)}`,
    ""
  ];

  const lines = (Array.isArray(order.items) ? order.items : []).map((item, index) => {
    const qty = numberOr(item.qty_kg, 0).toFixed(2);
    const price = money(numberOr(item.special_price_per_kg, 0));
    const total = money(numberOr(item.line_total, 0));
    return `${index + 1}. ${item.fish_name} (${item.fish_code}) | ${qty} kg x ${price} = ${total}`;
  });

  const footer = [
    "",
    `Total Amount: ${money(numberOr(order.total_amount, 0))}`,
    `Amount Paid: ${money(numberOr(order.amount_paid, 0))}`,
    `Balance Due: ${money(numberOr(order.balance_due, 0))}`,
    `Status: ${order.payment_status || "UNPAID"}`,
    "",
    `Notes: ${order.notes || "-"}`,
    `Shop Requests: ${order.shop_requests || "-"}`
  ];

  return [...header, ...lines, ...footer].join("\n");
}

function downloadShopOrderInvoice(order) {
  const invoiceToken = sanitizeFileNameToken(order.invoice_no || order.id || "invoice", "invoice");
  const dateToken = isIsoDate(order.date) ? order.date : isoDateToday();
  const filename = `shop-order-invoice-${invoiceToken}-${dateToken}.txt`;
  triggerBackupDownload(buildShopOrderInvoiceText(order), filename);
}

function buildCustomerBillInvoiceText(order) {
  const branch = findBranchById(order.branch_id);
  const totalAmount = round2(numberOr(order.total_amount, 0));
  const amountPaid = Math.max(0, round2(numberOr(order.amount_paid, 0)));
  const balanceAmount = round2(Math.abs(totalAmount - amountPaid));
  const header = [
    `${state.settings.company_name || "RTX FishOps"} - CUSTOMER BILL`,
    `Bill No: ${order.invoice_no || order.id}`,
    `Date: ${order.date || "-"}`,
    `Branch: ${branch?.name || order.branch_id || "-"}`,
    `Customer: ${order.shop_name || "-"}`,
    `Payment Method: ${paymentMethodLabel(order.payment_method)}`,
    `Payment Terms: ${paymentTermsLabel(order.payment_terms)}`,
    ""
  ];

  const lines = (Array.isArray(order.items) ? order.items : []).map((item, index) => {
    const qty = numberOr(item.qty_kg, 0).toFixed(2);
    const price = money(numberOr(item.special_price_per_kg, 0));
    const total = money(numberOr(item.line_total, 0));
    return `${index + 1}. ${item.fish_name} (${item.fish_code}) | ${qty} kg x ${price} = ${total}`;
  });

  const footer = [
    "",
    `Net Total: ${money(totalAmount)}`,
    `Total Amount: ${money(totalAmount)}`,
    `Amount Paid: ${money(amountPaid)}`,
    `Balance: ${money(balanceAmount)}`,
    `Status: ${order.payment_status || "UNPAID"}`,
    "",
    `Notes: ${order.notes || "-"}`
  ];

  return [...header, ...lines, ...footer].join("\n");
}

function downloadCustomerBillInvoice(order) {
  const invoiceToken = sanitizeFileNameToken(order.invoice_no || order.id || "bill", "bill");
  const dateToken = isIsoDate(order.date) ? order.date : isoDateToday();
  const filename = `customer-bill-${invoiceToken}-${dateToken}.txt`;
  triggerBackupDownload(buildCustomerBillInvoiceText(order), filename);
}

function buildSummary(branchId, dateText) {
  const scopedBranchIds = getBranchScopeIds(branchId);
  const branchSet = new Set(scopedBranchIds);
  const allBranchMode = isAllBranchesValue(branchId);
  if (branchSet.size === 0) {
    return {
      rows: [],
      totals: {
        sold: 0,
        revenue: 0,
        cost: 0,
        profit: 0
      }
    };
  }

  const activeSettings = DATA.branch_fish_settings.filter(
    (setting) => branchSet.has(setting.branch_id) && setting.is_active
  );
  const activeSettingByKey = new Map(
    activeSettings.map((setting) => [`${setting.branch_id}::${setting.fish_id}`, setting])
  );
  const prices = DATA.daily_prices.filter(
    (price) => branchSet.has(price.branch_id) && price.date === dateText
  );
  const entries = DATA.daily_stock_entry.filter(
    (entry) => branchSet.has(entry.branch_id) && entry.date === dateText
  );

  const priceByBranchFish = new Map();
  for (const row of prices) {
    const key = `${row.branch_id}::${row.fish_id}`;
    const existing = priceByBranchFish.get(key);
    if (!existing) {
      priceByBranchFish.set(key, row);
      continue;
    }

    const existingSource = normalizePriceSource(existing.price_source);
    const nextSource = normalizePriceSource(row.price_source);
    if (existingSource !== "morning" && nextSource === "morning") {
      priceByBranchFish.set(key, row);
    }
  }
  const entryByBranchFish = new Map(
    entries.map((row) => [`${row.branch_id}::${row.fish_id}`, row])
  );
  const holdCostByBranchFish = new Map();

  for (const holdRow of DATA.hold_stock_entry) {
    if (!branchSet.has(holdRow.branch_id)) {
      continue;
    }
    const holdStatus = String(holdRow.status || "").toLowerCase();
    if (holdStatus !== "moved") {
      continue;
    }
    const holdDate = isIsoDate(holdRow.moved_to_date)
      ? holdRow.moved_to_date
      : String(holdRow.date || "");
    if (holdDate !== dateText) {
      continue;
    }
    const fishId = String(holdRow.fish_id || "");
    if (!fishId) {
      continue;
    }
    const holdCost = Math.max(0, round2(numberOr(holdRow.total_cost_lkr, 0)));
    if (holdCost <= 0) {
      continue;
    }

    const scopeKey = `${holdRow.branch_id}::${fishId}`;
    holdCostByBranchFish.set(
      scopeKey,
      round2(numberOr(holdCostByBranchFish.get(scopeKey), 0) + holdCost)
    );
  }

  const rows = [];
  const totals = {
    sold: 0,
    revenue: 0,
    cost: 0,
    profit: 0
  };
  const aggregateRowsByFish = new Map();
  const appliedHoldKeys = new Set();

  for (const setting of activeSettings) {
    const fish = findFishById(setting.fish_id);
    if (!fish || fish.status !== "active") {
      continue;
    }

    const scopeKey = `${setting.branch_id}::${setting.fish_id}`;
    const entry = entryByBranchFish.get(scopeKey);
    if (!entry) {
      continue;
    }

    const sold = soldQty(entry);
    const price = priceByBranchFish.get(scopeKey);
    const holdCost = Math.max(0, round2(numberOr(holdCostByBranchFish.get(scopeKey), 0)));
    const holdPrice = getDailyPrice(setting.branch_id, dateText, setting.fish_id, "hold");
    const effectiveNormalPrice = holdCost > 0 && holdPrice ? holdPrice : price;
    const sourceDate = isIsoDate(entry.auto_opening_from) ? entry.auto_opening_from : "";
    const autoCarriedOpeningQty = sourceDate
      ? Math.max(0, round2(numberOr(entry.opening_qty, 0)))
      : 0;
    const yStockSoldQty = Math.max(0, Math.min(round2(sold), autoCarriedOpeningQty));
    const normalSoldQty = Math.max(0, round2(sold - yStockSoldQty));

    const yPrice = yStockSoldQty > 0 ? getDailyPrice(setting.branch_id, dateText, setting.fish_id, "morning") || price : null;

    let yRevenue = yStockSoldQty > 0 ? (yPrice ? round2(yStockSoldQty * yPrice.sell_price_per_unit) : null) : 0;
    let yCost = 0;
    let yProfit = yRevenue !== null ? round2(yRevenue - yCost) : null;

    let normalRevenue =
      normalSoldQty > 0
        ? effectiveNormalPrice
          ? round2(normalSoldQty * effectiveNormalPrice.sell_price_per_unit)
          : null
        : 0;
    let normalCost =
      normalSoldQty > 0
        ? effectiveNormalPrice
          ? round2(normalSoldQty * effectiveNormalPrice.cost_price_per_unit)
          : null
        : 0;
    let normalProfit = normalRevenue !== null && normalCost !== null ? round2(normalRevenue - normalCost) : null;

    if (holdCost > 0) {
      appliedHoldKeys.add(scopeKey);
      normalRevenue = normalRevenue === null ? 0 : normalRevenue;
      normalCost = round2(holdCost);
      normalProfit = round2(normalRevenue - normalCost);
    }

    const hasMissingYPrice = yStockSoldQty > 0 && !yPrice;
    const hasMissingNormalPrice = normalSoldQty > 0 && !effectiveNormalPrice && holdCost <= 0;
    const hasMissingPrice = hasMissingYPrice || hasMissingNormalPrice;
    const revenue = hasMissingPrice ? null : round2(numberOr(yRevenue, 0) + numberOr(normalRevenue, 0));
    const cost = hasMissingPrice ? null : round2(numberOr(yCost, 0) + numberOr(normalCost, 0));
    const profit = hasMissingPrice ? null : round2(numberOr(yProfit, 0) + numberOr(normalProfit, 0));

    const closing = numberOr(entry.closing_qty, 0);
    const waste = numberOr(entry.waste_qty, 0);
    const minStock = numberOr(setting.min_stock, 0);
    const targetStock = numberOr(setting.target_stock, 0);

    if (!allBranchMode) {
      rows.push({
        fish,
        setting,
        entry,
        sold,
        yStock: yStockSoldQty,
        yRevenue,
        yCost,
        yProfit,
        normalRevenue,
        normalCost,
        normalProfit,
        closing,
        waste,
        orderQty: Math.max(0, round2(targetStock - closing)),
        alert: stockAlert(closing, minStock, targetStock),
        revenue,
        cost,
        profit,
        priceMissing: hasMissingPrice
      });
    } else {
      const fishKey = fish.id || setting.fish_id;
      let aggregated = aggregateRowsByFish.get(fishKey);
      if (!aggregated) {
        aggregated = {
          fish,
          setting: null,
          entry: null,
          sold: 0,
          yStock: 0,
          yRevenue: 0,
          yCost: 0,
          yProfit: 0,
          normalRevenue: 0,
          normalCost: 0,
          normalProfit: 0,
          closing: 0,
          waste: 0,
          orderQty: 0,
          alert: "OK",
          revenue: 0,
          cost: 0,
          profit: 0,
          priceMissing: false,
          _hasPriceData: false,
          _minStock: 0,
          _targetStock: 0
        };
        aggregateRowsByFish.set(fishKey, aggregated);
      }

      aggregated.sold = round2(aggregated.sold + sold);
      aggregated.yStock = round2(aggregated.yStock + yStockSoldQty);
      aggregated.yRevenue = round2(numberOr(aggregated.yRevenue, 0) + numberOr(yRevenue, 0));
      aggregated.yCost = round2(numberOr(aggregated.yCost, 0) + numberOr(yCost, 0));
      aggregated.yProfit = round2(numberOr(aggregated.yProfit, 0) + numberOr(yProfit, 0));
      aggregated.normalRevenue = round2(numberOr(aggregated.normalRevenue, 0) + numberOr(normalRevenue, 0));
      aggregated.normalCost = round2(numberOr(aggregated.normalCost, 0) + numberOr(normalCost, 0));
      aggregated.normalProfit = round2(numberOr(aggregated.normalProfit, 0) + numberOr(normalProfit, 0));
      aggregated.closing = round2(aggregated.closing + closing);
      aggregated.waste = round2(aggregated.waste + waste);
      aggregated._minStock = round2(aggregated._minStock + minStock);
      aggregated._targetStock = round2(aggregated._targetStock + targetStock);
      if (revenue !== null && cost !== null && profit !== null) {
        aggregated.revenue = round2(aggregated.revenue + revenue);
        aggregated.cost = round2(aggregated.cost + cost);
        aggregated.profit = round2(aggregated.profit + profit);
        aggregated._hasPriceData = true;
      } else {
        aggregated.priceMissing = true;
      }
    }

    totals.sold = round2(totals.sold + sold);
    if (revenue !== null && cost !== null && profit !== null) {
      totals.revenue = round2(totals.revenue + revenue);
      totals.cost = round2(totals.cost + cost);
      totals.profit = round2(totals.profit + profit);
    }
  }

  for (const [scopeKey, holdCost] of holdCostByBranchFish.entries()) {
    if (holdCost <= 0 || appliedHoldKeys.has(scopeKey)) {
      continue;
    }

    const [, holdFishId] = scopeKey.split("::");
    if (!holdFishId) {
      continue;
    }

    const fish =
      findFishById(holdFishId) || {
        id: holdFishId,
        fish_code: holdFishId,
        name: holdFishId,
        unit: "kg",
        status: "active"
      };
    const setting = activeSettingByKey.get(scopeKey) || null;
    const minStock = numberOr(setting?.min_stock, 0);
    const targetStock = numberOr(setting?.target_stock, 0);

    if (!allBranchMode) {
      rows.push({
        fish,
        setting,
        entry: null,
        sold: 0,
        yStock: 0,
        yRevenue: 0,
        yCost: 0,
        yProfit: 0,
        normalRevenue: 0,
        normalCost: round2(holdCost),
        normalProfit: round2(-holdCost),
        closing: 0,
        waste: 0,
        orderQty: Math.max(0, round2(targetStock)),
        alert: stockAlert(0, minStock, targetStock),
        revenue: 0,
        cost: round2(holdCost),
        profit: round2(-holdCost),
        priceMissing: false
      });
    } else {
      const fishKey = fish.id || holdFishId;
      let aggregated = aggregateRowsByFish.get(fishKey);
      if (!aggregated) {
        aggregated = {
          fish,
          setting: null,
          entry: null,
          sold: 0,
          yStock: 0,
          yRevenue: 0,
          yCost: 0,
          yProfit: 0,
          normalRevenue: 0,
          normalCost: 0,
          normalProfit: 0,
          closing: 0,
          waste: 0,
          orderQty: 0,
          alert: "OK",
          revenue: 0,
          cost: 0,
          profit: 0,
          priceMissing: false,
          _hasPriceData: false,
          _minStock: 0,
          _targetStock: 0
        };
        aggregateRowsByFish.set(fishKey, aggregated);
      }

      aggregated._minStock = round2(aggregated._minStock + minStock);
      aggregated._targetStock = round2(aggregated._targetStock + targetStock);
      aggregated.normalCost = round2(numberOr(aggregated.normalCost, 0) + holdCost);
      aggregated.normalProfit = round2(numberOr(aggregated.normalProfit, 0) - holdCost);
      aggregated.cost = round2(aggregated.cost + holdCost);
      aggregated.profit = round2(aggregated.profit - holdCost);
      aggregated._hasPriceData = true;
    }

    totals.cost = round2(totals.cost + holdCost);
    totals.profit = round2(totals.profit - holdCost);
  }

  if (allBranchMode) {
    for (const row of aggregateRowsByFish.values()) {
      row.orderQty = Math.max(0, round2(row._targetStock - row.closing));
      row.alert = stockAlert(row.closing, row._minStock, row._targetStock);
      if (!row._hasPriceData) {
        row.revenue = null;
        row.cost = null;
        row.profit = null;
      }
      delete row._hasPriceData;
      delete row._minStock;
      delete row._targetStock;
      rows.push(row);
    }
  }

  rows.sort((a, b) => a.fish.name.localeCompare(b.fish.name));
  return { rows, totals };
}

function buildMonthlySummary(branchId, monthText) {
  const { month, monthLabel, startDate, endDate } = getMonthDateRange(monthText);
  const dailyRows = [];
  const totals = {
    sold: 0,
    waste: 0,
    revenue: 0,
    cost: 0,
    profit: 0,
    activeDays: 0,
    missingPriceDays: 0
  };

  let cursor = startDate;
  while (isoDaysBetween(cursor, endDate) >= 0) {
    const { rows, totals: dayTotals } = buildSummary(branchId, cursor);
    if (rows.length === 0) {
      cursor = getTomorrow(cursor);
      continue;
    }

    const waste = round2(rows.reduce((sum, row) => sum + numberOr(row.waste, 0), 0));
    const hasMissingPrice = rows.some((row) => row.priceMissing);

    dailyRows.push({
      date: cursor,
      fishRows: rows.length,
      sold: round2(dayTotals.sold),
      waste,
      revenue: round2(dayTotals.revenue),
      cost: round2(dayTotals.cost),
      profit: round2(dayTotals.profit),
      hasMissingPrice
    });

    totals.sold = round2(totals.sold + dayTotals.sold);
    totals.waste = round2(totals.waste + waste);
    totals.revenue = round2(totals.revenue + dayTotals.revenue);
    totals.cost = round2(totals.cost + dayTotals.cost);
    totals.profit = round2(totals.profit + dayTotals.profit);
    totals.activeDays += 1;
    if (hasMissingPrice) {
      totals.missingPriceDays += 1;
    }

    cursor = getTomorrow(cursor);
  }

  const bestProfitDay = dailyRows.length
    ? [...dailyRows].sort((a, b) => b.profit - a.profit)[0]
    : null;
  const worstProfitDay = dailyRows.length
    ? [...dailyRows].sort((a, b) => a.profit - b.profit)[0]
    : null;

  return {
    month,
    monthLabel,
    startDate,
    endDate,
    rows: dailyRows,
    totals,
    bestProfitDay,
    worstProfitDay
  };
}

function buildBillingProgressSummary(branchId, dateText) {
  const targetDate = isIsoDate(dateText) ? dateText : isoDateToday();
  const scopeBranchIds = getBranchScopeIds(branchId);
  const scopeBranchSet = new Set(scopeBranchIds);
  const methodTotals = {
    cash: { bills: 0, revenue: 0, income: 0, profit: 0 },
    bank: { bills: 0, revenue: 0, income: 0, profit: 0 },
    card: { bills: 0, revenue: 0, income: 0, profit: 0 },
    online: { bills: 0, revenue: 0, income: 0, profit: 0 },
    credit: { bills: 0, revenue: 0, income: 0, profit: 0 }
  };
  const totals = {
    bills: 0,
    revenue: 0,
    income: 0,
    profit: 0
  };
  const rows = [];

  if (scopeBranchSet.size === 0) {
    return {
      date: targetDate,
      rows,
      totals,
      methodTotals,
      topRevenueBill: null,
      topIncomeBill: null,
      topProfitBill: null
    };
  }

  for (const row of DATA.customer_bills) {
    if (!scopeBranchSet.has(row.branch_id)) {
      continue;
    }
    if (String(row.date || "") !== targetDate) {
      continue;
    }

    const revenue = Math.max(0, round2(numberOr(row.total_amount, 0)));
    const amountPaid = Math.max(0, round2(numberOr(row.amount_paid, 0)));
    const income = round2(Math.min(revenue, amountPaid));
    const profit = income;

    totals.bills += 1;
    totals.revenue = round2(totals.revenue + revenue);
    totals.income = round2(totals.income + income);
    totals.profit = round2(totals.profit + profit);

    const method = normalizePaymentMethod(row.payment_method);
    if (methodTotals[method]) {
      methodTotals[method].bills += 1;
      methodTotals[method].revenue = round2(methodTotals[method].revenue + revenue);
      methodTotals[method].income = round2(methodTotals[method].income + income);
      methodTotals[method].profit = round2(methodTotals[method].profit + profit);
    }

    const branch = findBranchById(row.branch_id);
    rows.push({
      id: String(row.id || ""),
      invoice_no: String(row.invoice_no || row.id || ""),
      branch_name: String(branch?.name || row.branch_id || "-"),
      customer_name: String(row.shop_name || "-"),
      payment_method: normalizePaymentMethod(row.payment_method),
      revenue,
      income,
      profit,
      created_at: String(row.created_at || "")
    });
  }

  rows.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  const topRevenueBill = rows.length ? [...rows].sort((a, b) => b.revenue - a.revenue)[0] : null;
  const topIncomeBill = rows.length ? [...rows].sort((a, b) => b.income - a.income)[0] : null;
  const topProfitBill = rows.length ? [...rows].sort((a, b) => b.profit - a.profit)[0] : null;

  return {
    date: targetDate,
    rows,
    totals,
    methodTotals,
    topRevenueBill,
    topIncomeBill,
    topProfitBill
  };
}

function setBrandMark(element) {
  if (!element) {
    return;
  }
  if (state.settings.company_logo) {
    element.style.backgroundImage = `url("${state.settings.company_logo}")`;
    element.classList.add("has-logo");
    element.textContent = "";
  } else {
    element.style.backgroundImage = "none";
    element.classList.remove("has-logo");
    element.textContent = state.settings.logo_text || "RTx";
  }
}

function applyBranding() {
  document.documentElement.style.setProperty("--primary", state.settings.theme_primary);
  document.documentElement.style.setProperty("--accent", state.settings.theme_accent);
  document.title = state.settings.company_name || "FishOps";
  if (ui.brandTitle) {
    ui.brandTitle.textContent = state.settings.company_name || "FishOps";
  }
  setBrandMark(ui.loginBrandMark);
  setBrandMark(ui.mainBrandMark);
}

function renderSessionIdentity() {
  if (!state.currentUser) {
    return;
  }
  const user = state.currentUser;
  const roleLabel = isGlobalAdminUser(user) ? "ADMIN (GLOBAL)" : user.role.toUpperCase();
  ui.sessionUser.textContent = user.username;
  ui.sessionRole.textContent = roleLabel;
  const hasPhoto = Boolean(user.photo);
  ui.sessionAvatar.classList.toggle("has-photo", hasPhoto);
  ui.sessionAvatar.style.backgroundImage = hasPhoto ? `url("${user.photo}")` : "none";
  ui.sessionAvatar.textContent = hasPhoto ? "" : getInitials(user.username);
}

function renderRoleOptions(selectedRole) {
  const roles = ["master", "admin", "user"];
  return roles
    .map((role) => `<option value="${role}" ${role === selectedRole ? "selected" : ""}>${role}</option>`)
    .join("");
}

function renderPageAccessOptions(role, hiddenPageIds = []) {
  const rolePageIds = getRoleVisiblePageIds(role);
  const hiddenSet = new Set(normalizeUserHiddenPageIds(role, hiddenPageIds));
  const rolePageSet = new Set(rolePageIds);
  return PAGES.filter((page) => rolePageSet.has(page.id))
    .map(
      (page) =>
        `<option value="${page.id}" ${hiddenSet.has(page.id) ? "selected" : ""}>${escapeHtml(page.title)}</option>`
    )
    .join("");
}

function renderBranchOptions(selectedBranchId, includeGlobal = true) {
  const options = [];
  if (includeGlobal) {
    options.push(`<option value="" ${!selectedBranchId ? "selected" : ""}>GLOBAL</option>`);
  }
  for (const branch of DATA.branches) {
    options.push(
      `<option value="${branch.id}" ${branch.id === selectedBranchId ? "selected" : ""}>${escapeHtml(
        branch.name
      )}</option>`
    );
  }
  return options.join("");
}

function renderTopbarActions() {
  const canSendBackup = hasPermission(state.currentUser, "backup_send_server");
  const canBackup = hasPermission(state.currentUser, "backup_export");
  const canImportBackup = hasPermission(state.currentUser, "backup_restore_import");

  ui.topbarActions.innerHTML = `
    <button class="btn btn-primary" id="sendBackupBtn" ${canSendBackup ? "" : "disabled"}>Send Backup</button>
    <button class="btn btn-soft" id="reloadFromServerBtn">Reload Update</button>
    <button class="btn btn-outline" id="exportBackupBtn" ${canBackup ? "" : "disabled"}>Download Backup</button>
    ${canImportBackup ? '<button class="btn btn-outline" id="importBackupBtn">Import Backup</button>' : ""}
  `;

  const sendBtn = document.getElementById("sendBackupBtn");
  const reloadBtn = document.getElementById("reloadFromServerBtn");
  const exportBtn = document.getElementById("exportBackupBtn");
  const importBtn = document.getElementById("importBackupBtn");
  sendBtn?.addEventListener("click", () => {
    void sendBackupToServer();
  });
  reloadBtn?.addEventListener("click", () => {
    void reloadStoreFromServer(true);
  });
  exportBtn?.addEventListener("click", exportBackup);
  importBtn?.addEventListener("click", openBackupImportPicker);
}

function renderNav() {
  const pages = getVisiblePages(state.currentUser);
  ui.navMenu.innerHTML = pages
    .map(
      (page) =>
        `<button class="nav-item ${state.activePage === page.id ? "active" : ""}" data-page="${
          page.id
        }">${escapeHtml(page.title)}</button>`
    )
    .join("");

  ui.navMenu.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const nextPage = item.getAttribute("data-page");
      if (!nextPage) {
        return;
      }
      state.activePage = nextPage;
      renderApp();
    });
  });
}

function renderDailySummaryTable(rows, options = {}) {
  const showSearch = Boolean(options.showSearch);
  const searchMarkup = showSearch
    ? `
      <div class="table-search">
        <input
          id="dailySummarySearchInput"
          class="table-input"
          type="search"
          placeholder="Search fish by code/name"
          value="${escapeHtml(state.quickSearch.dailySummary)}"
        />
      </div>
    `
    : "";

  const rowMarkup = rows
    .map((row) => {
      const searchable = fishSearchText(
        row.fish,
        [row.fish?.fish_code, row.fish?.name, row.alert].filter(Boolean).join(" ")
      );
      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(row.fish.name)}</td>
          <td>${row.sold.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
          <td>${row.yStock.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
          <td>${row.yRevenue === null ? "-" : money(row.yRevenue)}</td>
          <td class="${row.yCost === null ? "" : "cost-negative"}">${row.yCost === null ? "-" : money(row.yCost)}</td>
          <td class="${(row.yProfit || 0) >= 0 ? "profit-positive" : "profit-negative"}">${
            row.yProfit === null ? "-" : money(row.yProfit)
          }</td>
          <td>${row.normalRevenue === null ? "-" : money(row.normalRevenue)}</td>
          <td class="${row.normalCost === null ? "" : "cost-negative"}">${row.normalCost === null ? "-" : money(row.normalCost)}</td>
          <td class="${(row.normalProfit || 0) >= 0 ? "profit-positive" : "profit-negative"}">${
            row.normalProfit === null ? "-" : money(row.normalProfit)
          }</td>
          <td>${row.closing.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
          <td>${row.waste.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
          <td>${row.revenue === null ? "-" : money(row.revenue)}</td>
          <td class="${row.cost === null ? "" : "cost-negative"}">${row.cost === null ? "-" : money(row.cost)}</td>
          <td class="${(row.profit || 0) >= 0 ? "profit-positive" : "profit-negative"}">${
            row.profit === null ? "-" : money(row.profit)
          }</td>
          <td><span class="chip ${row.alert.toLowerCase()}">${row.alert}</span></td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="card wide">
      <div class="card-header"><h3>Daily Summary (Per Fish)</h3></div>
      ${searchMarkup}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Sold</th>
              <th>Y Stock</th>
              <th>Y Revenue</th>
              <th>Y Cost</th>
              <th>Y Profit</th>
              <th>Normal Revenue</th>
              <th>Normal Cost</th>
              <th>Normal Profit</th>
              <th>Closing</th>
              <th>Waste</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody ${showSearch ? 'id="dailySummaryTableBody"' : ""}>
            ${
              rows.length === 0
                ? '<tr><td colspan="15" class="empty-state">No stock entries for selected date.</td></tr>'
                : rowMarkup
            }
            ${
              showSearch && rows.length > 0
                ? '<tr id="dailySummarySearchEmptyRow" class="hidden"><td colspan="15" class="empty-state">No fish match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDashboardPage() {
  const { rows, totals } = buildSummary(state.branchId, state.date);
  const lowAlerts = rows.filter((row) => row.alert !== "OK");
  const orderRows = rows.filter((row) => row.orderQty > 0);
  const missingPrices = rows.filter((row) => row.priceMissing);

  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Revenue</p><h2>${money(totals.revenue)}</h2></article>
      <article class="kpi-card"><p>Cost</p><h2 class="cost-negative">${money(totals.cost)}</h2></article>
      <article class="kpi-card"><p>Profit</p><h2 class="${
        totals.profit >= 0 ? "profit-positive" : "profit-negative"
      }">${money(totals.profit)}</h2></article>
      <article class="kpi-card"><p>Sold (kg/pcs)</p><h2>${totals.sold.toFixed(2)}</h2></article>
    </section>

    <section class="content-grid">
      <article class="card">
        <div class="card-header"><h3>Low Stock Alerts</h3></div>
        <div class="list">
          ${
            lowAlerts.length === 0
              ? '<div class="list-item"><strong>No low stock alerts</strong><span class="chip ok">OK</span></div>'
              : lowAlerts
                  .map(
                    (row) =>
                      `<div class="list-item"><strong>${escapeHtml(
                        row.fish.name
                      )}</strong><span class="chip ${row.alert.toLowerCase()}">${row.alert}</span></div>`
                  )
                  .join("")
          }
        </div>
      </article>
      <article class="card">
        <div class="card-header"><h3>Tomorrow Order Plan</h3></div>
        <div class="list">
          ${
            orderRows.length === 0
              ? '<div class="list-item"><strong>No order required</strong><span class="chip ok">OK</span></div>'
              : orderRows
                  .map(
                    (row) =>
                      `<div class="list-item"><strong>${escapeHtml(
                        row.fish.name
                      )}</strong><span>${row.orderQty.toFixed(2)} ${escapeHtml(row.fish.unit)}</span></div>`
                  )
                  .join("")
          }
        </div>
      </article>
      <article class="card">
        <div class="card-header"><h3>Prices Missing Today</h3></div>
        <div class="list">
          ${
            missingPrices.length === 0
              ? '<div class="list-item"><strong>All prices set</strong><span class="chip ok">READY</span></div>'
              : missingPrices
                  .map(
                    (row) =>
                      `<div class="list-item"><strong>${escapeHtml(
                        row.fish.fish_code
                      )}</strong><span class="chip warning">MISSING</span></div>`
                  )
                  .join("")
          }
        </div>
      </article>
    </section>

    ${renderDailySummaryTable(rows)}
  `;
}

function renderUsersPage() {
  const rows = DATA.users
    .map(
      (user) => {
        const hiddenPages = getUserHiddenPageIds(user);
        const rolePages = getRoleVisiblePageIds(user.role);
        const tabHint =
          user.role === "master"
            ? "Master always sees all tabs"
            : hiddenPages.length === 0
              ? "No hidden tabs"
              : `${hiddenPages.length} tab(s) hidden`;
        return `
      <tr>
        <td>${escapeHtml(user.username)}</td>
        <td><select id="user-role-${user.id}" class="table-select">${renderRoleOptions(user.role)}</select></td>
        <td><select id="user-branch-${user.id}" class="table-select">${renderBranchOptions(
          user.branch_id,
          true
        )}</select></td>
        <td>
          <select id="user-status-${user.id}" class="table-select">
            <option value="active" ${user.status === "active" ? "selected" : ""}>active</option>
            <option value="inactive" ${user.status === "inactive" ? "selected" : ""}>inactive</option>
          </select>
        </td>
        <td>
          <select
            id="user-tabs-${user.id}"
            class="table-select user-tabs-select"
            multiple
            size="7"
            ${user.role === "master" ? "disabled" : ""}
          >
            ${renderPageAccessOptions(user.role, hiddenPages)}
          </select>
          <p class="hint user-tabs-hint">${escapeHtml(tabHint)} (${Math.max(0, rolePages.length - hiddenPages.length)} visible)</p>
        </td>
        <td><input id="user-password-${user.id}" class="table-input" type="text" placeholder="New password" /></td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-primary user-save-btn" data-user-id="${user.id}">Save</button>
            <button type="button" class="btn btn-danger user-delete-btn" data-user-id="${user.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
      }
    )
    .join("");

  return `
    <section class="card section-gap">
      <div class="card-header"><h3>Add User</h3></div>
      <form id="userCreateForm" class="form-grid">
        <input id="newUserUsername" type="text" placeholder="Username" required />
        <input id="newUserPassword" type="text" placeholder="Password" required />
        <select id="newUserRole">${renderRoleOptions("user")}</select>
        <select id="newUserBranch">${renderBranchOptions("BR-001", true)}</select>
        <select id="newUserStatus">
          <option value="active" selected>active</option>
          <option value="inactive">inactive</option>
        </select>
        <select id="newUserHiddenPages" class="full-width user-tabs-select" multiple size="7">
          ${renderPageAccessOptions("user", [])}
        </select>
        <p class="hint full-width">Hide selected tabs for this user. Unselected tabs stay visible.</p>
        <button class="btn btn-primary" type="submit">Create User</button>
      </form>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Users & Roles</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Hidden Tabs</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderFishProfilesPage() {
  const canEdit = hasPermission(state.currentUser, "upsert_fish_profile");
  const canDelete = hasPermission(state.currentUser, "delete_fish_profile");

  const rows = DATA.fish_profiles
    .map((fish) => {
      const searchable = fishSearchText(
        fish,
        [fish.category, fish.unit, fish.status, fish.id].filter(Boolean).join(" ")
      );
      const fishLabel = String(fish.name || fish.fish_code || fish.id);
      const photoPreview = String(fish.photo || "").trim()
        ? `<img class="fish-photo-thumb has-photo" src="${escapeHtml(fish.photo)}" alt="${escapeHtml(fishLabel)}" />`
        : `<span class="fish-photo-thumb">${escapeHtml(getInitials(fishLabel))}</span>`;
      return `
      <tr data-fish-search="${escapeHtml(searchable)}">
        <td>${escapeHtml(fish.fish_code)}</td>
        <td>${
          canEdit
            ? `<input id="fish-name-${fish.id}" class="table-input" value="${escapeHtml(fish.name)}" />`
            : escapeHtml(fish.name)
        }</td>
        <td>
          <div class="fish-photo-cell">
            ${photoPreview}
            ${
              canEdit
                ? `<input id="fish-photo-${fish.id}" class="table-input fish-photo-input" type="file" accept="image/*" />
                   <label class="fish-photo-remove"><input id="fish-photo-remove-${fish.id}" type="checkbox" /> Remove</label>`
                : ""
            }
          </div>
        </td>
        <td>${
          canEdit
            ? `<select id="fish-category-${fish.id}" class="table-select">
                <option value="Sea" ${fish.category === "Sea" ? "selected" : ""}>Sea</option>
                <option value="Lagoon" ${fish.category === "Lagoon" ? "selected" : ""}>Lagoon</option>
                <option value="Freshwater" ${fish.category === "Freshwater" ? "selected" : ""}>Freshwater</option>
              </select>`
            : escapeHtml(fish.category)
        }</td>
        <td>${
          canEdit
            ? `<select id="fish-unit-${fish.id}" class="table-select">
                <option value="kg" ${fish.unit === "kg" ? "selected" : ""}>kg</option>
                <option value="pcs" ${fish.unit === "pcs" ? "selected" : ""}>pcs</option>
              </select>`
            : escapeHtml(fish.unit)
        }</td>
        <td>${
          canEdit
            ? `<select id="fish-status-${fish.id}" class="table-select">
                <option value="active" ${fish.status === "active" ? "selected" : ""}>active</option>
                <option value="inactive" ${fish.status === "inactive" ? "selected" : ""}>inactive</option>
              </select>`
            : escapeHtml(fish.status)
        }</td>
        <td>
          ${
            canEdit
              ? `<div class="table-actions">
                  <button type="button" class="btn btn-primary fish-save-btn" data-fish-id="${fish.id}">Save</button>
                  <button type="button" class="btn btn-soft fish-toggle-btn" data-fish-id="${fish.id}">Toggle</button>
                  ${
                    canDelete
                      ? `<button type="button" class="btn btn-danger fish-delete-btn" data-fish-id="${fish.id}">Delete</button>`
                      : ""
                  }
                </div>`
              : '<span class="chip info">View only</span>'
          }
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    ${
      canEdit
        ? `<section class="card section-gap">
            <div class="card-header"><h3>Add Fish Profile</h3></div>
            <form id="fishCreateForm" class="form-grid compact">
              <input id="newFishCode" type="text" placeholder="Fish Code (optional, auto: F-0001)" />
              <input id="newFishName" type="text" placeholder="Fish Name" required />
              <input id="newFishPhotoInput" type="file" accept="image/*" />
              <select id="newFishCategory">
                <option value="Sea">Sea</option>
                <option value="Lagoon">Lagoon</option>
                <option value="Freshwater">Freshwater</option>
              </select>
              <select id="newFishUnit">
                <option value="kg">kg</option>
                <option value="pcs">pcs</option>
              </select>
              <select id="newFishStatus">
                <option value="active" selected>active</option>
                <option value="inactive">inactive</option>
              </select>
              <button class="btn btn-primary" type="submit">Add Fish</button>
            </form>
            <p class="page-note">If fish code is empty, the system auto-generates the next F code. Photo is optional.</p>
          </section>`
        : ""
    }

    <section class="card wide">
      <div class="card-header"><h3>Fish Profiles</h3></div>
      <div class="table-search">
        <input
          id="fishProfilesSearchInput"
          class="table-input"
          type="search"
          placeholder="Search fish by code/name/category/status"
          value="${escapeHtml(state.quickSearch.fishProfiles)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Photo</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="fishProfilesTableBody">
            ${rows || '<tr><td colspan="7" class="empty-state">No fish profiles found.</td></tr>'}
            ${
              rows
                ? '<tr id="fishProfilesSearchEmptyRow" class="hidden"><td colspan="7" class="empty-state">No fish match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderBranchFishSettingsPage() {
  if (isAllBranchesSelected()) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Branch Fish Settings</h3></div>
        <p class="empty-state">Select a single branch to manage branch fish settings.</p>
      </section>
    `;
  }

  const settingsRows = DATA.branch_fish_settings
    .filter((row) => row.branch_id === state.branchId)
    .map((setting) => {
      const fish = findFishById(setting.fish_id);
      const fishLabel = fishDisplayLabel(fish, setting.fish_id);
      const searchable = fishSearchText(fish, setting.fish_id);
      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(fishLabel)}</td>
          <td><input id="setting-min-${setting.id}" class="table-input" type="number" step="0.01" value="${setting.min_stock}" /></td>
          <td><input id="setting-target-${setting.id}" class="table-input" type="number" step="0.01" value="${setting.target_stock}" /></td>
          <td>
            <select id="setting-active-${setting.id}" class="table-select">
              <option value="true" ${setting.is_active ? "selected" : ""}>active</option>
              <option value="false" ${!setting.is_active ? "selected" : ""}>inactive</option>
            </select>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-primary setting-save-btn" data-setting-id="${setting.id}">Save</button>
              <button type="button" class="btn btn-danger setting-delete-btn" data-setting-id="${setting.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });
  const rows = settingsRows.join("");
  const settingFishOptions = DATA.fish_profiles
    .map((fish) => {
      const fishCode = String(fish.fish_code || "").trim();
      const fishName = String(fish.name || "").trim();
      const displayName = fishName || fishCode;
      const displayCode = fishCode || fishName;
      if (!displayName) {
        return "";
      }

      const label = `${escapeHtml(displayName)} (${escapeHtml(displayCode)})`;
      const codeOption = fishCode ? `<option value="${escapeHtml(fishCode)}">${label}</option>` : "";
      const nameOption =
        fishName && fishName.toLowerCase() !== fishCode.toLowerCase()
          ? `<option value="${escapeHtml(fishName)}">${label}</option>`
          : "";

      return `${codeOption}${nameOption}`;
    })
    .join("");

  return `
    <section class="card section-gap">
      <div class="card-header"><h3>Set Branch Stock Levels (${escapeHtml(state.branchId)})</h3></div>
      <form id="settingCreateForm" class="form-grid compact">
        <input
          id="newSettingFishInput"
          list="newSettingFishList"
          type="text"
          placeholder="Fish code or name (e.g. F-0001)"
          required
        />
        <datalist id="newSettingFishList">${settingFishOptions}</datalist>
        <input id="newSettingMin" type="number" step="0.01" placeholder="Min stock" required />
        <input id="newSettingTarget" type="number" step="0.01" placeholder="Target stock" required />
        <select id="newSettingActive">
          <option value="true" selected>active</option>
          <option value="false">inactive</option>
        </select>
        <button class="btn btn-primary" type="submit">Save Setting</button>
      </form>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Branch Fish Settings</h3></div>
      <div class="table-search">
        <input
          id="branchSettingsSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish code or name"
          value="${escapeHtml(state.quickSearch.branchFishSettings)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Min Stock</th>
              <th>Target Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="branchSettingsTableBody">
            ${rows || '<tr><td colspan="5" class="empty-state">No settings found.</td></tr>'}
            ${
              rows
                ? '<tr id="branchSettingsSearchEmptyRow" class="hidden"><td colspan="5" class="empty-state">No fish match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDailyPricesPage() {
  if (isAllBranchesSelected()) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Daily Prices</h3></div>
        <p class="empty-state">Select a single branch to manage daily prices.</p>
      </section>
    `;
  }

  const priceRows = DATA.daily_prices
    .filter((row) => row.branch_id === state.branchId && row.date === state.date)
    .sort((a, b) => {
      const aFish = findFishById(a.fish_id);
      const bFish = findFishById(b.fish_id);
      const byFish = String(aFish?.name || a.fish_id || "").localeCompare(String(bFish?.name || b.fish_id || ""));
      if (byFish !== 0) {
        return byFish;
      }
      const aSource = normalizePriceSource(a.price_source);
      const bSource = normalizePriceSource(b.price_source);
      if (aSource === bSource) {
        return 0;
      }
      return aSource === "morning" ? -1 : 1;
    })
    .map((price) => {
      const fish = findFishById(price.fish_id);
      const source = normalizePriceSource(price.price_source);
      const isHoldSource = source === "hold";
      const isRemainingPrice = isIsoDate(price.auto_price_from);
      const fishLabel = `${fishDisplayLabel(fish, price.fish_id)}${isRemainingPrice ? " (remaining)" : ""}`;
      const sourceLabel = isHoldSource ? "HOLD" : isRemainingPrice ? "MORNING (REMAINING)" : "MORNING";
      const sourceClass = isHoldSource ? "warning" : isRemainingPrice ? "info" : "ok";
      const searchable = `${fishSearchText(fish, price.fish_id)} ${isRemainingPrice ? "remaining" : ""} ${
        isHoldSource ? "hold" : "morning"
      }`.trim();
      return `
      <tr data-fish-search="${escapeHtml(searchable)}">
        <td>${escapeHtml(fishLabel)}</td>
        <td><span class="chip ${sourceClass}">${sourceLabel}</span></td>
        <td><input id="price-sell-${price.id}" class="table-input" type="number" step="0.01" value="${price.sell_price_per_unit}" /></td>
        <td><input id="price-cost-${price.id}" class="table-input" type="number" step="0.01" value="${price.cost_price_per_unit}" /></td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-primary price-save-btn" data-price-id="${price.id}">Save</button>
            <button type="button" class="btn btn-danger price-delete-btn" data-price-id="${price.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
    });
  const rows = priceRows.join("");
  const priceFishOptions = DATA.fish_profiles
    .filter((fish) => fish.status === "active")
    .map((fish) => {
      const fishCode = String(fish.fish_code || "").trim();
      const fishName = String(fish.name || "").trim();
      const displayName = fishName || fishCode;
      const displayCode = fishCode || fishName;
      if (!displayName) {
        return "";
      }

      const label = `${escapeHtml(displayName)} (${escapeHtml(displayCode)})`;
      const codeOption = fishCode ? `<option value="${escapeHtml(fishCode)}">${label}</option>` : "";
      const nameOption =
        fishName && fishName.toLowerCase() !== fishCode.toLowerCase()
          ? `<option value="${escapeHtml(fishName)}">${label}</option>`
          : "";

      return `${codeOption}${nameOption}`;
    })
    .join("");

  return `
    <section class="card section-gap">
      <div class="card-header"><h3>Set Daily Price (${escapeHtml(state.date)})</h3></div>
      <form id="priceUpsertForm" class="form-grid compact">
        <input
          id="priceFishInput"
          list="priceFishList"
          type="text"
          placeholder="Fish code or name (e.g. F-0001)"
          required
        />
        <datalist id="priceFishList">${priceFishOptions}</datalist>
        <input id="priceSellInput" type="number" step="0.01" placeholder="Sell price" required />
        <input id="priceCostInput" type="number" step="0.01" placeholder="Cost price" required />
        <button class="btn btn-primary" type="submit">Save Price</button>
      </form>
    </section>

    <section class="card wide">
      <div class="card-header">
        <h3>Daily Prices</h3>
        <p class="page-note">Morning and hold prices are shown separately by source and can be edited here.</p>
      </div>
      <div class="table-search">
        <input
          id="dailyPricesSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish code or name"
          value="${escapeHtml(state.quickSearch.dailyPrices)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Source</th>
              <th>Sell Price</th>
              <th>Cost Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="dailyPricesTableBody">
            ${rows || '<tr><td colspan="5" class="empty-state">No prices set for this date.</td></tr>'}
            ${
              rows
                ? '<tr id="dailyPricesSearchEmptyRow" class="hidden"><td colspan="5" class="empty-state">No fish match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderYDailyPricesPage() {
  if (isAllBranchesSelected()) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Y- Daily Price</h3></div>
        <p class="empty-state">Select a single branch to view yesterday carried stock prices.</p>
      </section>
    `;
  }

  const sourceDate = getYesterday(state.date);
  const rows = DATA.daily_stock_entry
    .filter(
      (row) =>
        row.branch_id === state.branchId &&
        row.date === state.date &&
        String(row.auto_opening_from || "") === sourceDate &&
        numberOr(row.opening_qty, 0) > 0
    )
    .sort((a, b) => {
      const aFish = findFishById(a.fish_id);
      const bFish = findFishById(b.fish_id);
      return String(aFish?.name || a.fish_id || "").localeCompare(String(bFish?.name || b.fish_id || ""));
    })
    .map((entry) => {
      const fish = findFishById(entry.fish_id);
      const price = getDailyPrice(state.branchId, state.date, entry.fish_id, "morning") || null;
      const hasPrice = Boolean(price);
      const searchable = `${fishSearchText(fish, entry.fish_id)} ${sourceDate}`.trim();

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(fishDisplayLabel(fish, entry.fish_id))} (remaining)</td>
          <td>${Math.max(0, round2(numberOr(entry.opening_qty, 0))).toFixed(2)}</td>
          <td>${hasPrice ? Math.round(numberOr(price.sell_price_per_unit, 0)).toLocaleString() : "-"}</td>
          <td>${hasPrice ? Math.round(numberOr(price.cost_price_per_unit, 0)).toLocaleString() : "-"}</td>
          <td>${escapeHtml(sourceDate || "-")}</td>
          <td><span class="chip ${hasPrice ? "ok" : "critical"}">${hasPrice ? "READY" : "MISSING"}</span></td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="card wide">
      <div class="card-header">
        <h3>Y- Daily Price (${escapeHtml(state.date)})</h3>
        <p class="page-note">Y stock uses today's morning sell price; Y cost is always treated as 0.</p>
      </div>
      <div class="table-search">
        <input
          id="yDailyPricesSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish code or name"
          value="${escapeHtml(state.quickSearch.yDailyPrices)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Opening Qty</th>
              <th>Sell Price</th>
              <th>Cost Price</th>
              <th>From Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="yDailyPricesTableBody">
            ${rows || '<tr><td colspan="6" class="empty-state">No carried stock prices for this date.</td></tr>'}
            ${
              rows
                ? '<tr id="yDailyPricesSearchEmptyRow" class="hidden"><td colspan="6" class="empty-state">No fish match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderHoldStockPage() {
  if (isAllBranchesSelected()) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Hold Stock</h3></div>
        <p class="empty-state">Select a single branch to manage hold stock.</p>
      </section>
    `;
  }

  const rows = DATA.hold_stock_entry
    .filter((row) => {
      if (row.branch_id !== state.branchId) {
        return false;
      }
      const rowDate = String(row.date || "");
      const status = String(row.status || "raw").toLowerCase();
      const isSameDate = rowDate === state.date;
      const isPendingFromPast = rowDate <= state.date && status !== "moved";
      return isSameDate || isPendingFromPast;
    })
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .map((row) => {
      const fish = findFishById(row.fish_id);
      const fishLabel = fishDisplayLabel(fish, row.fish_code || row.fish_id);
      const searchable = [
        fishSearchText(fish, row.fish_code || row.fish_id),
        String(row.date || "").toLowerCase(),
        String(row.status || "raw").toLowerCase()
      ].join(" ");
      const status = String(row.status || "raw").toLowerCase();
      const isMoved = status === "moved";
      const statusText = isMoved ? "MOVED" : status === "cut" ? "CUT" : "RAW";
      const statusClass = isMoved ? "ok" : status === "cut" ? "warning" : "info";
      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(row.date || "-")}</td>
          <td>${escapeHtml(fishLabel)}</td>
          <td>${Math.max(1, Math.round(numberOr(row.fish_count, 1)))}</td>
          <td>${numberOr(row.full_qty_kg, 0).toFixed(2)}</td>
          <td>
            <input
              id="hold-cost-${row.id}"
              class="table-input hold-table-input"
              type="number"
              min="0"
              step="0.01"
              value="${numberOr(row.total_cost_lkr, 0)}"
              ${isMoved ? "disabled" : ""}
            />
          </td>
          <td>
            <input
              id="hold-waste-${row.id}"
              class="table-input hold-table-input"
              type="number"
              min="0"
              step="0.01"
              value="${numberOr(row.waste_qty_kg, 0)}"
              ${isMoved ? "disabled" : ""}
            />
          </td>
          <td>${numberOr(row.usable_qty_kg, 0).toFixed(2)}</td>
          <td>${Math.round(numberOr(row.cost_per_kg, 0)).toLocaleString()}</td>
          <td>
            <input
              id="hold-profit-${row.id}"
              class="table-input hold-table-input"
              type="number"
              min="0"
              step="0.01"
              value="${numberOr(row.profit_margin_per_kg, 0)}"
              ${isMoved ? "disabled" : ""}
            />
          </td>
          <td>${Math.round(numberOr(row.sell_price_per_kg, 0)).toLocaleString()}</td>
          <td><span class="chip ${statusClass}">${statusText}</span></td>
          <td>
            <div class="table-actions">
              <button
                type="button"
                class="btn btn-soft hold-cut-btn"
                data-hold-id="${escapeHtml(row.id)}"
                ${isMoved ? "disabled" : ""}
              >
                Cut
              </button>
              <button
                type="button"
                class="btn btn-primary hold-move-btn"
                data-hold-id="${escapeHtml(row.id)}"
                ${isMoved || status !== "cut" ? "disabled" : ""}
              >
                Move
              </button>
              <button type="button" class="btn btn-danger hold-delete-btn" data-hold-id="${escapeHtml(row.id)}">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const codeOptions = DATA.fish_profiles
    .filter((fish) => fish.status === "active")
    .map(
      (fish) =>
        `<option value="${escapeHtml(fish.fish_code)}">${escapeHtml(fish.name)} (${escapeHtml(
          fish.fish_code
        )})</option>`
    )
    .join("");

  return `
    <section class="card section-gap">
      <div class="card-header"><h3>Add Hold Stock (${escapeHtml(state.date)})</h3></div>
      <form id="holdStockForm" class="form-grid">
        <input
          id="holdFishCodeInput"
          list="holdFishCodeList"
          type="text"
          placeholder="Fish code or name (e.g. FISH-TUNA)"
          required
        />
        <datalist id="holdFishCodeList">${codeOptions}</datalist>
        <input id="holdFishCountInput" type="number" min="1" step="1" value="1" placeholder="Whole fish count" required />
        <input id="holdFullKgInput" type="number" min="0" step="0.01" placeholder="Full fish kg" required />
        <input id="holdTotalCostInput" type="number" min="0" step="0.01" placeholder="Total cost (LKR)" required />
        <button class="btn btn-primary" type="submit">Add Stock</button>
      </form>
      <p class="page-note">Workflow: Add Stock -> Cut -> Move. Move updates same-day current stock, wastage, and daily prices.</p>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Hold Stock Records</h3></div>
      <div class="table-search">
        <input
          id="holdStockSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish code or name"
          value="${escapeHtml(state.quickSearch.holdStock)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hold Date</th>
              <th>Fish</th>
              <th>Count</th>
              <th>Full Kg</th>
              <th>Total Cost</th>
              <th>Waste Kg</th>
              <th>Remaining Kg</th>
              <th>Cost/Kg</th>
              <th>Profit/Kg</th>
              <th>Sell/Kg</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="holdStockTableBody">
            ${rows || '<tr><td colspan="12" class="empty-state">No hold stock records found for this branch/date scope.</td></tr>'}
            ${
              rows
                ? '<tr id="holdStockSearchEmptyRow" class="hidden"><td colspan="12" class="empty-state">No fish match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderShopOrdersPage() {
  const accessibleBranches = getAccessibleBranches(state.currentUser);
  if (accessibleBranches.length === 0) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Shop Orders</h3></div>
        <p class="empty-state">No branches available for this user.</p>
      </section>
    `;
  }

  if (!state.shopOrderDraftBranchId) {
    state.shopOrderDraftBranchId = isAllBranchesSelected()
      ? accessibleBranches[0]?.id || ""
      : state.branchId || accessibleBranches[0]?.id || "";
  }
  if (!accessibleBranches.some((branch) => branch.id === state.shopOrderDraftBranchId)) {
    state.shopOrderDraftBranchId = accessibleBranches[0]?.id || "";
  }
  if (!Array.isArray(state.shopOrderDraftItems)) {
    state.shopOrderDraftItems = [];
  }

  const scopeBranchIds = shopOrderScopeBranchIds();
  const scopeBranchSet = new Set(scopeBranchIds);
  const orders = DATA.shop_orders
    .filter((row) => {
      if (normalizeOrderChannel(row.order_channel) !== ORDER_CHANNEL_SHOP) {
        return false;
      }
      if (!scopeBranchSet.has(row.branch_id)) {
        return false;
      }
      return String(row.date || "") === state.date;
    })
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  const totals = orders.reduce(
    (acc, row) => {
      acc.totalAmount = round2(acc.totalAmount + numberOr(row.total_amount, 0));
      acc.totalPaid = round2(acc.totalPaid + numberOr(row.amount_paid, 0));
      acc.totalBalance = round2(acc.totalBalance + numberOr(row.balance_due, 0));
      if (String(row.payment_status || "").toUpperCase() === "UNPAID") {
        acc.unpaidCount += 1;
      }
      return acc;
    },
    { totalAmount: 0, totalPaid: 0, totalBalance: 0, unpaidCount: 0 }
  );

  const fishOptions = DATA.fish_profiles
    .filter((fish) => fish.status === "active")
    .map((fish) => {
      const label = `${escapeHtml(String(fish.name || fish.fish_code || fish.id))} (${escapeHtml(
        String(fish.fish_code || fish.id)
      )})`;
      const byCode = fish.fish_code ? `<option value="${escapeHtml(fish.fish_code)}">${label}</option>` : "";
      const byName =
        fish.name && String(fish.name).toLowerCase() !== String(fish.fish_code || "").toLowerCase()
          ? `<option value="${escapeHtml(fish.name)}">${label}</option>`
          : "";
      return `${byCode}${byName}`;
    })
    .join("");

  const draftRows = state.shopOrderDraftItems
    .map(
      (item, index) => `
        <tr>
          <td>${escapeHtml(item.fish_name)} (${escapeHtml(item.fish_code)})</td>
          <td>${numberOr(item.qty_kg, 0).toFixed(2)}</td>
          <td>${money(numberOr(item.special_price_per_kg, 0))}</td>
          <td>${money(numberOr(item.line_total, 0))}</td>
          <td>
            <button type="button" class="btn btn-danger shop-order-line-remove-btn" data-item-index="${index}">
              Remove
            </button>
          </td>
        </tr>
      `
    )
    .join("");
  const draftTotal = round2(
    state.shopOrderDraftItems.reduce((sum, item) => sum + numberOr(item.line_total, 0), 0)
  );

  const branchOptions = accessibleBranches
    .map(
      (branch) =>
        `<option value="${branch.id}" ${branch.id === state.shopOrderDraftBranchId ? "selected" : ""}>${escapeHtml(
          branch.name
        )}</option>`
    )
    .join("");

  const rows = orders
    .map((order) => {
      const branch = findBranchById(order.branch_id);
      const status = String(order.payment_status || "UNPAID").toUpperCase();
      const shopStatus = normalizeShopStatus(order.shop_status);
      const statusClass = status === "PAID" ? "ok" : status === "PARTIAL" ? "warning" : "critical";
      const searchable = [
        String(order.shop_name || "").toLowerCase(),
        shopStatus,
        String(order.invoice_no || "").toLowerCase(),
        String(branch?.name || order.branch_id || "").toLowerCase(),
        String(order.notes || "").toLowerCase(),
        String(order.shop_requests || "").toLowerCase(),
        formatShopOrderItemLines(order).toLowerCase()
      ].join(" ");

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(order.invoice_no || order.id)}</td>
          <td>${escapeHtml(branch?.name || order.branch_id || "-")}</td>
          <td>${escapeHtml(order.shop_name || "-")}</td>
          <td>
            <select id="shop-order-status-${order.id}" class="table-select">
              <option value="open" ${shopStatus === "open" ? "selected" : ""}>Open</option>
              <option value="closed" ${shopStatus === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </td>
          <td>${escapeHtml(formatShopOrderItemLines(order))}</td>
          <td>${money(numberOr(order.total_amount, 0))}</td>
          <td>
            <input
              id="shop-order-paid-${order.id}"
              class="table-input"
              type="number"
              min="0"
              step="0.01"
              value="${numberOr(order.amount_paid, 0)}"
            />
          </td>
          <td>${money(numberOr(order.balance_due, 0))}</td>
          <td><span class="chip ${statusClass}">${status}</span></td>
          <td>
            <select id="shop-order-method-${order.id}" class="table-select">
              <option value="cash" ${normalizePaymentMethod(order.payment_method) === "cash" ? "selected" : ""}>Cash</option>
              <option value="bank" ${normalizePaymentMethod(order.payment_method) === "bank" ? "selected" : ""}>Bank</option>
              <option value="card" ${normalizePaymentMethod(order.payment_method) === "card" ? "selected" : ""}>Card</option>
              <option value="online" ${normalizePaymentMethod(order.payment_method) === "online" ? "selected" : ""}>Online</option>
              <option value="credit" ${normalizePaymentMethod(order.payment_method) === "credit" ? "selected" : ""}>Credit</option>
            </select>
            <select id="shop-order-terms-${order.id}" class="table-select" style="margin-top:6px;">
              <option value="immediate" ${normalizePaymentTerms(order.payment_terms) === "immediate" ? "selected" : ""}>Immediate</option>
              <option value="7_days" ${normalizePaymentTerms(order.payment_terms) === "7_days" ? "selected" : ""}>7 days</option>
              <option value="15_days" ${normalizePaymentTerms(order.payment_terms) === "15_days" ? "selected" : ""}>15 days</option>
              <option value="month_end" ${normalizePaymentTerms(order.payment_terms) === "month_end" ? "selected" : ""}>Month end</option>
            </select>
          </td>
          <td>
            <input
              id="shop-order-notes-${order.id}"
              class="table-input"
              type="text"
              value="${escapeHtml(order.notes || "")}"
              placeholder="Internal note"
            />
            <input
              id="shop-order-requests-${order.id}"
              class="table-input"
              type="text"
              value="${escapeHtml(order.shop_requests || "")}"
              placeholder="Shop requests / feedback"
              style="margin-top:6px;"
            />
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-primary shop-order-save-btn" data-order-id="${order.id}">
                Save
              </button>
              <button type="button" class="btn btn-soft shop-order-paid-btn" data-order-id="${order.id}">
                Mark Paid
              </button>
              <button type="button" class="btn btn-outline shop-order-invoice-btn" data-order-id="${order.id}">
                Invoice
              </button>
              <button type="button" class="btn btn-danger shop-order-delete-btn" data-order-id="${order.id}">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Orders</p><h2>${orders.length}</h2></article>
      <article class="kpi-card"><p>Unpaid Orders</p><h2>${totals.unpaidCount}</h2></article>
      <article class="kpi-card"><p>Total Amount</p><h2>${money(totals.totalAmount)}</h2></article>
      <article class="kpi-card"><p>Total Paid</p><h2>${money(totals.totalPaid)}</h2></article>
      <article class="kpi-card"><p>Balance Due</p><h2>${money(totals.totalBalance)}</h2></article>
    </section>

    <section class="card section-gap">
      <div class="card-header"><h3>Create Shop Order (${escapeHtml(state.date)})</h3></div>
      <form id="shopOrderCreateForm" class="form-grid">
        <select id="shopOrderBranchInput" ${canSelectAllBranches(state.currentUser) ? "" : "disabled"}>
          ${branchOptions}
        </select>
        <input id="shopOrderShopNameInput" type="text" placeholder="Shop / Hotel / Restaurant name" required />
        <select id="shopOrderStatusInput">
          <option value="open" selected>Open</option>
          <option value="closed">Closed</option>
        </select>
        <input id="shopOrderInvoiceInput" type="text" placeholder="Invoice no (optional: auto)" />
        <select id="shopOrderPaymentMethodInput">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="card">Card</option>
          <option value="online">Online</option>
          <option value="credit">Credit</option>
        </select>
        <select id="shopOrderPaymentTermsInput">
          <option value="immediate">Immediate</option>
          <option value="7_days">7 days</option>
          <option value="15_days">15 days</option>
          <option value="month_end">Month end</option>
        </select>
        <input id="shopOrderAmountPaidInput" type="number" min="0" step="0.01" placeholder="Amount paid now" value="0" />
        <textarea id="shopOrderNotesInput" class="full-width" rows="2" placeholder="Internal notes (optional)"></textarea>
        <textarea id="shopOrderRequestsInput" class="full-width" rows="2" placeholder="Shop requests / suggestions / special instructions"></textarea>

        <input id="shopOrderFishInput" list="shopOrderFishList" type="text" placeholder="Fish code or name" />
        <datalist id="shopOrderFishList">${fishOptions}</datalist>
        <input id="shopOrderQtyInput" type="number" min="0" step="0.01" placeholder="Qty kg" />
        <input id="shopOrderSpecialPriceInput" type="number" min="0" step="0.01" placeholder="Special price per kg" />
        <button class="btn btn-soft" type="button" id="addShopOrderLineBtn">Add Fish Line</button>
        <button class="btn btn-primary" type="submit">Create Order</button>
      </form>

      <div class="table-wrap" style="margin-top:10px;">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Qty (kg)</th>
              <th>Special Price</th>
              <th>Line Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="shopOrderDraftTableBody">
            ${
              draftRows ||
              '<tr><td colspan="5" class="empty-state">No fish lines added yet.</td></tr>'
            }
          </tbody>
        </table>
      </div>
      <p class="page-note">Draft invoice total: <strong>${money(draftTotal)}</strong></p>
      <p class="page-note">
        Finance options included: payment method, payment terms, paid amount, balance due, notes, and shop request text.
      </p>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Shop Orders List (${escapeHtml(state.date)})</h3></div>
      <div class="table-search">
        <input
          id="shopOrdersSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by shop, status, invoice, fish, notes, or branch"
          value="${escapeHtml(state.quickSearch.shopOrders)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Branch</th>
              <th>Shop</th>
              <th>Shop Status</th>
              <th>Fish Lines</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Finance</th>
              <th>Notes / Requests</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="shopOrdersTableBody">
            ${
              rows ||
              '<tr><td colspan="12" class="empty-state">No shop orders for selected date and scope.</td></tr>'
            }
            ${
              rows
                ? '<tr id="shopOrdersSearchEmptyRow" class="hidden"><td colspan="12" class="empty-state">No shop orders match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderShopStatusPage() {
  const accessibleBranches = getAccessibleBranches(state.currentUser);
  if (accessibleBranches.length === 0) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Shop Status</h3></div>
        <p class="empty-state">No branches available for this user.</p>
      </section>
    `;
  }

  const scopeBranchIds = shopOrderScopeBranchIds();
  const scopeBranchSet = new Set(scopeBranchIds);
  const orders = DATA.shop_orders
    .filter((row) => {
      if (!isShopOrderRow(row)) {
        return false;
      }
      if (!scopeBranchSet.has(row.branch_id)) {
        return false;
      }
      return String(row.date || "") === state.date;
    })
    .sort((a, b) =>
      String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || ""))
    );

  const totals = orders.reduce(
    (acc, order) => {
      const status = normalizeShopStatus(order.shop_status);
      if (status === "closed") {
        acc.closed += 1;
      } else {
        acc.open += 1;
      }
      return acc;
    },
    { open: 0, closed: 0 }
  );

  const rows = orders
    .map((order) => {
      const branch = findBranchById(order.branch_id);
      const status = normalizeShopStatus(order.shop_status);
      const updatedAt = String(order.updated_at || order.created_at || "")
        .replace("T", " ")
        .replace("Z", "");
      const searchable = [
        String(order.shop_name || "").toLowerCase(),
        String(order.invoice_no || "").toLowerCase(),
        String(branch?.name || order.branch_id || "").toLowerCase(),
        status
      ].join(" ");

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(order.invoice_no || order.id)}</td>
          <td>${escapeHtml(branch?.name || order.branch_id || "-")}</td>
          <td>${escapeHtml(order.shop_name || "-")}</td>
          <td>
            <select id="shop-status-select-${order.id}" class="table-select">
              <option value="open" ${status === "open" ? "selected" : ""}>Open</option>
              <option value="closed" ${status === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </td>
          <td>${escapeHtml(updatedAt || "-")}</td>
          <td>
            <button type="button" class="btn btn-primary shop-status-save-btn" data-order-id="${order.id}">
              Save
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Total Shops</p><h2>${orders.length}</h2></article>
      <article class="kpi-card"><p>Open</p><h2>${totals.open}</h2></article>
      <article class="kpi-card"><p>Closed</p><h2>${totals.closed}</h2></article>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Shop Status (${escapeHtml(state.date)})</h3></div>
      <p class="page-note">Update open/closed status for each shop order.</p>
      <div class="table-search">
        <input
          id="shopStatusSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by shop, status, invoice, or branch"
          value="${escapeHtml(state.quickSearch.shopStatus)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Branch</th>
              <th>Shop</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="shopStatusTableBody">
            ${
              rows ||
              '<tr><td colspan="6" class="empty-state">No shop orders found for selected date and scope.</td></tr>'
            }
            ${
              rows
                ? '<tr id="shopStatusSearchEmptyRow" class="hidden"><td colspan="6" class="empty-state">No shops match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderBillingPage() {
  const accessibleBranches = getAccessibleBranches(state.currentUser);
  if (accessibleBranches.length === 0) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Billing</h3></div>
        <p class="empty-state">No branches available for this user.</p>
      </section>
    `;
  }

  if (!state.billingDraftBranchId) {
    state.billingDraftBranchId = isAllBranchesSelected()
      ? accessibleBranches[0]?.id || ""
      : state.branchId || accessibleBranches[0]?.id || "";
  }
  if (!accessibleBranches.some((branch) => branch.id === state.billingDraftBranchId)) {
    state.billingDraftBranchId = accessibleBranches[0]?.id || "";
  }
  if (!Array.isArray(state.billingDraftItems)) {
    state.billingDraftItems = [];
  }
  if (!state.billingDraftCategory) {
    state.billingDraftCategory = BILLING_CATEGORY_ALL;
  }

  const pricedFishEntries = DATA.fish_profiles
    .filter((fish) => fish.status === "active")
    .map((fish) => {
      const priceRow = getDailyPrice(state.billingDraftBranchId, state.date, fish.id, "morning");
      const defaultPrice = Math.max(0, round2(numberOr(priceRow?.sell_price_per_unit, 0)));
      const availableKg = getBillingAvailableStockKg(state.billingDraftBranchId, state.date, fish.id);
      return { fish, defaultPrice, availableKg };
    })
    .filter((entry) => entry.defaultPrice > 0);

  const allCategories = [
    ...new Set(
      pricedFishEntries
        .map((entry) => String(entry.fish.category || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
  const selectedCategory = [BILLING_CATEGORY_ALL, ...allCategories].includes(state.billingDraftCategory)
    ? state.billingDraftCategory
    : BILLING_CATEGORY_ALL;
  state.billingDraftCategory = selectedCategory;

  const searchTokens = normalizeSearchTokens(state.billingDraftSearch);
  const fishCards = pricedFishEntries
    .filter((entry) => {
      const fish = entry.fish;
      if (selectedCategory !== BILLING_CATEGORY_ALL && String(fish.category || "") !== selectedCategory) {
        return false;
      }
      const searchText = `${fishSearchText(fish, fish.id)} ${String(fish.category || "").toLowerCase()}`;
      return searchTokens.every((token) => searchText.includes(token));
    })
    .sort((a, b) => String(a.fish.name || "").localeCompare(String(b.fish.name || "")));

  const productCards = fishCards
    .map((entry) => {
      const fish = entry.fish;
      const defaultPrice = entry.defaultPrice;
      const availableKg = entry.availableKg;
      const hasStock = availableKg > 0;
      const title = String(fish.name || fish.fish_code || fish.id);
      const label = fishDisplayLabel(fish, fish.id);
      const hasPhoto = Boolean(String(fish.photo || "").trim());
      const avatar = hasPhoto
        ? `<span class="billing-pos-product-avatar has-photo"><img src="${escapeHtml(
            String(fish.photo || "")
          )}" alt="${escapeHtml(title)}" loading="lazy" /></span>`
        : `<span class="billing-pos-product-avatar">${escapeHtml(getInitials(title))}</span>`;
      return `
        <button
          type="button"
          class="billing-pos-product-btn ${hasStock ? "" : "out-of-stock"}"
          data-fish-id="${escapeHtml(fish.id)}"
          data-default-price="${defaultPrice}"
          data-stock-kg="${availableKg}"
          title="${escapeHtml(label)}"
          ${hasStock ? "" : "disabled"}
        >
          <span class="billing-pos-product-price">${money(defaultPrice)}</span>
          ${avatar}
          <span class="billing-pos-product-name">${escapeHtml(title)}</span>
          <span class="billing-pos-product-meta">${escapeHtml(String(fish.category || "General"))}</span>
          <span class="billing-pos-product-stock ${hasStock ? "in-stock" : "out-stock"}">${
            hasStock ? `Stock: ${availableKg.toFixed(2)} kg` : "Stock not available"
          }</span>
        </button>
      `;
    })
    .join("");

  const branchOptions = accessibleBranches
    .map(
      (branch) =>
        `<option value="${branch.id}" ${branch.id === state.billingDraftBranchId ? "selected" : ""}>${escapeHtml(
          branch.name
        )}</option>`
    )
    .join("");

  const draftTotal = round2(
    state.billingDraftItems.reduce((sum, item) => sum + numberOr(item.line_total, 0), 0)
  );
  const amountPaid = Math.max(0, round2(numberOr(state.billingDraftAmountPaid, 0)));
  const balanceDue = round2(Math.abs(draftTotal - amountPaid));
  const itemCount = state.billingDraftItems.length;

  const draftLines = state.billingDraftItems
    .map(
      (item, index) => `
        <article class="billing-pos-cart-line">
          <div class="billing-pos-cart-line-head">
            <strong>${escapeHtml(item.fish_name)}</strong>
            <button type="button" class="btn btn-danger billing-line-remove-btn" data-item-index="${index}">Remove</button>
          </div>
          <p class="billing-pos-cart-line-meta">${escapeHtml(item.fish_code)}</p>
          <div class="billing-pos-cart-line-edit">
            <input
              class="table-input billing-line-qty-input"
              type="number"
              min="0.01"
              step="0.01"
              data-item-index="${index}"
              value="${numberOr(item.qty_kg, 0)}"
              aria-label="Qty kg"
            />
            <input
              class="table-input billing-line-price-input"
              type="number"
              min="0.01"
              step="0.01"
              data-item-index="${index}"
              value="${numberOr(item.special_price_per_kg, 0)}"
              aria-label="Price per kg"
            />
            <strong>${money(numberOr(item.line_total, 0))}</strong>
          </div>
        </article>
      `
    )
    .join("");

  const scopeBranchSet = new Set(shopOrderScopeBranchIds());
  const recentBills = DATA.customer_bills
    .filter((row) => scopeBranchSet.has(row.branch_id) && String(row.date || "") === state.date)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 8);
  if (
    state.billingRecentDetailsId &&
    !recentBills.some((row) => String(row.id || "") === state.billingRecentDetailsId)
  ) {
    state.billingRecentDetailsId = "";
  }
  const recentBillRows = recentBills
    .map((row) => {
      const status = String(row.payment_status || "UNPAID").toUpperCase();
      const statusClass = status === "PAID" ? "ok" : status === "PARTIAL" ? "warning" : "critical";
      const isDetailsOpen = state.billingRecentDetailsId === String(row.id || "");
      const rowTotalAmount = round2(numberOr(row.total_amount, 0));
      const rowNetTotal = rowTotalAmount;
      const rowPaidAmount = Math.max(0, round2(numberOr(row.amount_paid, 0)));
      const rowBalanceAmount = round2(Math.abs(rowTotalAmount - rowPaidAmount));
      const itemLines = (Array.isArray(row.items) ? row.items : [])
        .map(
          (item) =>
            `<li>${escapeHtml(String(item.fish_name || item.fish_code || "-"))} (${escapeHtml(
              String(item.fish_code || "-")
            )}) - ${numberOr(item.qty_kg, 0).toFixed(2)} kg x ${money(numberOr(
              item.special_price_per_kg,
              0
            ))} = ${money(numberOr(item.line_total, 0))}</li>`
        )
        .join("");
      return `
        <article class="billing-pos-recent-row">
          <div>
            <strong>${escapeHtml(row.invoice_no || row.id)}</strong>
            <p>${escapeHtml(row.shop_name || "-")}</p>
          </div>
          <div class="billing-pos-recent-amount">${money(numberOr(row.total_amount, 0))}</div>
          <span class="chip ${statusClass}">${status}</span>
          <div class="billing-pos-recent-actions">
            <button type="button" class="btn btn-soft billing-recent-details-btn" data-order-id="${row.id}">${
              isDetailsOpen ? "Hide" : "Details"
            }</button>
            <button type="button" class="btn btn-outline billing-recent-invoice-btn" data-order-id="${row.id}">Download</button>
            ${
              status !== "PAID"
                ? `<button type="button" class="btn btn-soft billing-recent-paid-btn" data-order-id="${row.id}">Paid</button>`
                : ""
            }
            <button type="button" class="btn btn-danger billing-recent-delete-btn" data-order-id="${row.id}">Delete</button>
          </div>
          ${
            isDetailsOpen
              ? `
                <div class="billing-pos-recent-details">
                  <div class="billing-pos-recent-meta">
                    <p><strong>Payment:</strong> ${escapeHtml(paymentMethodLabel(row.payment_method))}</p>
                    <p><strong>Terms:</strong> ${escapeHtml(paymentTermsLabel(row.payment_terms))}</p>
                    <p><strong>Net Total:</strong> ${money(rowNetTotal)}</p>
                    <p><strong>Paid:</strong> ${money(rowPaidAmount)}</p>
                    <p><strong>Balance:</strong> ${money(rowBalanceAmount)}</p>
                  </div>
                  <p class="billing-pos-recent-note"><strong>Notes:</strong> ${escapeHtml(row.notes || "-")}</p>
                  <p class="billing-pos-recent-note"><strong>Requests:</strong> ${escapeHtml(row.shop_requests || "-")}</p>
                  <ul class="billing-pos-recent-items">
                    ${itemLines || '<li class="empty-state">No fish lines in this bill.</li>'}
                  </ul>
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");

  return `
    <section class="billing-pos-shell">
      <aside class="billing-pos-categories">
        <h3>Categories</h3>
        <button
          type="button"
          class="billing-pos-category-btn ${selectedCategory === BILLING_CATEGORY_ALL ? "active" : ""}"
          data-category="${BILLING_CATEGORY_ALL}"
        >
          All Fish
        </button>
        ${allCategories
          .map(
            (category) => `
              <button
                type="button"
                class="billing-pos-category-btn ${selectedCategory === category ? "active" : ""}"
                data-category="${escapeHtml(category)}"
              >
                ${escapeHtml(category)}
              </button>
            `
          )
          .join("")}
      </aside>

      <section class="billing-pos-products">
        <div class="billing-pos-toolbar">
          <select id="billingBranchInput" ${canSelectAllBranches(state.currentUser) ? "" : "disabled"}>
            ${branchOptions}
          </select>
          <input
            id="billingFishSearchInput"
            type="search"
            placeholder="Search fish by code/name"
            value="${escapeHtml(state.billingDraftSearch)}"
          />
        </div>
        <div class="billing-pos-grid">
          ${
            productCards ||
            '<p class="empty-state">No fish with daily price set for selected branch/date/category.</p>'
          }
        </div>
      </section>

      <aside class="billing-pos-cart">
        <form id="billingCreateForm" class="billing-pos-cart-form">
          <div class="billing-pos-cart-head">
            <h3>Daily Sell Bill</h3>
            <p>${escapeHtml(state.date)}</p>
          </div>
          <input id="billingCustomerNameInput" type="text" placeholder="Customer name (auto ID if empty)" value="${escapeHtml(
            state.billingDraftCustomerName
          )}" />
          <input id="billingInvoiceInput" type="text" placeholder="Bill no (auto if empty)" value="${escapeHtml(
            state.billingDraftInvoiceNo
          )}" />
          <div class="billing-pos-cart-fields">
            <select id="billingPaymentMethodInput">
              <option value="cash" ${normalizePaymentMethod(state.billingDraftPaymentMethod) === "cash" ? "selected" : ""}>Cash</option>
              <option value="bank" ${normalizePaymentMethod(state.billingDraftPaymentMethod) === "bank" ? "selected" : ""}>Bank</option>
              <option value="card" ${normalizePaymentMethod(state.billingDraftPaymentMethod) === "card" ? "selected" : ""}>Card</option>
              <option value="online" ${normalizePaymentMethod(state.billingDraftPaymentMethod) === "online" ? "selected" : ""}>Online</option>
              <option value="credit" ${normalizePaymentMethod(state.billingDraftPaymentMethod) === "credit" ? "selected" : ""}>Credit</option>
            </select>
            <select id="billingPaymentTermsInput">
              <option value="immediate" ${normalizePaymentTerms(state.billingDraftPaymentTerms) === "immediate" ? "selected" : ""}>Immediate</option>
              <option value="7_days" ${normalizePaymentTerms(state.billingDraftPaymentTerms) === "7_days" ? "selected" : ""}>7 days</option>
              <option value="15_days" ${normalizePaymentTerms(state.billingDraftPaymentTerms) === "15_days" ? "selected" : ""}>15 days</option>
              <option value="month_end" ${normalizePaymentTerms(state.billingDraftPaymentTerms) === "month_end" ? "selected" : ""}>Month end</option>
            </select>
          </div>
          <div class="billing-pos-payment-fields">
            <label class="billing-pos-payment-field" for="billingAmountPaidInput">
              <span>Customer paid amount</span>
              <input
                id="billingAmountPaidInput"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount paid"
                value="${numberOr(state.billingDraftAmountPaid, 0)}"
              />
            </label>
            <label class="billing-pos-payment-field" for="billingBalancePreviewInput">
              <span>Balance amount</span>
              <input
                id="billingBalancePreviewInput"
                type="text"
                value="${money(balanceDue)}"
                readonly
              />
            </label>
          </div>
          <textarea id="billingNotesInput" rows="2" placeholder="Internal notes">${escapeHtml(
            state.billingDraftNotes
          )}</textarea>
          <textarea id="billingRequestsInput" rows="2" placeholder="Customer requests">${escapeHtml(
            state.billingDraftRequests
          )}</textarea>

          <div class="billing-pos-cart-lines">
            ${
              draftLines ||
              '<p class="empty-state">No fish lines. Click fish cards to add to bill.</p>'
            }
          </div>

          <div class="billing-pos-cart-summary">
            <p><span>Items</span><strong>${itemCount}</strong></p>
            <p><span>Total</span><strong id="billingDraftTotalText">${money(draftTotal)}</strong></p>
            <p><span>Paid</span><strong id="billingDraftPaidText">${money(amountPaid)}</strong></p>
            <p><span>Balance</span><strong id="billingDraftBalanceText">${money(balanceDue)}</strong></p>
          </div>

          <div class="billing-pos-cart-actions">
            <button type="button" class="btn btn-outline" id="billingClearDraftBtn">Clear</button>
            <button class="btn btn-primary billing-pos-pay-btn" type="submit">PAY ${money(draftTotal)}</button>
          </div>
        </form>

        <div class="billing-pos-recent">
          <h3>Today Bills</h3>
          ${
            recentBillRows ||
            '<p class="empty-state">No bills yet for selected date/scope.</p>'
          }
        </div>
      </aside>
    </section>
  `;
}

function renderRemainingStockHoldsPage() {
  const scopedBranchIds = getBranchScopeIds(state.branchId);
  const branchSet = new Set(scopedBranchIds);

  if (branchSet.size === 0) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Current Stocks & Holds</h3></div>
        <p class="empty-state">No branches available for this user.</p>
      </section>
    `;
  }

  const remainingRows = DATA.daily_stock_entry
    .filter(
      (row) =>
        branchSet.has(row.branch_id) &&
        row.date === state.date &&
        numberOr(row.closing_qty, 0) > 0
    )
    .sort((a, b) => {
      const aFish = findFishById(a.fish_id);
      const bFish = findFishById(b.fish_id);
      const byFish = String(aFish?.name || a.fish_id || "").localeCompare(
        String(bFish?.name || b.fish_id || "")
      );
      if (byFish !== 0) {
        return byFish;
      }
      return String(a.branch_id || "").localeCompare(String(b.branch_id || ""));
    })
    .map((row) => {
      const fish = findFishById(row.fish_id);
      const branch = findBranchById(row.branch_id);
      const setting = getBranchSetting(row.branch_id, row.fish_id);
      const closingQty = Math.max(0, round2(numberOr(row.closing_qty, 0)));
      const wasteQty = Math.max(0, round2(numberOr(row.waste_qty, 0)));
      const minStock = Math.max(0, round2(numberOr(setting?.min_stock, 0)));
      const targetStock = Math.max(0, round2(numberOr(setting?.target_stock, 0)));
      const alert = stockAlert(closingQty, minStock, targetStock);
      const searchable = [
        fishSearchText(fish, row.fish_id),
        String(branch?.name || row.branch_id || "").toLowerCase(),
        String(alert || "").toLowerCase()
      ].join(" ");

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(fishDisplayLabel(fish, row.fish_id))}</td>
          <td>${escapeHtml(branch?.name || row.branch_id || "-")}</td>
          <td>${closingQty.toFixed(2)}</td>
          <td>${wasteQty.toFixed(2)}</td>
          <td>${minStock.toFixed(2)}</td>
          <td>${targetStock.toFixed(2)}</td>
          <td><span class="chip ${alert.toLowerCase()}">${alert}</span></td>
        </tr>
      `;
    })
    .join("");

  const holdRows = DATA.hold_stock_entry
    .filter((row) => {
      const status = String(row.status || "raw").toLowerCase();
      return (
        branchSet.has(row.branch_id) &&
        String(row.date || "") <= state.date &&
        status !== "moved" &&
        numberOr(row.usable_qty_kg, 0) > 0
      );
    })
    .sort((a, b) => {
      const byDate = String(b.date || "").localeCompare(String(a.date || ""));
      if (byDate !== 0) {
        return byDate;
      }
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    })
    .map((row) => {
      const fish = findFishById(row.fish_id);
      const branch = findBranchById(row.branch_id);
      const status = String(row.status || "raw").toLowerCase();
      const statusText = status === "cut" ? "CUT" : "RAW";
      const statusClass = status === "cut" ? "warning" : "info";
      const searchable = [
        fishSearchText(fish, row.fish_code || row.fish_id),
        String(branch?.name || row.branch_id || "").toLowerCase(),
        status,
        String(row.date || "").toLowerCase()
      ].join(" ");

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(fishDisplayLabel(fish, row.fish_code || row.fish_id))}</td>
          <td>${escapeHtml(branch?.name || row.branch_id || "-")}</td>
          <td>${escapeHtml(row.date || "-")}</td>
          <td><span class="chip ${statusClass}">${statusText}</span></td>
          <td>${Math.max(1, Math.round(numberOr(row.fish_count, 1)))}</td>
          <td>${Math.max(0, round2(numberOr(row.full_qty_kg, 0))).toFixed(2)}</td>
          <td>${Math.max(0, round2(numberOr(row.waste_qty_kg, 0))).toFixed(2)}</td>
          <td>${Math.max(0, round2(numberOr(row.usable_qty_kg, 0))).toFixed(2)}</td>
          <td>${Math.round(numberOr(row.sell_price_per_kg, 0)).toLocaleString()}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="card wide section-gap">
      <div class="card-header"><h3>Current Stock (${escapeHtml(state.date)})</h3></div>
      <div class="table-search">
        <input
          id="remainingStocksSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish, branch, or status"
          value="${escapeHtml(state.quickSearch.remainingStocks)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Branch</th>
              <th>Current Kg</th>
              <th>Waste Kg</th>
              <th>Min Stock</th>
              <th>Target Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="remainingStocksTableBody">
            ${
              remainingRows ||
              '<tr><td colspan="7" class="empty-state">No current stock for selected date.</td></tr>'
            }
            ${
              remainingRows
                ? '<tr id="remainingStocksSearchEmptyRow" class="hidden"><td colspan="7" class="empty-state">No stock rows match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Open Hold Stocks (up to ${escapeHtml(state.date)})</h3></div>
      <div class="table-search">
        <input
          id="remainingHoldsSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish, branch, date, or status"
          value="${escapeHtml(state.quickSearch.remainingHolds)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Branch</th>
              <th>Hold Date</th>
              <th>Status</th>
              <th>Count</th>
              <th>Full Kg</th>
              <th>Waste Kg</th>
              <th>Remaining Kg</th>
              <th>Sell/Kg</th>
            </tr>
          </thead>
          <tbody id="remainingHoldsTableBody">
            ${holdRows || '<tr><td colspan="9" class="empty-state">No open hold stock rows.</td></tr>'}
            ${
              holdRows
                ? '<tr id="remainingHoldsSearchEmptyRow" class="hidden"><td colspan="9" class="empty-state">No hold rows match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderOpeningPage() {
  if (isAllBranchesSelected()) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Morning Opening Stock</h3></div>
        <p class="empty-state">Select a single branch to enter opening stock.</p>
      </section>
    `;
  }

  const settings = DATA.branch_fish_settings.filter(
    (row) => row.branch_id === state.branchId && row.is_active
  );
  const openingRows = settings
    .map((setting) => {
      const fish = findFishById(setting.fish_id);
      const entry = getStockEntry(state.branchId, state.date, setting.fish_id);
      const fishLabel = fishDisplayLabel(fish, setting.fish_id);
      const searchable = fishSearchText(fish, setting.fish_id);
      return `
        <tr data-fish-id="${setting.fish_id}" data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(fishLabel)}</td>
          <td><input class="table-input opening-input" type="number" step="0.01" value="${
            entry ? numberOr(entry.opening_qty, 0) : 0
          }" /></td>
          <td><input class="table-input purchase-input" type="number" step="0.01" value="${
            entry ? numberOr(entry.purchase_qty, 0) : 0
          }" /></td>
        </tr>
      `;
    });
  const rows = openingRows.join("");

  return `
    <section class="card wide">
      <div class="card-header"><h3>Morning Opening Stock</h3></div>
      <div class="table-search">
        <input
          id="openingStockSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish code or name"
          value="${escapeHtml(state.quickSearch.morningOpeningStock)}"
        />
      </div>
      <form id="openingForm">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fish</th>
                <th>Opening Qty</th>
                <th>Purchase Qty</th>
              </tr>
            </thead>
            <tbody id="openingStockTableBody">
              ${rows || '<tr><td colspan="3" class="empty-state">No active fish settings.</td></tr>'}
              ${
                rows
                  ? '<tr id="openingStockSearchEmptyRow" class="hidden"><td colspan="3" class="empty-state">No fish match your search.</td></tr>'
                  : ""
              }
            </tbody>
          </table>
        </div>
        <div class="inline-actions">
          <button class="btn btn-primary" type="submit">Save Opening Stock</button>
        </div>
      </form>
    </section>
  `;
}

function renderClosingPage() {
  if (isAllBranchesSelected()) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Night Closing Stock</h3></div>
        <p class="empty-state">Select a single branch to enter closing stock.</p>
      </section>
    `;
  }

  const settings = DATA.branch_fish_settings.filter(
    (row) => row.branch_id === state.branchId && row.is_active
  );
  const closingRows = settings
    .map((setting) => {
      const fish = findFishById(setting.fish_id);
      const entry = getStockEntry(state.branchId, state.date, setting.fish_id);
      const fishLabel = fishDisplayLabel(fish, setting.fish_id);
      const searchable = fishSearchText(fish, setting.fish_id);
      return `
        <tr data-fish-id="${setting.fish_id}" data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(fishLabel)}</td>
          <td><input class="table-input closing-input" type="number" step="0.01" value="${
            entry ? numberOr(entry.closing_qty, 0) : 0
          }" /></td>
        </tr>
      `;
    });
  const rows = closingRows.join("");

  return `
    <section class="card wide">
      <div class="card-header"><h3>Night Closing Stock</h3></div>
      <div class="table-search">
        <input
          id="closingStockSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish code or name"
          value="${escapeHtml(state.quickSearch.nightClosingStock)}"
        />
      </div>
      <form id="closingForm">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fish</th>
                <th>Closing Qty</th>
              </tr>
            </thead>
            <tbody id="closingStockTableBody">
              ${rows || '<tr><td colspan="2" class="empty-state">No active fish settings.</td></tr>'}
              ${
                rows
                  ? '<tr id="closingStockSearchEmptyRow" class="hidden"><td colspan="2" class="empty-state">No fish match your search.</td></tr>'
                  : ""
              }
            </tbody>
          </table>
        </div>
        <div class="inline-actions">
          <button class="btn btn-primary" type="submit">Save Closing Stock</button>
        </div>
      </form>
    </section>
  `;
}

function renderDailySummaryPage() {
  const { rows, totals } = buildSummary(state.branchId, state.date);
  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Total Revenue</p><h2>${money(totals.revenue)}</h2></article>
      <article class="kpi-card"><p>Total Cost</p><h2 class="cost-negative">${money(totals.cost)}</h2></article>
      <article class="kpi-card"><p>Total Profit</p><h2 class="${
        totals.profit >= 0 ? "profit-positive" : "profit-negative"
      }">${money(totals.profit)}</h2></article>
      <article class="kpi-card"><p>Total Sold</p><h2>${totals.sold.toFixed(2)}</h2></article>
    </section>
    ${renderDailySummaryTable(rows, { showSearch: true })}
  `;
}

function buildInterBranchTransferSuggestions(dateText) {
  const accessibleBranches = getAccessibleBranches(state.currentUser);
  const branchById = new Map(accessibleBranches.map((branch) => [branch.id, branch]));
  const branchSet = new Set(branchById.keys());
  const settingByBranchFish = new Map();

  for (const setting of DATA.branch_fish_settings) {
    if (!setting.is_active || !branchSet.has(setting.branch_id)) {
      continue;
    }
    settingByBranchFish.set(`${setting.branch_id}::${setting.fish_id}`, setting);
  }

  const plansByFish = new Map();
  let totalShortage = 0;
  let totalSurplus = 0;
  let criticalTargets = 0;

  for (const setting of settingByBranchFish.values()) {
    const fish = findFishById(setting.fish_id);
    if (fish && fish.status !== "active") {
      continue;
    }

    const entry = getStockEntry(setting.branch_id, dateText, setting.fish_id);
    const closing = Math.max(0, round2(numberOr(entry?.closing_qty, 0)));
    const minStock = Math.max(0, round2(numberOr(setting.min_stock, 0)));
    const targetStock = Math.max(minStock, round2(numberOr(setting.target_stock, 0)));
    const shortage = Math.max(0, round2(targetStock - closing));
    const surplus = Math.max(0, round2(closing - targetStock));
    const alert = stockAlert(closing, minStock, targetStock);

    let plan = plansByFish.get(setting.fish_id);
    if (!plan) {
      plan = { fish, deficits: [], surpluses: [] };
      plansByFish.set(setting.fish_id, plan);
    }

    const branchName = branchById.get(setting.branch_id)?.name || setting.branch_id;
    if (shortage > 0) {
      totalShortage = round2(totalShortage + shortage);
      if (alert === "CRITICAL") {
        criticalTargets += 1;
      }
      plan.deficits.push({
        branch_id: setting.branch_id,
        branch_name: branchName,
        closing,
        target_stock: targetStock,
        shortage,
        alert,
        moved: 0
      });
    }

    if (surplus > 0) {
      totalSurplus = round2(totalSurplus + surplus);
      plan.surpluses.push({
        branch_id: setting.branch_id,
        branch_name: branchName,
        closing,
        target_stock: targetStock,
        surplus,
        moved: 0
      });
    }
  }

  const ALERT_PRIORITY = { CRITICAL: 2, LOW: 1, OK: 0 };
  const suggestions = [];
  const uncoveredNeeds = [];

  for (const [fishId, plan] of plansByFish.entries()) {
    const fish = plan.fish || {
      id: fishId,
      fish_code: fishId,
      name: fishId,
      unit: "kg",
      status: "active"
    };
    const fishCode = String(fish.fish_code || fishId);
    const fishName = String(fish.name || fishId);
    const fishUnit = String(fish.unit || "kg");

    const deficits = [...plan.deficits].sort((a, b) => {
      const priorityDiff = ALERT_PRIORITY[b.alert] - ALERT_PRIORITY[a.alert];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return b.shortage - a.shortage;
    });
    const surpluses = [...plan.surpluses].sort((a, b) => b.surplus - a.surplus);

    for (const deficit of deficits) {
      for (const source of surpluses) {
        const remainingNeed = round2(Math.max(0, deficit.shortage - deficit.moved));
        const remainingSupply = round2(Math.max(0, source.surplus - source.moved));
        if (remainingNeed <= 0 || remainingSupply <= 0) {
          continue;
        }

        const qty = round2(Math.min(remainingNeed, remainingSupply));
        if (qty <= 0) {
          continue;
        }

        const fromClosingBefore = round2(source.closing - source.moved);
        const toClosingBefore = round2(deficit.closing + deficit.moved);

        source.moved = round2(source.moved + qty);
        deficit.moved = round2(deficit.moved + qty);

        suggestions.push({
          fish_id: fishId,
          fish_code: fishCode,
          fish_name: fishName,
          fish_unit: fishUnit,
          from_branch_id: source.branch_id,
          from_branch_name: source.branch_name,
          to_branch_id: deficit.branch_id,
          to_branch_name: deficit.branch_name,
          qty,
          target_alert: deficit.alert,
          from_closing_before: fromClosingBefore,
          from_closing_after: round2(fromClosingBefore - qty),
          to_closing_before: toClosingBefore,
          to_closing_after: round2(toClosingBefore + qty),
          target_stock: deficit.target_stock,
          remaining_need_after: round2(Math.max(0, deficit.shortage - deficit.moved))
        });
      }
    }

    for (const deficit of deficits) {
      const remaining = round2(Math.max(0, deficit.shortage - deficit.moved));
      if (remaining <= 0) {
        continue;
      }
      uncoveredNeeds.push({
        fish_id: fishId,
        fish_code: fishCode,
        fish_name: fishName,
        fish_unit: fishUnit,
        branch_id: deficit.branch_id,
        branch_name: deficit.branch_name,
        remaining_shortage: remaining,
        alert: deficit.alert
      });
    }
  }

  suggestions.sort((a, b) => {
    const priorityDiff = ALERT_PRIORITY[b.target_alert] - ALERT_PRIORITY[a.target_alert];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    if (b.qty !== a.qty) {
      return b.qty - a.qty;
    }
    if (a.to_branch_name !== b.to_branch_name) {
      return a.to_branch_name.localeCompare(b.to_branch_name);
    }
    return a.fish_name.localeCompare(b.fish_name);
  });

  uncoveredNeeds.sort((a, b) => {
    const priorityDiff = ALERT_PRIORITY[b.alert] - ALERT_PRIORITY[a.alert];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    if (b.remaining_shortage !== a.remaining_shortage) {
      return b.remaining_shortage - a.remaining_shortage;
    }
    if (a.branch_name !== b.branch_name) {
      return a.branch_name.localeCompare(b.branch_name);
    }
    return a.fish_name.localeCompare(b.fish_name);
  });

  const suggestedTotal = round2(suggestions.reduce((sum, row) => sum + row.qty, 0));
  const uncoveredTotal = round2(Math.max(0, totalShortage - suggestedTotal));
  const coveragePercent =
    totalShortage > 0 ? round2((suggestedTotal / totalShortage) * 100) : 100;

  return {
    branchCount: accessibleBranches.length,
    totalShortage,
    totalSurplus,
    suggestedTotal,
    uncoveredTotal,
    coveragePercent,
    criticalTargets,
    suggestions,
    uncoveredNeeds
  };
}

function renderTransferSuggestionsPage() {
  const model = buildInterBranchTransferSuggestions(state.date);

  let emptyMessage = "No transfer suggestions generated for this date.";
  if (model.totalShortage <= 0) {
    emptyMessage = "No shortage found. All branches are at or above target stock.";
  } else if (model.totalSurplus <= 0) {
    emptyMessage = "Shortage exists, but no branch has surplus stock above target.";
  }

  const suggestionsRows =
    model.suggestions.length === 0
      ? `<tr><td colspan="10" class="empty-state">${escapeHtml(emptyMessage)}</td></tr>`
      : model.suggestions
          .map((row) => {
            const searchable = `${row.fish_code} ${row.fish_name} ${row.from_branch_name} ${row.to_branch_name}`.toLowerCase();
            return `
              <tr data-fish-search="${escapeHtml(searchable)}">
                <td>${escapeHtml(row.fish_name)} (${escapeHtml(row.fish_code)})</td>
                <td>${escapeHtml(row.from_branch_name)}</td>
                <td>${escapeHtml(row.to_branch_name)}</td>
                <td>${row.qty.toFixed(2)} ${escapeHtml(row.fish_unit)}</td>
                <td><span class="chip ${row.target_alert.toLowerCase()}">${row.target_alert}</span></td>
                <td>${row.from_closing_before.toFixed(2)} -> ${row.from_closing_after.toFixed(2)}</td>
                <td>${row.to_closing_before.toFixed(2)} -> ${row.to_closing_after.toFixed(2)}</td>
                <td>${row.target_stock.toFixed(2)}</td>
                <td>${row.remaining_need_after.toFixed(2)}</td>
                <td>${escapeHtml(row.from_branch_id)} -> ${escapeHtml(row.to_branch_id)}</td>
              </tr>
            `;
          })
          .join("");

  const uncoveredRows =
    model.uncoveredNeeds.length === 0
      ? '<tr><td colspan="4" class="empty-state">All computed shortages are covered by suggested transfers.</td></tr>'
      : model.uncoveredNeeds
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.fish_name)} (${escapeHtml(row.fish_code)})</td>
                <td>${escapeHtml(row.branch_name)}</td>
                <td>${row.remaining_shortage.toFixed(2)} ${escapeHtml(row.fish_unit)}</td>
                <td><span class="chip ${row.alert.toLowerCase()}">${row.alert}</span></td>
              </tr>
            `
          )
          .join("");

  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Critical Targets</p><h2>${model.criticalTargets}</h2></article>
      <article class="kpi-card"><p>Total Shortage</p><h2>${model.totalShortage.toFixed(2)}</h2></article>
      <article class="kpi-card"><p>Suggested Transfer</p><h2>${model.suggestedTotal.toFixed(2)}</h2></article>
      <article class="kpi-card"><p>Uncovered Shortage</p><h2>${model.uncoveredTotal.toFixed(2)}</h2></article>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Inter-Branch Transfer Suggestions</h3></div>
      <p class="page-note">
        Scope: ${model.branchCount} active branch(es) | Date: ${escapeHtml(state.date)} |
        Coverage: ${model.coveragePercent.toFixed(2)}%. Suggestions keep source branch at or above target stock.
      </p>
      <div class="table-search">
        <input
          id="transferSuggestionsSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by fish or branch name"
          value="${escapeHtml(state.quickSearch.transferSuggestions)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>From Branch</th>
              <th>To Branch</th>
              <th>Suggested Qty</th>
              <th>Target Alert</th>
              <th>From Closing (B -> A)</th>
              <th>To Closing (B -> A)</th>
              <th>Target Stock</th>
              <th>Need Left</th>
              <th>Route</th>
            </tr>
          </thead>
          <tbody id="transferSuggestionsTableBody">
            ${suggestionsRows}
            ${
              model.suggestions.length > 0
                ? '<tr id="transferSuggestionsSearchEmptyRow" class="hidden"><td colspan="10" class="empty-state">No suggestions match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Uncovered Needs</h3></div>
      <p class="page-note">These shortages remain because no surplus was available in other branches.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Branch</th>
              <th>Remaining Shortage</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            ${uncoveredRows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderErrorLogsPage() {
  const scopeBranchIds = getBranchScopeIds(state.branchId);
  const branchSet = new Set(scopeBranchIds);
  const showAllBranches = canSelectAllBranches(state.currentUser) && isAllBranchesSelected();

  const logs = DATA.app_error_logs
    .filter((row) => {
      const rowBranch = String(row.branch_id || "");
      if (!rowBranch) {
        return true;
      }
      if (showAllBranches) {
        return true;
      }
      if (branchSet.size === 0) {
        return false;
      }
      return branchSet.has(rowBranch);
    })
    .sort((a, b) => String(b.datetime || "").localeCompare(String(a.datetime || "")))
    .slice(0, 300);

  const today = isoDateToday();
  const stats = logs.reduce(
    (acc, row) => {
      const level = String(row.level || "ERROR").toUpperCase();
      acc.total += 1;
      if (level === "PROMISE") {
        acc.promise += 1;
      } else {
        acc.error += 1;
      }
      if (String(row.datetime || "").slice(0, 10) === today) {
        acc.today += 1;
      }
      return acc;
    },
    { total: 0, error: 0, promise: 0, today: 0 }
  );

  const rows = logs
    .map((row) => {
      const level = String(row.level || "ERROR").toUpperCase();
      const chipClass = errorSeverityChip(level);
      const branchLabel = getBranchScopeLabel(row.branch_id) || row.branch_id || "-";
      const user = row.user_id ? findUserById(row.user_id) : null;
      const userLabel = user ? `${user.username} (${row.user_role || "-"})` : row.user_role || "-";
      const time = String(row.datetime || "").replace("T", " ").replace("Z", "");
      const sourceText = row.source
        ? `${row.source}${row.line ? `:${row.line}` : ""}${row.column ? `:${row.column}` : ""}`
        : "-";
      const detailsBlocks = [row.details, row.stack].filter(Boolean).join("\n");
      const searchable = [
        String(row.message || "").toLowerCase(),
        String(row.page || "").toLowerCase(),
        String(branchLabel || "").toLowerCase(),
        String(userLabel || "").toLowerCase(),
        String(sourceText || "").toLowerCase(),
        String(row.details || "").toLowerCase()
      ].join(" ");

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(time || "-")}</td>
          <td><span class="chip ${chipClass}">${escapeHtml(level)}</span></td>
          <td>${escapeHtml(row.page || "-")}</td>
          <td>${escapeHtml(branchLabel)}</td>
          <td>${escapeHtml(userLabel)}</td>
          <td>${escapeHtml(row.message || "-")}</td>
          <td>${escapeHtml(sourceText)}</td>
          <td>
            ${
              detailsBlocks
                ? `<details><summary>View</summary><pre class="error-log-pre">${escapeHtml(detailsBlocks)}</pre></details>`
                : "-"
            }
          </td>
        </tr>
      `;
    })
    .join("");

  const clearDisabled = state.currentUser?.role === "master" ? "" : "disabled";
  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Total Logs</p><h2>${stats.total}</h2></article>
      <article class="kpi-card"><p>Errors</p><h2>${stats.error}</h2></article>
      <article class="kpi-card"><p>Promise Rejections</p><h2>${stats.promise}</h2></article>
      <article class="kpi-card"><p>Today</p><h2>${stats.today}</h2></article>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Error Logs</h3></div>
      <div class="inline-actions" style="margin-bottom:10px;">
        <button type="button" class="btn btn-outline" id="downloadErrorLogsBtn">Download Logs JSON</button>
        <button type="button" class="btn btn-danger" id="clearErrorLogsBtn" ${clearDisabled}>Clear Logs</button>
      </div>
      <div class="table-search">
        <input
          id="errorLogsSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by message, page, user, or source"
          value="${escapeHtml(state.quickSearch.errorLogs)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Page</th>
              <th>Branch</th>
              <th>User</th>
              <th>Message</th>
              <th>Source</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="errorLogsTableBody">
            ${
              rows ||
              '<tr><td colspan="8" class="empty-state">No errors captured for this scope yet.</td></tr>'
            }
            ${
              rows
                ? '<tr id="errorLogsSearchEmptyRow" class="hidden"><td colspan="8" class="empty-state">No logs match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
      <p class="page-note">Latest 300 logs are shown in this tab for performance.</p>
    </section>
  `;
}

function renderActivityLogsPage() {
  const scopeBranchIds = getBranchScopeIds(state.branchId);
  const branchSet = new Set(scopeBranchIds);
  const showAllBranches = canSelectAllBranches(state.currentUser) && isAllBranchesSelected();

  const logs = (DATA.activity_logs || [])
    .filter((row) => {
      const rowBranch = String(row.branch_id || "");
      if (!rowBranch) {
        return true;
      }
      if (showAllBranches) {
        return true;
      }
      if (branchSet.size === 0) {
        return false;
      }
      return branchSet.has(rowBranch);
    })
    .sort((a, b) => String(b.datetime || "").localeCompare(String(a.datetime || "")))
    .slice(0, 500);

  const today = isoDateToday();
  const stats = logs.reduce(
    (acc, row) => {
      const action = String(row.action || "").toUpperCase();
      acc.total += 1;
      if (String(row.datetime || "").slice(0, 10) === today) {
        acc.today += 1;
      }
      if (action.includes("DELETE") || action.includes("WIPE")) {
        acc.delete += 1;
      } else if (action.includes("BACKUP") || action.includes("IMPORT") || action.includes("RESTORE")) {
        acc.backup += 1;
      } else {
        acc.update += 1;
      }
      return acc;
    },
    { total: 0, update: 0, delete: 0, backup: 0, today: 0 }
  );

  const rows = logs
    .map((row) => {
      const action = String(row.action || "UPDATE").toUpperCase();
      const chipClass = activityActionChip(action);
      const branchLabel = getBranchScopeLabel(row.branch_id) || row.branch_id || "-";
      const user =
        row.user_id ? findUserById(row.user_id) : null;
      const userName = row.user_name || user?.username || "-";
      const userRole = row.user_role || user?.role || "-";
      const userLabel = `${userName} (${userRole})`;
      const time = String(row.datetime || "").replace("T", " ").replace("Z", "");
      const detailsText = String(row.details || "");
      const searchable = [
        String(action || "").toLowerCase(),
        String(row.summary || "").toLowerCase(),
        String(row.page || "").toLowerCase(),
        String(branchLabel || "").toLowerCase(),
        String(userLabel || "").toLowerCase(),
        detailsText.toLowerCase()
      ].join(" ");

      return `
        <tr data-fish-search="${escapeHtml(searchable)}">
          <td>${escapeHtml(time || "-")}</td>
          <td><span class="chip ${chipClass}">${escapeHtml(action)}</span></td>
          <td>${escapeHtml(row.page || "-")}</td>
          <td>${escapeHtml(branchLabel)}</td>
          <td>${escapeHtml(userLabel)}</td>
          <td>${escapeHtml(row.summary || "-")}</td>
          <td>
            ${
              detailsText
                ? `<details><summary>View</summary><pre class="error-log-pre">${escapeHtml(detailsText)}</pre></details>`
                : "-"
            }
          </td>
        </tr>
      `;
    })
    .join("");

  const clearDisabled = state.currentUser?.role === "master" ? "" : "disabled";
  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Total Logs</p><h2>${stats.total}</h2></article>
      <article class="kpi-card"><p>Create/Update</p><h2>${stats.update}</h2></article>
      <article class="kpi-card"><p>Delete/Wipe</p><h2>${stats.delete}</h2></article>
      <article class="kpi-card"><p>Backup/Import</p><h2>${stats.backup}</h2></article>
      <article class="kpi-card"><p>Today</p><h2>${stats.today}</h2></article>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Activity Logs</h3></div>
      <div class="inline-actions" style="margin-bottom:10px;">
        <button type="button" class="btn btn-outline" id="downloadActivityLogsBtn">Download Logs JSON</button>
        <button type="button" class="btn btn-danger" id="clearActivityLogsBtn" ${clearDisabled}>Clear Logs</button>
      </div>
      <div class="table-search">
        <input
          id="activityLogsSearchInput"
          class="table-input"
          type="search"
          placeholder="Quick find by action, summary, page, user, or branch"
          value="${escapeHtml(state.quickSearch.activityLogs)}"
        />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Page</th>
              <th>Branch</th>
              <th>User</th>
              <th>Summary</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="activityLogsTableBody">
            ${
              rows ||
              '<tr><td colspan="7" class="empty-state">No activity captured for this scope yet.</td></tr>'
            }
            ${
              rows
                ? '<tr id="activityLogsSearchEmptyRow" class="hidden"><td colspan="7" class="empty-state">No logs match your search.</td></tr>'
                : ""
            }
          </tbody>
        </table>
      </div>
      <p class="page-note">Latest 500 activity records are shown for performance.</p>
    </section>
  `;
}

function renderReportsPage() {
  const { rows, totals } = buildSummary(state.branchId, state.date);
  const wasteTotal = round2(rows.reduce((sum, row) => sum + row.waste, 0));
  const topFish = [...rows]
    .filter((row) => row.profit !== null)
    .sort((a, b) => (b.profit || 0) - (a.profit || 0))[0];

  return `
    <section class="content-grid">
      <article class="card">
        <div class="card-header"><h3>Profit Snapshot</h3></div>
        <p><strong>Top fish:</strong> ${topFish ? escapeHtml(topFish.fish.name) : "N/A"}</p>
        <p><strong>Top profit:</strong> ${topFish ? money(topFish.profit || 0) : "-"}</p>
      </article>
      <article class="card">
        <div class="card-header"><h3>Waste Trend</h3></div>
        <p><strong>Total waste (today):</strong> ${wasteTotal.toFixed(2)}</p>
      </article>
      <article class="card">
        <div class="card-header"><h3>Branch Totals</h3></div>
        <p><strong>Revenue:</strong> ${money(totals.revenue)}</p>
        <p><strong>Profit:</strong> ${money(totals.profit)}</p>
      </article>
    </section>
    <section class="card wide">
      <div class="card-header"><h3>PDF Export</h3></div>
      <div class="inline-actions">
        <button type="button" class="btn btn-primary" id="downloadDailyPdfBtn">Download Daily Report PDF</button>
        <button type="button" class="btn btn-soft" id="downloadOrderPdfBtn">Download Tomorrow Order PDF</button>
      </div>
    </section>
  `;
}

function renderMonthlyCalculationsPage() {
  const month = getMonthlyViewMonth();
  const summary = buildMonthlySummary(state.branchId, month);
  const bestDayText = summary.bestProfitDay
    ? `${summary.bestProfitDay.date} (${money(summary.bestProfitDay.profit)})`
    : "-";
  const worstDayText = summary.worstProfitDay
    ? `${summary.worstProfitDay.date} (${money(summary.worstProfitDay.profit)})`
    : "-";

  return `
    <section class="card wide">
      <div class="card-header"><h3>Monthly Calculations</h3></div>
      <div class="inline-actions">
        <label for="monthlyCalcMonthInput"><strong>Month</strong></label>
        <input id="monthlyCalcMonthInput" class="table-input" type="month" value="${escapeHtml(
          summary.month
        )}" />
      </div>
      <p class="page-note">
        Scope: ${escapeHtml(getBranchScopeLabel(state.branchId))} | Month: ${escapeHtml(summary.monthLabel)} | Showing only days with stock activity.
      </p>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card"><p>Revenue</p><h2>${money(summary.totals.revenue)}</h2></article>
      <article class="kpi-card"><p>Cost</p><h2 class="cost-negative">${money(summary.totals.cost)}</h2></article>
      <article class="kpi-card"><p>Profit</p><h2 class="${
        summary.totals.profit >= 0 ? "profit-positive" : "profit-negative"
      }">${money(summary.totals.profit)}</h2></article>
      <article class="kpi-card"><p>Sold</p><h2>${summary.totals.sold.toFixed(2)}</h2></article>
      <article class="kpi-card"><p>Waste</p><h2>${summary.totals.waste.toFixed(2)}</h2></article>
      <article class="kpi-card"><p>Active Days</p><h2>${summary.totals.activeDays}</h2></article>
    </section>

    <section class="content-grid">
      <article class="card">
        <div class="card-header"><h3>Best Profit Day</h3></div>
        <p><strong>${escapeHtml(bestDayText)}</strong></p>
      </article>
      <article class="card">
        <div class="card-header"><h3>Lowest Profit Day</h3></div>
        <p><strong>${escapeHtml(worstDayText)}</strong></p>
      </article>
      <article class="card">
        <div class="card-header"><h3>Missing Prices</h3></div>
        <p><strong>${summary.totals.missingPriceDays}</strong> day(s) with incomplete pricing.</p>
      </article>
    </section>

    <section class="card wide">
      <div class="card-header"><h3>Daily Breakdown</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Fish Rows</th>
              <th>Sold</th>
              <th>Waste</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              summary.rows.length === 0
                ? '<tr><td colspan="8" class="empty-state">No stock activity found for this month and branch scope.</td></tr>'
                : summary.rows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.date)}</td>
                          <td>${row.fishRows}</td>
                          <td>${row.sold.toFixed(2)}</td>
                          <td>${row.waste.toFixed(2)}</td>
                          <td>${money(row.revenue)}</td>
                          <td class="cost-negative">${money(row.cost)}</td>
                          <td class="${row.profit >= 0 ? "profit-positive" : "profit-negative"}">${money(
                            row.profit
                          )}</td>
                          <td><span class="chip ${row.hasMissingPrice ? "warning" : "ok"}">${
                            row.hasMissingPrice ? "MISSING PRICE" : "OK"
                          }</span></td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderBillingProgressPage() {
  if (!hasPermission(state.currentUser, "view_billing_progress")) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Daily Sell Billing Progress</h3></div>
        <p class="empty-state">You do not have access to Billing Progress.</p>
      </section>
    `;
  }

  const summary = buildBillingProgressSummary(state.branchId, state.date);
  const avgBill = summary.totals.bills ? round2(summary.totals.revenue / summary.totals.bills) : 0;

  const topRevenueText = summary.topRevenueBill
    ? `${summary.topRevenueBill.invoice_no} (${money(summary.topRevenueBill.revenue)})`
    : "-";
  const topIncomeText = summary.topIncomeBill
    ? `${summary.topIncomeBill.invoice_no} (${money(summary.topIncomeBill.income)})`
    : "-";
  const topProfitText = summary.topProfitBill
    ? `${summary.topProfitBill.invoice_no} (${money(summary.topProfitBill.profit)})`
    : "-";

  const paymentMethodRows = [
    { key: "cash", label: "Cash" },
    { key: "bank", label: "Bank" },
    { key: "card", label: "Card" },
    { key: "online", label: "Online" },
    { key: "credit", label: "Credit" }
  ]
    .map((entry) => {
      const metrics = summary.methodTotals[entry.key];
      return `
        <tr>
          <td>${entry.label}</td>
          <td>${metrics.bills}</td>
          <td>${money(metrics.revenue)}</td>
          <td>${money(metrics.income)}</td>
          <td class="${metrics.profit >= 0 ? "profit-positive" : "profit-negative"}">${money(metrics.profit)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="card wide">
      <div class="card-header"><h3>Daily Sell Billing Progress</h3></div>
      <div class="inline-actions">
        <label for="billingProgressDateInput"><strong>Date</strong></label>
        <input id="billingProgressDateInput" class="table-input" type="date" value="${escapeHtml(summary.date)}" />
      </div>
      <p class="page-note">
        Scope: ${escapeHtml(getBranchScopeLabel(state.branchId))} | Date: ${escapeHtml(summary.date)} | Dashboard for daily sell billing.
      </p>
      <p class="page-note">
        Billing Progress uses only Billing records. Income/Profit here are capped to bill total (overpayment/change is excluded).
      </p>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card"><p>Total Bills</p><h2>${summary.totals.bills}</h2></article>
      <article class="kpi-card"><p>Revenue</p><h2>${money(summary.totals.revenue)}</h2></article>
      <article class="kpi-card"><p>Income</p><h2>${money(summary.totals.income)}</h2></article>
      <article class="kpi-card"><p>Profit</p><h2 class="${
        summary.totals.profit >= 0 ? "profit-positive" : "profit-negative"
      }">${money(summary.totals.profit)}</h2></article>
      <article class="kpi-card"><p>Avg Bill Value</p><h2>${money(avgBill)}</h2></article>
    </section>

    <section class="content-grid">
      <article class="card">
        <div class="card-header"><h3>Top Revenue Bill</h3></div>
        <p><strong>${escapeHtml(topRevenueText)}</strong></p>
      </article>
      <article class="card">
        <div class="card-header"><h3>Top Income Bill</h3></div>
        <p><strong>${escapeHtml(topIncomeText)}</strong></p>
      </article>
      <article class="card">
        <div class="card-header"><h3>Top Profit Bill</h3></div>
        <p><strong>${escapeHtml(topProfitText)}</strong></p>
      </article>
    </section>

    <section class="card wide section-gap">
      <div class="card-header"><h3>Payment Method Income / Revenue / Profit</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Bills</th>
              <th>Revenue</th>
              <th>Income</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${paymentMethodRows}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card wide section-gap">
      <div class="card-header"><h3>Daily Bills</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Branch</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Revenue</th>
              <th>Income</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${
              summary.rows.length === 0
                ? '<tr><td colspan="7" class="empty-state">No customer billing activity found for selected date and scope.</td></tr>'
                : summary.rows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.invoice_no)}</td>
                          <td>${escapeHtml(row.branch_name)}</td>
                          <td>${escapeHtml(row.customer_name)}</td>
                          <td>${escapeHtml(paymentMethodLabel(row.payment_method))}</td>
                          <td>${money(row.revenue)}</td>
                          <td>${money(row.income)}</td>
                          <td class="${row.profit >= 0 ? "profit-positive" : "profit-negative"}">${money(
                            row.profit
                          )}</td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSettingsPage() {
  const canManageSettings = hasPermission(state.currentUser, "manage_settings");
  const canManageBranches = hasPermission(state.currentUser, "manage_branches");
  const isMasterUser = state.currentUser?.role === "master";
  const canEditBranches = state.currentUser?.role === "master";
  const disabled = canManageSettings ? "" : "disabled";
  const profileNote = canManageSettings
    ? "Master can edit all settings, logo, roles, passwords, and fish records."
    : canManageBranches
      ? "Admin can view all branch details. Only master can edit settings and branches."
      : "Only master can manage settings and branches.";
  const logoPreview = state.settings.company_logo
    ? `style="background-image:url('${escapeHtml(state.settings.company_logo)}')"`
    : "";
  const backupLocationLabel = state.settings.auto_backup_location_label
    ? String(state.settings.auto_backup_location_label)
    : "Not selected";
  const branchRows = DATA.branches
    .map(
      (branch) => `
        <tr data-branch-id="${escapeHtml(branch.id)}">
          <td>${escapeHtml(branch.id)}</td>
          <td>
            <input
              type="text"
              class="table-input branch-name-input"
              value="${escapeHtml(branch.name)}"
              placeholder="Branch Name"
              ${canEditBranches ? "" : "readonly"}
            />
          </td>
          <td>
            <input
              type="text"
              class="table-input branch-location-input"
              value="${escapeHtml(branch.location || "-")}"
              placeholder="Location"
              ${canEditBranches ? "" : "readonly"}
            />
          </td>
          <td><span class="chip ${branch.status === "active" ? "ok" : "critical"}">${escapeHtml(
        branch.status
      )}</span></td>
          <td>
            ${
              canEditBranches
                ? `<div class="table-actions">
              <button type="button" class="btn btn-primary branch-save-btn" data-branch-id="${escapeHtml(
                branch.id
              )}">
                Save
              </button>
              <button type="button" class="btn btn-danger branch-delete-btn" data-branch-id="${escapeHtml(
                branch.id
              )}">
                Delete
              </button>
            </div>`
                : '<span class="hint">View only</span>'
            }
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="card wide">
      <div class="card-header"><h3>Settings</h3></div>
      <form id="settingsForm" class="settings-form">
        <div class="profile-row">
          <button type="button" id="settingsAvatarBtn" class="session-avatar ${
            state.currentUser.photo ? "has-photo" : ""
          }" ${state.currentUser.photo ? `style="background-image:url('${escapeHtml(state.currentUser.photo)}')"` : ""}>${
    state.currentUser.photo ? "" : getInitials(state.currentUser.username)
  }</button>
          <div>
            <strong>${escapeHtml(state.currentUser.username)}</strong>
            <p>${escapeHtml(profileNote)}</p>
          </div>
          <button type="button" id="settingsChangePhotoBtn" class="btn btn-soft">Change Photo</button>
        </div>

        <div class="profile-row">
          <div class="brand-mark ${state.settings.company_logo ? "has-logo" : ""}" ${logoPreview}>${
    state.settings.company_logo ? "" : escapeHtml(state.settings.logo_text || "RTx")
  }</div>
          <div>
            <strong>Company Logo</strong>
            <p>Upload logo for sidebar and login header.</p>
          </div>
          <button type="button" id="settingsUploadLogoBtn" class="btn btn-soft" ${disabled}>Upload Logo</button>
          <button type="button" id="settingsClearLogoBtn" class="btn btn-outline" ${disabled}>Clear Logo</button>
        </div>

        <div class="settings-grid">
          <div class="settings-field">
            <label for="companyNameInput">Company Name</label>
            <input id="companyNameInput" type="text" value="${escapeHtml(state.settings.company_name)}" ${disabled} />
          </div>
          <div class="settings-field">
            <label for="logoTextInput">Logo Text (when no image)</label>
            <input id="logoTextInput" type="text" value="${escapeHtml(state.settings.logo_text)}" ${disabled} />
          </div>
          <div class="settings-field">
            <label for="currencyInput">Currency</label>
            <select id="currencyInput" ${disabled}>
              <option value="LKR" ${state.settings.currency === "LKR" ? "selected" : ""}>LKR</option>
              <option value="USD" ${state.settings.currency === "USD" ? "selected" : ""}>USD</option>
              <option value="EUR" ${state.settings.currency === "EUR" ? "selected" : ""}>EUR</option>
            </select>
          </div>
          <div class="settings-field">
            <label for="primaryColorInput">Primary Color</label>
            <input id="primaryColorInput" type="color" value="${escapeHtml(
              state.settings.theme_primary
            )}" ${disabled} />
          </div>
          <div class="settings-field">
            <label for="accentColorInput">Accent Color</label>
            <input id="accentColorInput" type="color" value="${escapeHtml(
              state.settings.theme_accent
            )}" ${disabled} />
          </div>
          <div class="settings-field full settings-switch">
            <label>
              <input id="maintenanceInput" type="checkbox" ${
                state.settings.maintenance_mode ? "checked" : ""
              } ${disabled} />
              Maintenance Mode
            </label>
          </div>
          ${
            isMasterUser
              ? `
          <div class="settings-field full">
            <label>
              <input id="autoBackupAfterClosingInput" type="checkbox" ${
                state.settings.auto_backup_after_closing ? "checked" : ""
              } ${disabled} />
              Auto backup daily after closing stock save
            </label>
            <div class="settings-actions">
              <button class="btn btn-soft" type="button" id="chooseDailyBackupFolderBtn" ${disabled}>
                Select Backup Folder
              </button>
              <button class="btn btn-outline" type="button" id="clearDailyBackupFolderBtn" ${disabled}>
                Clear Folder
              </button>
            </div>
            <input id="dailyBackupFolderLabelInput" type="text" value="${escapeHtml(
              backupLocationLabel
            )}" readonly />
            <p class="page-note">
              Master only. When enabled, system writes backup JSON automatically after night closing stock save.
            </p>
          </div>
          `
              : `
          <div class="settings-field full">
            <label>Daily Auto Backup</label>
            <p class="page-note">Master only feature.</p>
          </div>
          `
          }
          <div class="settings-actions">
            <button class="btn btn-primary" type="submit" ${disabled}>Save Settings</button>
            ${
              canManageSettings
                ? '<button class="btn btn-danger" type="button" id="gotoDeleteDataBtn">Open Delete Data Tab</button>'
                : ""
            }
          </div>
        </div>
        <p id="settingsMessage" class="settings-message"></p>
      </form>
    </section>

    ${
      canManageBranches
        ? `
      <section class="card wide">
        <div class="card-header"><h3>Branch Management</h3></div>
        ${
          canEditBranches
            ? `<form id="branchCreateForm" class="form-grid">
          <input id="newBranchId" type="text" placeholder="Branch ID (optional, e.g. BR-003)" />
          <input id="newBranchName" type="text" placeholder="Branch Name" required />
          <input id="newBranchLocation" type="text" placeholder="Location" />
          <button class="btn btn-primary" type="submit">Add Branch</button>
        </form>
        <p class="page-note">If branch ID is empty, the system auto-generates the next BR code.</p>`
            : '<p class="page-note">View all branch details. Only master can add, update, or delete branches.</p>'
        }
        <div class="table-wrap" style="margin-top:10px;">
          <table>
            <thead>
              <tr>
                <th>Branch ID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${branchRows || '<tr><td colspan="5" class="empty-state">No branches found.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
    `
        : ""
    }
  `;
}

function renderAboutPage() {
  const aboutLogoSrc = "./RTX%20LOGO.png";
  return `
    <section class="app-signature">
      <section class="card wide signature-hero">
        <h2>Application Signature</h2>
        <p>Official product, ownership, and platform details for RTX FishOps.</p>
      </section>

      <section class="card wide signature-logo-card">
        <div class="signature-logo-row">
          <img
            class="signature-logo-thumb"
            src="${escapeHtml(aboutLogoSrc)}"
            alt="RTX Technologies logo"
          />
          <p class="signature-logo-company">RTX Technologies Pvt Ltd</p>
        </div>
      </section>

      <section class="card wide signature-grid-shell">
        <div class="signature-grid">
          <article class="signature-item">
            <p class="signature-label">Application Name</p>
            <p class="signature-value">RTX FishOps - Retail Operations & Inventory SaaS Platform</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Version</p>
            <p class="signature-value">Version 6.11.0 - Enterprise SaaS Release</p>
            <p class="signature-subtext">Powered by RTX Virual Engine Runtime</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Developed By</p>
            <p class="signature-value">Hasintha Arunalu</p>
            <p class="signature-subtext">Founder | Systems Architect | Technology Entrepreneur</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Organization</p>
            <p class="signature-value">RTX Technologies Pvt Ltd</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Domain</p>
            <p class="signature-value">Retail Operations Management / Inventory / Financial Processing</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Development Type</p>
            <p class="signature-value">Proprietary SaaS Platform - Built and Maintained In-House</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Technology Stack</p>
            <p class="signature-value">
              TypeScript, JavaScript, IndexedDB, HTML5, CSS3, Progressive Web Application (PWA)
            </p>
            <p class="signature-subtext">RTX Virual Engine Runtime with Service Worker Architecture</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Target Platform</p>
            <p class="signature-value">Cross-Platform Web Application</p>
            <p class="signature-subtext">
              Windows (PWA Desktop Install) | Web Browser | RTX Virual Engine Runtime
            </p>
            <p class="signature-subtext">
              Cloud-enabled architecture supporting real-time synchronization,
              multi-branch operations, and distributed deployment across locations.
            </p>
            <p class="signature-subtext">Designed for global scale SaaS deployment.</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Deployment Model</p>
            <p class="signature-value">
              Cloud-enabled SaaS | Multi-Branch Distributed System | Secure Remote Access
            </p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Build Location</p>
            <p class="signature-value">Sri Lanka | USA</p>
          </article>
          <article class="signature-item">
            <p class="signature-label">Ownership Notice</p>
            <p class="signature-value">
              Copyright \u00A9 2026 RTX Technologies Pvt Ltd. All Rights Reserved.
            </p>
            <p class="signature-subtext">
              RTX FishOps and RTX Virual Engine are proprietary technologies of RTX Technologies
              Pvt Ltd.
            </p>
            <p class="signature-subtext">
              Unauthorized reproduction, distribution, reverse engineering, or modification of this
              software is strictly prohibited.
            </p>
          </article>
        </div>
      </section>

      <section class="card wide signature-purpose">
        <p class="signature-label">Purpose Statement</p>
        <p class="signature-purpose-text">
          RTX FishOps is a SaaS-based retail operations platform engineered to manage fish
          retail operations, inventory tracking, and financial workflows across multiple
          branches in real time.
        </p>
        <p class="signature-purpose-text">
          Powered by RTX Virual Engine, the platform provides reliable online-first
          performance, secure cloud connectivity, and scalable infrastructure designed for
          global retail deployment.
        </p>
      </section>

    </section>
  `;
}

function renderDeleteDataPage() {
  if (!hasPermission(state.currentUser, "delete_center")) {
    return `
      <section class="card wide">
        <p class="empty-state">Only master can access Delete Data.</p>
      </section>
    `;
  }

  const userDeleteCount = Math.max(
    0,
    DATA.users.filter((user) => user.role !== "master").length
  );
  const dailyEnteredDetailsCount =
    DATA.daily_prices.length +
    DATA.daily_stock_entry.length +
    DATA.hold_stock_entry.length +
    DATA.shop_orders.length +
    DATA.customer_bills.length +
    DATA.app_error_logs.length;
  const activityLogsCount = Array.isArray(DATA.activity_logs) ? DATA.activity_logs.length : 0;

  const categories = [
    {
      key: "daily_entered_details",
      label: "All Daily Entered Details (keep Fish Profiles + Branch Fish Settings)",
      count: dailyEnteredDetailsCount
    },
    { key: "daily_prices", label: "Daily Prices", count: DATA.daily_prices.length },
    { key: "daily_stock_entry", label: "Daily Stock Entries", count: DATA.daily_stock_entry.length },
    { key: "hold_stock_entry", label: "Hold Stock Entries", count: DATA.hold_stock_entry.length },
    { key: "shop_orders", label: "Shop Orders", count: DATA.shop_orders.length },
    { key: "customer_bills", label: "Customer Bills", count: DATA.customer_bills.length },
    { key: "app_error_logs", label: "Error Logs", count: DATA.app_error_logs.length },
    { key: "activity_logs", label: "Activity Logs", count: activityLogsCount },
    {
      key: "branch_fish_settings",
      label: "Branch Fish Settings",
      count: DATA.branch_fish_settings.length
    },
    {
      key: "fish_profiles_related",
      label: "Fish Profiles (+ settings/prices/stock/hold/orders/bills)",
      count: DATA.fish_profiles.length
    },
    { key: "users_non_master", label: "Users (non-master only)", count: userDeleteCount },
    { key: "settings_branding", label: "Theme + Branding Settings", count: 1 }
  ];

  return `
    <section class="card wide">
      <div class="card-header"><h3>Delete Data By Category (Master Only)</h3></div>
      <p class="page-note">Each action removes only the selected category. Use full wipe for complete reset.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Current Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${categories
              .map(
                (row) => `
                  <tr>
                    <td>${escapeHtml(row.label)}</td>
                    <td>${row.count}</td>
                    <td>
                      <button
                        type="button"
                        class="btn btn-danger delete-category-btn"
                        data-category="${row.key}"
                        data-label="${escapeHtml(row.label)}"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="inline-actions" style="margin-top:12px;">
        <button type="button" class="btn btn-danger" id="fullWipeBtn">FULL WIPE ALL DATA</button>
      </div>
      <p class="page-note">Full wipe resets all data and keeps only your current master account for login.</p>
    </section>
  `;
}

function renderActivePage() {
  switch (state.activePage) {
    case "dashboard":
      return renderDashboardPage();
    case "users_roles":
      return renderUsersPage();
    case "fish_profiles":
      return renderFishProfilesPage();
    case "branch_fish_settings":
      return renderBranchFishSettingsPage();
    case "daily_prices":
      return renderDailyPricesPage();
    case "y_daily_prices":
      return renderYDailyPricesPage();
    case "hold_stock":
      return renderHoldStockPage();
    case "shop_orders":
      return renderShopOrdersPage();
    case "shop_status":
      return renderShopStatusPage();
    case "billing":
      return renderBillingPage();
    case "billing_progress":
      return renderBillingProgressPage();
    case "remaining_stock_holds":
      return renderRemainingStockHoldsPage();
    case "morning_opening_stock":
      return renderOpeningPage();
    case "night_closing_stock":
      return renderClosingPage();
    case "daily_summary":
      return renderDailySummaryPage();
    case "reports":
      return renderReportsPage();
    case "transfer_suggestions":
      return renderTransferSuggestionsPage();
    case "error_logs":
      return renderErrorLogsPage();
    case "activity_logs":
      return renderActivityLogsPage();
    case "monthly_calculations":
      return renderMonthlyCalculationsPage();
    case "about":
      return renderAboutPage();
    case "settings":
      return renderSettingsPage();
    case "delete_data":
      return renderDeleteDataPage();
    default:
      return '<section class="card"><p class="empty-state">Unknown page.</p></section>';
  }
}

function openProfilePhotoPicker() {
  ui.photoInput.click();
}

function openLogoPicker() {
  ui.logoInput.click();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode image."));
    image.src = dataUrl;
  });
}

async function optimizeImageDataUrl(file, options = {}) {
  const {
    maxEdge = 512,
    outputType = "image/webp",
    quality = 0.82
  } = options;

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(sourceDataUrl);
  const width = Number(image.naturalWidth || image.width || 1);
  const height = Number(image.naturalHeight || image.height || 1);
  const largestEdge = Math.max(width, height, 1);
  const scale = largestEdge > maxEdge ? maxEdge / largestEdge : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return sourceDataUrl;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const optimizedDataUrl = canvas.toDataURL(outputType, quality);
  return optimizedDataUrl.length < sourceDataUrl.length ? optimizedDataUrl : sourceDataUrl;
}

async function handleProfilePhotoChange(event) {
  if (!state.currentUser) {
    return;
  }
  if (!ensureWriteAllowed()) {
    event.target.value = "";
    return;
  }
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  if (!String(file.type || "").startsWith("image/")) {
    alert("Please select an image file.");
    event.target.value = "";
    return;
  }

  try {
    state.currentUser.photo = await optimizeImageDataUrl(file, {
      maxEdge: 320,
      outputType: "image/webp",
      quality: 0.8
    });
    saveStoreWithActivity("PROFILE_PHOTO_UPDATE", "Updated profile photo.", {
      details: { fileName: file.name, fileType: file.type }
    });
    renderSessionIdentity();
    if (state.activePage === "settings") {
      renderApp();
    }
  } catch {
    alert("Unable to update profile photo.");
  }
  event.target.value = "";
}

async function handleLogoChange(event) {
  if (!hasPermission(state.currentUser, "manage_settings")) {
    return;
  }
  if (!ensureWriteAllowed()) {
    event.target.value = "";
    return;
  }
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  if (!String(file.type || "").startsWith("image/")) {
    alert("Please select an image file.");
    event.target.value = "";
    return;
  }

  try {
    state.settings.company_logo = await optimizeImageDataUrl(file, {
      maxEdge: 640,
      outputType: "image/webp",
      quality: 0.84
    });
    applyBranding();
    saveStoreWithActivity("SETTINGS_LOGO_UPDATE", "Updated company logo.", {
      details: { fileName: file.name, fileType: file.type }
    });
    if (state.activePage === "settings") {
      renderApp();
    }
  } catch {
    alert("Unable to update company logo.");
  }
  event.target.value = "";
}

function copyYesterdayPrices() {
  if (!hasPermission(state.currentUser, "set_daily_prices")) {
    return;
  }
  if (isAllBranchesSelected()) {
    alert("Select a single branch to copy yesterday prices.");
    return;
  }
  if (!ensureWriteAllowed()) {
    return;
  }
  const sourceDate = getYesterday(state.date);
  const sourceRows = DATA.daily_prices.filter(
    (row) =>
      row.branch_id === state.branchId &&
      row.date === sourceDate &&
      normalizePriceSource(row.price_source) === "morning"
  );
  let copied = 0;
  for (const source of sourceRows) {
    const existing = getDailyPrice(state.branchId, state.date, source.fish_id, "morning");
    if (!existing) {
      DATA.daily_prices.push({
        id: makeId("PRC"),
        date: state.date,
        branch_id: state.branchId,
        fish_id: source.fish_id,
        sell_price_per_unit: source.sell_price_per_unit,
        cost_price_per_unit: source.cost_price_per_unit,
        auto_price_from: "",
        price_source: "morning"
      });
      copied += 1;
    }
  }
  saveStoreWithActivity(
    "DAILY_PRICES_COPY_YESTERDAY",
    `Copied ${copied} daily price row(s) from ${sourceDate}.`,
    {
      details: { sourceDate, targetDate: state.date, branchId: state.branchId }
    }
  );
  if (copied > 0) {
    alert(`Copied ${copied} price rows from ${sourceDate}.`);
  } else {
    alert(`No new rows to copy from ${sourceDate}.`);
  }
  renderApp();
}

function buildBackupPayloadString() {
  return JSON.stringify({ data: DATA, settings: state.settings }, null, 2);
}

function triggerBackupDownload(payloadText, filename) {
  const blob = new Blob([payloadText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeFileNameToken(value, fallbackValue = "NA") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || fallbackValue;
}

function buildBackupFileName(prefix, dateText, branchId = "") {
  const dateToken = isIsoDate(dateText) ? dateText : isoDateToday();
  const branchToken = sanitizeFileNameToken(branchId || "ALL", "ALL");
  return `${prefix}-${branchToken}-${dateToken}.json`;
}

function supportsDirectoryBackupPicker() {
  return typeof window.showDirectoryPicker === "function";
}

function openBackupHandleDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(BACKUP_HANDLE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BACKUP_HANDLE_STORE_NAME)) {
        db.createObjectStore(BACKUP_HANDLE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open backup handle storage."));
  });
}

function runHandleStoreTransaction(mode, executor) {
  return openBackupHandleDb()
    .then((db) => {
      if (!db) {
        return null;
      }

      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(BACKUP_HANDLE_STORE_NAME, mode);
          const store = tx.objectStore(BACKUP_HANDLE_STORE_NAME);
          const request = executor(store);

          let result = null;
          if (request) {
            request.onsuccess = () => {
              result = request.result;
            };
            request.onerror = () => {
              reject(request.error || new Error("Backup handle request failed."));
            };
          }

          tx.oncomplete = () => {
            db.close();
            resolve(result);
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error || new Error("Backup handle transaction aborted."));
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error || new Error("Backup handle transaction failed."));
          };
        } catch (error) {
          db.close();
          reject(error);
        }
      });
    })
    .catch(() => null);
}

async function loadStoredDailyBackupDirectoryHandle() {
  const handle = await runHandleStoreTransaction("readonly", (store) =>
    store.get(DAILY_BACKUP_HANDLE_KEY)
  );
  return handle || null;
}

async function saveStoredDailyBackupDirectoryHandle(handle) {
  if (!handle) {
    return false;
  }
  const result = await runHandleStoreTransaction("readwrite", (store) =>
    store.put(handle, DAILY_BACKUP_HANDLE_KEY)
  );
  return result !== null;
}

async function clearStoredDailyBackupDirectoryHandle() {
  await runHandleStoreTransaction("readwrite", (store) => store.delete(DAILY_BACKUP_HANDLE_KEY));
}

async function ensureBackupDirectoryHandleLoaded() {
  if (dailyBackupDirectoryHandle) {
    return dailyBackupDirectoryHandle;
  }
  dailyBackupDirectoryHandle = await loadStoredDailyBackupDirectoryHandle();
  return dailyBackupDirectoryHandle;
}

async function ensureDirectoryWritePermission(handle) {
  if (!handle || typeof handle.queryPermission !== "function") {
    return false;
  }

  const permissionOptions = { mode: "readwrite" };
  try {
    const current = await handle.queryPermission(permissionOptions);
    if (current === "granted") {
      return true;
    }
    if (typeof handle.requestPermission !== "function") {
      return false;
    }
    const requested = await handle.requestPermission(permissionOptions);
    return requested === "granted";
  } catch {
    return false;
  }
}

async function chooseDailyBackupDirectory() {
  if (state.currentUser?.role !== "master") {
    return { ok: false, message: "Only master can set backup folder." };
  }
  if (!supportsDirectoryBackupPicker()) {
    return {
      ok: false,
      message: "This browser does not support folder picker. Use a Chromium browser for folder-based auto backup."
    };
  }

  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!handle) {
      return { ok: false, message: "Folder was not selected." };
    }

    const permitted = await ensureDirectoryWritePermission(handle);
    if (!permitted) {
      return { ok: false, message: "Folder write permission denied." };
    }

    dailyBackupDirectoryHandle = handle;
    const stored = await saveStoredDailyBackupDirectoryHandle(handle);
    state.settings.auto_backup_location_label = String(handle.name || "Selected folder");
    if (!stored) {
      return {
        ok: true,
        message: "Folder selected for this session. Browser blocked persistent folder access."
      };
    }

    return { ok: true, message: `Folder selected: ${state.settings.auto_backup_location_label}` };
  } catch (error) {
    if (String(error?.name || "") === "AbortError") {
      return { ok: false, message: "" };
    }
    return { ok: false, message: "Failed to select backup folder." };
  }
}

async function clearDailyBackupDirectory() {
  dailyBackupDirectoryHandle = null;
  state.settings.auto_backup_location_label = "";
  await clearStoredDailyBackupDirectoryHandle();
}

async function runAutoBackupAfterClosing(branchId, closingDate) {
  if (!state.settings.auto_backup_after_closing) {
    return { message: "" };
  }

  const handle = await ensureBackupDirectoryHandleLoaded();
  if (!handle) {
    return { message: "Auto backup skipped: select backup folder in Settings." };
  }

  const permitted = await ensureDirectoryWritePermission(handle);
  if (!permitted) {
    return { message: "Auto backup skipped: folder permission not granted." };
  }

  const fileName = buildBackupFileName("fishops-auto-backup", closingDate, branchId);
  const payload = buildBackupPayloadString();

  try {
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(payload);
    await writable.close();
    return { message: `Auto backup saved: ${fileName}` };
  } catch {
    return { message: "Auto backup failed: unable to write file in selected folder." };
  }
}

function exportBackup() {
  if (!hasPermission(state.currentUser, "backup_export")) {
    return;
  }
  const payload = buildBackupPayloadString();
  const filename = buildBackupFileName("fishops-backup", state.date, state.branchId);
  triggerBackupDownload(payload, filename);
  saveStoreWithActivity("BACKUP_EXPORT", `Downloaded backup file ${filename}.`, {
    details: { filename }
  });
}

function normalizeImportedBackupPayload(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Backup file must be a JSON object.");
  }

  const payloadData = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
  const requiredCollections = [
    "branches",
    "users",
    "fish_profiles",
    "branch_fish_settings",
    "daily_prices",
    "daily_stock_entry"
  ];

  function normalizeCollection(value, key) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === "object") {
      // Some backups serialize one-row collections as a single object.
      return [value];
    }
    throw new Error(`Invalid backup: "${key}" must be an array or object.`);
  }

  const collections = {};
  for (const key of requiredCollections) {
    collections[key] = normalizeCollection(payloadData[key], key);
  }
  const holdStockRows =
    payloadData.hold_stock_entry === undefined
      ? []
      : normalizeCollection(payloadData.hold_stock_entry, "hold_stock_entry");
  const importedShopOrderRows =
    payloadData.shop_orders === undefined
      ? []
      : normalizeCollection(payloadData.shop_orders, "shop_orders");
  const customerBillRows =
    payloadData.customer_bills === undefined
      ? importedShopOrderRows.filter((row) => isBillingRow(row))
      : normalizeCollection(payloadData.customer_bills, "customer_bills");
  const shopOrderRows = importedShopOrderRows.filter((row) => isShopOrderRow(row));
  const appErrorRows =
    payloadData.app_error_logs === undefined
      ? []
      : normalizeCollection(payloadData.app_error_logs, "app_error_logs");
  const activityRows =
    payloadData.activity_logs === undefined
      ? []
      : normalizeCollection(payloadData.activity_logs, "activity_logs");

  const defaults = createDefaultStore();
  const settingsSource =
    parsed.settings && typeof parsed.settings === "object" ? parsed.settings : state.settings;

  return {
    data: {
      branches: collections.branches,
      users: collections.users,
      fish_profiles: collections.fish_profiles,
      branch_fish_settings: collections.branch_fish_settings,
      daily_prices: collections.daily_prices,
      daily_stock_entry: collections.daily_stock_entry,
      hold_stock_entry: holdStockRows,
      shop_orders: shopOrderRows,
      customer_bills: customerBillRows,
      app_error_logs: appErrorRows,
      activity_logs: activityRows
    },
    settings: {
      ...defaults.settings,
      ...(settingsSource || {})
    }
  };
}

async function importBackupFromFile(file) {
  if (!ensureWriteAllowed()) {
    return;
  }

  const raw = await file.text();
  const parsed = JSON.parse(raw);
  const nextStore = normalizeImportedBackupPayload(parsed);
  const previousUserId = state.currentUser?.id;

  const persistResult = writeSnapshotToLocalStorage(nextStore, { notifyOnQuota: true });
  if (!persistResult.ok) {
    throw new Error("Not enough browser storage to import this backup.");
  }
  loadStore(persistResult.savedSnapshot);
  applyBranding();
  scheduleRemoteStorePush();

  const currentUser = DATA.users.find(
    (user) => user.id === previousUserId && user.status === "active"
  );
  if (!currentUser) {
    saveStore({
      activityCategory: "backup",
      activityAction: "Imported backup file",
      activityDetails: { file: file.name || "" }
    });
    endSession();
    alert("Backup imported. Please log in again.");
    return;
  }

  state.currentUser = currentUser;
  saveStore({
    activityCategory: "backup",
    activityAction: "Imported backup file",
    activityDetails: { file: file.name || "" }
  });
  populateBranchSelector();
  renderApp();
  saveStoreWithActivity("BACKUP_IMPORT", "Imported backup from file.", {
    details: { fileName: file.name, importedAt: new Date().toISOString() }
  });
  alert("Backup imported successfully.");
}

function openBackupImportPicker() {
  if (!hasPermission(state.currentUser, "backup_restore_import")) {
    return;
  }
  if (!ensureWriteAllowed()) {
    return;
  }

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = ".json,application/json";
  picker.addEventListener(
    "change",
    async () => {
      const file = picker.files?.[0];
      if (!file) {
        return;
      }

      try {
        await importBackupFromFile(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        alert(`Import failed: ${message}`);
      }
    },
    { once: true }
  );
  picker.click();
}

async function installApp() {
  if (!state.currentUser || state.currentUser.role !== "master") {
    return;
  }
  if (!state.deferredInstallPrompt) {
    alert("Install is not available in this browser context yet.");
    return;
  }

  state.deferredInstallPrompt.prompt();
  try {
    await state.deferredInstallPrompt.userChoice;
  } catch {
    // ignore
  }
  state.deferredInstallPrompt = null;
  renderApp();
}

function setupInstallPromptListeners() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    if (state.currentUser) {
      renderApp();
    }
  });

  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    if (state.currentUser) {
      renderApp();
    }
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  navigator.serviceWorker
    .register("./service-worker.js?v=20260308-13")
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state !== "installed") {
            return;
          }
          if (!navigator.serviceWorker.controller) {
            return;
          }

          const shouldReload = window.confirm("A new app update is available. Reload now?");
          if (shouldReload) {
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    })
    .catch(() => {
      // no-op
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

function getJsPdfClass() {
  return window.jspdf?.jsPDF || null;
}

function pdfAlertColor(alertText) {
  const normalized = String(alertText || "").toUpperCase();
  if (normalized === "CRITICAL") {
    return [220, 38, 38];
  }
  if (normalized === "LOW") {
    return [245, 158, 11];
  }
  if (normalized === "OK") {
    return [22, 163, 74];
  }
  return [59, 130, 246];
}

function getPdfImageFormat(dataUrl) {
  const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,/.exec(String(dataUrl || ""));
  const format = String(match?.[1] || "").toLowerCase();
  if (format === "jpg" || format === "jpeg") {
    return "JPEG";
  }
  if (format === "png") {
    return "PNG";
  }
  if (format === "webp") {
    return "WEBP";
  }
  return "PNG";
}

function drawPdfReportHeader(doc, title, branchLabel, dateText) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 22, "F");

  let logoDrawn = false;
  const logoData = String(state.settings.company_logo || "");
  if (logoData.startsWith("data:image/")) {
    try {
      doc.addImage(logoData, getPdfImageFormat(logoData), 10, 5, 12, 12);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    doc.setFillColor(13, 148, 136);
    doc.roundedRect(10, 5, 12, 12, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(state.settings.logo_text || "RTx").slice(0, 3), 16, 13, { align: "center" });
  }

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 26, 13);

  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(`Branch: ${branchLabel}`, 10, 30);
  doc.text(`Date: ${dateText}`, 10, 35);
  doc.setTextColor(0, 0, 0);
  return 42;
}

function writePdfTableHeader(doc, y) {
  doc.setFillColor(238, 242, 255);
  doc.rect(10, y - 4, 190, 7, "F");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Fish", 12, y);
  doc.text("Sold", 63, y);
  doc.text("Revenue", 93, y);
  doc.text("Cost", 128, y);
  doc.text("Profit", 160, y);
  doc.text("Status", 196, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  return y + 7;
}

function ensurePdfRow(doc, y, nextPageStartY = 16) {
  if (y <= 280) {
    return y;
  }
  doc.addPage();
  return nextPageStartY;
}

function appendPdfFooterToAllPages(doc) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(90);
    const footerLines = doc.splitTextToSize(PDF_COPYRIGHT_LINE, pageWidth - 20);
    const startY = pageHeight - 8 - (footerLines.length - 1) * 3.2;
    footerLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, startY + index * 3.2, { align: "center" });
    });
  }

  doc.setTextColor(0);
}

function downloadDailyReportPdf() {
  const JsPDF = getJsPdfClass();
  if (!JsPDF) {
    alert("PDF engine not loaded. Check internet/CDN access.");
    return;
  }

  const { rows, totals } = buildSummary(state.branchId, state.date);
  const branchLabel = getBranchScopeLabel(state.branchId);
  const branchToken = isAllBranchesValue(state.branchId) ? "ALL" : state.branchId;
  const doc = new JsPDF();
  const continuationY = 16;
  let y = drawPdfReportHeader(doc, "FishOps Daily Report", branchLabel, state.date);

  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(`Revenue: ${money(totals.revenue)} | Cost: ${money(totals.cost)} | Profit: ${money(totals.profit)}`, 10, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  y = writePdfTableHeader(doc, y);
  for (const row of rows) {
    y = ensurePdfRow(doc, y, continuationY);
    if (y === continuationY) {
      y = writePdfTableHeader(doc, y);
    }

    doc.setTextColor(15, 23, 42);
    doc.text(row.fish.name.slice(0, 24), 10, y);
    doc.text(`${row.sold.toFixed(2)} ${row.fish.unit}`, 62, y);
    doc.text(row.revenue === null ? "-" : money(row.revenue), 90, y);
    doc.text(row.cost === null ? "-" : money(row.cost), 125, y);
    if (row.profit === null) {
      doc.text("-", 160, y);
    } else {
      doc.setTextColor(row.profit >= 0 ? 22 : 220, row.profit >= 0 ? 163 : 38, row.profit >= 0 ? 74 : 38);
      doc.text(money(row.profit), 160, y);
    }
    const [statusR, statusG, statusB] = pdfAlertColor(row.alert);
    doc.setTextColor(statusR, statusG, statusB);
    doc.text(row.alert, 196, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 7;
  }

  appendPdfFooterToAllPages(doc);
  doc.save(`fishops-daily-report-${branchToken}-${state.date}.pdf`);
}

function downloadTomorrowOrderPdf() {
  const JsPDF = getJsPdfClass();
  if (!JsPDF) {
    alert("PDF engine not loaded. Check internet/CDN access.");
    return;
  }

  const { rows } = buildSummary(state.branchId, state.date);
  const orders = rows.filter((row) => row.orderQty > 0);
  const branchLabel = getBranchScopeLabel(state.branchId);
  const branchToken = isAllBranchesValue(state.branchId) ? "ALL" : state.branchId;
  const doc = new JsPDF();
  const continuationY = 16;
  let y = drawPdfReportHeader(doc, "FishOps Tomorrow Order Plan", branchLabel, state.date);

  doc.setFillColor(238, 242, 255);
  doc.rect(10, y - 4, 190, 7, "F");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Fish", 12, y);
  doc.text("Order Qty", 110, y);
  doc.text("Status", 196, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 7;

  for (const row of orders) {
    y = ensurePdfRow(doc, y, continuationY);
    if (y === continuationY) {
      doc.setFillColor(238, 242, 255);
      doc.rect(10, y - 4, 190, 7, "F");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Fish", 12, y);
      doc.text("Order Qty", 110, y);
      doc.text("Status", 196, y, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    doc.setTextColor(15, 23, 42);
    doc.text(row.fish.name.slice(0, 24), 10, y);
    doc.text(`${row.orderQty.toFixed(2)} ${row.fish.unit}`, 100, y);
    const [statusR, statusG, statusB] = pdfAlertColor(row.alert);
    doc.setTextColor(statusR, statusG, statusB);
    doc.text(row.alert, 196, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 7;
  }

  if (orders.length === 0) {
    doc.setTextColor(59, 130, 246);
    doc.text("No order required for tomorrow.", 10, y);
    doc.setTextColor(0, 0, 0);
  }

  appendPdfFooterToAllPages(doc);
  doc.save(`fishops-tomorrow-order-${branchToken}-${state.date}.pdf`);
}

function bindUsersPageEvents() {
  if (isWriteRestricted()) {
    return;
  }

  const updateCreateHiddenTabs = () => {
    const roleInput = document.getElementById("newUserRole");
    const tabsInput = document.getElementById("newUserHiddenPages");
    if (!roleInput || !tabsInput) {
      return;
    }
    const role = String(roleInput.value || "user").trim().toLowerCase();
    const selectedHidden = Array.from(tabsInput.selectedOptions).map((option) => option.value);
    const nextHidden = normalizeUserHiddenPageIds(role, selectedHidden);
    tabsInput.innerHTML = renderPageAccessOptions(role, nextHidden);
    tabsInput.disabled = role === "master";
  };

  const createForm = document.getElementById("userCreateForm");
  const createRoleInput = document.getElementById("newUserRole");
  createRoleInput?.addEventListener("change", updateCreateHiddenTabs);
  updateCreateHiddenTabs();

  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("newUserUsername")?.value.trim();
    const password = document.getElementById("newUserPassword")?.value;
    const role = document.getElementById("newUserRole")?.value;
    const branch = document.getElementById("newUserBranch")?.value || null;
    const status = document.getElementById("newUserStatus")?.value || "active";
    const hiddenPagesInput = document.getElementById("newUserHiddenPages");
    const selectedHiddenPages = hiddenPagesInput
      ? Array.from(hiddenPagesInput.selectedOptions).map((option) => option.value)
      : [];
    const normalizedHiddenPages = normalizeUserHiddenPageIds(role, selectedHiddenPages);
    const scopedBranch = normalizeUserBranchScope(role, branch);

    if (!username || !password || !role) {
      alert("Username, password, and role are required.");
      return;
    }
    if (role === "user" && !scopedBranch) {
      alert("User role must be assigned to a branch.");
      return;
    }
    if (DATA.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      alert("Username already exists.");
      return;
    }

    DATA.users.push({
      id: makeId("USR"),
      username,
      password,
      role,
      branch_id: scopedBranch,
      status,
      photo: "",
      hidden_page_ids: normalizedHiddenPages
    });
    saveStoreWithActivity("USER_CREATE", `Created user "${username}".`, {
      details: {
        role,
        branch_id: scopedBranch,
        status,
        hidden_tabs: normalizedHiddenPages.length
      }
    });
    renderApp();
  });

  document.querySelectorAll("[id^='user-role-']").forEach((roleInput) => {
    roleInput.addEventListener("change", () => {
      const userId = String(roleInput.id || "").replace("user-role-", "");
      const tabsInput = document.getElementById(`user-tabs-${userId}`);
      if (!tabsInput) {
        return;
      }
      const role = String(roleInput.value || "user").trim().toLowerCase();
      const selectedHidden = Array.from(tabsInput.selectedOptions).map((option) => option.value);
      const nextHidden = normalizeUserHiddenPageIds(role, selectedHidden);
      tabsInput.innerHTML = renderPageAccessOptions(role, nextHidden);
      tabsInput.disabled = role === "master";
      const hint = tabsInput.parentElement?.querySelector(".user-tabs-hint");
      if (hint) {
        const rolePages = getRoleVisiblePageIds(role);
        hint.textContent =
          role === "master"
            ? "Master always sees all tabs"
            : nextHidden.length === 0
              ? "No hidden tabs"
              : `${nextHidden.length} tab(s) hidden (${Math.max(0, rolePages.length - nextHidden.length)} visible)`;
      }
    });
  });

  document.querySelectorAll(".user-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const userId = button.getAttribute("data-user-id");
      if (!userId) {
        return;
      }
      const user = findUserById(userId);
      if (!user) {
        return;
      }

      const role = document.getElementById(`user-role-${userId}`)?.value || user.role;
      const branch = document.getElementById(`user-branch-${userId}`)?.value || "";
      const status = document.getElementById(`user-status-${userId}`)?.value || user.status;
      const newPassword = document.getElementById(`user-password-${userId}`)?.value || "";
      const tabsInput = document.getElementById(`user-tabs-${userId}`);
      const selectedHiddenPages = tabsInput
        ? Array.from(tabsInput.selectedOptions).map((option) => option.value)
        : [];
      const normalizedHiddenPages = normalizeUserHiddenPageIds(role, selectedHiddenPages);
      const scopedBranch = normalizeUserBranchScope(role, branch);

      if (role === "user" && !scopedBranch) {
        alert("User role must be assigned to a branch.");
        return;
      }

      user.role = role;
      user.branch_id = scopedBranch;
      user.status = status;
      user.hidden_page_ids = normalizedHiddenPages;
      if (newPassword.trim()) {
        user.password = newPassword.trim();
      }

      if (state.currentUser?.id === user.id) {
        state.currentUser = user;
        if (user.status !== "active") {
          alert("Current session user is now inactive. Please login again.");
          saveStoreWithActivity("USER_UPDATE", `Updated user "${user.username}".`, {
            details: {
              role,
              branch_id: scopedBranch,
              status,
              hidden_tabs: normalizedHiddenPages.length,
              password_changed: Boolean(newPassword.trim())
            }
          });
          endSession();
          return;
        }
        populateBranchSelector();
      }

      saveStoreWithActivity("USER_UPDATE", `Updated user "${user.username}".`, {
        details: {
          role,
          branch_id: scopedBranch,
          status,
          hidden_tabs: normalizedHiddenPages.length,
          password_changed: Boolean(newPassword.trim())
        }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".user-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const userId = button.getAttribute("data-user-id");
      if (!userId) {
        return;
      }
      const user = findUserById(userId);
      if (!user) {
        return;
      }

      const activeMasters = DATA.users.filter(
        (entry) => entry.role === "master" && entry.status === "active"
      );
      if (user.role === "master" && activeMasters.length <= 1) {
        alert("At least one active master user is required.");
        return;
      }

      const ok = window.confirm(`Delete user "${user.username}"?`);
      if (!ok) {
        return;
      }

      DATA.users = DATA.users.filter((entry) => entry.id !== userId);
      saveStoreWithActivity("USER_DELETE", `Deleted user "${user.username}".`, {
        details: { role: user.role, branch_id: user.branch_id }
      });

      if (state.currentUser?.id === userId) {
        endSession();
        return;
      }
      renderApp();
    });
  });
}

function bindFishPageEvents() {
  bindFishQuickSearch(
    "fishProfilesSearchInput",
    "fishProfilesTableBody",
    "fishProfilesSearchEmptyRow",
    "fishProfiles"
  );

  if (isWriteRestricted()) {
    return;
  }

  if (!hasPermission(state.currentUser, "upsert_fish_profile")) {
    return;
  }

  const createForm = document.getElementById("fishCreateForm");
  createForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fishCodeInput = document.getElementById("newFishCode")?.value.trim().toUpperCase();
    const fishCode = fishCodeInput || nextFishCode();
    const name = document.getElementById("newFishName")?.value.trim();
    const category = document.getElementById("newFishCategory")?.value || "Sea";
    const unit = document.getElementById("newFishUnit")?.value || "kg";
    const status = document.getElementById("newFishStatus")?.value || "active";
    const photoFile = document.getElementById("newFishPhotoInput")?.files?.[0] || null;

    if (!name) {
      alert("Fish name is required.");
      return;
    }
    if (!/^F-\d{4}$/.test(fishCode)) {
      alert("Fish code must follow F-0001 format.");
      return;
    }
    if (DATA.fish_profiles.some((fish) => fish.fish_code === fishCode)) {
      alert("Fish code already exists.");
      return;
    }

    let photo = "";
    if (photoFile) {
      if (!String(photoFile.type || "").startsWith("image/")) {
        alert("Please select an image file for fish photo.");
        return;
      }
      try {
        photo = await optimizeImageDataUrl(photoFile, {
          maxEdge: 320,
          outputType: "image/webp",
          quality: 0.8
        });
      } catch {
        alert("Unable to process fish photo.");
        return;
      }
    }

    DATA.fish_profiles.push({
      id: makeId("FISH"),
      fish_code: fishCode,
      name,
      category,
      unit,
      status,
      photo
    });
    saveStoreWithActivity("FISH_CREATE", `Added fish "${name}" (${fishCode}).`, {
      details: { fish_code: fishCode, category, unit, status, has_photo: Boolean(photo) }
    });
    renderApp();
  });

  document.querySelectorAll(".fish-save-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const fishId = button.getAttribute("data-fish-id");
      if (!fishId) {
        return;
      }
      const fish = findFishById(fishId);
      if (!fish) {
        return;
      }
      const name = document.getElementById(`fish-name-${fishId}`)?.value.trim();
      const category = document.getElementById(`fish-category-${fishId}`)?.value || fish.category;
      const unit = document.getElementById(`fish-unit-${fishId}`)?.value || fish.unit;
      const status = document.getElementById(`fish-status-${fishId}`)?.value || fish.status;
      const photoFile = document.getElementById(`fish-photo-${fishId}`)?.files?.[0] || null;
      const removePhoto = Boolean(document.getElementById(`fish-photo-remove-${fishId}`)?.checked);

      if (!name) {
        alert("Fish name is required.");
        return;
      }

      let photo = removePhoto ? "" : String(fish.photo || "");
      if (photoFile) {
        if (!String(photoFile.type || "").startsWith("image/")) {
          alert("Please select an image file for fish photo.");
          return;
        }
        try {
          photo = await optimizeImageDataUrl(photoFile, {
            maxEdge: 320,
            outputType: "image/webp",
            quality: 0.8
          });
        } catch {
          alert("Unable to process fish photo.");
          return;
        }
      }

      fish.name = name;
      fish.category = category;
      fish.unit = unit;
      fish.status = status;
      fish.photo = photo;
      saveStoreWithActivity("FISH_UPDATE", `Updated fish "${name}" (${fish.fish_code}).`, {
        details: { fish_id: fish.id, category, unit, status, has_photo: Boolean(photo) }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".fish-toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const fishId = button.getAttribute("data-fish-id");
      const fish = fishId ? findFishById(fishId) : null;
      if (!fish) {
        return;
      }
      fish.status = fish.status === "active" ? "inactive" : "active";
      saveStoreWithActivity("FISH_STATUS_TOGGLE", `Set fish "${fish.name}" to ${fish.status}.`, {
        details: { fish_id: fish.id, fish_code: fish.fish_code, status: fish.status }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".fish-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!hasPermission(state.currentUser, "delete_fish_profile")) {
        return;
      }
      const fishId = button.getAttribute("data-fish-id");
      const fish = fishId ? findFishById(fishId) : null;
      if (!fish) {
        return;
      }

      const ok = window.confirm(
        `Delete fish "${fish.name}" and related settings/prices/stock/hold entries?`
      );
      if (!ok) {
        return;
      }

      DATA.fish_profiles = DATA.fish_profiles.filter((item) => item.id !== fishId);
      DATA.branch_fish_settings = DATA.branch_fish_settings.filter((item) => item.fish_id !== fishId);
      DATA.daily_prices = DATA.daily_prices.filter((item) => item.fish_id !== fishId);
      DATA.daily_stock_entry = DATA.daily_stock_entry.filter((item) => item.fish_id !== fishId);
      DATA.hold_stock_entry = DATA.hold_stock_entry.filter((item) => item.fish_id !== fishId);
      saveStoreWithActivity(
        "FISH_DELETE",
        `Deleted fish "${fish.name}" (${fish.fish_code}) and related records.`,
        { details: { fish_id: fish.id } }
      );
      renderApp();
    });
  });
}

function bindBranchSettingsEvents() {
  bindFishQuickSearch(
    "branchSettingsSearchInput",
    "branchSettingsTableBody",
    "branchSettingsSearchEmptyRow",
    "branchFishSettings"
  );

  if (isWriteRestricted()) {
    return;
  }

  const createForm = document.getElementById("settingCreateForm");
  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fishSearchText = document.getElementById("newSettingFishInput")?.value;
    const fish = findFishByCodeOrName(fishSearchText);
    const minStock = numberOr(document.getElementById("newSettingMin")?.value, 0);
    const targetStock = numberOr(document.getElementById("newSettingTarget")?.value, 0);
    const isActive = (document.getElementById("newSettingActive")?.value || "true") === "true";

    if (!fish) {
      alert("Fish code/name not found.");
      return;
    }

    const fishId = fish.id;
    if (targetStock < minStock) {
      alert("Target stock should be greater than or equal to min stock.");
      return;
    }

    upsertBranchSetting(state.branchId, fishId, minStock, targetStock, isActive);
    saveStoreWithActivity("BRANCH_SETTING_UPSERT", `Saved branch fish setting for ${fishDisplayLabel(fish)}.`, {
      details: {
        branch_id: state.branchId,
        fish_id: fishId,
        min_stock: minStock,
        target_stock: targetStock,
        is_active: isActive
      }
    });
    renderApp();
  });

  document.querySelectorAll(".setting-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const settingId = button.getAttribute("data-setting-id");
      if (!settingId) {
        return;
      }
      const setting = DATA.branch_fish_settings.find((item) => item.id === settingId);
      if (!setting) {
        return;
      }
      const minStock = numberOr(document.getElementById(`setting-min-${settingId}`)?.value, setting.min_stock);
      const targetStock = numberOr(
        document.getElementById(`setting-target-${settingId}`)?.value,
        setting.target_stock
      );
      const isActive = (document.getElementById(`setting-active-${settingId}`)?.value || "true") === "true";

      if (targetStock < minStock) {
        alert("Target stock should be greater than or equal to min stock.");
        return;
      }

      setting.min_stock = minStock;
      setting.target_stock = targetStock;
      setting.is_active = isActive;
      saveStoreWithActivity("BRANCH_SETTING_UPDATE", "Updated branch fish setting.", {
        details: {
          setting_id: setting.id,
          branch_id: setting.branch_id,
          fish_id: setting.fish_id,
          min_stock: minStock,
          target_stock: targetStock,
          is_active: isActive
        }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".setting-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const settingId = button.getAttribute("data-setting-id");
      if (!settingId) {
        return;
      }
      const setting = DATA.branch_fish_settings.find((item) => item.id === settingId);
      DATA.branch_fish_settings = DATA.branch_fish_settings.filter((item) => item.id !== settingId);
      saveStoreWithActivity("BRANCH_SETTING_DELETE", "Deleted branch fish setting.", {
        details: {
          setting_id: settingId,
          branch_id: setting?.branch_id || "",
          fish_id: setting?.fish_id || ""
        }
      });
      renderApp();
    });
  });
}

function bindDailyPricesEvents() {
  bindFishQuickSearch(
    "dailyPricesSearchInput",
    "dailyPricesTableBody",
    "dailyPricesSearchEmptyRow",
    "dailyPrices"
  );

  if (isWriteRestricted()) {
    return;
  }

  const form = document.getElementById("priceUpsertForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fishSearchText = document.getElementById("priceFishInput")?.value;
    const fish = findFishByCodeOrName(fishSearchText);
    const sell = numberOr(document.getElementById("priceSellInput")?.value, 0);
    const cost = numberOr(document.getElementById("priceCostInput")?.value, 0);

    if (!fish) {
      alert("Fish code/name not found.");
      return;
    }
    if (fish.status !== "active") {
      alert("Selected fish is inactive.");
      return;
    }

    const fishId = fish.id;
    upsertDailyPrice(state.branchId, state.date, fishId, sell, cost, {
      auto_price_from: "",
      price_source: "morning"
    });
    saveStoreWithActivity("DAILY_PRICE_UPSERT", `Saved daily price for ${fishDisplayLabel(fish)}.`, {
      details: {
        branch_id: state.branchId,
        date: state.date,
        fish_id: fishId,
        sell_price_per_unit: sell,
        cost_price_per_unit: cost,
        source: "morning"
      }
    });
    renderApp();
  });

  document.querySelectorAll(".price-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const priceId = button.getAttribute("data-price-id");
      if (!priceId) {
        return;
      }
      const price = DATA.daily_prices.find((item) => item.id === priceId);
      if (!price) {
        return;
      }
      const sell = numberOr(document.getElementById(`price-sell-${priceId}`)?.value, price.sell_price_per_unit);
      const cost = numberOr(document.getElementById(`price-cost-${priceId}`)?.value, price.cost_price_per_unit);
      price.sell_price_per_unit = sell;
      price.cost_price_per_unit = cost;
      price.auto_price_from = "";
      price.price_source = "morning";
      const fish = findFishById(price.fish_id);
      saveStoreWithActivity("DAILY_PRICE_UPDATE", `Updated daily price for ${fishDisplayLabel(fish, price.fish_id)}.`, {
        details: {
          price_id: price.id,
          branch_id: price.branch_id,
          date: price.date,
          fish_id: price.fish_id,
          sell_price_per_unit: sell,
          cost_price_per_unit: cost
        }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".price-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const priceId = button.getAttribute("data-price-id");
      if (!priceId) {
        return;
      }
      const price = DATA.daily_prices.find((item) => item.id === priceId);
      DATA.daily_prices = DATA.daily_prices.filter((item) => item.id !== priceId);
      saveStoreWithActivity("DAILY_PRICE_DELETE", "Deleted daily price entry.", {
        details: {
          price_id: priceId,
          branch_id: price?.branch_id || "",
          date: price?.date || "",
          fish_id: price?.fish_id || ""
        }
      });
      renderApp();
    });
  });
}

function bindYDailyPricesEvents() {
  bindFishQuickSearch(
    "yDailyPricesSearchInput",
    "yDailyPricesTableBody",
    "yDailyPricesSearchEmptyRow",
    "yDailyPrices"
  );
}

function bindHoldStockEvents() {
  bindFishQuickSearch(
    "holdStockSearchInput",
    "holdStockTableBody",
    "holdStockSearchEmptyRow",
    "holdStock"
  );

  if (isWriteRestricted()) {
    return;
  }

  const form = document.getElementById("holdStockForm");
  const fishCodeInput = document.getElementById("holdFishCodeInput");
  const fishCountInput = document.getElementById("holdFishCountInput");
  const fullKgInput = document.getElementById("holdFullKgInput");
  const totalCostInput = document.getElementById("holdTotalCostInput");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ensureWriteAllowed()) {
      return;
    }

    const fishSearchText = String(fishCodeInput?.value || "").trim();
    const fish = findFishByCodeOrName(fishSearchText);
    if (!fish) {
      alert("Fish code/name not found.");
      return;
    }
    if (fish.status !== "active") {
      alert("Selected fish is inactive.");
      return;
    }

    const fishCount = Math.max(1, Math.round(numberOr(fishCountInput?.value, 1)));
    const metrics = calculateHoldStockMetrics(fullKgInput?.value, 0, totalCostInput?.value, 0);

    if (metrics.fullQty <= 0) {
      alert("Full fish kg must be greater than zero.");
      return;
    }

    const holdEntry = {
      id: makeId("HLD"),
      date: state.date,
      branch_id: state.branchId,
      fish_id: fish.id,
      fish_code: fish.fish_code,
      fish_count: fishCount,
      full_qty_kg: metrics.fullQty,
      waste_qty_kg: metrics.wasteQty,
      usable_qty_kg: metrics.usableQty,
      total_cost_lkr: metrics.totalCostLkr,
      cost_per_kg: metrics.costPerKgLkr,
      profit_margin_per_kg: metrics.marginPerKgLkr,
      sell_price_per_kg: metrics.sellPricePerKgLkr,
      status: "raw",
      moved_at: "",
      created_at: new Date().toISOString()
    };

    DATA.hold_stock_entry.push(holdEntry);
    saveStoreWithActivity("HOLD_STOCK_ADD", `Added hold stock for ${fishDisplayLabel(fish)}.`, {
      details: {
        hold_id: holdEntry.id,
        branch_id: holdEntry.branch_id,
        date: holdEntry.date,
        fish_id: holdEntry.fish_id,
        fish_count: holdEntry.fish_count,
        full_qty_kg: holdEntry.full_qty_kg,
        total_cost_lkr: holdEntry.total_cost_lkr
      }
    });
    renderApp();
    alert("Hold stock added.");
  });

  document.querySelectorAll(".hold-cut-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const holdId = button.getAttribute("data-hold-id");
      const entry = holdId ? DATA.hold_stock_entry.find((row) => row.id === holdId) : null;
      if (!entry) {
        return;
      }
      if (String(entry.status || "").toLowerCase() === "moved") {
        return;
      }

      const wasteInput = document.getElementById(`hold-waste-${entry.id}`);
      const profitInput = document.getElementById(`hold-profit-${entry.id}`);
      const costInput = document.getElementById(`hold-cost-${entry.id}`);
      const metrics = calculateHoldStockMetrics(
        entry.full_qty_kg,
        wasteInput?.value,
        costInput?.value,
        profitInput?.value
      );

      if (metrics.wasteQty > metrics.fullQty) {
        alert("Waste kg cannot be greater than full fish kg.");
        return;
      }
      if (metrics.usableQty <= 0) {
        alert("Remaining kg must be greater than zero.");
        return;
      }

      entry.waste_qty_kg = metrics.wasteQty;
      entry.usable_qty_kg = metrics.usableQty;
      entry.total_cost_lkr = metrics.totalCostLkr;
      entry.cost_per_kg = metrics.costPerKgLkr;
      entry.profit_margin_per_kg = metrics.marginPerKgLkr;
      entry.sell_price_per_kg = metrics.sellPricePerKgLkr;
      entry.status = "cut";
      entry.cut_at = new Date().toISOString();
      saveStoreWithActivity("HOLD_STOCK_CUT", `Cut hold stock entry ${entry.id}.`, {
        details: {
          hold_id: entry.id,
          branch_id: entry.branch_id,
          fish_id: entry.fish_id,
          usable_qty_kg: entry.usable_qty_kg,
          waste_qty_kg: entry.waste_qty_kg,
          sell_price_per_kg: entry.sell_price_per_kg
        }
      });
      renderApp();
      alert("Cut completed. You can move this stock now.");
    });
  });

  document.querySelectorAll(".hold-move-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const holdId = button.getAttribute("data-hold-id");
      const entry = holdId ? DATA.hold_stock_entry.find((row) => row.id === holdId) : null;
      if (!entry) {
        return;
      }
      const status = String(entry.status || "").toLowerCase();
      if (status === "moved") {
        return;
      }
      if (status !== "cut") {
        alert("Cut stock first, then move.");
        return;
      }

      const moved = moveHoldEntryToOperationalStock(entry);
      if (!moved) {
        alert("Unable to move this hold stock entry.");
        return;
      }
      saveStoreWithActivity("HOLD_STOCK_MOVE", `Moved hold stock entry ${entry.id} to operational stock.`, {
        details: {
          hold_id: entry.id,
          target_date: moved,
          branch_id: entry.branch_id,
          fish_id: entry.fish_id
        }
      });
      renderApp();
      alert(`Hold stock moved to current stock for ${moved}. Closing/waste and daily price updated.`);
    });
  });

  document.querySelectorAll(".hold-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const holdId = button.getAttribute("data-hold-id");
      if (!holdId) {
        return;
      }
      const ok = window.confirm("Delete this hold stock row?");
      if (!ok) {
        return;
      }
      const entry = DATA.hold_stock_entry.find((row) => row.id === holdId);
      DATA.hold_stock_entry = DATA.hold_stock_entry.filter((row) => row.id !== holdId);
      saveStoreWithActivity("HOLD_STOCK_DELETE", `Deleted hold stock entry ${holdId}.`, {
        details: {
          hold_id: holdId,
          branch_id: entry?.branch_id || "",
          fish_id: entry?.fish_id || "",
          date: entry?.date || ""
        }
      });
      renderApp();
    });
  });
}

function bindShopOrdersEvents() {
  bindFishQuickSearch(
    "shopOrdersSearchInput",
    "shopOrdersTableBody",
    "shopOrdersSearchEmptyRow",
    "shopOrders"
  );

  if (isWriteRestricted()) {
    return;
  }

  const canSelectBranch = canSelectAllBranches(state.currentUser);
  if (!canSelectBranch) {
    state.shopOrderDraftBranchId = state.branchId;
  }

  const createForm = document.getElementById("shopOrderCreateForm");
  const branchInput = document.getElementById("shopOrderBranchInput");
  const shopNameInput = document.getElementById("shopOrderShopNameInput");
  const shopStatusInput = document.getElementById("shopOrderStatusInput");
  const invoiceInput = document.getElementById("shopOrderInvoiceInput");
  const paymentMethodInput = document.getElementById("shopOrderPaymentMethodInput");
  const paymentTermsInput = document.getElementById("shopOrderPaymentTermsInput");
  const amountPaidInput = document.getElementById("shopOrderAmountPaidInput");
  const notesInput = document.getElementById("shopOrderNotesInput");
  const requestsInput = document.getElementById("shopOrderRequestsInput");
  const fishInput = document.getElementById("shopOrderFishInput");
  const qtyInput = document.getElementById("shopOrderQtyInput");
  const specialPriceInput = document.getElementById("shopOrderSpecialPriceInput");
  const addLineBtn = document.getElementById("addShopOrderLineBtn");

  branchInput?.addEventListener("change", () => {
    state.shopOrderDraftBranchId = String(branchInput.value || "").trim();
  });

  addLineBtn?.addEventListener("click", () => {
    if (!ensureWriteAllowed()) {
      return;
    }

    const fishQuery = String(fishInput?.value || "").trim();
    const fish = findFishByCodeOrName(fishQuery);
    if (!fish) {
      alert("Fish code/name not found.");
      return;
    }
    if (fish.status !== "active") {
      alert("Selected fish is inactive.");
      return;
    }

    const line = createShopOrderItemFromInput(fish, qtyInput?.value, specialPriceInput?.value);
    if (!line) {
      alert("Fish qty kg and special price must be greater than zero.");
      return;
    }

    state.shopOrderDraftItems.push(line);
    if (fishInput) {
      fishInput.value = "";
    }
    if (qtyInput) {
      qtyInput.value = "";
    }
    if (specialPriceInput) {
      specialPriceInput.value = "";
    }
    renderApp();
  });

  document.querySelectorAll(".shop-order-line-remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const index = Number(button.getAttribute("data-item-index"));
      if (!Number.isInteger(index) || index < 0 || index >= state.shopOrderDraftItems.length) {
        return;
      }
      state.shopOrderDraftItems.splice(index, 1);
      renderApp();
    });
  });

  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!ensureWriteAllowed()) {
      return;
    }

    const branchId = canSelectBranch
      ? String(branchInput?.value || state.shopOrderDraftBranchId || "").trim()
      : state.branchId;
    if (!branchId) {
      alert("Branch is required.");
      return;
    }
    if (!getAccessibleBranches(state.currentUser).some((branch) => branch.id === branchId)) {
      alert("Selected branch is not accessible.");
      return;
    }

    const shopName = String(shopNameInput?.value || "").trim();
    if (!shopName) {
      alert("Shop name is required.");
      return;
    }
    if (!state.shopOrderDraftItems.length) {
      alert("Add at least one fish line before creating order.");
      return;
    }

    const invoiceNoRaw = String(invoiceInput?.value || "").trim();
    const invoiceNo = invoiceNoRaw || nextShopInvoiceNo(state.date, branchId);
    if (
      DATA.shop_orders.some(
        (row) => isShopOrderRow(row) && String(row.invoice_no || "").toLowerCase() === invoiceNo.toLowerCase()
      )
    ) {
      alert(`Invoice "${invoiceNo}" already exists.`);
      return;
    }

    const order = {
      id: makeId("ORD"),
      date: state.date,
      order_channel: ORDER_CHANNEL_SHOP,
      branch_id: branchId,
      shop_name: shopName,
      shop_status: normalizeShopStatus(shopStatusInput?.value),
      invoice_no: invoiceNo,
      currency: state.settings.currency || "LKR",
      payment_method: normalizePaymentMethod(paymentMethodInput?.value),
      payment_terms: normalizePaymentTerms(paymentTermsInput?.value),
      amount_paid: Math.max(0, round2(numberOr(amountPaidInput?.value, 0))),
      notes: String(notesInput?.value || "").trim(),
      shop_requests: String(requestsInput?.value || "").trim(),
      items: state.shopOrderDraftItems.map((item) => ({
        id: makeId("ITM"),
        fish_id: item.fish_id,
        fish_code: item.fish_code,
        fish_name: item.fish_name,
        qty_kg: Math.max(0, round2(numberOr(item.qty_kg, 0))),
        special_price_per_kg: Math.max(0, round2(numberOr(item.special_price_per_kg, 0))),
        line_total: round2(numberOr(item.line_total, 0))
      })),
      total_amount: 0,
      balance_due: 0,
      payment_status: "UNPAID",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    rebuildShopOrderFinancials(order);
    DATA.shop_orders.push(order);
    state.shopOrderDraftBranchId = branchId;
    state.shopOrderDraftItems = [];
    saveStoreWithActivity("SHOP_ORDER_CREATE", `Created shop order "${invoiceNo}" for ${shopName}.`, {
      details: {
        order_id: order.id,
        invoice_no: invoiceNo,
        branch_id: branchId,
        shop_status: order.shop_status,
        item_count: order.items.length,
        total_amount: order.total_amount
      }
    });
    renderApp();
    alert(`Order created. Invoice: ${invoiceNo}`);
  });

  document.querySelectorAll(".shop-order-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const orderId = button.getAttribute("data-order-id");
      const order = orderId ? DATA.shop_orders.find((row) => row.id === orderId) : null;
      if (!order || !isShopOrderRow(order)) {
        return;
      }

      order.amount_paid = Math.max(
        0,
        round2(numberOr(document.getElementById(`shop-order-paid-${order.id}`)?.value, order.amount_paid))
      );
      order.payment_method = normalizePaymentMethod(
        document.getElementById(`shop-order-method-${order.id}`)?.value
      );
      order.payment_terms = normalizePaymentTerms(
        document.getElementById(`shop-order-terms-${order.id}`)?.value
      );
      order.shop_status = normalizeShopStatus(
        document.getElementById(`shop-order-status-${order.id}`)?.value || order.shop_status
      );
      order.notes = String(document.getElementById(`shop-order-notes-${order.id}`)?.value || "").trim();
      order.shop_requests = String(
        document.getElementById(`shop-order-requests-${order.id}`)?.value || ""
      ).trim();
      rebuildShopOrderFinancials(order);
      saveStoreWithActivity("SHOP_ORDER_UPDATE", `Updated shop order "${order.invoice_no || order.id}".`, {
        details: {
          order_id: order.id,
          invoice_no: order.invoice_no,
          amount_paid: order.amount_paid,
          shop_status: order.shop_status,
          payment_status: order.payment_status
        }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".shop-order-paid-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const orderId = button.getAttribute("data-order-id");
      const order = orderId ? DATA.shop_orders.find((row) => row.id === orderId) : null;
      if (!order || !isShopOrderRow(order)) {
        return;
      }
      order.amount_paid = round2(numberOr(order.total_amount, 0));
      rebuildShopOrderFinancials(order);
      saveStoreWithActivity("SHOP_ORDER_MARK_PAID", `Marked shop order "${order.invoice_no || order.id}" as paid.`, {
        details: {
          order_id: order.id,
          invoice_no: order.invoice_no,
          amount_paid: order.amount_paid
        }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".shop-order-invoice-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.getAttribute("data-order-id");
      const order = orderId ? DATA.shop_orders.find((row) => row.id === orderId) : null;
      if (!order || !isShopOrderRow(order)) {
        return;
      }
      downloadShopOrderInvoice(order);
    });
  });

  document.querySelectorAll(".shop-order-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const orderId = button.getAttribute("data-order-id");
      if (!orderId) {
        return;
      }
      const order = DATA.shop_orders.find((row) => row.id === orderId);
      if (!order || !isShopOrderRow(order)) {
        return;
      }
      const ok = window.confirm(
        `Delete shop order "${order.invoice_no || order.id}" for ${order.shop_name || "shop"}?`
      );
      if (!ok) {
        return;
      }
      DATA.shop_orders = DATA.shop_orders.filter((row) => row.id !== orderId);
      saveStoreWithActivity("SHOP_ORDER_DELETE", `Deleted shop order "${order.invoice_no || order.id}".`, {
        details: {
          order_id: order.id,
          invoice_no: order.invoice_no,
          branch_id: order.branch_id
        }
      });
      renderApp();
    });
  });
}

function bindShopStatusEvents() {
  bindFishQuickSearch(
    "shopStatusSearchInput",
    "shopStatusTableBody",
    "shopStatusSearchEmptyRow",
    "shopStatus"
  );

  if (isWriteRestricted()) {
    return;
  }

  document.querySelectorAll(".shop-status-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const orderId = String(button.getAttribute("data-order-id") || "");
      if (!orderId) {
        return;
      }
      const order = DATA.shop_orders.find((row) => row.id === orderId);
      if (!order || !isShopOrderRow(order)) {
        return;
      }

      const nextStatus = normalizeShopStatus(
        document.getElementById(`shop-status-select-${order.id}`)?.value || order.shop_status
      );
      const previousStatus = normalizeShopStatus(order.shop_status);
      if (nextStatus === previousStatus) {
        return;
      }

      order.shop_status = nextStatus;
      order.updated_at = new Date().toISOString();
      saveStoreWithActivity(
        "SHOP_STATUS_UPDATE",
        `Updated shop status for "${order.shop_name || order.invoice_no || order.id}" to ${shopStatusLabel(
          nextStatus
        )}.`,
        {
          details: {
            order_id: order.id,
            invoice_no: order.invoice_no,
            branch_id: order.branch_id,
            shop_status: nextStatus
          }
        }
      );
      renderApp();
    });
  });
}

function bindBillingEvents() {
  if (isWriteRestricted()) {
    return;
  }

  const canSelectBranch = canSelectAllBranches(state.currentUser);
  if (!canSelectBranch) {
    state.billingDraftBranchId = state.branchId;
  }

  const createForm = document.getElementById("billingCreateForm");
  const branchInput = document.getElementById("billingBranchInput");
  const customerInput = document.getElementById("billingCustomerNameInput");
  const invoiceInput = document.getElementById("billingInvoiceInput");
  const paymentMethodInput = document.getElementById("billingPaymentMethodInput");
  const paymentTermsInput = document.getElementById("billingPaymentTermsInput");
  const amountPaidInput = document.getElementById("billingAmountPaidInput");
  const balancePreviewInput = document.getElementById("billingBalancePreviewInput");
  const notesInput = document.getElementById("billingNotesInput");
  const requestsInput = document.getElementById("billingRequestsInput");
  const fishSearchInput = document.getElementById("billingFishSearchInput");
  const clearDraftBtn = document.getElementById("billingClearDraftBtn");

  const updateDraftBalancePreview = () => {
    const total = round2(
      state.billingDraftItems.reduce((sum, item) => sum + numberOr(item.line_total, 0), 0)
    );
    const paid = Math.max(0, round2(numberOr(state.billingDraftAmountPaid, 0)));
    const balance = round2(Math.abs(total - paid));
    const totalLabel = document.getElementById("billingDraftTotalText");
    const paidLabel = document.getElementById("billingDraftPaidText");
    const balanceLabel = document.getElementById("billingDraftBalanceText");
    if (totalLabel) {
      totalLabel.textContent = money(total);
    }
    if (paidLabel) {
      paidLabel.textContent = money(paid);
    }
    if (balanceLabel) {
      balanceLabel.textContent = money(balance);
    }
    if (balancePreviewInput instanceof HTMLInputElement) {
      balancePreviewInput.value = money(balance);
    }
  };

  branchInput?.addEventListener("change", () => {
    state.billingDraftBranchId = String(branchInput.value || "").trim();
    renderApp();
  });

  fishSearchInput?.addEventListener("input", () => {
    state.billingDraftSearch = String(fishSearchInput.value || "");
    renderApp();
  });

  document.querySelectorAll(".billing-pos-category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.billingDraftCategory = String(button.getAttribute("data-category") || BILLING_CATEGORY_ALL);
      renderApp();
    });
  });

  customerInput?.addEventListener("input", () => {
    state.billingDraftCustomerName = String(customerInput.value || "");
  });
  invoiceInput?.addEventListener("input", () => {
    state.billingDraftInvoiceNo = String(invoiceInput.value || "");
  });
  paymentMethodInput?.addEventListener("change", () => {
    state.billingDraftPaymentMethod = normalizePaymentMethod(paymentMethodInput.value);
  });
  paymentTermsInput?.addEventListener("change", () => {
    state.billingDraftPaymentTerms = normalizePaymentTerms(paymentTermsInput.value);
  });
  notesInput?.addEventListener("input", () => {
    state.billingDraftNotes = String(notesInput.value || "");
  });
  requestsInput?.addEventListener("input", () => {
    state.billingDraftRequests = String(requestsInput.value || "");
  });
  amountPaidInput?.addEventListener("input", () => {
    state.billingDraftAmountPaid = Math.max(0, round2(numberOr(amountPaidInput.value, 0)));
    updateDraftBalancePreview();
  });
  updateDraftBalancePreview();

  document.querySelectorAll(".billing-pos-product-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }

      const fishId = String(button.getAttribute("data-fish-id") || "");
      const fish = fishId ? findFishById(fishId) : null;
      if (!fish) {
        return;
      }
      if (fish.status !== "active") {
        alert("Selected fish is inactive.");
        return;
      }

      const defaultPrice = Math.max(0, round2(numberOr(button.getAttribute("data-default-price"), 0)));
      if (defaultPrice <= 0) {
        alert("Daily price is missing for this fish. Set daily price first.");
        return;
      }
      const availableKg = Math.max(0, round2(numberOr(button.getAttribute("data-stock-kg"), 0)));
      if (availableKg <= 0) {
        alert("Stock not available for this fish.");
        return;
      }

      const existing = state.billingDraftItems.find((item) => item.fish_id === fish.id);
      if (existing) {
        const currentQty = Math.max(0.01, round2(numberOr(existing.qty_kg, 0)));
        const remainingQty = round2(availableKg - currentQty);
        if (remainingQty <= 0) {
          alert(`Stock limit reached for ${fishDisplayLabel(fish)}. Available: ${availableKg.toFixed(2)} kg.`);
          return;
        }
        existing.qty_kg = round2(currentQty + Math.min(1, remainingQty));
        existing.line_total = round2(existing.qty_kg * Math.max(0.01, numberOr(existing.special_price_per_kg, 0)));
      } else {
        const line = createShopOrderItemFromInput(fish, Math.min(1, availableKg), defaultPrice);
        if (!line) {
          return;
        }
        state.billingDraftItems.push(line);
      }
      renderApp();
    });
  });

  document.querySelectorAll(".billing-line-remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const index = Number(button.getAttribute("data-item-index"));
      if (!Number.isInteger(index) || index < 0 || index >= state.billingDraftItems.length) {
        return;
      }
      state.billingDraftItems.splice(index, 1);
      renderApp();
    });
  });

  document.querySelectorAll(".billing-line-qty-input").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.getAttribute("data-item-index"));
      if (!Number.isInteger(index) || index < 0 || index >= state.billingDraftItems.length) {
        return;
      }
      const item = state.billingDraftItems[index];
      const nextQty = Math.max(0, round2(numberOr(input.value, item.qty_kg)));
      const availableKg = getBillingAvailableStockKg(state.billingDraftBranchId, state.date, item.fish_id);
      const boundedQty = availableKg > 0 ? Math.min(nextQty, availableKg) : 0;
      if (boundedQty <= 0) {
        state.billingDraftItems.splice(index, 1);
      } else {
        if (boundedQty < nextQty) {
          alert(`Only ${availableKg.toFixed(2)} kg available for ${item.fish_name}.`);
        }
        item.qty_kg = boundedQty;
        item.line_total = round2(item.qty_kg * Math.max(0.01, round2(numberOr(item.special_price_per_kg, 0))));
      }
      renderApp();
    });
  });

  document.querySelectorAll(".billing-line-price-input").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.getAttribute("data-item-index"));
      if (!Number.isInteger(index) || index < 0 || index >= state.billingDraftItems.length) {
        return;
      }
      const item = state.billingDraftItems[index];
      const nextPrice = Math.max(0, round2(numberOr(input.value, item.special_price_per_kg)));
      if (nextPrice <= 0) {
        alert("Price per kg must be greater than zero.");
        input.value = String(item.special_price_per_kg);
        return;
      }
      item.special_price_per_kg = nextPrice;
      item.line_total = round2(Math.max(0.01, round2(numberOr(item.qty_kg, 0))) * item.special_price_per_kg);
      renderApp();
    });
  });

  clearDraftBtn?.addEventListener("click", () => {
    state.billingDraftItems = [];
    renderApp();
  });

  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!ensureWriteAllowed()) {
      return;
    }

    const branchId = canSelectBranch
      ? String(branchInput?.value || state.billingDraftBranchId || "").trim()
      : state.branchId;
    if (!branchId) {
      alert("Branch is required.");
      return;
    }
    if (!getAccessibleBranches(state.currentUser).some((branch) => branch.id === branchId)) {
      alert("Selected branch is not accessible.");
      return;
    }

    const customerNameRaw = String(state.billingDraftCustomerName || customerInput?.value || "").trim();
    const customerName = customerNameRaw || nextBillingCustomerId(state.date, branchId);
    if (!state.billingDraftItems.length) {
      alert("Add at least one fish line before creating bill.");
      return;
    }
    for (const item of state.billingDraftItems) {
      const availableKg = getBillingAvailableStockKg(branchId, state.date, item.fish_id);
      const requestedKg = Math.max(0, round2(numberOr(item.qty_kg, 0)));
      if (availableKg <= 0) {
        alert(`Stock not available for ${item.fish_name}. Update stock and try again.`);
        return;
      }
      if (requestedKg > availableKg) {
        alert(`${item.fish_name} exceeds available stock (${availableKg.toFixed(2)} kg).`);
        return;
      }
    }

    const invoiceNoRaw = String(state.billingDraftInvoiceNo || invoiceInput?.value || "").trim();
    const invoiceNo = invoiceNoRaw || nextCustomerBillNo(state.date, branchId);
    if (DATA.customer_bills.some((row) => String(row.invoice_no || "").toLowerCase() === invoiceNo.toLowerCase())) {
      alert(`Bill no "${invoiceNo}" already exists.`);
      return;
    }
    const paidAmount = Math.max(0, round2(numberOr(state.billingDraftAmountPaid, amountPaidInput?.value)));

    const bill = {
      id: makeId("ORD"),
      date: state.date,
      order_channel: ORDER_CHANNEL_BILLING,
      branch_id: branchId,
      shop_name: customerName,
      invoice_no: invoiceNo,
      currency: state.settings.currency || "LKR",
      payment_method: normalizePaymentMethod(state.billingDraftPaymentMethod || paymentMethodInput?.value),
      payment_terms: normalizePaymentTerms(state.billingDraftPaymentTerms || paymentTermsInput?.value),
      amount_paid: paidAmount,
      notes: String(state.billingDraftNotes || notesInput?.value || "").trim(),
      shop_requests: String(state.billingDraftRequests || requestsInput?.value || "").trim(),
      items: state.billingDraftItems.map((item) => ({
        id: makeId("ITM"),
        fish_id: item.fish_id,
        fish_code: item.fish_code,
        fish_name: item.fish_name,
        qty_kg: Math.max(0, round2(numberOr(item.qty_kg, 0))),
        special_price_per_kg: Math.max(0, round2(numberOr(item.special_price_per_kg, 0))),
        line_total: round2(numberOr(item.line_total, 0))
      })),
      total_amount: 0,
      balance_due: 0,
      payment_status: "UNPAID",
      stock_applied: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    rebuildShopOrderFinancials(bill);
    const stockResult = applyBillingStockUpdate(bill, "decrease");
    if (!stockResult.ok) {
      alert(stockResult.message || "Unable to update stock for this bill.");
      return;
    }
    bill.stock_applied = true;
    const totalAmount = round2(numberOr(bill.total_amount, 0));
    const balanceAmount = round2(Math.abs(totalAmount - paidAmount));
    const isBalanceReturn = paidAmount > totalAmount;
    DATA.customer_bills.push(bill);
    state.billingDraftBranchId = branchId;
    state.billingDraftItems = [];
    state.billingDraftCustomerName = "";
    state.billingDraftInvoiceNo = "";
    state.billingDraftAmountPaid = 0;
    state.billingDraftNotes = "";
    state.billingDraftRequests = "";
    saveStoreWithActivity("CUSTOMER_BILL_CREATE", `Created customer bill "${invoiceNo}" for ${customerName}.`, {
      details: {
        order_id: bill.id,
        invoice_no: invoiceNo,
        branch_id: branchId,
        item_count: bill.items.length,
        total_amount: bill.total_amount,
        stock_updated: true
      }
    });
    renderApp();
    const balanceMessage =
      balanceAmount > 0
        ? isBalanceReturn
          ? `Balance to return: ${money(balanceAmount)}.`
          : `Balance due: ${money(balanceAmount)}.`
        : "No balance pending.";
    alert(`Bill created. Bill no: ${invoiceNo}. ${balanceMessage} Use Download button in Today Bills.`);
  });

  document.querySelectorAll(".billing-recent-invoice-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.getAttribute("data-order-id");
      const bill = orderId ? DATA.customer_bills.find((row) => row.id === orderId) : null;
      if (!bill) {
        return;
      }
      downloadCustomerBillInvoice(bill);
    });
  });

  document.querySelectorAll(".billing-recent-details-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = String(button.getAttribute("data-order-id") || "");
      if (!orderId) {
        return;
      }
      state.billingRecentDetailsId = state.billingRecentDetailsId === orderId ? "" : orderId;
      renderApp();
    });
  });

  document.querySelectorAll(".billing-recent-paid-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const orderId = button.getAttribute("data-order-id");
      const bill = orderId ? DATA.customer_bills.find((row) => row.id === orderId) : null;
      if (!bill) {
        return;
      }
      bill.amount_paid = round2(numberOr(bill.total_amount, 0));
      rebuildShopOrderFinancials(bill);
      saveStoreWithActivity("CUSTOMER_BILL_MARK_PAID", `Marked customer bill "${bill.invoice_no || bill.id}" as paid.`, {
        details: {
          order_id: bill.id,
          invoice_no: bill.invoice_no,
          amount_paid: bill.amount_paid
        }
      });
      renderApp();
    });
  });

  document.querySelectorAll(".billing-recent-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureWriteAllowed()) {
        return;
      }
      const orderId = button.getAttribute("data-order-id");
      if (!orderId) {
        return;
      }
      const bill = DATA.customer_bills.find((row) => row.id === orderId);
      if (!bill) {
        return;
      }
      const ok = window.confirm(
        `Delete customer bill "${bill.invoice_no || bill.id}" for ${bill.shop_name || "customer"}?`
      );
      if (!ok) {
        return;
      }
      if (Boolean(bill.stock_applied)) {
        const stockRestore = applyBillingStockUpdate(bill, "increase");
        if (!stockRestore.ok) {
          alert(stockRestore.message || "Unable to restore stock for this bill.");
          return;
        }
      }
      DATA.customer_bills = DATA.customer_bills.filter((row) => row.id !== orderId);
      saveStoreWithActivity("CUSTOMER_BILL_DELETE", `Deleted customer bill "${bill.invoice_no || bill.id}".`, {
        details: {
          order_id: bill.id,
          invoice_no: bill.invoice_no,
          branch_id: bill.branch_id,
          stock_restored: Boolean(bill.stock_applied)
        }
      });
      renderApp();
    });
  });
}

function bindRemainingStockHoldsEvents() {
  bindFishQuickSearch(
    "remainingStocksSearchInput",
    "remainingStocksTableBody",
    "remainingStocksSearchEmptyRow",
    "remainingStocks"
  );
  bindFishQuickSearch(
    "remainingHoldsSearchInput",
    "remainingHoldsTableBody",
    "remainingHoldsSearchEmptyRow",
    "remainingHolds"
  );
}

function bindOpeningEvents() {
  bindFishQuickSearch(
    "openingStockSearchInput",
    "openingStockTableBody",
    "openingStockSearchEmptyRow",
    "morningOpeningStock"
  );

  if (isWriteRestricted()) {
    return;
  }

  const form = document.getElementById("openingForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ensureWriteAllowed()) {
      return;
    }
    const rows = form.querySelectorAll("tbody tr[data-fish-id]");
    let updatedRows = 0;
    for (const row of rows) {
      const fishId = row.getAttribute("data-fish-id");
      if (!fishId) {
        continue;
      }
      updatedRows += 1;
      const openingQty = numberOr(row.querySelector(".opening-input")?.value, 0);
      const purchaseQty = numberOr(row.querySelector(".purchase-input")?.value, 0);
      const existingEntry = getStockEntry(state.branchId, state.date, fishId);
      const existingOpening = numberOr(existingEntry?.opening_qty, 0);
      const existingAutoSource = String(existingEntry?.auto_opening_from || "");
      const keepAutoSource =
        isIsoDate(existingAutoSource) && round2(existingOpening) === round2(openingQty);
      upsertStockEntry(state.branchId, state.date, fishId, {
        opening_qty: openingQty,
        purchase_qty: purchaseQty,
        auto_opening_from: keepAutoSource ? existingAutoSource : ""
      });
    }
    saveStoreWithActivity("OPENING_STOCK_SAVE", "Saved opening stock.", {
      details: {
        branch_id: state.branchId,
        date: state.date,
        rows_updated: updatedRows
      }
    });
    alert("Opening stock saved.");
    renderApp();
  });
}

function bindClosingEvents() {
  bindFishQuickSearch(
    "closingStockSearchInput",
    "closingStockTableBody",
    "closingStockSearchEmptyRow",
    "nightClosingStock"
  );

  if (isWriteRestricted()) {
    return;
  }

  const form = document.getElementById("closingForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ensureWriteAllowed()) {
      return;
    }
    const rows = form.querySelectorAll("tbody tr[data-fish-id]");
    for (const row of rows) {
      const fishId = row.getAttribute("data-fish-id");
      if (!fishId) {
        continue;
      }
      const closingQty = numberOr(row.querySelector(".closing-input")?.value, 0);
      upsertStockEntry(state.branchId, state.date, fishId, {
        closing_qty: closingQty
      });
    }
    const carry = autoCarryClosingToNextDay(state.branchId, state.date);
    const persisted = saveStoreWithActivity("CLOSING_STOCK_SAVE", "Saved closing stock.", {
      details: {
        branch_id: state.branchId,
        date: state.date,
        carried_items: carry.movedCount,
        carry_to_date: carry.nextDate
      }
    });
    if (!persisted) {
      renderApp();
      return;
    }

    const backupResult = await runAutoBackupAfterClosing(state.branchId, state.date);
    if (backupResult.message) {
      saveStore({
        activityCategory: "backup",
        activityAction: "Auto backup after closing stock",
        activityDetails: {
          branch_id: state.branchId,
          date: state.date,
          result: backupResult.message
        }
      });
    }
    let message = "Closing stock saved.";
    if (carry.movedCount > 0) {
      message = `Closing stock saved. ${carry.movedCount} item(s) auto-moved to opening stock for ${carry.nextDate}.`;
    }
    if (backupResult.message) {
      message = `${message} ${backupResult.message}`;
      saveStoreWithActivity("AUTO_BACKUP_AFTER_CLOSING", backupResult.message, {
        details: { branch_id: state.branchId, date: state.date }
      });
    }
    alert(message);
    renderApp();
  });
}

function bindDashboardEvents() {
  // Reserved for dashboard-only interactions.
}

function bindDailySummaryEvents() {
  bindFishQuickSearch(
    "dailySummarySearchInput",
    "dailySummaryTableBody",
    "dailySummarySearchEmptyRow",
    "dailySummary"
  );
}

function bindErrorLogsEvents() {
  bindFishQuickSearch(
    "errorLogsSearchInput",
    "errorLogsTableBody",
    "errorLogsSearchEmptyRow",
    "errorLogs"
  );

  const downloadBtn = document.getElementById("downloadErrorLogsBtn");
  const clearBtn = document.getElementById("clearErrorLogsBtn");

  downloadBtn?.addEventListener("click", () => {
    if (clientErrorLogs.length === 0) {
      return;
    }

    const payload = {
      exported_at: new Date().toISOString(),
      total: clientErrorLogs.length,
      logs: clientErrorLogs
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fishops-activity-logs-${isoDateToday()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  clearBtn?.addEventListener("click", () => {
    if (clientErrorLogs.length === 0) {
      return;
    }
    const ok = window.confirm("Clear all captured error logs?");
    if (!ok) {
      return;
    }
    clientErrorLogs.length = 0;
    renderApp();
  });
}

function bindActivityLogsEvents() {
  bindFishQuickSearch(
    "activityLogsSearchInput",
    "activityLogsTableBody",
    "activityLogsSearchEmptyRow",
    "activityLogs"
  );

  const downloadBtn = document.getElementById("downloadActivityLogsBtn");
  const clearBtn = document.getElementById("clearActivityLogsBtn");

  downloadBtn?.addEventListener("click", () => {
    if (!Array.isArray(DATA.activity_logs) || DATA.activity_logs.length === 0) {
      return;
    }

    const payload = {
      exported_at: new Date().toISOString(),
      total: DATA.activity_logs.length,
      logs: DATA.activity_logs
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fishops-activity-logs-${isoDateToday()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  clearBtn?.addEventListener("click", () => {
    if (!Array.isArray(DATA.activity_logs) || DATA.activity_logs.length === 0) {
      return;
    }
    const ok = window.confirm("Clear all activity logs?");
    if (!ok) {
      return;
    }
    DATA.activity_logs = [];
    saveStore({ logActivity: false });
    renderApp();
  });
}

function bindReportsEvents() {
  const dailyBtn = document.getElementById("downloadDailyPdfBtn");
  const orderBtn = document.getElementById("downloadOrderPdfBtn");
  dailyBtn?.addEventListener("click", downloadDailyReportPdf);
  orderBtn?.addEventListener("click", downloadTomorrowOrderPdf);
}

function bindTransferSuggestionsEvents() {
  bindFishQuickSearch(
    "transferSuggestionsSearchInput",
    "transferSuggestionsTableBody",
    "transferSuggestionsSearchEmptyRow",
    "transferSuggestions"
  );
}

function bindMonthlyCalculationsEvents() {
  const monthInput = document.getElementById("monthlyCalcMonthInput");
  monthInput?.addEventListener("change", () => {
    const nextMonth = normalizeIsoMonth(monthInput.value);
    if (!nextMonth) {
      monthInput.value = getMonthlyViewMonth();
      return;
    }
    state.monthlyViewMonth = nextMonth;
    renderApp();
  });
}

function bindBillingProgressEvents() {
  if (!hasPermission(state.currentUser, "view_billing_progress")) {
    return;
  }

  const dateInput = document.getElementById("billingProgressDateInput");
  dateInput?.addEventListener("change", () => {
    const nextDate = String(dateInput.value || "");
    if (!isIsoDate(nextDate)) {
      dateInput.value = state.date;
      return;
    }
    state.date = nextDate;
    ui.dateInput.value = nextDate;
    renderApp();
  });
}

function bindSettingsEvents() {
  if (isWriteRestricted()) {
    return;
  }

  const isMasterUser = state.currentUser?.role === "master";
  const settingsForm = document.getElementById("settingsForm");
  const settingsAvatarBtn = document.getElementById("settingsAvatarBtn");
  const settingsChangePhotoBtn = document.getElementById("settingsChangePhotoBtn");
  const settingsUploadLogoBtn = document.getElementById("settingsUploadLogoBtn");
  const settingsClearLogoBtn = document.getElementById("settingsClearLogoBtn");
  const autoBackupAfterClosingInput = document.getElementById("autoBackupAfterClosingInput");
  const chooseDailyBackupFolderBtn = document.getElementById("chooseDailyBackupFolderBtn");
  const clearDailyBackupFolderBtn = document.getElementById("clearDailyBackupFolderBtn");
  const dailyBackupFolderLabelInput = document.getElementById("dailyBackupFolderLabelInput");
  const settingsMessage = document.getElementById("settingsMessage");
  const gotoDeleteDataBtn = document.getElementById("gotoDeleteDataBtn");
  const branchCreateForm = document.getElementById("branchCreateForm");

  settingsAvatarBtn?.addEventListener("click", openProfilePhotoPicker);
  settingsChangePhotoBtn?.addEventListener("click", openProfilePhotoPicker);
  settingsUploadLogoBtn?.addEventListener("click", openLogoPicker);
  settingsClearLogoBtn?.addEventListener("click", () => {
    state.settings.company_logo = "";
    saveStoreWithActivity("SETTINGS_LOGO_CLEAR", "Cleared company logo.");
    applyBranding();
    renderApp();
  });

  chooseDailyBackupFolderBtn?.addEventListener("click", async () => {
    if (!isMasterUser) {
      return;
    }

    const result = await chooseDailyBackupDirectory();
    if (result.ok) {
      saveStoreWithActivity("BACKUP_FOLDER_SET", "Selected daily auto backup folder.", {
        details: { folder_label: state.settings.auto_backup_location_label || "" }
      });
      if (dailyBackupFolderLabelInput) {
        dailyBackupFolderLabelInput.value =
          state.settings.auto_backup_location_label || "Not selected";
      }
      if (settingsMessage) {
        settingsMessage.classList.remove("error");
        settingsMessage.textContent = result.message || "Backup folder selected.";
      }
      return;
    }

    if (result.message && settingsMessage) {
      settingsMessage.classList.add("error");
      settingsMessage.textContent = result.message;
    }
  });

  clearDailyBackupFolderBtn?.addEventListener("click", async () => {
    if (!isMasterUser) {
      return;
    }
    await clearDailyBackupDirectory();
    saveStoreWithActivity("BACKUP_FOLDER_CLEAR", "Cleared daily auto backup folder.");
    if (dailyBackupFolderLabelInput) {
      dailyBackupFolderLabelInput.value = "Not selected";
    }
    if (settingsMessage) {
      settingsMessage.classList.remove("error");
      settingsMessage.textContent = "Backup folder cleared.";
    }
  });

  settingsForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasPermission(state.currentUser, "manage_settings")) {
      return;
    }

    state.settings.company_name =
      document.getElementById("companyNameInput")?.value.trim() || DEFAULT_STORE.settings.company_name;
    state.settings.logo_text =
      document.getElementById("logoTextInput")?.value.trim() || DEFAULT_STORE.settings.logo_text;
    state.settings.currency =
      document.getElementById("currencyInput")?.value || DEFAULT_STORE.settings.currency;
    state.settings.theme_primary =
      document.getElementById("primaryColorInput")?.value || DEFAULT_STORE.settings.theme_primary;
    state.settings.theme_accent =
      document.getElementById("accentColorInput")?.value || DEFAULT_STORE.settings.theme_accent;
    state.settings.maintenance_mode = Boolean(
      document.getElementById("maintenanceInput")?.checked
    );
    if (isMasterUser) {
      state.settings.auto_backup_after_closing = Boolean(autoBackupAfterClosingInput?.checked);
    }

    saveStoreWithActivity("SETTINGS_SAVE", "Saved settings.", {
      details: {
        company_name: state.settings.company_name,
        currency: state.settings.currency,
        maintenance_mode: state.settings.maintenance_mode,
        auto_backup_after_closing: state.settings.auto_backup_after_closing
      }
    });
    applyBranding();
    renderApp();

    const message = document.getElementById("settingsMessage");
    if (message) {
      message.classList.remove("error");
      message.textContent = "Settings saved.";
    }
  });

  gotoDeleteDataBtn?.addEventListener("click", () => {
    if (!hasPermission(state.currentUser, "delete_center")) {
      return;
    }
    state.activePage = "delete_data";
    renderApp();
  });

  document.querySelectorAll(".branch-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.currentUser?.role !== "master") {
        return;
      }

      const branchId = button.getAttribute("data-branch-id");
      if (!branchId) {
        return;
      }
      const row = button.closest("tr[data-branch-id]");
      const branch = findBranchById(branchId);
      if (!row || !branch) {
        return;
      }

      const branchName = row.querySelector(".branch-name-input")?.value.trim();
      const branchLocation = row.querySelector(".branch-location-input")?.value.trim() || "-";

      if (!branchName) {
        alert("Branch name is required.");
        return;
      }

      branch.name = branchName;
      branch.location = branchLocation;
      saveStoreWithActivity("BRANCH_UPDATE", `Updated branch "${branchId}".`, {
        details: { branch_id: branchId, name: branchName, location: branchLocation }
      });
      populateBranchSelector();
      renderApp();
      alert(`Branch "${branchId}" updated.`);
    });
  });

  document.querySelectorAll(".branch-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.currentUser?.role !== "master") {
        return;
      }

      const branchId = button.getAttribute("data-branch-id");
      if (!branchId) {
        return;
      }

      const activeCount = DATA.branches.filter((branch) => branch.status === "active").length;
      if (activeCount <= 1) {
        alert("At least one active branch is required.");
        return;
      }

      const usage = getBranchUsage(branchId);
      const linkedCount =
        usage.users + usage.settings + usage.prices + usage.stock + usage.hold + usage.orders + usage.bills;
      if (linkedCount > 0) {
        alert(
          `Cannot delete "${branchId}" because linked records exist (users: ${usage.users}, settings: ${usage.settings}, prices: ${usage.prices}, stock: ${usage.stock}, hold: ${usage.hold}, orders: ${usage.orders}, bills: ${usage.bills}).`
        );
        return;
      }

      const ok = window.confirm(`Delete branch "${branchId}"?`);
      if (!ok) {
        return;
      }

      DATA.branches = DATA.branches.filter((branch) => branch.id !== branchId);
      if (state.branchId === branchId) {
        state.branchId = "";
      }
      saveStoreWithActivity("BRANCH_DELETE", `Deleted branch "${branchId}".`, {
        details: { branch_id: branchId, name: branch.name }
      });
      populateBranchSelector();
      renderApp();
      alert(`Branch "${branchId}" deleted.`);
    });
  });

  branchCreateForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.currentUser?.role !== "master") {
      return;
    }

    const branchName = document.getElementById("newBranchName")?.value.trim();
    const branchLocation = document.getElementById("newBranchLocation")?.value.trim() || "-";
    const branchIdInput = document.getElementById("newBranchId")?.value || "";
    const branchId = normalizeBranchId(branchIdInput) || nextBranchId();

    if (!branchName) {
      alert("Branch name is required.");
      return;
    }
    if (DATA.branches.some((branch) => branch.id.toLowerCase() === branchId.toLowerCase())) {
      alert(`Branch ID "${branchId}" already exists.`);
      return;
    }

    DATA.branches.push({
      id: branchId,
      name: branchName,
      location: branchLocation,
      status: "active"
    });

    saveStoreWithActivity("BRANCH_CREATE", `Added branch "${branchName}".`, {
      details: { branch_id: branchId, location: branchLocation }
    });
    state.branchId = branchId;
    populateBranchSelector();
    renderApp();
    alert(`Branch "${branchName}" added.`);
  });
}

function deleteDataByCategory(category) {
  if (!ensureWriteAllowed()) {
    return false;
  }

  switch (category) {
    case "daily_entered_details":
      DATA.daily_prices = [];
      DATA.daily_stock_entry = [];
      DATA.hold_stock_entry = [];
      DATA.shop_orders = [];
      DATA.customer_bills = [];
      DATA.app_error_logs = [];
      break;
    case "daily_prices":
      DATA.daily_prices = [];
      break;
    case "daily_stock_entry":
      DATA.daily_stock_entry = [];
      break;
    case "hold_stock_entry":
      DATA.hold_stock_entry = [];
      break;
    case "shop_orders":
      DATA.shop_orders = [];
      break;
    case "customer_bills":
      DATA.customer_bills = [];
      break;
    case "app_error_logs":
      DATA.app_error_logs = [];
      break;
    case "activity_logs":
      DATA.activity_logs = [];
      break;
    case "branch_fish_settings":
      DATA.branch_fish_settings = [];
      break;
    case "fish_profiles_related":
      DATA.fish_profiles = [];
      DATA.branch_fish_settings = [];
      DATA.daily_prices = [];
      DATA.daily_stock_entry = [];
      DATA.hold_stock_entry = [];
      DATA.shop_orders = [];
      DATA.customer_bills = [];
      DATA.app_error_logs = [];
      break;
    case "users_non_master":
      DATA.users = DATA.users.filter((user) => user.role === "master");
      break;
    case "settings_branding":
      state.settings = {
        ...state.settings,
        company_name: DEFAULT_STORE.settings.company_name,
        logo_text: DEFAULT_STORE.settings.logo_text,
        company_logo: "",
        theme_primary: DEFAULT_STORE.settings.theme_primary,
        theme_accent: DEFAULT_STORE.settings.theme_accent,
        currency: DEFAULT_STORE.settings.currency,
        maintenance_mode: DEFAULT_STORE.settings.maintenance_mode,
        auto_backup_after_closing: DEFAULT_STORE.settings.auto_backup_after_closing,
        auto_backup_location_label: DEFAULT_STORE.settings.auto_backup_location_label
      };
      clearDailyBackupDirectory().catch(() => {
        // ignore backup folder cleanup failures
      });
      applyBranding();
      break;
    default:
      return false;
  }
  return true;
}

function fullWipeAllDataForMaster() {
  if (!ensureWriteAllowed()) {
    return;
  }

  const currentMaster = state.currentUser;
  DATA = {
    branches: clone(DEFAULT_STORE.data.branches),
    users: [
      {
        ...clone(currentMaster),
        role: "master",
        branch_id: null,
        status: "active"
      }
    ],
    fish_profiles: [],
    branch_fish_settings: [],
    daily_prices: [],
    daily_stock_entry: [],
    hold_stock_entry: [],
    shop_orders: [],
    customer_bills: [],
    app_error_logs: [],
    activity_logs: []
  };

  state.settings = clone(DEFAULT_STORE.settings);
  clearDailyBackupDirectory().catch(() => {
    // ignore backup folder cleanup failures
  });
  applyBranding();
  saveStoreWithActivity("FULL_WIPE", "Executed full wipe of all data.", {
    user: currentMaster,
    details: { preserved_master_id: currentMaster?.id || "" }
  });
}

function bindDeleteDataEvents() {
  if (isWriteRestricted()) {
    return;
  }

  if (!hasPermission(state.currentUser, "delete_center")) {
    return;
  }

  document.querySelectorAll(".delete-category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-category");
      if (!category) {
        return;
      }
      const categoryLabel = button.getAttribute("data-label") || category;

      const ok = window.confirm(`Delete category "${categoryLabel}"?`);
      if (!ok) {
        return;
      }

      const changed = deleteDataByCategory(category);
      if (!changed) {
        return;
      }

      saveStoreWithActivity("DELETE_CATEGORY", `Deleted data category "${categoryLabel}".`, {
        details: { category }
      });
      renderApp();
    });
  });

  const fullWipeBtn = document.getElementById("fullWipeBtn");
  fullWipeBtn?.addEventListener("click", () => {
    const ok = window.confirm(
      "FULL WIPE will remove all operational data. Continue?"
    );
    if (!ok) {
      return;
    }

    fullWipeAllDataForMaster();
    state.activePage = "delete_data";
    renderApp();
  });
}

function bindActivePageEvents() {
  switch (state.activePage) {
    case "dashboard":
      bindDashboardEvents();
      break;
    case "users_roles":
      bindUsersPageEvents();
      break;
    case "fish_profiles":
      bindFishPageEvents();
      break;
    case "branch_fish_settings":
      bindBranchSettingsEvents();
      break;
    case "daily_prices":
      bindDailyPricesEvents();
      break;
    case "y_daily_prices":
      bindYDailyPricesEvents();
      break;
    case "hold_stock":
      bindHoldStockEvents();
      break;
    case "shop_orders":
      bindShopOrdersEvents();
      break;
    case "shop_status":
      bindShopStatusEvents();
      break;
    case "billing":
      bindBillingEvents();
      break;
    case "billing_progress":
      bindBillingProgressEvents();
      break;
    case "remaining_stock_holds":
      bindRemainingStockHoldsEvents();
      break;
    case "morning_opening_stock":
      bindOpeningEvents();
      break;
    case "night_closing_stock":
      bindClosingEvents();
      break;
    case "daily_summary":
      bindDailySummaryEvents();
      break;
    case "error_logs":
      bindErrorLogsEvents();
      break;
    case "activity_logs":
      bindActivityLogsEvents();
      break;
    case "reports":
      bindReportsEvents();
      break;
    case "transfer_suggestions":
      bindTransferSuggestionsEvents();
      break;
    case "monthly_calculations":
      bindMonthlyCalculationsEvents();
      break;
    case "settings":
      bindSettingsEvents();
      break;
    case "delete_data":
      bindDeleteDataEvents();
      break;
    default:
      break;
  }
}

function populateBranchSelector() {
  const branches = getAccessibleBranches(state.currentUser);
  const showAllOption = canSelectAllBranches(state.currentUser);
  const options = [];
  if (showAllOption) {
    options.push(
      `<option value="${ALL_BRANCH_OPTION_VALUE}" ${
        isAllBranchesValue(state.branchId) ? "selected" : ""
      }>${ALL_BRANCH_OPTION_LABEL}</option>`
    );
  }
  options.push(
    ...branches.map((branch) => `<option value="${branch.id}">${escapeHtml(branch.name)}</option>`)
  );
  ui.branchSelect.innerHTML = options.join("");

  const isCurrentBranchValid =
    isAllBranchesValue(state.branchId) ||
    branches.some((branch) => branch.id === state.branchId);
  if (!isCurrentBranchValid) {
    state.branchId = showAllOption ? ALL_BRANCH_OPTION_VALUE : branches[0]?.id || "";
  }
  ui.branchSelect.value = state.branchId;
  ui.branchSelect.disabled = state.currentUser.role === "user";
}

function applyRoleUiConstraints() {
  const isUser = state.currentUser?.role === "user";
  ui.dateInput.disabled = isUser;
  if (isUser) {
    state.date = isoDateToday();
    ui.dateInput.value = state.date;
  }
}

function renderApp() {
  const visiblePages = getVisiblePages(state.currentUser);
  const currentPage = PAGES.find((page) => page.id === state.activePage);
  if (!currentPage || !visiblePages.some((page) => page.id === currentPage.id)) {
    state.activePage = visiblePages[0]?.id || "dashboard";
  }

  renderNav();
  renderTopbarActions();
  renderSessionIdentity();
  applyRoleUiConstraints();

  const page = PAGES.find((item) => item.id === state.activePage);
  ui.pageTitle.textContent = page ? page.title : "FishOps";
  const branchLabel = getBranchScopeLabel(state.branchId);
  ui.contextText.textContent = `${branchLabel} | ${state.date} | role=${state.currentUser.role}`;
  ui.pageHost.innerHTML = renderActivePage();
  bindActivePageEvents();
}

function startSession(user) {
  state.currentUser = user;
  const branches = getAccessibleBranches(user);
  const scopedBranchId = normalizeUserBranchScope(user.role, user.branch_id);
  if (canSelectAllBranches(user)) {
    state.branchId = ALL_BRANCH_OPTION_VALUE;
  } else {
    state.branchId =
      scopedBranchId && branches.some((branch) => branch.id === scopedBranchId)
        ? scopedBranchId
        : branches[0]?.id || "";
  }
  state.activePage = "dashboard";
  state.quickSearch.fishProfiles = "";
  state.quickSearch.branchFishSettings = "";
  state.quickSearch.dailyPrices = "";
  state.quickSearch.yDailyPrices = "";
  state.quickSearch.transferSuggestions = "";
  state.quickSearch.errorLogs = "";
  state.quickSearch.activityLogs = "";
  state.quickSearch.holdStock = "";
  state.quickSearch.shopOrders = "";
  state.quickSearch.shopStatus = "";
  state.quickSearch.billing = "";
  state.quickSearch.remainingStocks = "";
  state.quickSearch.remainingHolds = "";
  state.quickSearch.morningOpeningStock = "";
  state.quickSearch.nightClosingStock = "";
  state.shopOrderDraftBranchId = "";
  state.shopOrderDraftItems = [];
  state.billingDraftBranchId = "";
  state.billingDraftItems = [];
  state.billingDraftCategory = BILLING_CATEGORY_ALL;
  state.billingDraftSearch = "";
  state.billingDraftCustomerName = "";
  state.billingDraftInvoiceNo = "";
  state.billingDraftPaymentMethod = "cash";
  state.billingDraftPaymentTerms = "immediate";
  state.billingDraftAmountPaid = 0;
  state.billingDraftNotes = "";
  state.billingDraftRequests = "";
  state.billingRecentDetailsId = "";
  state.date = isoDateToday();
  state.monthlyViewMonth = state.date.slice(0, 7);
  ui.dateInput.value = state.date;
  populateBranchSelector();
  applyBranding();
  renderApp();
  ui.loginScreen.classList.add("hidden");
  ui.appShell.classList.remove("hidden");
  saveStoreWithActivity("LOGIN", `User "${user.username}" signed in.`, {
    user,
    details: { role: user.role, branch_id: state.branchId }
  });
  startRemoteStorePolling();
  void checkForRemoteStoreUpdate();
}

function endSession() {
  const previousUser = state.currentUser;
  if (previousUser) {
    saveStoreWithActivity("LOGOUT", `User "${previousUser.username}" signed out.`, {
      user: previousUser,
      details: { role: previousUser.role, branch_id: state.branchId }
    });
  }
  state.currentUser = null;
  state.quickSearch.fishProfiles = "";
  state.quickSearch.branchFishSettings = "";
  state.quickSearch.dailyPrices = "";
  state.quickSearch.yDailyPrices = "";
  state.quickSearch.transferSuggestions = "";
  state.quickSearch.errorLogs = "";
  state.quickSearch.activityLogs = "";
  state.quickSearch.holdStock = "";
  state.quickSearch.shopOrders = "";
  state.quickSearch.shopStatus = "";
  state.quickSearch.billing = "";
  state.quickSearch.remainingStocks = "";
  state.quickSearch.remainingHolds = "";
  state.quickSearch.morningOpeningStock = "";
  state.quickSearch.nightClosingStock = "";
  state.shopOrderDraftBranchId = "";
  state.shopOrderDraftItems = [];
  state.billingDraftBranchId = "";
  state.billingDraftItems = [];
  state.billingDraftCategory = BILLING_CATEGORY_ALL;
  state.billingDraftSearch = "";
  state.billingDraftCustomerName = "";
  state.billingDraftInvoiceNo = "";
  state.billingDraftPaymentMethod = "cash";
  state.billingDraftPaymentTerms = "immediate";
  state.billingDraftAmountPaid = 0;
  state.billingDraftNotes = "";
  state.billingDraftRequests = "";
  state.billingRecentDetailsId = "";
  state.monthlyViewMonth = isoDateToday().slice(0, 7);
  ui.usernameInput.value = "";
  ui.passwordInput.value = "";
  ui.loginError.textContent = "";
  ui.sessionUser.textContent = "-";
  ui.sessionRole.textContent = "";
  ui.sessionAvatar.classList.remove("has-photo");
  ui.sessionAvatar.style.backgroundImage = "none";
  ui.sessionAvatar.textContent = "RT";
  ui.appShell.classList.add("hidden");
  ui.loginScreen.classList.remove("hidden");
  stopRemoteStorePolling();
}

function findLocalActiveUser(username, password) {
  return (
    DATA.users.find(
      (entry) =>
        entry.username.toLowerCase() === username.toLowerCase() &&
        entry.password === password &&
        entry.status === "active"
    ) || null
  );
}

async function loginWithApi(username, password) {
  if (isRemoteSyncConfigured()) {
    await reloadStoreFromServer(false);
  }

  const localUser = findLocalActiveUser(username, password);
  if (!localUser) {
    return {
      user: null,
      error: "Invalid username or password.",
      fallbackToLocal: false
    };
  }

  return {
    user: clone(localUser),
    error: "",
    fallbackToLocal: false
  };
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const submitButton = ui.loginForm.querySelector('button[type="submit"]');
  try {
    const username = ui.usernameInput.value.trim();
    const password = ui.passwordInput.value;
    if (!username || !password) {
      ui.loginError.textContent = "Username and password are required.";
      return;
    }

    if (!DATA || !Array.isArray(DATA.users)) {
      loadStore();
    }

    ui.loginError.textContent = "";
    if (submitButton) {
      submitButton.disabled = true;
    }

    const loginResult = await loginWithApi(username, password);
    let user = loginResult.user;

    if (!user) {
      ui.loginError.textContent = loginResult.error || "Invalid username or password.";
      return;
    }

    const localUser = DATA.users.find(
      (entry) => entry.username.toLowerCase() === String(user.username || "").toLowerCase()
    );
    if (localUser) {
      user = { ...localUser, ...user };
    }

    startSession(user);
  } catch (error) {
    captureAppError(error, { level: "ERROR", details: "login submit failed" });
    ui.loginError.textContent = "Login failed. Please reload and try again.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function wireEvents() {
  ui.loginForm.addEventListener("submit", handleLoginSubmit);
  ui.logoutBtn.addEventListener("click", () => endSession());
  ui.changePhotoBtn.addEventListener("click", openProfilePhotoPicker);
  ui.sessionAvatar.addEventListener("click", openProfilePhotoPicker);
  ui.photoInput.addEventListener("change", handleProfilePhotoChange);
  ui.logoInput.addEventListener("change", handleLogoChange);

  ui.branchSelect.addEventListener("change", () => {
    state.branchId = ui.branchSelect.value;
    renderApp();
  });

  ui.dateInput.addEventListener("change", () => {
    if (state.currentUser?.role === "user") {
      return;
    }
    state.date = ui.dateInput.value;
    renderApp();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }
    loadStore();
    applyBranding();
    refreshSessionFromCurrentData();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkForRemoteStoreUpdate();
    }
  });

  window.addEventListener("error", (event) => {
    captureAppError(event.error || event.message, {
      level: "ERROR",
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      details: event.message
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    captureAppError(event.reason || "Unhandled promise rejection", {
      level: "PROMISE",
      details: event.reason
    });
  });
}

async function init() {
  installClientErrorCapture();
  wireEvents();
  loadStore();
  await reloadStoreFromServer(false);
  const stockDataPurged = purgeStockDataIfNeeded();
  if (stockDataPurged) {
    saveStore();
  }
  const loadedBackupHandle = await ensureBackupDirectoryHandleLoaded();
  if (!loadedBackupHandle && state.settings.auto_backup_location_label) {
    state.settings.auto_backup_location_label = "";
  }
  if (loadedBackupHandle && !state.settings.auto_backup_location_label) {
    state.settings.auto_backup_location_label = String(loadedBackupHandle.name || "Selected folder");
  }
  saveStore({ syncRemote: false });
  applyBranding();
  setupInstallPromptListeners();
  registerServiceWorker();
  ui.usernameInput.focus();
}

init().catch((error) => {
  captureAppError(error, { level: "ERROR", details: "init() failed" });
  alert("Application initialization failed. Check Error Logs tab after reload.");
});



