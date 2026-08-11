import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { requireSession, hasPermission } from "@/lib/rbac";
import { PERMISSION, ROLE_LABELS, type RoleKey } from "@/lib/roles";
import { SidebarNav } from "@/components/sidebar-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const t = await getTranslations("app");
  const canAdmin = hasPermission(session, PERMISSION.ADMIN_ACCESS);
  const roleLabel = session.user.roleKey
    ? ROLE_LABELS[session.user.roleKey as RoleKey]
    : "—";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <div className="font-semibold">{t("name")}</div>
            <div className="text-xs text-muted-foreground">{t("tagline")}</div>
          </div>
        </div>
        <SidebarNav canAdmin={canAdmin} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b bg-card px-6 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {session.user.name ?? session.user.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
