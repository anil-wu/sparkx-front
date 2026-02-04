"use client";

import Link from "next/link";

import { useI18n } from "@/i18n/client";

export default function ProjectEditorHeader({ projectId }: { projectId: string }) {
  const { t } = useI18n();

  return (
    <div className="absolute left-4 top-4 z-50 flex items-center gap-2">
      <Link
        href={`/projects/${projectId}`}
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
      >
        {t("projects.intro")}
      </Link>
    </div>
  );
}

