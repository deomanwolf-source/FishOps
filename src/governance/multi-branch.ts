import { canAccessBranch } from "../security/permissions.js";
import type { Branch, User } from "../types/entities.js";

export function listAccessibleBranches(user: User, branches: Branch[]): Branch[] {
  return branches.filter((branch) => canAccessBranch(user.role, user.branch_id, branch.id));
}

export function canCompareBranches(user: User): boolean {
  return user.role === "master";
}
