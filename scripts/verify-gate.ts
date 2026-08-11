/**
 * Phase 0 gate verification (data/logic layer). Finite, self-terminating.
 *   DATABASE_URL=... pnpm tsx scripts/verify-gate.ts
 */
import bcrypt from "bcryptjs";
import { db } from "../src/lib/prisma";
import { runWithAuditContext } from "../src/lib/audit-context";
import { ROLE, PERMISSION } from "../src/lib/roles";

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures++;
}

async function main() {
  const org = await db.organization.findUniqueOrThrow({
    where: { slug: "default" },
  });

  // --- 1. Audit-on-write: an update must append exactly one AuditLog row. ---
  const before = await db.auditLog.count({ where: { organizationId: org.id } });
  await runWithAuditContext(
    {
      actorId: "verify-script",
      actorEmail: "verify@qems.local",
      organizationId: org.id,
      ip: "127.0.0.1",
    },
    async () => {
      await db.organization.update({
        where: { id: org.id },
        data: { name: `Demo Organisation AB (${new Date().toISOString()})` },
      });
    },
  );
  const after = await db.auditLog.count({ where: { organizationId: org.id } });
  check("Update writes an AuditLog row", after === before + 1);

  const latest = await db.auditLog.findFirst({
    where: { organizationId: org.id, entity: "Organization" },
    orderBy: { createdAt: "desc" },
  });
  check("AuditLog captures actor", latest?.actorEmail === "verify@qems.local");
  check("AuditLog captures before/after diff", !!latest?.before && !!latest?.after);
  check("AuditLog action is UPDATE", latest?.action === "UPDATE");

  // --- 2. Credentials: bcrypt verify (the authorize() core). ---
  const admin = await db.user.findFirstOrThrow({
    where: { email: "admin@qems.local" },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  check(
    "Correct password verifies",
    !!admin.passwordHash && (await bcrypt.compare("Passw0rd!", admin.passwordHash)),
  );
  check(
    "Wrong password is rejected",
    !!admin.passwordHash && !(await bcrypt.compare("nope", admin.passwordHash)),
  );

  // --- 3. RBAC data: admin holds admin.access, read-only does not. ---
  const adminPerms = admin.role?.permissions.map((p) => p.permission.key) ?? [];
  check("SYSTEM_ADMIN has admin.access", adminPerms.includes(PERMISSION.ADMIN_ACCESS));

  const readOnly = await db.role.findFirstOrThrow({
    where: { organizationId: org.id, key: ROLE.READ_ONLY },
    include: { permissions: { include: { permission: true } } },
  });
  const roPerms = readOnly.permissions.map((p) => p.permission.key);
  check(
    "READ_ONLY lacks admin.access (route would 403)",
    !roPerms.includes(PERMISSION.ADMIN_ACCESS),
  );
  check("READ_ONLY can read content", roPerms.includes(PERMISSION.CONTENT_READ));

  console.log(failures === 0 ? "\nGATE PASS" : `\nGATE FAIL (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().finally(() => db.$disconnect());
