"use client";

import React, { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Minimize2, Image as ImageIcon, Layers } from 'lucide-react';
import { BaseElement } from '../types/BaseElement';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useI18n } from '@/i18n/client';

interface HierarchyPanelProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function HierarchyPanel({ isCollapsed, toggleSidebar }: HierarchyPanelProps) {
  const { t } = useI18n();
  const store = useWorkspaceStore();
  const elements = store?.elements || [];
  const selectedId = store?.selectedId || null;
  const selectElement = store?.selectElement || (() => {});
  const updateElement = store?.updateElement || (() => {});
  
  if (isCollapsed) {
    return (
      <button 
        onClick={toggleSidebar}
        className="fixed left-6 bottom-6 w-10 h-10 flex items-center justify-center z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
      >
        <Layers size={24} />
      </button>
    );
  }

  return (
    <div className="w-[260px] bg-white border border-gray-100 flex flex-col h-full transition-all duration-300 relative select-none rounded-3xl shadow-lg overflow-hidden">
      
      {/* Layers Header */}
      <div className="p-4 pb-2">
        <span className="font-bold text-gray-800">
          {t("hierarchy.title", { count: elements.length })}
        </span>
      </div>
      
      {/* Layers List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {elements.slice().reverse().map((el) => (
          <LayerItem 
            key={el.id}
            element={el}
            active={selectedId === el.id} 
            t={t}
            onClick={() => selectElement(el.id)}
            onToggleVisible={(e) => {
              e.stopPropagation();
              updateElement(el.id, { visible: !el.visible });
            }}
            onToggleLock={(e) => {
              e.stopPropagation();
              if (!el.locked && selectedId === el.id) {
                selectElement(null);
              }
              updateElement(el.id, { locked: !el.locked });
            }}
          />
        ))}
        {elements.length === 0 && (
           <div className="text-center text-gray-400 text-sm py-4">
             {t("hierarchy.empty")}
           </div>
        )}
      </div>

      {/* Collapse Button */}
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

function LayerItem({ 
  element, 
  active, 
  t,
  onClick,
  onToggleVisible,
  onToggleLock
}: { 
  element: BaseElement<any>, 
  active: boolean, 
  t: (key: string, values?: Record<string, string | number>) => string;
  onClick: () => void,
  onToggleVisible: (e: React.MouseEvent) => void,
  onToggleLock: (e: React.MouseEvent) => void
}) {
  // Determine icon/image based on type
  const isImage = element.type === 'image';
  const imageUrl = isImage ? (element as any).src : null;

  return (
    <div 
      onClick={onClick}
      className={`
      flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer group
      ${active 
        ? 'bg-gray-100 border-gray-100 shadow-sm' 
        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
      }
    `}>
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
        {imageUrl ? (
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
        ) : (
           <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: (element as any).color || '#ccc' }}></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? 'text-gray-900' : 'text-gray-600'}`}>
          {element.name}
        </div>
        <div className="text-xs text-gray-400">{element.type}</div>
      </div>

      <div className="flex items-center gap-1">
        <div 
          onClick={onToggleLock}
          className={`p-1 rounded-md hover:bg-gray-200 text-gray-400 transition-colors
            ${element.locked ? 'text-orange-500 opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
          title={element.locked ? t("hierarchy.unlock") : t("hierarchy.lock")}
        >
          {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </div>
        <div 
          onClick={onToggleVisible}
          className={`p-1 rounded-md hover:bg-gray-200 text-gray-400 transition-colors
            ${!element.visible ? 'text-gray-500 opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
          title={element.visible ? t("hierarchy.hide") : t("hierarchy.show")}
        >
          {element.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </div>
      </div>
    </div>
  )
}
