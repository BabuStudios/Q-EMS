import { getTranslations } from "next-intl/server";
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

export default async function AuditLogPage() {
  await requirePermission(PERMISSION.AUDITLOG_READ);
  const t = await getTranslations("auditLog");
  const orgId = await getOrgScope();

  const logs = await db.auditLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{logs.length} / 100</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      {t("when")}
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      {t("actor")}
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      {t("action")}
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      {t("entity")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                        {log.createdAt.toLocaleString("sv-SE")}
                      </td>
                      <td className="py-2 pr-4">{log.actorEmail ?? "system"}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {log.entity}
                        {log.entityId ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {log.entityId.slice(0, 8)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
