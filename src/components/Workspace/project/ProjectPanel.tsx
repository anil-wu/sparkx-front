"use client";

import React, { useState } from 'react';
import { useI18n } from '@/i18n/client';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  File, 
  Search, 
  Plus, 
  MoreHorizontal, 
  LayoutGrid, 
  List as ListIcon, 
  Minimize2,
  FolderOpen
} from 'lucide-react';

interface ProjectPanelProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  isOpen?: boolean;
}

export default function ProjectPanel({ isCollapsed, toggleSidebar }: ProjectPanelProps) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: 'root-1',
      name: 'Assets',
      type: 'folder',
      isOpen: true,
      children: [
        { 
          id: 'assets-1', 
          name: 'Characters', 
          type: 'folder',
          isOpen: false,
          children: [
            { id: 'char-1', name: 'Player.png', type: 'file' },
            { id: 'char-2', name: 'Enemy.png', type: 'file' },
          ]
        },
        { 
            id: 'assets-2', 
            name: 'Environment', 
            type: 'folder',
            isOpen: false,
            children: [
                { id: 'env-1', name: 'Ground.png', type: 'file' },
                { id: 'env-2', name: 'Sky.jpg', type: 'file' },
            ] 
        },
        {
          id: 'root-ui',
          name: 'UIs',
          type: 'folder',
          isOpen: false,
          children: [
            { id: 'ui-1', name: 'HUD.tsx', type: 'file' },
            { id: 'ui-2', name: 'MainMenu.tsx', type: 'file' },
          ]
        },
      ]
    },
    {
      id: 'root-2',
      name: 'Scenes',
      type: 'folder',
      isOpen: true,
      children: [
        { id: 'scene-1', name: 'MainMenu', type: 'file' },
        { id: 'scene-2', name: 'Level1', type: 'file' },
      ]
    },
    {
      id: 'root-scripts',
      name: 'Scripts',
      type: 'folder',
      isOpen: false,
      children: [
        { id: 'script-1', name: 'GameManager.ts', type: 'file' },
        { id: 'script-2', name: 'PlayerController.ts', type: 'file' },
      ]
    },
    { id: 'root-3', name: 'Config.json', type: 'file' },
    { id: 'root-4', name: 'README.md', type: 'file' },
  ]);

  const toggleFolder = (id: string) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setFiles(updateNodes(files));
  };

  const FileTreeItem = ({ node, level = 0 }: { node: FileNode, level?: number }) => {
    const isFolder = node.type === 'folder';
    const paddingLeft = level * 12 + 12;

    return (
      <div className="select-none">
        <div 
          className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm ${searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => isFolder && toggleFolder(node.id)}
        >
          {isFolder ? (
            <div className="text-gray-400">
               {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : (
             <div className="w-3.5" /> // Spacer
          )}
          
          <div className={`${isFolder ? 'text-blue-500' : 'text-gray-500'}`}>
            {isFolder ? (node.isOpen ? <FolderOpen size={16} /> : <Folder size={16} />) : <File size={16} />}
          </div>
          
          <span className="text-gray-700 truncate flex-1">{node.name}</span>
        </div>
        
        {isFolder && node.isOpen && node.children && (
          <div>
            {node.children.map(child => (
              <FileTreeItem key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

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
         {files.map(node => (
            <FileTreeItem key={node.id} node={node} />
         ))}
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
