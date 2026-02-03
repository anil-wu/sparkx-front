"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import LanguageSwitcher from "@/components/I18n/LanguageSwitcher";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";

type AuthControlsProps = {
  label?: string;
};

export default function AuthControls({ label }: AuthControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="absolute right-4 top-4 z-50 flex items-center gap-3">
      {label && (
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow">
          {label}
        </span>
      )}
      <LanguageSwitcher />
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? t("auth.signing_out") : t("auth.sign_out")}
      </button>
    </div>
  );
}
