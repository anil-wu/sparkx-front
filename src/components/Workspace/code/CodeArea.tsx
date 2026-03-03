"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from '@/i18n/client';
import ProjectPanel from '../project/ProjectPanel';

interface CodeAreaProps {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  projectId?: string;
  userId?: number;
  userToken?: string;
}

type FileTreeNode = {
  path: string;
  name: string;
  type: "folder" | "file";
  children?: FileTreeNode[];
};

export default function CodeArea({ isSidebarCollapsed: _isSidebarCollapsed, toggleSidebar, projectId, userId, userToken }: CodeAreaProps) {
  const { t } = useI18n();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const workspaceMgrBaseUrl = "http://localhost:7070";
  const workspaceRoot = "game";

  const canLoadWorkspace = Boolean(projectId && userId);

  const loadTree = useCallback(async () => {
    if (!projectId || !userId) return;
    setTreeLoading(true);
    setTreeError(null);
    try {
      await fetch(`${workspaceMgrBaseUrl}/api/projects/create`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: String(userId), projectId, token: userToken || "" }),
      }).catch(() => null);

      const response = await fetch(
        `${workspaceMgrBaseUrl}/api/projects/tree?userId=${encodeURIComponent(String(userId))}&projectId=${encodeURIComponent(projectId)}&root=${encodeURIComponent(workspaceRoot)}&maxDepth=8`,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true) {
        throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${response.status}`);
      }
      setTree((data?.tree || null) as FileTreeNode | null);
    } catch (e) {
      setTree(null);
      setTreeError(e instanceof Error ? e.message : String(e));
    } finally {
      setTreeLoading(false);
    }
  }, [projectId, userId, userToken]);

  const loadFile = useCallback(
    async (relativePath: string) => {
      if (!projectId || !userId) return;
      setFileLoading(true);
      setFileError(null);
      try {
        const response = await fetch(
          `${workspaceMgrBaseUrl}/api/projects/file?userId=${encodeURIComponent(String(userId))}&projectId=${encodeURIComponent(projectId)}&root=${encodeURIComponent(workspaceRoot)}&path=${encodeURIComponent(relativePath)}`,
        );
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.ok !== true) {
          throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${response.status}`);
        }
        setFileContent(typeof data?.content === "string" ? data.content : "");
      } catch (e) {
        setFileContent(null);
        setFileError(e instanceof Error ? e.message : String(e));
      } finally {
        setFileLoading(false);
      }
    },
    [projectId, userId],
  );

  useEffect(() => {
    if (!canLoadWorkspace) {
      setTree(null);
      setTreeError(null);
      setTreeLoading(false);
      setSelectedFilePath(null);
      setFileContent(null);
      setFileError(null);
      setFileLoading(false);
      return;
    }
    void loadTree();
  }, [canLoadWorkspace, loadTree]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      setSelectedFilePath(filePath);
      void loadFile(filePath);
    },
    [loadFile],
  );

  const rightHeader = useMemo(() => {
    if (!selectedFilePath) return null;
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
        <div className="text-xs font-medium text-gray-700 truncate">{selectedFilePath}</div>
        <button
          type="button"
          onClick={() => selectedFilePath && void loadFile(selectedFilePath)}
          disabled={fileLoading}
          className="text-xs text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60"
        >
          {t("chat.history_refresh")}
        </button>
      </div>
    );
  }, [fileLoading, loadFile, selectedFilePath, t]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧：ProjectPanel 文件结构 */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-hidden">
        <ProjectPanel 
          isCollapsed={false}
          toggleSidebar={toggleSidebar}
          tree={tree}
          isLoading={treeLoading}
          error={treeError}
          selectedFilePath={selectedFilePath}
          onRefresh={loadTree}
          onFileSelect={handleFileSelect}
        />
      </div>

      {/* 右侧：文件内容显示区域 */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {selectedFilePath ? (
          <>
            {rightHeader}
            <div className="flex-1 overflow-auto p-4">
              {fileError ? (
                <div className="text-xs p-2 rounded-lg bg-red-50 text-red-700 border border-red-100">{fileError}</div>
              ) : fileLoading ? (
                <div className="text-sm text-gray-500">{t("workspace.loading")}</div>
              ) : (
                <pre className="text-xs leading-5 whitespace-pre overflow-x-auto font-mono text-gray-900">
                  {fileContent ?? ""}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-sm">{t("code.no_file_selected")}</p>
              <p className="text-xs mt-2">{t("code.select_file_hint")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
