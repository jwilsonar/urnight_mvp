"use server";

import { cookies } from "next/headers";
import { isAppLocale, type AppLocale } from "./config";

export async function setLocale(locale: AppLocale) {
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
