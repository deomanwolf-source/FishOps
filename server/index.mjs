import express from "express";
import cors from "cors";
import path from "node:path";
import db from "./db.mjs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

function upsertStorePayload(storeValue) {
  const payload = JSON.stringify(storeValue);
  db.prepare(
    `
    INSERT INTO app_store (id, payload, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = datetime('now')
  `
  ).run(payload);

  return db.prepare("SELECT updated_at FROM app_store WHERE id = 1").get()?.updated_at || null;
}

// ---- API ----

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// users
app.get("/api/users", (req, res) => {
  const rows = db
    .prepare("SELECT id, username, role, status, branch FROM users ORDER BY id DESC")
    .all();
  res.json(rows);
});

app.post("/api/users", (req, res) => {
  const { username, password, role = "user", status = "active", branch = "GLOBAL" } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }

  try {
    const info = db
      .prepare("INSERT INTO users (username, password, role, status, branch) VALUES (?, ?, ?, ?, ?)")
      .run(username, password, role, status, branch);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: String(error?.message || error) });
  }
});

// daily stock
app.get("/api/daily-stock", (req, res) => {
  const date = String(req.query?.date || "");
  const branch = String(req.query?.branch || "");
  if (!date || !branch) {
    res.status(400).json({ error: "date and branch required" });
    return;
  }

  const rows = db
    .prepare("SELECT * FROM daily_stock WHERE date = ? AND branch = ? ORDER BY fish")
    .all(date, branch);
  res.json(rows);
});

app.post("/api/daily-stock", (req, res) => {
  const { date, branch, fish, qty = 0, price = 0 } = req.body || {};
  if (!date || !branch || !fish) {
    res.status(400).json({ error: "date, branch, fish required" });
    return;
  }

  db.prepare(
    `
    INSERT INTO daily_stock (date, branch, fish, qty, price)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date, branch, fish) DO UPDATE SET
      qty = excluded.qty,
      price = excluded.price,
      updated_at = datetime('now')
  `
  ).run(date, branch, fish, qty, price);

  res.json({ ok: true });
});

// centralized full store sync (used by current frontend while migrating modules)
app.get("/api/store", (req, res) => {
  const row = db.prepare("SELECT payload, updated_at FROM app_store WHERE id = 1").get();
  if (!row) {
    res.json({ store: null, updated_at: null });
    return;
  }

  try {
    const parsed = JSON.parse(String(row.payload || "{}"));
    res.json({ store: parsed, updated_at: row.updated_at || null });
  } catch {
    res.status(500).json({ error: "Stored payload is invalid JSON." });
  }
});

app.get("/api/store/version", (req, res) => {
  const row = db.prepare("SELECT updated_at FROM app_store WHERE id = 1").get();
  res.json({ updated_at: row?.updated_at || null });
});

app.put("/api/store", (req, res) => {
  const { store } = req.body || {};
  if (!store || typeof store !== "object") {
    res.status(400).json({ error: "store object required" });
    return;
  }

  try {
    const updatedAt = upsertStorePayload(store);
    res.json({ ok: true, updated_at: updatedAt });
  } catch (error) {
    res.status(400).json({ error: String(error?.message || error) });
  }
});

app.post("/api/backup", (req, res) => {
  const { store } = req.body || {};
  if (!store || typeof store !== "object") {
    res.status(400).json({ error: "store object required" });
    return;
  }

  try {
    const updatedAt = upsertStorePayload(store);
    res.json({ ok: true, updated_at: updatedAt });
  } catch (error) {
    res.status(400).json({ error: String(error?.message || error) });
  }
});

// ---- Serve frontend ----
app.use(express.static(path.resolve("./")));

const PORT = Number.parseInt(process.env.PORT || "8080", 10) || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`FishOps backend + web running on http://0.0.0.0:${PORT}`);
});
