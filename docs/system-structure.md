# System Structure

This document maps your FishOps requirements to concrete modules.

## 1) Product goal mapping

- Opening + closing workflow is modeled in `daily_stock_entry`.
- No per-sale entry is required.
- Core formulas are implemented in `src/engine/calculations.ts`.
- Branch daily output is assembled in `src/engine/daily-summary.ts`.

## 2) Roles and permissions

- Role model: `src/types/entities.ts`.
- Permission matrix and enforcement: `src/security/permissions.ts`
- Service-level checks: `src/services/fishops-service.ts`

Edit/update access is restricted to `admin/master` via permission checks.

## 3) Data model and IndexedDB collections

Collections are represented in:

- `src/types/entities.ts` (entity contracts)
- `src/storage/indexeddb-schema.ts` (IndexedDB table/index definitions)

Implemented collections:

- `branches`
- `users`
- `fish_profiles`
- `branch_fish_settings`
- `daily_prices`
- `daily_stock_entry`
- `audit_logs`

## 4) Daily calculation engine

Implemented in `src/engine/calculations.ts`:

- Sold quantity
- Revenue
- Cost
- Profit
- Tomorrow order quantity
- Low stock level
- Validation (`sold_qty >= 0`)

## 5) Navigation and pages

Implemented in `src/navigation/pages.ts`:

- Dashboard
- Users and roles
- Fish profiles
- Branch fish settings
- Daily prices
- Morning opening stock
- Night closing stock
- Daily summary
- Reports
- Settings

All pages are permission-gated.

## 6) Theme system

Implemented in `src/theme/operational-blue-teal.ts`:

- Colors
- Typography
- Shape
- Button styles
- Status chips

## 7) Operational workflow support

Service methods in `src/services/fishops-service.ts` support:

- Setting prices
- Copying prices from previous date
- Price history lookup per fish
- Entering/updating stock
- Building daily dashboard output
- Building company branch comparison (master scope)
- Backup export/import
- Full center wipe (master only)
- Audit log entries on create/update

## 8) Multi-branch governance

- Branch scope rules: `master` can access all branches.
- Branch scope rules: `admin` is restricted to own branch.
- Branch scope rules: `user` is restricted to own branch.

This is enforced by `canAccessBranch` in `src/security/permissions.ts` and checked in service methods.
