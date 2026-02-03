import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthControls from "@/components/Auth/AuthControls";
import Workspace from "@/components/Workspace/Workspace";
import { auth } from "@/lib/auth";
import { getRequestLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";

export default async function HomePage() {
  const locale = getRequestLocale();
  const t = createTranslator(getMessages(locale));
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const userLabel = session.user.name ?? session.user.email ?? t("auth.signed_in");

  return (
    <main className="relative">
      <AuthControls label={userLabel} />
      <Workspace />
    </main>
  );
}
