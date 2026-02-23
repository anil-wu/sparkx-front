"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import LanguageSwitcher from "@/components/I18n/LanguageSwitcher";
import { useI18n } from "@/i18n/client";

type WorkspaceHeaderProps = {
  projectId?: string;
  label?: string;
};

export default function WorkspaceHeader({
  projectId,
  label,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const handleGoProjects = () => {
    router.push("/projects");
  };

  const handleSignOut = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/sparkx/auth/logout", {
          method: "POST",
        });

        if (!response.ok) {
          setError(t("auth.sign_out_failed"));
        }
      } catch {
        setError(t("auth.sign_out_failed"));
      } finally {
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {projectId && (
          <Link
            href={`/projects/${projectId}`}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {t("projects.intro")}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        {error && (
          <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700">
            {error}
          </span>
        )}
        {label && (
          <span className="hidden rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 md:inline-block">
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={handleGoProjects}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {t("auth.projects")}
        </button>
        <LanguageSwitcher className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50" />
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? t("auth.signing_out") : t("auth.sign_out")}
        </button>
      </div>
    </div>
  );
}
