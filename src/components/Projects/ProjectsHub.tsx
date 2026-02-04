"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Plus, Rocket, Trash2 } from "lucide-react";

import { useI18n } from "@/i18n/client";
import {
  type Project,
  createProject,
  createSeedProjects,
  deleteProject,
  ensureProjects,
  writeProjects,
} from "@/lib/projects";

type ProjectsHubProps = {
  userKey: string;
};

const pickFallbackCover = (index: number) => {
  const covers = [
    "/revamp/cover1.jpg",
    "/revamp/cover2.jpg",
    "/revamp/cover3.jpg",
    "/revamp/cover4.jpg",
    "/revamp/cover5.jpg",
    "/revamp/cover6.jpg",
  ];
  return covers[index % covers.length]!;
};

export default function ProjectsHub({ userKey }: ProjectsHubProps) {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(ensureProjects(userKey));
  }, [userKey]);

  const hydratedProjects = useMemo(
    () =>
      projects.map((project, index) => ({
        ...project,
        coverImage: project.coverImage || pickFallbackCover(index),
      })),
    [projects],
  );

  const handleCreateProject = () => {
    const project = createProject(userKey, {
      name: t("projects.untitled_project"),
      description: t("projects.untitled_description"),
    });
    setProjects((prev) => [project, ...prev]);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(userKey, projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleResetDemo = () => {
    const seeded = createSeedProjects();
    writeProjects(userKey, seeded);
    setProjects(seeded);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t("projects.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("projects.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCreateProject}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t("projects.new_project")}
          </button>
        </div>
      </div>

      {hydratedProjects.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">{t("projects.empty")}</p>
          <button
            type="button"
            onClick={handleCreateProject}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t("projects.create_first")}
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hydratedProjects.map((project) => (
            <div
              key={project.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${project.coverImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
              </div>

              <div className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {project.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {project.description || t("projects.no_description")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project.id)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={t("projects.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <Rocket className="h-4 w-4" />
                    {t("projects.open_editor")}
                  </Link>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <BookOpenText className="h-4 w-4" />
                    {t("projects.intro")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center">
        <button
          type="button"
          onClick={handleResetDemo}
          className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
        >
          {t("projects.reset_demo")}
        </button>
      </div>
    </div>
  );
}
