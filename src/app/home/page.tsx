import { headers } from "next/headers";
import { redirect } from "next/navigation";

import UserHome from "@/components/Home/UserHome";
import { getRequestLocale } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";
import { getSparkxSessionFromHeaders } from "@/lib/sparkx-session";

export default async function UserHomePage() {
  const locale = getRequestLocale();
  const t = createTranslator(getMessages(locale));
  const requestHeaders = await headers();
  const session = getSparkxSessionFromHeaders(requestHeaders);

  if (!session) {
    redirect("/login");
  }

  return <UserHome session={session} />;
}
