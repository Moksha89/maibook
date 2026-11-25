import { describe, expect, it } from "vitest";

import { canAssignRole, canManageUser, isSuperAdmin } from "./user-guards";

const user = (...keys: string[]) => ({ roles: keys.map((key) => ({ role: { key } })) });

describe("user administration guards", () => {
  it("detects SuperAdmins", () => {
    expect(isSuperAdmin(user("superadmin"))).toBe(true);
    expect(isSuperAdmin(user("admin"))).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
  it("only lets a SuperAdmin create or promote to SuperAdmin", () => {
    expect(canAssignRole(false, "superadmin")).toBe(false);
    expect(canAssignRole(true, "superadmin")).toBe(true);
    expect(canAssignRole(false, "admin")).toBe(true);
    expect(canAssignRole(false, "manager")).toBe(true);
  });
  it("stops admins acting on SuperAdmin accounts", () => {
    expect(canManageUser(false, true)).toBe(false);
    expect(canManageUser(true, true)).toBe(true);
    expect(canManageUser(false, false)).toBe(true);
  });
});
