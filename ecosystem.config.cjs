const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    let value = normalized.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const envFromFile = loadEnvFile(path.join(__dirname, ".env"));

const appEnv = {
  NODE_ENV: envFromFile.NODE_ENV || process.env.NODE_ENV || "production",
  PORT: envFromFile.PORT || process.env.PORT || "8080",
  DATABASE_URL: envFromFile.DATABASE_URL || process.env.DATABASE_URL || ""
};

module.exports = {
  apps: [
    {
      name: "fishops",
      cwd: __dirname,
      script: "server/index.mjs",
      interpreter: "node",
      env: appEnv
    }
  ]
};
