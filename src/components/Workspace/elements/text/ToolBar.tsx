"use client";

import React, { useState, useRef } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Settings, Download, ChevronDown, SlidersHorizontal, Pencil } from 'lucide-react';
import { BaseElement } from '../../types/BaseElement';
import { StrokePanel } from '../shared/StrokePanel';
import { TextAdvancedPanel } from './AdvancedPanel';

interface TextToolBarProps {
  element: BaseElement;
  onUpdate: (updates: Partial<any>) => void;
  onDownload?: () => void;
}

const FONT_FAMILIES = [
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'
];

const FONT_SIZES = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 72, 96
];

const FONT_WEIGHTS = [
  'Normal', 'Bold', 'Italic', 'Bold Italic'
];

export default function TextToolBar({ element, onUpdate, onDownload }: TextToolBarProps) {
  const [showStrokePanel, setShowStrokePanel] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const strokeButtonRef = useRef<HTMLButtonElement>(null);

  const el = element as any;
  const textColor = el.textColor || '#000000';
  const stroke = el.textStroke; 
  const strokeWidth = el.textStrokeWidth || 2;
  const fontFamily = el.fontFamily || 'Inter';
  const fontSize = el.fontSize || 14;
  const fontStyle = el.fontStyle || 'normal';
  const align = el.align || 'center';

  // Helper to parse font style
  // Konva uses 'normal', 'bold', 'italic', 'italic bold'
  // Let's simplify to a dropdown
  
  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 whitespace-nowrap z-50">
      {/* Text Color */}
      <div className="relative group flex items-center gap-2 pr-2 border-r border-gray-200">
        <div 
            className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer hover:scale-105 transition-transform shadow-sm"
            style={{ backgroundColor: textColor }}
            onClick={() => document.getElementById('text-color-input')?.click()}
        />
        <input 
            id="text-color-input"
            type="color" 
            value={textColor}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
            className="absolute opacity-0 w-0 h-0"
        />
        {/* Transparent/None indicator from image - simplified as a style icon or similar if needed */}
        {/* For now, just the color picker circle as primary interaction */}
      </div>

      {/* Stroke Color */}
      <div className="relative group flex items-center gap-2 pr-2 border-r border-gray-200">
         <button 
            ref={strokeButtonRef}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 ${stroke ? 'text-gray-900' : 'text-gray-400'}`}
            onClick={() => setShowStrokePanel(!showStrokePanel)}
            title="Stroke Color"
         >
            <div className="relative">
                <Pencil size={18} />
                {stroke && (
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: stroke }}></div>
                )}
                {!stroke && (
                     <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-red-500 flex items-center justify-center">
                        <div className="w-1.5 h-0.5 bg-white transform rotate-45"></div>
                     </div>
                )}
            </div>
         </button>
         
         {showStrokePanel && (
             <StrokePanel 
                 stroke={stroke}
                 strokeWidth={strokeWidth}
                 onUpdate={(updates) => {
                     // Map stroke updates to textStroke updates
                     const mappedUpdates: any = {};
                     if (updates.stroke !== undefined) mappedUpdates.textStroke = updates.stroke;
                     if (updates.strokeWidth !== undefined) mappedUpdates.textStrokeWidth = updates.strokeWidth;
                     onUpdate(mappedUpdates);
                 }}
                 onClose={() => setShowStrokePanel(false)}
             />
          )}
      </div>

      {/* Font Family */}
      <div className="relative">
        <select
          value={fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="appearance-none bg-transparent hover:bg-gray-50 pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer outline-none focus:border-blue-500 transition-colors w-32"
        >
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Font Weight/Style */}
      <div className="relative">
        <select
          value={fontStyle}
          className="appearance-none bg-transparent hover:bg-gray-50 pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer outline-none focus:border-blue-500 transition-colors w-28"
          onChange={(e) => {
             onUpdate({ fontStyle: e.target.value }); 
          }}
        >
          <option value="normal">Regular</option>
          <option value="bold">Bold</option>
          <option value="italic">Italic</option>
          <option value="italic bold">Bold Italic</option>
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Font Size */}
      <div className="relative">
        <select
          value={fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="appearance-none bg-transparent hover:bg-gray-50 pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer outline-none focus:border-blue-500 transition-colors w-20"
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
         <button 
            className={`p-1.5 rounded-lg transition-colors ${align === 'left' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => onUpdate({ align: 'left' })}
            title="Align Left"
         >
            <AlignLeft size={18} />
         </button>
         <button 
            className={`p-1.5 rounded-lg transition-colors ${align === 'center' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => onUpdate({ align: 'center' })}
            title="Align Center"
         >
            <AlignCenter size={18} />
         </button>
         <button 
            className={`p-1.5 rounded-lg transition-colors ${align === 'right' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => onUpdate({ align: 'right' })}
            title="Align Right"
         >
            <AlignRight size={18} />
         </button>
      </div>
      
      {/* Settings */}
      <div className="relative">
        <button 
           className={`p-1.5 rounded-lg transition-colors ${showAdvancedPanel ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-600'}`}
           onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
           title="Advanced Settings"
        >
          <SlidersHorizontal size={18} />
        </button>

        {showAdvancedPanel && (
           <TextAdvancedPanel 
               element={el}
               onUpdate={onUpdate}
               onClose={() => setShowAdvancedPanel(false)}
           />
        )}
      </div>

      {/* Download */}
      {onDownload && (
        <button 
          onClick={onDownload}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors ml-1"
        >
          <Download size={18} />
        </button>
      )}
    </div>
  );
}
