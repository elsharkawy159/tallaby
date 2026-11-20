import { describe, expect, it } from "vitest";
import { ADMIN_ROLES } from "./middleware-types";
import { getAdminPermissions, hasPermission } from "./middleware-utils";

// Owner, 2026-11-20: admin has every super_admin permission; moderator is unchanged.
describe("admin permissions", () => {
  it("gives admin every super_admin permission, in both tables", () => {
    expect(ADMIN_ROLES.admin).toEqual(ADMIN_ROLES.super_admin);
    expect(getAdminPermissions("admin")).toEqual(getAdminPermissions("super_admin"));
    expect(hasPermission("admin", "canManageSettings")).toBe(true);
    expect(hasPermission("admin", "canManageRoles")).toBe(true);
  });

  it("keeps the two tables in step", () => {
    for (const role of ["admin", "super_admin", "moderator"] as const) {
      expect(getAdminPermissions(role)).toEqual(ADMIN_ROLES[role]);
    }
  });

  it("keeps moderator without users, settings and roles", () => {
    expect(hasPermission("moderator", "canManageUsers")).toBe(false);
    expect(hasPermission("moderator", "canManageSettings")).toBe(false);
    expect(hasPermission("moderator", "canManageRoles")).toBe(false);
    expect(hasPermission("moderator", "canManageProducts")).toBe(true);
  });
});
