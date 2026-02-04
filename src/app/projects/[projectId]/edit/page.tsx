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
    <main className="relative">
      <ProjectEditorHeader projectId={projectId} />
      <AuthControls label={userLabel} />
      <Workspace initialLeftPanel={initialLeftPanel} />
    </main>
  );
}
