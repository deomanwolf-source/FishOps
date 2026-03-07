import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const usePostgres = DATABASE_URL.length > 0;

function toTimestampText(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function postgresSslConfig() {
  const pgSsl = String(process.env.PGSSL || "").trim().toLowerCase();
  const pgSslMode = String(process.env.PGSSLMODE || "").trim().toLowerCase();
  const enabled =
    pgSsl === "1" ||
    pgSsl === "true" ||
    pgSsl === "yes" ||
    pgSsl === "require" ||
    pgSslMode === "require" ||
    pgSslMode === "verify-ca" ||
    pgSslMode === "verify-full";

  if (!enabled) {
    return undefined;
  }

  return { rejectUnauthorized: false };
}

function createSqliteAdapter() {
  const dataDir = path.resolve("./data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(path.join(dataDir, "fishops.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  branch TEXT NOT NULL DEFAULT 'GLOBAL',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  branch TEXT NOT NULL,
  fish TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, branch, fish)
);

CREATE TABLE IF NOT EXISTS app_store (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

  const statements = {
    usersList: db.prepare("SELECT id, username, role, status, branch FROM users ORDER BY id DESC"),
    userInsert: db.prepare(
      "INSERT INTO users (username, password, role, status, branch) VALUES (?, ?, ?, ?, ?)"
    ),
    stockList: db.prepare("SELECT * FROM daily_stock WHERE date = ? AND branch = ? ORDER BY fish"),
    stockUpsert: db.prepare(`
      INSERT INTO daily_stock (date, branch, fish, qty, price)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date, branch, fish) DO UPDATE SET
        qty = excluded.qty,
        price = excluded.price,
        updated_at = datetime('now')
    `),
    storeSelect: db.prepare("SELECT payload, updated_at FROM app_store WHERE id = 1"),
    storeVersion: db.prepare("SELECT updated_at FROM app_store WHERE id = 1"),
    storeUpsert: db.prepare(`
      INSERT INTO app_store (id, payload, updated_at)
      VALUES (1, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = datetime('now')
    `)
  };

  return {
    kind: "sqlite",
    async listUsers() {
      return statements.usersList.all();
    },
    async createUser({ username, password, role, status, branch }) {
      const info = statements.userInsert.run(username, password, role, status, branch);
      return Number(info.lastInsertRowid);
    },
    async listDailyStock(date, branch) {
      return statements.stockList.all(date, branch);
    },
    async upsertDailyStock({ date, branch, fish, qty, price }) {
      statements.stockUpsert.run(date, branch, fish, qty, price);
    },
    async getStore() {
      const row = statements.storeSelect.get();
      if (!row) {
        return null;
      }
      return {
        payload: String(row.payload || "{}"),
        updated_at: toTimestampText(row.updated_at)
      };
    },
    async getStoreVersion() {
      const row = statements.storeVersion.get();
      return toTimestampText(row?.updated_at);
    },
    async upsertStorePayload(storeValue) {
      const payload = JSON.stringify(storeValue);
      statements.storeUpsert.run(payload);
      const updatedAt = statements.storeVersion.get()?.updated_at;
      return toTimestampText(updatedAt);
    },
    async close() {
      db.close();
    }
  };
}

async function createPostgresAdapter() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: postgresSslConfig()
  });

  await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  branch TEXT NOT NULL DEFAULT 'GLOBAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_stock (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  branch TEXT NOT NULL,
  fish TEXT NOT NULL,
  qty DOUBLE PRECISION NOT NULL DEFAULT 0,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, branch, fish)
);

CREATE TABLE IF NOT EXISTS app_store (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
  `);

  return {
    kind: "postgres",
    async listUsers() {
      const result = await pool.query(
        "SELECT id, username, role, status, branch FROM users ORDER BY id DESC"
      );
      return result.rows;
    },
    async createUser({ username, password, role, status, branch }) {
      const result = await pool.query(
        "INSERT INTO users (username, password, role, status, branch) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [username, password, role, status, branch]
      );
      return Number(result.rows[0]?.id);
    },
    async listDailyStock(date, branch) {
      const result = await pool.query(
        "SELECT id, date, branch, fish, qty, price, updated_at FROM daily_stock WHERE date = $1 AND branch = $2 ORDER BY fish",
        [date, branch]
      );
      return result.rows;
    },
    async upsertDailyStock({ date, branch, fish, qty, price }) {
      await pool.query(
        `
        INSERT INTO daily_stock (date, branch, fish, qty, price)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(date, branch, fish) DO UPDATE SET
          qty = excluded.qty,
          price = excluded.price,
          updated_at = CURRENT_TIMESTAMP
        `,
        [date, branch, fish, qty, price]
      );
    },
    async getStore() {
      const result = await pool.query(
        "SELECT payload::text AS payload, updated_at FROM app_store WHERE id = 1"
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return {
        payload: String(row.payload || "{}"),
        updated_at: toTimestampText(row.updated_at)
      };
    },
    async getStoreVersion() {
      const result = await pool.query("SELECT updated_at FROM app_store WHERE id = 1");
      return toTimestampText(result.rows[0]?.updated_at);
    },
    async upsertStorePayload(storeValue) {
      const payload = JSON.stringify(storeValue);
      const result = await pool.query(
        `
        INSERT INTO app_store (id, payload, updated_at)
        VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          payload = excluded.payload,
          updated_at = CURRENT_TIMESTAMP
        RETURNING updated_at
        `,
        [payload]
      );
      return toTimestampText(result.rows[0]?.updated_at);
    },
    async close() {
      await pool.end();
    }
  };
}

async function createDatabaseAdapter() {
  if (usePostgres) {
    console.log("[db] Using PostgreSQL storage.");
    return createPostgresAdapter();
  }

  console.log("[db] Using SQLite storage at ./data/fishops.db");
  return createSqliteAdapter();
}

const db = await createDatabaseAdapter();

export default db;
