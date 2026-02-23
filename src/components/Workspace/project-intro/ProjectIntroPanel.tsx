"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Calendar, Clock, FileText } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { getProjectById } from "@/lib/projects-api";
import type { Project } from "@/lib/projects";

interface ProjectIntroPanelProps {
  projectId?: string;
}

export default function ProjectIntroPanel({ projectId }: ProjectIntroPanelProps) {
  const { t } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await getProjectById(projectId);
        if (!cancelled) {
          setProject(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load project");
          setProject(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const createdAtLabel = useMemo(() => {
    if (!project?.createdAt) return null;
    const date = new Date(project.createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  }, [project?.createdAt]);

  const updatedAtLabel = useMemo(() => {
    if (!project?.updatedAt) return null;
    const date = new Date(project.updatedAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  }, [project?.updatedAt]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm">{t("project_info.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm font-medium">{t("project_info.load_failed")}</p>
          {error && <p className="text-xs mt-2 text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      <div className="mx-auto w-full max-w-4xl p-8 overflow-y-auto">
        {/* Project Cover Image */}
        {project.coverImage ? (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={project.coverImage}
              alt={project.name}
              className="w-full h-64 object-cover"
            />
          </div>
        ) : (
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 h-64 flex items-center justify-center shadow-lg">
            <ImageIcon className="text-white/80" size={64} />
          </div>
        )}

        {/* Project Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Project Name */}
          <h1 className="text-3xl font-semibold text-gray-900">
            {project.name}
          </h1>

          {/* Project Description */}
          <div className="mt-4">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <FileText size={18} className="text-gray-500" />
              <span className="font-medium">{t("project_info.description")}</span>
            </div>
            <p className="text-gray-600 leading-relaxed pl-6">
              {project.description || t("project_info.no_description")}
            </p>
          </div>

          {/* Project Metadata */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {createdAtLabel && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <span className="text-gray-500">{t("project_info.created_at_label")}</span>
                    <p className="font-medium text-gray-900">{createdAtLabel}</p>
                  </div>
                </div>
              )}
              {updatedAtLabel && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={18} className="text-gray-400" />
                  <div>
                    <span className="text-gray-500">{t("project_info.updated_at_label")}</span>
                    <p className="font-medium text-gray-900">{updatedAtLabel}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <FileText size={16} />
            {t("project_info.view_details")}
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            {t("project_info.edit_project")}
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            {t("project_info.settings")}
          </button>
        </div>
      </div>
    </div>
  );
}
