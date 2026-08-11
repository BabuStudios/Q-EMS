"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("signingIn") : t("signIn")}
    </Button>
  );
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>{t("signInTitle")}</CardTitle>
          <CardDescription>{t("signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error ? (
              <p role="alert" className="text-sm text-destructive">
                {t(state.error)}
              </p>
            ) : null}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
