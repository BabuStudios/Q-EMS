import { PrismaClient, Prisma, AuditAction } from "@prisma/client";
import { getAuditContext } from "./audit-context";

/**
 * Base client (unextended). Audit rows are written through this handle so the
 * audit extension never re-enters itself (no recursion, no logging-the-log).
 */
const base = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const WRITE_OPS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

// Never audited: the audit log itself (recursion) and auth session churn.
const SKIP_MODELS = new Set(["AuditLog", "Session", "VerificationToken"]);

function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function deriveAction(
  op: string,
  data: Record<string, unknown> | undefined,
  hadBefore: boolean,
): AuditAction {
  if (op === "delete" || op === "deleteMany") return AuditAction.DELETE;
  if (op === "create" || op === "createMany") return AuditAction.CREATE;
  if (op === "upsert") return hadBefore ? AuditAction.UPDATE : AuditAction.CREATE;
  // update / updateMany
  if (data && "deletedAt" in data) {
    return data.deletedAt === null
      ? AuditAction.RESTORE
      : AuditAction.SOFT_DELETE;
  }
  return AuditAction.UPDATE;
}

/**
 * Append-only audit trail. Captures actor (via AsyncLocalStorage), entity,
 * before/after snapshots, action, timestamp and request metadata on every
 * mutating Prisma operation. Immutable by construction — only ever created.
 */
const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || SKIP_MODELS.has(model) || !WRITE_OPS.has(operation)) {
          return query(args);
        }

        const ctx = getAuditContext();
        const a = args as Record<string, unknown>;
        const data = a?.data as Record<string, unknown> | undefined;

        // Best-effort before-snapshot for single-record mutations.
        let before: unknown = null;
        if (
          (operation === "update" ||
            operation === "delete" ||
            operation === "upsert") &&
          a?.where
        ) {
          try {
            const delegate = (
              base as unknown as Record<
                string,
                { findFirst: (args: unknown) => Promise<unknown> }
              >
            )[delegateName(model)];
            before = delegate
              ? await delegate.findFirst({ where: a.where })
              : null;
          } catch {
            before = null;
          }
        }

        const result = await query(args);

        const action = deriveAction(operation, data, before != null);
        const isBulk = operation.endsWith("Many");

        // Resolve an entity id when we can (single-record ops return the row).
        const after =
          isBulk || operation === "delete" || operation === "deleteMany"
            ? null
            : (result as Record<string, unknown> | null);
        const entityId =
          (after?.id as string | undefined) ??
          (before as { id?: string } | null)?.id ??
          undefined;

        try {
          await base.auditLog.create({
            data: {
              organizationId:
                ctx.organizationId ??
                ((after?.organizationId ??
                  (before as { organizationId?: string } | null)
                    ?.organizationId) as string | undefined) ??
                null,
              actorId: ctx.actorId ?? null,
              actorEmail: ctx.actorEmail ?? null,
              action,
              entity: model,
              entityId: entityId ?? null,
              before: (before as Prisma.InputJsonValue) ?? Prisma.DbNull,
              after: isBulk
                ? ({ bulk: true, data: data ?? null } as Prisma.InputJsonValue)
                : ((after as Prisma.InputJsonValue) ?? Prisma.DbNull),
              ip: ctx.ip ?? null,
              userAgent: ctx.userAgent ?? null,
            },
          });
        } catch (err) {
          // Auditing must never break the primary write; surface in logs only.
          console.error("[audit] failed to write AuditLog:", err);
        }

        return result;
      },
    },
  },
});

const globalForPrisma = globalThis as unknown as {
  prisma?: typeof prisma;
};

export const db = globalForPrisma.prisma ?? prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export type Db = typeof db;
