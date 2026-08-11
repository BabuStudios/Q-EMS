import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request actor context. Populated at the edge of every server action /
 * route handler (see `withActor`) so the Prisma audit extension can attribute
 * writes to the acting user without threading the actor through every call.
 */
export type AuditContext = {
  actorId?: string;
  actorEmail?: string;
  organizationId?: string;
  ip?: string;
  userAgent?: string;
};

const storage = new AsyncLocalStorage<AuditContext>();

export function runWithAuditContext<T>(ctx: AuditContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getAuditContext(): AuditContext {
  return storage.getStore() ?? {};
}
