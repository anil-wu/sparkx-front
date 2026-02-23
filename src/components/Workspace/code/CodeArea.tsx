"use client";

import React, { useState } from 'react';
import { useI18n } from '@/i18n/client';
import ProjectPanel from '../project/ProjectPanel';

interface CodeAreaProps {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function CodeArea({ isSidebarCollapsed, toggleSidebar }: CodeAreaProps) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左侧：ProjectPanel 文件结构 */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-hidden">
        <ProjectPanel 
          isCollapsed={false}
          toggleSidebar={toggleSidebar}
          onFileSelect={handleFileSelect}
        />
      </div>

      {/* 右侧：文件内容显示区域 */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {selectedFile ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-sm">File Content: {selectedFile}</p>
              <p className="text-xs mt-2">Code editor will be implemented here</p>
            </div>
          </div>
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
