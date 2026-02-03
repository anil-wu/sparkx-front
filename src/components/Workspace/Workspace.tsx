"use client";

import React, { useState } from 'react';
import HierarchyPanel from './hierarchy/HierarchyPanel';
import ProjectPanel from './project/ProjectPanel';
import GamePanel from './game/GamePanel';
import CanvasArea from './CanvasArea';
import ChatPanel from './chat/ChatPanel';
import { Clapperboard, Gamepad2, Layers, FolderOpen, PenTool } from 'lucide-react';
import { useI18n } from '@/i18n/client';

export default function Workspace() {
  const { t } = useI18n();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'game'>('editor');
  const [leftPanel, setLeftPanel] = useState<'hierarchy' | 'project'>('hierarchy');

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <div className={`transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'w-0 p-0' : 'w-auto p-4 h-full'} flex flex-col gap-3`}>
        {!isSidebarCollapsed && (
          <div className="flex bg-gray-200/50 p-1 rounded-xl shrink-0">
             <button 
               onClick={() => setLeftPanel('hierarchy')}
               className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${leftPanel === 'hierarchy' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Layers size={14} className="mr-1.5" />
               {t('workspace.layers')}
             </button>
             <button 
               onClick={() => setLeftPanel('project')}
               className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${leftPanel === 'project' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <FolderOpen size={14} className="mr-1.5" />
               {t('workspace.project')}
             </button>
          </div>
        )}

        {leftPanel === 'hierarchy' ? (
          <HierarchyPanel 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={toggleSidebar}
          />
        ) : (
          <ProjectPanel 
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
        )}
      </div>
      
      <div className="flex flex-1 flex-col bg-gray-50 overflow-hidden relative">
        {/* View Mode Switcher */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex items-center z-50">
          <button 
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'editor' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <PenTool size={16} />
            {t('workspace.editor')}
          </button>
          <button 
            onClick={() => setViewMode('game')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'game' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Gamepad2 size={16} />
            {t('workspace.game')}
          </button>
        </div>

        
        {viewMode === 'editor' ? (
          <CanvasArea 
            isSidebarCollapsed={isSidebarCollapsed}
          />
        ) : (
          <GamePanel />
        )}
      </div>

      <div className={`transition-all duration-300 ${isRightPanelCollapsed ? 'w-0 p-0' : 'w-auto p-4 h-full'}`}>
        <ChatPanel isCollapsed={isRightPanelCollapsed} togglePanel={toggleRightPanel} />
      </div>
    </div>
  );
}
