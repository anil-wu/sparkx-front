"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import LanguageSwitcher from "@/components/I18n/LanguageSwitcher";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";

type AuthControlsProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export default function AuthControls({
  label,
  className,
  compact = false,
}: AuthControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();
  const buttonClassName = compact
    ? "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    : "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50";

  const handleGoProjects = () => {
    router.push("/projects");
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className={className ?? "flex items-center gap-2"}>
      {!compact && label && (
        <span className="hidden rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 md:inline-block">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={handleGoProjects}
        className={buttonClassName}
      >
        {t("auth.projects")}
      </button>
      <LanguageSwitcher className={compact ? "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50" : "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"} />
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {pending ? t("auth.signing_out") : t("auth.sign_out")}
      </button>
    </div>
  );
}
