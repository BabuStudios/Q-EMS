"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useTranslations("auth");
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("signOut")}</span>
      </Button>
    </form>
  );
}
