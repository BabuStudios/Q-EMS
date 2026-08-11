/**
 * RBAC catalog — the single source of truth for system roles and permissions.
 * Consumed by the seed script and by the server-side guards. Roles map to the
 * personas in the spec (§1).
 */

export const ROLE = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  QMS_MANAGER: "QMS_MANAGER", // KMA-/ledningssystemsansvarig
  PROCESS_OWNER: "PROCESS_OWNER",
  AUDITOR: "AUDITOR",
  CONTRIBUTOR: "CONTRIBUTOR",
  READ_ONLY: "READ_ONLY",
} as const;

export type RoleKey = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABELS: Record<RoleKey, string> = {
  SYSTEM_ADMIN: "Systemadministratör",
  QMS_MANAGER: "Ledningssystemsansvarig (KMA)",
  PROCESS_OWNER: "Processägare",
  AUDITOR: "Revisor",
  CONTRIBUTOR: "Bidragsgivare",
  READ_ONLY: "Endast läs",
};

/**
 * Permission keys. Dotted `domain.action`. Phase 0 ships platform/admin scope;
 * later phases add document.*, audit.*, action.* etc. — guards already work.
 */
export const PERMISSION = {
  ADMIN_ACCESS: "admin.access",
  ORG_MANAGE: "org.manage",
  USER_MANAGE: "user.manage",
  ROLE_MANAGE: "role.manage",
  AUDITLOG_READ: "auditlog.read",
  CONTENT_READ: "content.read",
  CONTENT_WRITE: "content.write",
} as const;

export type PermissionKey = (typeof PERMISSION)[keyof typeof PERMISSION];

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  "admin.access": "Åtkomst till administrationsgränssnittet",
  "org.manage": "Hantera organisationsinställningar",
  "user.manage": "Hantera användare",
  "role.manage": "Hantera roller och behörigheter",
  "auditlog.read": "Läsa spårningsloggen",
  "content.read": "Läsa innehåll (register, dokument, processer)",
  "content.write": "Skapa och redigera innehåll",
};

const ALL = Object.values(PERMISSION) as PermissionKey[];

/** Default permission grants per system role. */
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  SYSTEM_ADMIN: ALL,
  QMS_MANAGER: [
    PERMISSION.ADMIN_ACCESS,
    PERMISSION.USER_MANAGE,
    PERMISSION.AUDITLOG_READ,
    PERMISSION.CONTENT_READ,
    PERMISSION.CONTENT_WRITE,
  ],
  PROCESS_OWNER: [PERMISSION.CONTENT_READ, PERMISSION.CONTENT_WRITE],
  AUDITOR: [PERMISSION.CONTENT_READ, PERMISSION.AUDITLOG_READ],
  CONTRIBUTOR: [PERMISSION.CONTENT_READ, PERMISSION.CONTENT_WRITE],
  READ_ONLY: [PERMISSION.CONTENT_READ],
};

export const SYSTEM_ROLES: { key: RoleKey; description: string }[] = (
  Object.keys(ROLE) as RoleKey[]
).map((key) => ({ key, description: ROLE_LABELS[key] }));
