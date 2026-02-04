import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthControls from "@/components/Auth/AuthControls";
import ProjectIntro from "@/components/Projects/ProjectIntro";
import { auth } from "@/lib/auth";
import { getRequestLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";

export default async function ProjectIntroPage({
  params,
}: {
  params: { projectId: string };
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
  const userKey = session.user.id ?? session.user.email ?? "unknown";

  return (
    <main className="relative min-h-screen bg-slate-50">
      <AuthControls label={userLabel} />
      <ProjectIntro userKey={userKey} projectId={projectId} />
    </main>
  );
}
