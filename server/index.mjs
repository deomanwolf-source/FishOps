import express from "express";
import cors from "cors";
import path from "node:path";
import db from "./db.mjs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

async function upsertStorePayload(storeValue) {
  return db.upsertStorePayload(storeValue);
}

// ---- API ----

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// users
app.get("/api/users", async (req, res) => {
  try {
    const rows = await db.listUsers();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
});

app.post("/api/users", async (req, res) => {
  const { username, password, role = "user", status = "active", branch = "GLOBAL" } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }

  try {
    const id = await db.createUser({ username, password, role, status, branch });
    res.json({ id });
  } catch (error) {
    res.status(400).json({ error: String(error?.message || error) });
  }
});

// daily stock
app.get("/api/daily-stock", async (req, res) => {
  const date = String(req.query?.date || "");
  const branch = String(req.query?.branch || "");
  if (!date || !branch) {
    res.status(400).json({ error: "date and branch required" });
    return;
  }

  try {
    const rows = await db.listDailyStock(date, branch);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
});

app.post("/api/daily-stock", async (req, res) => {
  const { date, branch, fish, qty = 0, price = 0 } = req.body || {};
  if (!date || !branch || !fish) {
    res.status(400).json({ error: "date, branch, fish required" });
    return;
  }

  try {
    await db.upsertDailyStock({ date, branch, fish, qty, price });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: String(error?.message || error) });
  }
});

// centralized full store sync (used by current frontend while migrating modules)
app.get("/api/store", async (req, res) => {
  try {
    const row = await db.getStore();
    if (!row) {
      res.json({ store: null, updated_at: null });
      return;
    }

    const parsed = JSON.parse(String(row.payload || "{}"));
    res.json({ store: parsed, updated_at: row.updated_at || null });
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.status(500).json({ error: "Stored payload is invalid JSON." });
      return;
    }
    res.status(500).json({ error: String(error?.message || error) });
  }
});

app.get("/api/store/version", async (req, res) => {
  try {
    const updatedAt = await db.getStoreVersion();
    res.json({ updated_at: updatedAt || null });
  } catch (error) {
    res.status(500).json({ error: String(error?.message || error) });
  }
});

app.put("/api/store", async (req, res) => {
  const { store } = req.body || {};
  if (!store || typeof store !== "object") {
    res.status(400).json({ error: "store object required" });
    return;
  }

  try {
    const updatedAt = await upsertStorePayload(store);
    res.json({ ok: true, updated_at: updatedAt });
  } catch (error) {
    res.status(400).json({ error: String(error?.message || error) });
  }
});

app.post("/api/backup", async (req, res) => {
  const { store } = req.body || {};
  if (!store || typeof store !== "object") {
    res.status(400).json({ error: "store object required" });
    return;
  }

  try {
    const updatedAt = await upsertStorePayload(store);
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
