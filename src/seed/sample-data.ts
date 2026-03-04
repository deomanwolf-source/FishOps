import type { FishOpsDataset } from "../types/entities.js";

export const SAMPLE_DATASET: FishOpsDataset = {
  branches: [
    {
      id: "BR-001",
      name: "Colombo Main",
      location: "Colombo",
      phone: "+94-11-1001001",
      status: "active"
    },
    {
      id: "BR-002",
      name: "Negombo Harbor",
      location: "Negombo",
      phone: "+94-31-1002002",
      status: "active"
    }
  ],
  users: [
    {
      id: "USR-MASTER-001",
      username: "master",
      password: "master123",
      role: "master",
      branch_id: null,
      status: "active"
    },
    {
      id: "USR-ADMIN-001",
      username: "admin_colombo",
      password: "admin123",
      role: "admin",
      branch_id: "BR-001",
      status: "active"
    },
    {
      id: "USR-USER-001",
      username: "user_colombo",
      password: "user123",
      role: "user",
      branch_id: "BR-001",
      status: "active"
    }
  ],
  fish_profiles: [
    {
      id: "FISH-001",
      fish_code: "FISH-TUNA",
      name: "Tuna",
      local_name: "Kelawalla",
      category: "Sea",
      unit: "kg",
      status: "active"
    },
    {
      id: "FISH-002",
      fish_code: "FISH-POMFRET",
      name: "Pomfret",
      local_name: "Avoli",
      category: "Sea",
      unit: "kg",
      status: "active"
    },
    {
      id: "FISH-003",
      fish_code: "FISH-TILAPIA",
      name: "Tilapia",
      category: "Freshwater",
      unit: "kg",
      status: "active"
    }
  ],
  branch_fish_settings: [
    {
      id: "SET-001",
      branch_id: "BR-001",
      fish_id: "FISH-001",
      min_stock: 20,
      target_stock: 50,
      is_active: true
    },
    {
      id: "SET-002",
      branch_id: "BR-001",
      fish_id: "FISH-002",
      min_stock: 15,
      target_stock: 35,
      is_active: true
    },
    {
      id: "SET-003",
      branch_id: "BR-001",
      fish_id: "FISH-003",
      min_stock: 25,
      target_stock: 45,
      is_active: true
    }
  ],
  daily_prices: [],
  daily_stock_entry: [],
  audit_logs: []
};
