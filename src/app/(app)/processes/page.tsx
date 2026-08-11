import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/rbac";
import { PhasePlaceholder } from "@/components/phase-placeholder";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireSession();
  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("processes")} phase="Fas 3" />;
}
