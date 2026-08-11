"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FileText,
  Workflow,
  Table2,
  CheckSquare,
  ClipboardCheck,
  Settings,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  key: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/documents", key: "documents", icon: FileText },
  { href: "/processes", key: "processes", icon: Workflow },
  { href: "/lists", key: "lists", icon: Table2 },
  { href: "/actions", key: "actions", icon: CheckSquare },
  { href: "/audits", key: "audits", icon: ClipboardCheck },
  { href: "/admin", key: "admin", icon: Settings, adminOnly: true },
  { href: "/admin/audit-log", key: "auditLog", icon: ScrollText, adminOnly: true },
];

export function SidebarNav({ canAdmin }: { canAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav aria-label="Huvudnavigering" className="flex flex-col gap-1 p-3">
      {ITEMS.filter((item) => !item.adminOnly || canAdmin).map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
