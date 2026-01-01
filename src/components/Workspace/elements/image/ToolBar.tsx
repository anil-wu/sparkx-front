"use client";

import React from 'react';
import { BaseElement } from '../../types/BaseElement';
import { ZoomIn, Scissors, Eraser, Edit, Move, PenTool, MoreHorizontal, Settings2 } from 'lucide-react';

export default function ImageToolbar() {
  const items = [
    { icon: <ZoomIn size={18} />, label: "放大" },
    { icon: <Scissors size={18} />, label: "移除背景" },
    { icon: <Eraser size={18} />, label: "擦除" },
    { icon: <Edit size={18} />, label: "编辑元素" },
    { icon: <Move size={18} />, label: "调整姿态" },
    { icon: <PenTool size={18} />, label: "手绘" },
    { icon: <MoreHorizontal size={18} />, label: "" },
    { icon: <Settings2 size={18} />, label: "" },
  ];

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-200 whitespace-nowrap">
      {items.map((item, index) => (
        <button 
          key={index}
          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 text-sm text-gray-700 transition-colors"
        >
          {item.icon}
          {item.label && <span>{item.label}</span>}
        </button>
      ))}
    </div>
  );
}
