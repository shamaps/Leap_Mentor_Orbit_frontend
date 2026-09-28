import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  getPermissionsForRoles,
  hasPermission,
  hasAnyPermission,
} from "../../features/auth/model/permissions";

describe("permissions", () => {
  it("returns no permissions for absent, empty, or unknown roles", () => {
    expect(getPermissionsForRoles()).toEqual([]);
    expect(getPermissionsForRoles([])).toEqual([]);
    expect(getPermissionsForRoles(["guest"])).toEqual([]);
  });

  it("combines permissions from known roles without duplicates", () => {
    expect(getPermissionsForRoles(["mentor", "mentee", "mentor"])).toEqual([
      PERMISSIONS.VIEW_MENTOR_DASHBOARD,
      PERMISSIONS.UPLOAD_VERIFICATION_DOCS,
      PERMISSIONS.MANAGE_MENTOR_PROFILE,
      PERMISSIONS.VIEW_MENTEE_DASHBOARD,
      PERMISSIONS.MANAGE_MENTEE_PROFILE,
    ]);
  });

  it("checks a permission for optional roles", () => {
    expect(hasPermission(undefined, PERMISSIONS.VIEW_MENTOR_DASHBOARD)).toBe(false);
    expect(hasPermission(["mentor"], PERMISSIONS.VIEW_MENTOR_DASHBOARD)).toBe(true);
    expect(hasPermission(["mentee"], PERMISSIONS.VIEW_MENTOR_DASHBOARD)).toBe(false);
  });

  it("checks whether any requested permission is granted", () => {
    expect(hasAnyPermission(["mentee"], [])).toBe(false);
    expect(hasAnyPermission(["mentee"], [PERMISSIONS.VIEW_MENTOR_DASHBOARD])).toBe(false);
    expect(hasAnyPermission(["mentee"], [
      PERMISSIONS.VIEW_MENTOR_DASHBOARD,
      PERMISSIONS.MANAGE_MENTEE_PROFILE,
    ])).toBe(true);
  });
});
