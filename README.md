# RTX FishOps

RTX FishOps is a multi-branch fish inventory and finance foundation built around daily opening and closing stock.

## Application signature

- Application name: RTX FishOps - Fish Store Operations System
- Version: 6.11.0 (Enterprise Release)
- Runtime: RUN by RTX Virual Engine Technology
- Developed by: Hasintha Arunalu (Founder | Systems Architect | Technology Entrepreneur)
- Organization: RTX Technologies
- Domain: Retail and inventory management / fish market operations
- Development type: Proprietary in-house software
- Technology stack: HTML/CSS, JavaScript, IndexedDB, PWA (Service Worker)
- Architecture: RTX Virual Engine runtime with multi-branch operations and daily price engine
- Target platform: Windows (PWA desktop install on RTX Virual Engine)
- Future direction: Cloud sync and multi-branch SaaS expansion
- Build location: Sri Lanka
- Ownership notice: Copyright (c) 2026 RTX Technologies. All rights reserved. This software is the intellectual property of RTX Technologies. Unauthorized duplication, modification, or distribution is strictly prohibited.

No per-sale entry is required. The system computes:

- Sold quantity
- Revenue
- Cost
- Profit
- Remaining stock
- Low stock alerts
- Tomorrow order quantity
- Branch-level daily outputs ready for reporting

## Scope implemented in this scaffold

- Full domain model for all collections you defined
- Role and permission matrix (`master`, `admin`, `user`)
- Branch access governance rules
- Daily formula engine
- Branch daily dashboard summary builder
- Reports engine helpers (fish profit, waste trend, price change, CSV export)
- Theme tokens for "Operational Blue + Teal"
- Navigation/page structure with permission gates
- Service layer that combines data + permissions + calculations
- Daily price copy helper (`source_date` -> `target_date`) and price history query
- Backup export/import and full wipe service hooks for master governance

## Project structure

```text
.
|-- docs/
|   |-- system-structure.md
|-- src/
|   |-- engine/
|   |   |-- calculations.ts
|   |   `-- daily-summary.ts
|   |-- governance/
|   |   `-- multi-branch.ts
|   |-- navigation/
|   |   `-- pages.ts
|   |-- reports/
|   |   `-- report-engine.ts
|   |-- seed/
|   |   `-- sample-data.ts
|   |-- security/
|   |   `-- permissions.ts
|   |-- services/
|   |   `-- fishops-service.ts
|   |-- storage/
|   |   `-- indexeddb-schema.ts
|   |-- theme/
|   |   `-- operational-blue-teal.ts
|   |-- types/
|   |   `-- entities.ts
|   |-- workflow/
|   |   `-- operational-workflow.ts
|   `-- index.ts
|-- package.json
`-- tsconfig.json
```

## Business formulas

- `sold_qty = opening_qty + purchase_qty - closing_qty - waste_qty`
- Validation: `sold_qty >= 0`
- `revenue = sold_qty * sell_price_per_unit`
- `cost = sold_qty * cost_price_per_unit`
- `profit = revenue - cost`
- `order_qty = max(0, target_stock - closing_qty)`
- `CRITICAL` alert when `closing_qty < min_stock`
- `LOW` alert when `closing_qty < target_stock`
- `OK` alert when `closing_qty >= target_stock`

## Quick start (backend + website server)

```bash
npm install
npm start
```

This starts the FishOps Express API + web server from the project root.

- Default URL: `http://127.0.0.1:8080`
- API health: `http://127.0.0.1:8080/api/health`
- Storage backend:
  - SQLite by default: `./data/fishops.db`
  - PostgreSQL when `DATABASE_URL` is set
- Optional environment variables:
  - `PORT` (for cloud/server platforms)
  - `DATABASE_URL` (example: `postgresql://postgres:password@localhost:5432/fishops`)
  - `PGSSLMODE=require` (optional for managed PostgreSQL services)

### Use PostgreSQL for app data

If PostgreSQL is running on your machine:

```bash
export DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fishops"
npm install
npm start
```

On Ubuntu/Linux, create the DB once if needed:

```bash
sudo -u postgres psql -c "CREATE DATABASE fishops;"
```

## Domain engine quick run (non-UI)

```bash
npm run typecheck
npm run build
npm run start:engine
```

This runs the TypeScript service/engine sample in `src/index.ts`.

## Run server for another computer (Windows/LAN)

Host computer (the one that has this project):

```powershell
npm install
npm start
```

Use the host machine IP, for example: `http://192.168.1.20:8080`.

Other computer on the same network:

1. Open the LAN URL in a browser.
2. Install the PWA from the browser install button (or from the in-app `Install App` button).
3. Sign in and start using operations pages.

If Windows Firewall prompts on first run, allow Node.js on Private networks.

## Auto start after reboot

### Ubuntu (systemd, one command)

From project root:

```bash
chmod +x ./tools/install-autostart-ubuntu.sh
./tools/install-autostart-ubuntu.sh
```

This installs and starts a `fishops` service that runs:

- `node server/index.mjs`
- Working directory = your current project folder
- Trigger = boot startup

Check status:

```bash
sudo systemctl status fishops --no-pager
```

Remove service:

```bash
sudo systemctl disable --now fishops
sudo rm -f /etc/systemd/system/fishops.service
sudo systemctl daemon-reload
```

### Windows (Scheduled Task, startup as SYSTEM)

Run PowerShell as Administrator from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\install-autostart-windows.ps1
```

This installs a startup task named `FishOpsServer` that runs:

- `node server/index.mjs`
- Working directory = project root
- Trigger = machine startup

Check task:

```powershell
Get-ScheduledTask -TaskName "FishOpsServer"
```

Remove task (if needed):

```powershell
Unregister-ScheduledTask -TaskName "FishOpsServer" -Confirm:$false
```

### Linux (systemd)

Use the template file:

- `deploy/fishops.service`

Copy and edit values (`User`, `WorkingDirectory`, `ExecStart`) to match your server paths, then:

```bash
sudo cp deploy/fishops.service /etc/systemd/system/fishops.service
sudo systemctl daemon-reload
sudo systemctl enable fishops
sudo systemctl restart fishops
sudo systemctl status fishops
```

### PM2 (persistent with `.env`)

Create `.env` from `.env.example` and set `DATABASE_URL`.

Start or recreate process using ecosystem config:

```bash
cd ~/Desktop/FishOps
pm2 delete fishops || true
pm2 start ecosystem.config.cjs --update-env
pm2 save
```

After editing `.env`, reload env variables:

```bash
pm2 restart ecosystem.config.cjs --only fishops --update-env
```

## Notes

- Password is plain text in the model for now, matching your requirement to hash later.
- Reports for `user` role are restricted to today scope by permission design.
- "Delete fish profile by admin" is context-controlled (optional enable).
