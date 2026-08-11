import { describe, it, expect } from "vitest";
import {
  PERMISSION,
  PERMISSION_DESCRIPTIONS,
  ROLE,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  type RoleKey,
} from "./roles";

describe("RBAC catalog", () => {
  it("defines a label for every role", () => {
    for (const key of Object.values(ROLE)) {
      expect(ROLE_LABELS[key]).toBeTruthy();
    }
  });

  it("grants the SYSTEM_ADMIN every permission", () => {
    const all = Object.values(PERMISSION);
    expect(new Set(ROLE_PERMISSIONS[ROLE.SYSTEM_ADMIN])).toEqual(new Set(all));
  });

  it("lets every role at least read content", () => {
    for (const key of Object.values(ROLE)) {
      expect(ROLE_PERMISSIONS[key as RoleKey]).toContain(PERMISSION.CONTENT_READ);
    }
  });

  it("keeps admin-only permissions away from READ_ONLY and CONTRIBUTOR", () => {
    for (const key of [ROLE.READ_ONLY, ROLE.CONTRIBUTOR] as const) {
      expect(ROLE_PERMISSIONS[key]).not.toContain(PERMISSION.ADMIN_ACCESS);
      expect(ROLE_PERMISSIONS[key]).not.toContain(PERMISSION.USER_MANAGE);
    }
  });

  it("describes every permission key", () => {
    for (const key of Object.values(PERMISSION)) {
      expect(PERMISSION_DESCRIPTIONS[key]).toBeTruthy();
    }
  });

  it("exposes all roles as seedable system roles", () => {
    expect(SYSTEM_ROLES.map((r) => r.key).sort()).toEqual(
      Object.values(ROLE).sort(),
    );
  });
});
