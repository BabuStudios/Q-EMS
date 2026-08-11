import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  PERMISSION_DESCRIPTIONS,
  ROLE,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  type PermissionKey,
  type RoleKey,
} from "../src/lib/roles";

// Plain client (no audit extension) — seeding is provisioning, not user activity.
const prisma = new PrismaClient();

const ORG_SLUG = process.env.DEFAULT_ORG_SLUG ?? "default";
const DEFAULT_PASSWORD = "Passw0rd!";

const DEMO_USERS: { email: string; name: string; role: RoleKey }[] = [
  { email: "admin@qems.local", name: "System Administratör", role: ROLE.SYSTEM_ADMIN },
  { email: "kma@qems.local", name: "Karin Miljö", role: ROLE.QMS_MANAGER },
  { email: "process@qems.local", name: "Per Process", role: ROLE.PROCESS_OWNER },
  { email: "revisor@qems.local", name: "Rita Revisor", role: ROLE.AUDITOR },
  { email: "medarbetare@qems.local", name: "Mats Medarbetare", role: ROLE.CONTRIBUTOR },
  { email: "lasare@qems.local", name: "Lena Läsare", role: ROLE.READ_ONLY },
];

async function main() {
  console.log("Seeding Q-EMS …");

  // 1. Organization (single-tenant bootstrap).
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { slug: ORG_SLUG, name: "Demo Organisation AB" },
  });

  // 2. Permissions (global catalog).
  for (const [key, description] of Object.entries(PERMISSION_DESCRIPTIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
  const permissionByKey = new Map(
    (await prisma.permission.findMany()).map((p) => [p.key, p.id]),
  );

  // 3. System roles + their permission grants.
  for (const { key } of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: org.id, key } },
      update: { name: ROLE_LABELS[key], isSystem: true },
      create: {
        organizationId: org.id,
        key,
        name: ROLE_LABELS[key],
        isSystem: true,
      },
    });

    // Reset and re-grant from the catalog so the seed is the source of truth.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const grants = ROLE_PERMISSIONS[key as RoleKey] ?? [];
    await prisma.rolePermission.createMany({
      data: grants
        .map((pk: PermissionKey) => permissionByKey.get(pk))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }

  const roleByKey = new Map(
    (await prisma.role.findMany({ where: { organizationId: org.id } })).map(
      (r) => [r.key, r.id],
    ),
  );

  // 4. Demo users (one per role) to exercise RBAC deny/allow.
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email: u.email } },
      update: { name: u.name, roleId: roleByKey.get(u.role), isActive: true },
      create: {
        organizationId: org.id,
        email: u.email,
        name: u.name,
        passwordHash,
        roleId: roleByKey.get(u.role),
      },
    });
  }

  console.log(`Seed complete. Org "${org.name}" (${org.slug}).`);
  console.log(`Users (password: ${DEFAULT_PASSWORD}):`);
  for (const u of DEMO_USERS) console.log(`  - ${u.email}  [${u.role}]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
