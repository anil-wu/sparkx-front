"use client";

import React from 'react';
import { PlusCircle, History, Share2, Copy, Minimize2, Paperclip, AtSign, Lightbulb, Zap, Globe, Box, ArrowUp, ChevronLeft, Sparkles } from 'lucide-react';

interface RightPanelProps {
  isCollapsed: boolean;
  togglePanel: () => void;
}

export default function RightPanel({ isCollapsed, togglePanel }: RightPanelProps) {
  if (isCollapsed) {
    return (
      <button 
        onClick={togglePanel}
        className="fixed right-6 top-6 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-md hover:bg-gray-50 transition-all duration-200 z-50"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <div className="w-[400px] bg-white h-full flex flex-col rounded-3xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300">
      {/* Header Menu Area */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <h2 className="text-sm font-semibold text-gray-800">生成图中形象的三视图</h2>
        <div className="flex items-center gap-3 text-gray-600">
          <button className="hover:text-gray-900"><PlusCircle size={18} /></button>
          <button className="hover:text-gray-900"><History size={18} /></button>
          <button className="hover:text-gray-900"><Share2 size={18} /></button>
          <button className="hover:text-gray-900"><Copy size={18} /></button>
          <button onClick={togglePanel} className="hover:text-gray-900"><Minimize2 size={18} /></button>
        </div>
      </div>

      {/* Middle Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-6">
        <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between text-xs text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <span>🖼️</span>
            <span>图片分析</span>
          </div>
          <span className="text-gray-400">▼</span>
        </div>

        <div className="text-sm text-gray-700 leading-relaxed">
          现在我将生成角色的端正战力姿势（双手垂直站立）：
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>👁</span>
          <span>flux</span>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-3">角色端正战力姿势</h3>
          <div className="w-full aspect-[3/4] bg-black rounded-lg overflow-hidden relative group">
             {/* Placeholder for character image */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full relative">
                  {/* We can use an image here if available, or a colored placeholder */}
                  <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
                    <span className="text-4xl">👧</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 leading-relaxed">
          完成！我已经为您生成了角色的端正战力姿势，双手垂直自然下垂，展现了稳定的站立姿态。
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">L</div>
            <span>Meatai 已完成当前任务</span>
          </div>
          <div className="flex gap-2 text-gray-400">
             <button className="hover:text-gray-600">👍</button>
             <button className="hover:text-gray-600">👎</button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
             <Box size={14} />
          </button>
          <button className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200">
             <span className="text-xs font-bold">中</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 text-sm text-gray-600">
          <span>在基于</span>
          <div className="px-2 py-0.5 bg-white border border-gray-200 rounded flex items-center gap-1 text-xs shadow-sm">
             <span>🖼️</span>
             <span>角色端正战...</span>
          </div>
          <span>生成三视图，背景白色</span>
        </div>

        <div className="text-xs text-gray-400">Dec 30, 2025</div>
        
        <div className="text-sm text-gray-700">
          我来为您生成这个端正战力姿势角色的三视图，背景设为白色。
        </div>
      </div>

      {/* Footer Chat Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="border border-gray-200 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-shadow bg-white">
          <textarea 
            placeholder="请输入你的设计需求" 
            className="w-full h-16 resize-none outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          ></textarea>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-gray-400">
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><Paperclip size={16} /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><AtSign size={16} /></button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                 <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Lightbulb size={16} /></button>
                 <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Zap size={16} /></button>
                 <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Globe size={16} /></button>
                 <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Box size={16} /></button>
              </div>
              <button className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white hover:bg-gray-400 transition-colors">
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
