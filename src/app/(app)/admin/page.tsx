import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Users, ShieldCheck, ScrollText } from "lucide-react";
import { requirePermission, getOrgScope } from "@/lib/rbac";
import { PERMISSION } from "@/lib/roles";
import { db } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Server-side gate — denies anyone without admin.access (anti-pattern §8).
  await requirePermission(PERMISSION.ADMIN_ACCESS);
  const t = await getTranslations("admin");
  const orgId = await getOrgScope();

  const [userCount, roleCount, auditCount] = await Promise.all([
    db.user.count({ where: { organizationId: orgId, deletedAt: null } }),
    db.role.count({ where: { organizationId: orgId, deletedAt: null } }),
    db.auditLog.count({ where: { organizationId: orgId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>{t("users")}</CardDescription>
              <CardTitle className="text-2xl">{userCount}</CardTitle>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>{t("roles")}</CardDescription>
              <CardTitle className="text-2xl">{roleCount}</CardTitle>
            </div>
            <ShieldCheck
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
        </Card>
        <Link href="/admin/audit-log" className="block">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardDescription>{t("auditLog")}</CardDescription>
                <CardTitle className="text-2xl">{auditCount}</CardTitle>
              </div>
              <ScrollText
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t("auditLog")} →
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
