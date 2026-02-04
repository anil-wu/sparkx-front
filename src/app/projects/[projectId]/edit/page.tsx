import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthControls from "@/components/Auth/AuthControls";
import ProjectEditorHeader from "@/components/Projects/ProjectEditorHeader";
import Workspace from "@/components/Workspace/Workspace";
import { auth } from "@/lib/auth";
import { getRequestLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";

export default async function ProjectEditorPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { projectId } = params;
  const locale = getRequestLocale();
  const t = createTranslator(getMessages(locale));
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const userLabel =
    session.user.name ?? session.user.email ?? t("auth.signed_in");

  const panelParam = searchParams?.panel;
  const initialLeftPanel =
    panelParam === "project" || (Array.isArray(panelParam) && panelParam[0] === "project")
      ? "project"
      : "hierarchy";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <ProjectEditorHeader projectId={projectId} />
          <AuthControls label={userLabel} />
        </div>
      </header>
      <div className="h-[calc(100vh-56px)]">
        <Workspace initialLeftPanel={initialLeftPanel} heightClassName="h-full" />
      </div>
    </main>
  );
}
