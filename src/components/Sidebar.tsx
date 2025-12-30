"use client";

import React, { useState } from 'react';
import { ChevronRight, Eye, Lock, ChevronUp, ChevronDown, Minimize2, Image as ImageIcon, Layers } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

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
      {/* History Header */}
      <div 
        className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
      >
        <span className="font-bold text-gray-800">历史记录</span>
        {isHistoryOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </div>
      
      {/* History Content */}
      {isHistoryOpen && (
        <div className="p-6 flex flex-col items-center justify-center border-b border-gray-100 bg-gray-50/50">
          <div className="w-20 h-16 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-300">
             <ImageIcon size={32} />
          </div>
          <span className="text-xs text-gray-400 font-medium">暂无历史记录</span>
        </div>
      )}

      {/* Layers Header */}
      <div className="p-4 pb-2">
        <span className="font-bold text-gray-800">图层</span>
      </div>
      
      {/* Layers List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        <LayerItem 
          name="端正战力姿势三视图" 
          image="/role.png" 
          active={false} 
        />
        <LayerItem 
          name="角色端正战力姿势" 
          image="/role.png" 
          active={false} 
        />
        <LayerItem 
          name="角色三视图" 
          image="/role.png" 
          active={true} 
          locked 
          visible 
        />
        <LayerItem 
          name="image" 
          image="/role.png" 
          active={false} 
        />
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

function LayerItem({ name, image, active, locked, visible }: { name: string, image: string, active: boolean, locked?: boolean, visible?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer group
      ${active 
        ? 'bg-gray-100 border-gray-100 shadow-sm' 
        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
      }
    `}>
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0 relative">
        {/* We use a colored div or img */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
        {!image && <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-xs">IMG</div>}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? 'text-gray-900' : 'text-gray-600'}`}>
          {name}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className={`text-gray-400 ${(!locked && !active) && 'opacity-0 group-hover:opacity-100'} hover:text-gray-600`}>
          <Lock size={14} />
        </div>
        <div className={`text-gray-400 ${(!visible && !active) && 'opacity-0 group-hover:opacity-100'} hover:text-gray-600`}>
          <Eye size={14} />
        </div>
      </div>
    </div>
  )
}
