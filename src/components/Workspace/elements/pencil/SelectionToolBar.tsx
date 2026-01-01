import React, { useState, useRef } from 'react';
import { Download, Spline, Slash } from 'lucide-react';
import { BaseElement } from '../../types/BaseElement';
import { StrokePanel } from '../shared/StrokePanel';

interface DrawSelectionToolbarProps {
  element: BaseElement;
  onUpdate: (updates: Partial<any>) => void;
  onDownload?: () => void;
}

export default function PencilSelectionToolbar({ element, onUpdate, onDownload }: DrawSelectionToolbarProps) {
  const [showStrokePanel, setShowStrokePanel] = useState(false);
  const strokeButtonRef = useRef<HTMLButtonElement>(null);

  const el = element as any;
  // Default to transparent for fill if not set, as it's a line
  const fill = el.fill || 'transparent'; 
  const stroke = el.stroke || '#000000';
  const width = Math.round(el.width || 0);
  const height = Math.round(el.height || 0);
  const strokeWidth = el.strokeWidth || 2;
  const tension = el.tension || 0;

  return (
    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 whitespace-nowrap relative">
      {/* Fill Color (Usually none for lines, but can be set) */}
      <div className="relative group">
        <button 
            className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer hover:scale-105 transition-transform shadow-sm flex items-center justify-center overflow-hidden bg-gray-50"
            onClick={() => {
                // Toggle between transparent and a default color, or open a color picker
                // For now, let's assume it opens a color input
                document.getElementById('draw-fill-color-input')?.click();
            }}
        >
            {fill === 'transparent' ? (
                <Slash size={16} className="text-red-500" />
            ) : (
                <div className="w-full h-full" style={{ backgroundColor: fill }} />
            )}
        </button>
        <input 
            id="draw-fill-color-input"
            type="color" 
            value={fill === 'transparent' ? '#ffffff' : fill}
            onChange={(e) => onUpdate({ fill: e.target.value })}
            className="absolute opacity-0 w-0 h-0"
        />
      </div>

      {/* Stroke Color */}
      <div className="relative">
         <button 
            ref={strokeButtonRef}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 ${stroke ? 'text-gray-900' : 'text-gray-400'}`}
            onClick={() => setShowStrokePanel(!showStrokePanel)}
            title="Stroke Color"
         >
            <div className="relative flex items-center justify-center w-full h-full">
                {/* Outer ring for stroke color */}
                <div 
                    className="w-5 h-5 rounded-full border-2" 
                    style={{ borderColor: stroke }}
                />
            </div>
         </button>
         
         {showStrokePanel && (
            <StrokePanel 
                stroke={stroke}
                strokeWidth={strokeWidth}
                onUpdate={onUpdate}
                onClose={() => setShowStrokePanel(false)}
            />
         )}
      </div>

      {/* Tension / Smoothness (Optional, matching the image's 3rd icon style) */}
      <div className="relative">
         <button 
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 ${tension > 0 ? 'text-blue-500' : 'text-gray-400'}`}
            onClick={() => onUpdate({ tension: tension > 0 ? 0 : 0.5 })}
            title="Toggle Smoothness"
         >
            <Spline size={18} />
         </button>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* Width */}
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
         <span className="text-xs text-gray-500 font-medium">W</span>
         <input 
            type="number" 
            value={width}
            onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                onUpdate({ width: val });
            }}
            className="w-12 bg-transparent text-sm font-medium text-gray-700 outline-none"
         />
      </div>

      {/* Height */}
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
         <span className="text-xs text-gray-500 font-medium">H</span>
         <input 
            type="number" 
            value={height}
            onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                onUpdate({ height: val });
            }}
            className="w-12 bg-transparent text-sm font-medium text-gray-700 outline-none"
         />
      </div>

      {/* Download */}
      {onDownload && (
        <button 
            onClick={onDownload}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors ml-1"
            title="Download"
        >
            <Download size={18} />
        </button>
      )}
    </div>
  );
}
