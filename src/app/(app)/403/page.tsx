import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ForbiddenPage() {
  const t = await getTranslations("errors");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("forbiddenBody")}</p>
      <Button asChild>
        <Link href="/dashboard">{t("backToDashboard")}</Link>
      </Button>
    </div>
  );
}
