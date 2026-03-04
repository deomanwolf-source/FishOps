const STORAGE_KEY = "fishops_demo_store_v3";
const STOCK_DATA_PURGE_MARKER_KEY = "fishops_stock_data_purge_v1";
const PDF_COPYRIGHT_LINE =
  "\u00A9 2026 RTX FishOps | 6.11.0 (Enterprise Release) | RUN by RTX Virual Engine Technology | Developed by Hasintha Arunalu | RTX Technologies. All rights reserved.";
const ALL_BRANCH_OPTION_VALUE = "__ALL_BRANCHES__";
const ALL_BRANCH_OPTION_LABEL = "All Branches";
const BACKUP_HANDLE_DB_NAME = "fishops_backup_handles_v1";
const BACKUP_HANDLE_STORE_NAME = "handles";
const DAILY_BACKUP_HANDLE_KEY = "daily_backup_directory";
const REMOTE_STORE_ENDPOINT = "/api/store";
const REMOTE_BACKUP_ENDPOINT = "/api/backup";
const REMOTE_STORE_VERSION_ENDPOINT = "/api/store/version";
const REMOTE_STORE_POLL_INTERVAL_MS = 15000;
const LOCAL_STORE_PERSISTENCE_ENABLED = false;

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
    hold_stock_entry: []
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
    "backup_send_server",
    "backup_export",
    "view_all_branches",
    "switch_branch",
    "view_fish_profiles",
    "upsert_fish_profile",
    "set_branch_stock_levels",
    "set_daily_prices",
    "manage_hold_stock",
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
  { id: "hold_stock", title: "Hold Stock", permission: "manage_hold_stock" },
  { id: "remaining_stock_holds", title: "Remaining Stocks & Holds", permission: "manage_hold_stock" },
  { id: "morning_opening_stock", title: "Morning Opening Stock", permission: "enter_opening_stock" },
  { id: "night_closing_stock", title: "Night Closing Stock", permission: "enter_closing_stock" },
  { id: "daily_summary", title: "Daily Summary", permission: "view_dashboard" },
  { id: "reports", title: "Reports", permission: "view_reports_today" },
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

const state = {
  currentUser: null,
  branchId: "",
  date: isoDateToday(),
  activePage: "dashboard",
  quickSearch: {
    branchFishSettings: "",
    dailyPrices: "",
    holdStock: "",
    remainingStocks: "",
    remainingHolds: "",
    morningOpeningStock: "",
    nightClosingStock: ""
  },
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
      : base.data.hold_stock_entry
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
  }

  for (const fish of DATA.fish_profiles) {
    if (!fish.id) {
      fish.id = makeId("FISH");
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
  }

  for (const row of DATA.daily_stock_entry) {
    if (!row.id) {
      row.id = makeId("STK");
    }
    if (typeof row.auto_opening_from !== "string") {
      row.auto_opening_from = "";
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
  endpoint = REMOTE_STORE_ENDPOINT,
  method = "PUT",
  showAlert = false,
  successMessage = "Backup sent to server.",
  failureMessage = "Failed to send backup to server"
} = {}) {
  if (remoteStorePushInFlight) {
    return false;
  }

  remoteStorePushInFlight = true;
  try {
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ store: getCurrentStoreSnapshot() })
    });
    const payload = await readResponseJsonSafe(response);
    if (!response.ok) {
      const detail = payload?.error ? ` ${payload.error}` : "";
      throw new Error(`${response.status}.${detail}`);
    }

    remoteSyncAvailable = true;
    if (payload?.updated_at) {
      remoteStoreVersion = String(payload.updated_at);
    }

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
  await uploadStoreSnapshot({
    endpoint: REMOTE_STORE_ENDPOINT,
    method: "PUT",
    showAlert: false
  });
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
      alert("Data updated from server. Please log in again.");
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
  const response = await fetch(REMOTE_STORE_ENDPOINT, { cache: "no-store" });
  const payload = await readResponseJsonSafe(response);
  if (!response.ok) {
    const detail = payload?.error ? ` ${payload.error}` : "";
    throw new Error(`Unable to fetch /api/store (${response.status}).${detail}`);
  }
  remoteSyncAvailable = true;
  return payload;
}

async function reloadStoreFromServer(showAlert = false) {
  try {
    const payload = await fetchRemoteStore();
    const nextStore = payload?.store;
    if (!nextStore || typeof nextStore !== "object") {
      if (showAlert) {
        alert("No server backup found yet.");
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
      alert("Loaded latest backup from server.");
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
  try {
    const response = await fetch(REMOTE_STORE_VERSION_ENDPOINT, { cache: "no-store" });
    const payload = await readResponseJsonSafe(response);
    if (!response.ok) {
      return "";
    }
    remoteSyncAvailable = true;
    return String(payload?.updated_at || "");
  } catch {
    remoteSyncAvailable = false;
    return "";
  }
}

async function checkForRemoteStoreUpdate() {
  if (!state.currentUser || document.visibilityState !== "visible") {
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

  await uploadStoreSnapshot({
    endpoint: REMOTE_BACKUP_ENDPOINT,
    method: "POST",
    showAlert: true,
    successMessage: "Backup sent and saved on server."
  });
}

function hasPermission(user, permission) {
  if (user.role === "master") {
    return true;
  }
  return ROLE_PERMISSIONS[user.role].includes(permission);
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

function getVisiblePages(user) {
  return PAGES.filter((page) => hasPermission(user, page.permission));
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
    hold: DATA.hold_stock_entry.filter((row) => row.branch_id === branchId).length
  };
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
  const costPerKgLkr = usableQty > 0 ? Math.round(totalCostLkr / usableQty) : 0;
  const sellPricePerKgLkr = Math.round(costPerKgLkr + marginPerKgLkr);

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
      continue;
    }

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
  }

  return { nextDate, movedCount };
}

function getDailyPrice(branchId, dateText, fishId) {
  return DATA.daily_prices.find(
    (row) => row.branch_id === branchId && row.date === dateText && row.fish_id === fishId
  );
}

function upsertDailyPrice(branchId, dateText, fishId, sellPrice, costPrice) {
  if (!ensureWriteAllowed()) {
    return null;
  }

  let row = getDailyPrice(branchId, dateText, fishId);
  if (!row) {
    row = {
      id: makeId("PRC"),
      date: dateText,
      branch_id: branchId,
      fish_id: fishId,
      sell_price_per_unit: sellPrice,
      cost_price_per_unit: costPrice
    };
    DATA.daily_prices.push(row);
  } else {
    row.sell_price_per_unit = sellPrice;
    row.cost_price_per_unit = costPrice;
  }
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
  if (usableQty <= 0) {
    return "";
  }

  const baseDate = isIsoDate(state.date) ? state.date : entry.date;
  const targetDate = getTomorrow(baseDate);
  if (!targetDate) {
    return "";
  }

  const stockRow = getStockEntry(entry.branch_id, targetDate, entry.fish_id);
  const currentOpening = numberOr(stockRow?.opening_qty, 0);
  upsertStockEntry(entry.branch_id, targetDate, entry.fish_id, {
    opening_qty: round2(currentOpening + usableQty)
  });

  upsertDailyPrice(
    entry.branch_id,
    targetDate,
    entry.fish_id,
    Math.round(numberOr(entry.sell_price_per_kg, 0)),
    Math.round(numberOr(entry.cost_per_kg, 0))
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

  const priceByBranchFish = new Map(
    prices.map((row) => [`${row.branch_id}::${row.fish_id}`, row])
  );
  const entryByBranchFish = new Map(
    entries.map((row) => [`${row.branch_id}::${row.fish_id}`, row])
  );
  const holdCostByBranchFish = new Map();

  for (const holdRow of DATA.hold_stock_entry) {
    if (!branchSet.has(holdRow.branch_id) || holdRow.date !== dateText) {
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
    let revenue = price ? round2(sold * price.sell_price_per_unit) : null;
    let cost = price ? round2(sold * price.cost_price_per_unit) : null;
    let profit = revenue !== null && cost !== null ? round2(revenue - cost) : null;

    if (holdCost > 0) {
      appliedHoldKeys.add(scopeKey);
      cost = round2(numberOr(cost, 0) + holdCost);
      revenue = revenue === null ? 0 : revenue;
      profit = round2(revenue - cost);
    }

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
        closing,
        waste,
        orderQty: Math.max(0, round2(targetStock - closing)),
        alert: stockAlert(closing, minStock, targetStock),
        revenue,
        cost,
        profit,
        priceMissing: !price
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

function renderDailySummaryTable(rows) {
  return `
    <section class="card wide">
      <div class="card-header"><h3>Daily Summary (Per Fish)</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fish</th>
              <th>Sold</th>
              <th>Closing</th>
              <th>Waste</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length === 0
                ? '<tr><td colspan="8" class="empty-state">No stock entries for selected date.</td></tr>'
                : rows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.fish.name)}</td>
                          <td>${row.sold.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
                          <td>${row.closing.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
                          <td>${row.waste.toFixed(2)} ${escapeHtml(row.fish.unit)}</td>
                          <td>${row.revenue === null ? "-" : money(row.revenue)}</td>
                          <td>${row.cost === null ? "-" : money(row.cost)}</td>
                          <td class="${(row.profit || 0) >= 0 ? "profit-positive" : "profit-negative"}">${
                            row.profit === null ? "-" : money(row.profit)
                          }</td>
                          <td><span class="chip ${row.alert.toLowerCase()}">${row.alert}</span></td>
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

function renderDashboardPage() {
  const { rows, totals } = buildSummary(state.branchId, state.date);
  const lowAlerts = rows.filter((row) => row.alert !== "OK");
  const orderRows = rows.filter((row) => row.orderQty > 0);
  const missingPrices = rows.filter((row) => row.priceMissing);

  return `
    <section class="kpi-grid">
      <article class="kpi-card"><p>Revenue</p><h2>${money(totals.revenue)}</h2></article>
      <article class="kpi-card"><p>Cost</p><h2>${money(totals.cost)}</h2></article>
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
      (user) => `
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
        <td><input id="user-password-${user.id}" class="table-input" type="text" placeholder="New password" /></td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-primary user-save-btn" data-user-id="${user.id}">Save</button>
            <button type="button" class="btn btn-danger user-delete-btn" data-user-id="${user.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
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
    .map(
      (fish) => `
      <tr>
        <td>${escapeHtml(fish.fish_code)}</td>
        <td>${
          canEdit
            ? `<input id="fish-name-${fish.id}" class="table-input" value="${escapeHtml(fish.name)}" />`
            : escapeHtml(fish.name)
        }</td>
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
    `
    )
    .join("");

  return `
    ${
      canEdit
        ? `<section class="card section-gap">
            <div class="card-header"><h3>Add Fish Profile</h3></div>
            <form id="fishCreateForm" class="form-grid compact">
              <input id="newFishCode" type="text" placeholder="Fish Code (optional, auto: F-0001)" />
              <input id="newFishName" type="text" placeholder="Fish Name" required />
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
            <p class="page-note">If fish code is empty, the system auto-generates the next F code.</p>
          </section>`
        : ""
    }

    <section class="card wide">
      <div class="card-header"><h3>Fish Profiles</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
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

  return `
    <section class="card section-gap">
      <div class="card-header"><h3>Set Branch Stock Levels (${escapeHtml(state.branchId)})</h3></div>
      <form id="settingCreateForm" class="form-grid compact">
        <select id="newSettingFishId">
          ${DATA.fish_profiles
            .map((fish) => `<option value="${fish.id}">${escapeHtml(fish.name)}</option>`)
            .join("")}
        </select>
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
    .map((price) => {
      const fish = findFishById(price.fish_id);
      const fishLabel = fishDisplayLabel(fish, price.fish_id);
      const searchable = fishSearchText(fish, price.fish_id);
      return `
      <tr data-fish-search="${escapeHtml(searchable)}">
        <td>${escapeHtml(fishLabel)}</td>
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

  return `
    <section class="card section-gap">
      <div class="card-header"><h3>Set Daily Price (${escapeHtml(state.date)})</h3></div>
      <form id="priceUpsertForm" class="form-grid compact">
        <select id="priceFishId">
          ${DATA.fish_profiles
            .filter((fish) => fish.status === "active")
            .map((fish) => `<option value="${fish.id}">${escapeHtml(fish.name)}</option>`)
            .join("")}
        </select>
        <input id="priceSellInput" type="number" step="0.01" placeholder="Sell price" required />
        <input id="priceCostInput" type="number" step="0.01" placeholder="Cost price" required />
        <button class="btn btn-primary" type="submit">Save Price</button>
      </form>
    </section>

    <section class="card wide">
      <div class="card-header">
        <h3>Daily Prices</h3>
        <p class="page-note">Set sell and cost prices manually for the selected date.</p>
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
              <th>Sell Price</th>
              <th>Cost Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="dailyPricesTableBody">
            ${rows || '<tr><td colspan="4" class="empty-state">No prices set for this date.</td></tr>'}
            ${
              rows
                ? '<tr id="dailyPricesSearchEmptyRow" class="hidden"><td colspan="4" class="empty-state">No fish match your search.</td></tr>'
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
      <p class="page-note">Workflow: Add Stock -> Cut -> Move. Table below shows today plus pending open holds from previous dates.</p>
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

function renderRemainingStockHoldsPage() {
  const scopedBranchIds = getBranchScopeIds(state.branchId);
  const branchSet = new Set(scopedBranchIds);

  if (branchSet.size === 0) {
    return `
      <section class="card wide">
        <div class="card-header"><h3>Remaining Stocks & Holds</h3></div>
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
      <div class="card-header"><h3>Remaining Stock (${escapeHtml(state.date)})</h3></div>
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
              <th>Remaining Kg</th>
              <th>Waste Kg</th>
              <th>Min Stock</th>
              <th>Target Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="remainingStocksTableBody">
            ${
              remainingRows ||
              '<tr><td colspan="7" class="empty-state">No remaining stock for selected date.</td></tr>'
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
          <td><input class="table-input waste-input" type="number" step="0.01" value="${
            entry ? numberOr(entry.waste_qty, 0) : 0
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
                <th>Waste Qty</th>
              </tr>
            </thead>
            <tbody id="closingStockTableBody">
              ${rows || '<tr><td colspan="3" class="empty-state">No active fish settings.</td></tr>'}
              ${
                rows
                  ? '<tr id="closingStockSearchEmptyRow" class="hidden"><td colspan="3" class="empty-state">No fish match your search.</td></tr>'
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
      <article class="kpi-card"><p>Total Cost</p><h2>${money(totals.cost)}</h2></article>
      <article class="kpi-card"><p>Total Profit</p><h2 class="${
        totals.profit >= 0 ? "profit-positive" : "profit-negative"
      }">${money(totals.profit)}</h2></article>
      <article class="kpi-card"><p>Total Sold</p><h2>${totals.sold.toFixed(2)}</h2></article>
    </section>
    ${renderDailySummaryTable(rows)}
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

  const categories = [
    { key: "daily_prices", label: "Daily Prices", count: DATA.daily_prices.length },
    { key: "daily_stock_entry", label: "Daily Stock Entries", count: DATA.daily_stock_entry.length },
    { key: "hold_stock_entry", label: "Hold Stock Entries", count: DATA.hold_stock_entry.length },
    {
      key: "branch_fish_settings",
      label: "Branch Fish Settings",
      count: DATA.branch_fish_settings.length
    },
    {
      key: "fish_profiles_related",
      label: "Fish Profiles (+ settings/prices/stock/hold)",
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
    case "hold_stock":
      return renderHoldStockPage();
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
    saveStore();
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
    saveStore();
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
    (row) => row.branch_id === state.branchId && row.date === sourceDate
  );
  let copied = 0;
  for (const source of sourceRows) {
    const existing = getDailyPrice(state.branchId, state.date, source.fish_id);
    if (!existing) {
      DATA.daily_prices.push({
        id: makeId("PRC"),
        date: state.date,
        branch_id: state.branchId,
        fish_id: source.fish_id,
        sell_price_per_unit: source.sell_price_per_unit,
        cost_price_per_unit: source.cost_price_per_unit
      });
      copied += 1;
    }
  }
  saveStore();
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
      hold_stock_entry: holdStockRows
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
    endSession();
    alert("Backup imported. Please log in again.");
    return;
  }

  state.currentUser = currentUser;
  populateBranchSelector();
  renderApp();
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
    .register("./service-worker.js")
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

  const createForm = document.getElementById("userCreateForm");
  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("newUserUsername")?.value.trim();
    const password = document.getElementById("newUserPassword")?.value;
    const role = document.getElementById("newUserRole")?.value;
    const branch = document.getElementById("newUserBranch")?.value || null;
    const status = document.getElementById("newUserStatus")?.value || "active";
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
      photo: ""
    });
    saveStore();
    renderApp();
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
      const scopedBranch = normalizeUserBranchScope(role, branch);

      if (role === "user" && !scopedBranch) {
        alert("User role must be assigned to a branch.");
        return;
      }

      user.role = role;
      user.branch_id = scopedBranch;
      user.status = status;
      if (newPassword.trim()) {
        user.password = newPassword.trim();
      }

      if (state.currentUser?.id === user.id) {
        state.currentUser = user;
        if (user.status !== "active") {
          alert("Current session user is now inactive. Please login again.");
          saveStore();
          endSession();
          return;
        }
        populateBranchSelector();
      }

      saveStore();
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
      saveStore();

      if (state.currentUser?.id === userId) {
        endSession();
        return;
      }
      renderApp();
    });
  });
}

function bindFishPageEvents() {
  if (isWriteRestricted()) {
    return;
  }

  if (!hasPermission(state.currentUser, "upsert_fish_profile")) {
    return;
  }

  const createForm = document.getElementById("fishCreateForm");
  createForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fishCodeInput = document.getElementById("newFishCode")?.value.trim().toUpperCase();
    const fishCode = fishCodeInput || nextFishCode();
    const name = document.getElementById("newFishName")?.value.trim();
    const category = document.getElementById("newFishCategory")?.value || "Sea";
    const unit = document.getElementById("newFishUnit")?.value || "kg";
    const status = document.getElementById("newFishStatus")?.value || "active";

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

    DATA.fish_profiles.push({
      id: makeId("FISH"),
      fish_code: fishCode,
      name,
      category,
      unit,
      status
    });
    saveStore();
    renderApp();
  });

  document.querySelectorAll(".fish-save-btn").forEach((button) => {
    button.addEventListener("click", () => {
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

      if (!name) {
        alert("Fish name is required.");
        return;
      }

      fish.name = name;
      fish.category = category;
      fish.unit = unit;
      fish.status = status;
      saveStore();
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
      saveStore();
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
      saveStore();
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
    const fishId = document.getElementById("newSettingFishId")?.value;
    const minStock = numberOr(document.getElementById("newSettingMin")?.value, 0);
    const targetStock = numberOr(document.getElementById("newSettingTarget")?.value, 0);
    const isActive = (document.getElementById("newSettingActive")?.value || "true") === "true";

    if (!fishId) {
      alert("Select fish.");
      return;
    }
    if (targetStock < minStock) {
      alert("Target stock should be greater than or equal to min stock.");
      return;
    }

    upsertBranchSetting(state.branchId, fishId, minStock, targetStock, isActive);
    saveStore();
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
      saveStore();
      renderApp();
    });
  });

  document.querySelectorAll(".setting-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const settingId = button.getAttribute("data-setting-id");
      if (!settingId) {
        return;
      }
      DATA.branch_fish_settings = DATA.branch_fish_settings.filter((item) => item.id !== settingId);
      saveStore();
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
    const fishId = document.getElementById("priceFishId")?.value;
    const sell = numberOr(document.getElementById("priceSellInput")?.value, 0);
    const cost = numberOr(document.getElementById("priceCostInput")?.value, 0);

    if (!fishId) {
      alert("Select fish.");
      return;
    }
    upsertDailyPrice(state.branchId, state.date, fishId, sell, cost);
    saveStore();
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
      saveStore();
      renderApp();
    });
  });

  document.querySelectorAll(".price-delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const priceId = button.getAttribute("data-price-id");
      if (!priceId) {
        return;
      }
      DATA.daily_prices = DATA.daily_prices.filter((item) => item.id !== priceId);
      saveStore();
      renderApp();
    });
  });
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
    saveStore();
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
      saveStore();
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
      saveStore();
      renderApp();
      alert(`Hold stock moved to opening stock for ${moved} with daily price updated.`);
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
      DATA.hold_stock_entry = DATA.hold_stock_entry.filter((row) => row.id !== holdId);
      saveStore();
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
    for (const row of rows) {
      const fishId = row.getAttribute("data-fish-id");
      if (!fishId) {
        continue;
      }
      const openingQty = numberOr(row.querySelector(".opening-input")?.value, 0);
      const purchaseQty = numberOr(row.querySelector(".purchase-input")?.value, 0);
      upsertStockEntry(state.branchId, state.date, fishId, {
        opening_qty: openingQty,
        purchase_qty: purchaseQty,
        auto_opening_from: ""
      });
    }
    saveStore();
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
      const wasteQty = numberOr(row.querySelector(".waste-input")?.value, 0);
      upsertStockEntry(state.branchId, state.date, fishId, {
        closing_qty: closingQty,
        waste_qty: wasteQty
      });
    }
    const carry = autoCarryClosingToNextDay(state.branchId, state.date);
    const persisted = saveStore();
    if (!persisted) {
      renderApp();
      return;
    }

    const backupResult = await runAutoBackupAfterClosing(state.branchId, state.date);
    let message = "Closing stock saved.";
    if (carry.movedCount > 0) {
      message = `Closing stock saved. ${carry.movedCount} item(s) auto-moved to opening stock for ${carry.nextDate}.`;
    }
    if (backupResult.message) {
      message = `${message} ${backupResult.message}`;
    }
    alert(message);
    renderApp();
  });
}

function bindDashboardEvents() {
  // Reserved for dashboard-only interactions.
}

function bindReportsEvents() {
  const dailyBtn = document.getElementById("downloadDailyPdfBtn");
  const orderBtn = document.getElementById("downloadOrderPdfBtn");
  dailyBtn?.addEventListener("click", downloadDailyReportPdf);
  orderBtn?.addEventListener("click", downloadTomorrowOrderPdf);
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
    saveStore();
    applyBranding();
    renderApp();
  });

  chooseDailyBackupFolderBtn?.addEventListener("click", async () => {
    if (!isMasterUser) {
      return;
    }

    const result = await chooseDailyBackupDirectory();
    if (result.ok) {
      saveStore();
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
    saveStore();
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

    saveStore();
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
      saveStore();
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
      const linkedCount = usage.users + usage.settings + usage.prices + usage.stock + usage.hold;
      if (linkedCount > 0) {
        alert(
          `Cannot delete "${branchId}" because linked records exist (users: ${usage.users}, settings: ${usage.settings}, prices: ${usage.prices}, stock: ${usage.stock}, hold: ${usage.hold}).`
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
      saveStore();
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

    saveStore();
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
    case "daily_prices":
      DATA.daily_prices = [];
      break;
    case "daily_stock_entry":
      DATA.daily_stock_entry = [];
      break;
    case "hold_stock_entry":
      DATA.hold_stock_entry = [];
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
    hold_stock_entry: []
  };

  state.settings = clone(DEFAULT_STORE.settings);
  clearDailyBackupDirectory().catch(() => {
    // ignore backup folder cleanup failures
  });
  applyBranding();
  saveStore();
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

      const ok = window.confirm(`Delete category "${category}"?`);
      if (!ok) {
        return;
      }

      const changed = deleteDataByCategory(category);
      if (!changed) {
        return;
      }

      saveStore();
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
    case "hold_stock":
      bindHoldStockEvents();
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
    case "reports":
      bindReportsEvents();
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
  const currentPage = PAGES.find((page) => page.id === state.activePage);
  if (!currentPage || !hasPermission(state.currentUser, currentPage.permission)) {
    state.activePage = getVisiblePages(state.currentUser)[0]?.id || "dashboard";
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
  state.quickSearch.branchFishSettings = "";
  state.quickSearch.dailyPrices = "";
  state.quickSearch.holdStock = "";
  state.quickSearch.remainingStocks = "";
  state.quickSearch.remainingHolds = "";
  state.quickSearch.morningOpeningStock = "";
  state.quickSearch.nightClosingStock = "";
  state.date = isoDateToday();
  ui.dateInput.value = state.date;
  populateBranchSelector();
  applyBranding();
  renderApp();
  ui.loginScreen.classList.add("hidden");
  ui.appShell.classList.remove("hidden");
  startRemoteStorePolling();
  void checkForRemoteStoreUpdate();
}

function endSession() {
  state.currentUser = null;
  state.quickSearch.branchFishSettings = "";
  state.quickSearch.dailyPrices = "";
  state.quickSearch.holdStock = "";
  state.quickSearch.remainingStocks = "";
  state.quickSearch.remainingHolds = "";
  state.quickSearch.morningOpeningStock = "";
  state.quickSearch.nightClosingStock = "";
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

function handleLoginSubmit(event) {
  event.preventDefault();
  const username = ui.usernameInput.value.trim();
  const password = ui.passwordInput.value;
  const user = DATA.users.find(
    (entry) =>
      entry.username.toLowerCase() === username.toLowerCase() &&
      entry.password === password &&
      entry.status === "active"
  );

  if (!user) {
    ui.loginError.textContent = "Invalid username or password.";
    return;
  }

  ui.loginError.textContent = "";
  startSession(user);
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
}

async function init() {
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
  wireEvents();
  ui.usernameInput.focus();
}

init();

