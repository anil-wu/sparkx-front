import Link from "next/link";
import { headers } from "next/headers";

import AuthControls from "@/components/Auth/AuthControls";
import LanguageSwitcher from "@/components/I18n/LanguageSwitcher";
import { getMessages } from "@/i18n/messages";
import { getRequestLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/translator";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const locale = getRequestLocale();
  const t = createTranslator(getMessages(locale));
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const userLabel = session?.user.name ?? session?.user.email ?? t("auth.signed_in");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-wide text-slate-900">SparkX</span>
          {session ? (
            <AuthControls label={userLabel} />
          ) : (
            <div className="flex items-center gap-2">
              <LanguageSwitcher className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50" />
              <Link
                href="/login"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {t("login.sign_in")}
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {t("home_intro.badge")}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {t("home_intro.title")}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          {t("home_intro.description")}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={session ? "/projects" : "/login"}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {session ? t("home_intro.open_projects") : t("home_intro.sign_in_start")}
          </Link>
        </div>
      </section>
    </main>
  );
}
