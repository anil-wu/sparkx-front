"use client";

import type { ReactNode } from "react";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { I18nProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

export default function Providers({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const content = (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!googleClientId) {
    return content;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
}
