"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from "./config";

export async function getUserLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value as Locale | undefined;
  return value && locales.includes(value) ? value : defaultLocale;
}

export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
