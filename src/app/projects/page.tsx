import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthControls from "@/components/Auth/AuthControls";
import ProjectsHub from "@/components/Projects/ProjectsHub";
import { auth } from "@/lib/auth";
import { getRequestLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";

export default async function ProjectsPage() {
  const locale = getRequestLocale();
  const t = createTranslator(getMessages(locale));
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const userLabel =
    session.user.name ?? session.user.email ?? t("auth.signed_in");
  const userKey = session.user.id ?? session.user.email ?? "unknown";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-end px-6">
          <AuthControls label={userLabel} />
        </div>
      </header>
      <ProjectsHub userKey={userKey} />
    </main>
  );
}
