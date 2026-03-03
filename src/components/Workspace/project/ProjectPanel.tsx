"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Minimize2, MoreHorizontal, Plus, Search } from "lucide-react";

interface ProjectPanelProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  tree?: FileNode | null;
  isLoading?: boolean;
  error?: string | null;
  selectedFilePath?: string | null;
  onRefresh?: () => void;
  onFileSelect?: (filePath: string) => void;
}

interface FileNode {
  path: string;
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
}

export default function ProjectPanel({
  isCollapsed,
  toggleSidebar,
  tree,
  isLoading,
  error,
  selectedFilePath,
  onRefresh,
  onFileSelect,
}: ProjectPanelProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({});
  
  const toggleFolder = useCallback((folderPath: string) => {
    setOpenPaths(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const effectiveTree = useMemo(() => {
    if (!tree) return null;
    if (!normalizedQuery) return tree;
    const filterNode = (node: FileNode): FileNode | null => {
      const selfMatch = node.name.toLowerCase().includes(normalizedQuery) || node.path.toLowerCase().includes(normalizedQuery);
      if (node.type === "file") return selfMatch ? node : null;
      const children = (node.children || []).map(filterNode).filter(Boolean) as FileNode[];
      if (selfMatch || children.length > 0) return { ...node, children };
      return null;
    };
    return filterNode(tree);
  }, [normalizedQuery, tree]);

  const FileTreeItem = useCallback(
    ({ node, level = 0 }: { node: FileNode; level?: number }) => {
      const isFolder = node.type === "folder";
      const isOpen = normalizedQuery ? true : openPaths[node.path] ?? level < 1;
      const paddingLeft = level * 12 + 12;
      const isSelected = node.type === "file" && selectedFilePath === node.path;

      const handleClick = () => {
        if (isFolder) {
          toggleFolder(node.path);
        } else {
          onFileSelect?.(node.path);
        }
      };

      return (
        <div className="select-none">
          <div
            className={[
              "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm",
              isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-700",
            ].join(" ")}
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={handleClick}
          >
            {isFolder ? (
              <div className="text-gray-400">{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
            ) : (
              <div className="w-3.5" />
            )}

            <div className={isFolder ? "text-blue-500" : isSelected ? "text-blue-600" : "text-gray-500"}>
              {isFolder ? (isOpen ? <FolderOpen size={16} /> : <Folder size={16} />) : <File size={16} />}
            </div>

            <span className="truncate flex-1">{node.name}</span>
          </div>

          {isFolder && isOpen && node.children && node.children.length > 0 && (
            <div>
              {node.children.map(child => (
                <FileTreeItem key={child.path} node={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    },
    [normalizedQuery, onFileSelect, openPaths, selectedFilePath, toggleFolder],
  );

  if (isCollapsed) {
    return (
      <button 
        onClick={toggleSidebar}
        className="fixed left-6 bottom-6 w-10 h-10 flex items-center justify-center z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
      >
        <FolderOpen size={24} />
      </button>
    );
  }

  return (
    <div className="w-[260px] bg-white border border-gray-100 flex flex-col h-full rounded-3xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-gray-800">{t("project.assets")}</span>
        <div className="flex items-center gap-1">
           <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <Plus size={16} />
           </button>
           <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <MoreHorizontal size={16} />
           </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-2">
        <div className="relative">
           <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
              type="text" 
              placeholder={t("project.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500 outline-none"
           />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-xs text-gray-500 p-2">{t("workspace.loading")}</div>
        ) : error ? (
          <div className="p-2 space-y-2">
            <div className="text-xs p-2 rounded-lg bg-red-50 text-red-700 border border-red-100">{error}</div>
            {onRefresh && (
              <button type="button" onClick={onRefresh} className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
                {t("chat.history_refresh")}
              </button>
            )}
          </div>
        ) : effectiveTree ? (
          <FileTreeItem node={effectiveTree} />
        ) : (
          <div className="text-xs text-gray-400 p-2">{t("workspace.loading")}</div>
        )}
      </div>

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-gray-100 mt-auto">
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center justify-start px-2 py-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
        >
          <Minimize2 size={20} />
        </button>
      </div>
    </div>
  );
}
