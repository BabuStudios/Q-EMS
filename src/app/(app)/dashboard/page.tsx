import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import { ROLE_LABELS, type RoleKey } from "@/lib/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const t = await getTranslations("dashboard");

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true },
  });

  const roleLabel = session.user.roleKey
    ? ROLE_LABELS[session.user.roleKey as RoleKey]
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome", { name: session.user.name ?? session.user.email ?? "" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t("organization")}</CardDescription>
            <CardTitle>{org?.name ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("yourRole")}</CardDescription>
            <CardTitle>{roleLabel}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {t("phaseNotice")}
        </CardContent>
      </Card>
    </div>
  );
}
