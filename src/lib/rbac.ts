import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { runWithAuditContext } from "./audit-context";
import { ROLE, type PermissionKey, type RoleKey } from "./roles";

/** SYSTEM_ADMIN implicitly holds every permission. */
function isSystemAdmin(session: Session | null): boolean {
  return session?.user?.roleKey === ROLE.SYSTEM_ADMIN;
}

export async function getSession(): Promise<Session | null> {
  return auth();
}

/** Require an authenticated session or redirect to login. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export function hasPermission(
  session: Session | null,
  permission: PermissionKey,
): boolean {
  if (isSystemAdmin(session)) return true;
  return session?.user?.permissions?.includes(permission) ?? false;
}

export function hasRole(
  session: Session | null,
  ...roles: RoleKey[]
): boolean {
  const key = session?.user?.roleKey;
  return !!key && roles.includes(key as RoleKey);
}

/**
 * Server-side permission gate. Use at the top of every protected page and
 * server action. Redirects unauthenticated users to login and unauthorized
 * users to /403. NEVER rely on hiding UI alone (anti-pattern §8).
 */
export async function requirePermission(
  permission: PermissionKey,
): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session, permission)) redirect("/403");
  return session;
}

export async function requireRole(...roles: RoleKey[]): Promise<Session> {
  const session = await requireSession();
  if (!isSystemAdmin(session) && !hasRole(session, ...roles)) redirect("/403");
  return session;
}

/**
 * The tenant scope layer. Every tenant-bound query must filter by this value.
 * Single-tenant today; the multi-tenant switch resolves the org per-request
 * here instead of from the session — no query rewrite, no schema change.
 */
export async function getOrgScope(): Promise<string> {
  const session = await requireSession();
  return session.user.organizationId;
}

/**
 * Run a mutating server action inside the audit context so the Prisma audit
 * extension can attribute writes to the current actor + request metadata.
 */
export async function withActor<T>(fn: () => Promise<T>): Promise<T> {
  const session = await auth();
  const h = await headers();
  return runWithAuditContext(
    {
      actorId: session?.user?.id,
      actorEmail: session?.user?.email ?? undefined,
      organizationId: session?.user?.organizationId,
      ip:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        undefined,
      userAgent: h.get("user-agent") ?? undefined,
    },
    fn,
  );
}
