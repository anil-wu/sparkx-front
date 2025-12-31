"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Spline, ArrowDownToLine, X, Pipette, ChevronDown, AlignCenter, Scan } from 'lucide-react';
import { BaseElement } from '../models/BaseElement';

interface ShapeToolbarProps {
  element: BaseElement;
  onUpdate: (updates: Partial<any>) => void;
  onDownload?: () => void;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number = 1) => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return hex;
}

// Helper to get hex from color string (handles basic hex)
const getHex = (color: string) => {
  if (color.startsWith('#')) return color.substring(0, 7);
  return color;
}

const StrokePanel = ({ 
  stroke, 
  strokeWidth, 
  onUpdate, 
  onClose 
}: { 
  stroke: string | undefined, 
  strokeWidth: number, 
  onUpdate: (updates: any) => void, 
  onClose: () => void 
}) => {
  const [hex, setHex] = useState(stroke ? getHex(stroke) : '#000000');
  const [opacity, setOpacity] = useState(100);
  
  const presets = [
    { color: undefined, label: 'None' }, // Transparent/None
    { color: '#000000', label: 'Black' },
    { color: '#ffffff', label: 'White' },
    { color: '#22c55e', label: 'Green' },
    { color: '#a855f7', label: 'Purple' },
    { color: '#e879f9', label: 'Light Purple' },
  ];

  const handleHexChange = (val: string) => {
    setHex(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
       onUpdate({ stroke: val });
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 w-[280px] p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-gray-700">描边</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 h-8">
           <span className="mr-2 text-gray-400"><AlignCenter size={14} /></span>
           <input 
             type="number" 
             value={strokeWidth}
             onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 0 })}
             className="w-full bg-transparent outline-none text-sm"
           />
           <span className="text-xs text-gray-400 ml-1">px</span>
        </div>
        <div className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-2 h-8 cursor-pointer">
           <span className="text-sm text-gray-600">居中</span>
           <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>

      {/* Color Picker Area */}
      <div className="mb-4">
        {/* Gradient Box Mockup */}
        <div 
           className="w-full h-32 rounded-lg mb-3 relative overflow-hidden cursor-pointer"
           style={{
             background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hex})`,
             backgroundColor: hex
           }}
        >
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-2 mb-3">
           {/* Hue Slider */}
           <div className="h-3 rounded-full relative overflow-hidden">
             <input 
               type="range" 
               min="0" 
               max="360" 
               className="w-full h-full opacity-0 absolute z-10 cursor-pointer"
               onChange={(e) => {
                 // Simplified hue change logic - in real app we'd convert HSL to Hex
                 // For now, let's just use native picker for complex color selection if needed
               }}
             />
             <div className="w-full h-full" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}></div>
           </div>
           
           {/* Opacity Slider */}
           <div className="h-3 rounded-full relative overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]">
             <input 
                type="range" 
                min="0" 
                max="100" 
                value={opacity} 
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full h-full opacity-0 absolute z-10 cursor-pointer" 
             />
             <div className="w-full h-full absolute top-0 left-0 pointer-events-none" style={{ background: `linear-gradient(to right, transparent, ${hex})` }}></div>
           </div>
        </div>

        {/* Presets */}
        <div className="flex items-center justify-between gap-2 mb-3">
           <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
             <Pipette size={16} />
           </button>
           <div className="flex gap-2">
             {presets.map((preset, i) => (
               <button 
                 key={i}
                 className={`w-6 h-6 rounded-full border border-gray-200 relative overflow-hidden ${!preset.color ? 'bg-white' : ''}`}
                 style={{ backgroundColor: preset.color || 'transparent' }}
                 onClick={() => {
                    if (preset.color) {
                        setHex(preset.color);
                        onUpdate({ stroke: preset.color, strokeWidth: strokeWidth || 2 });
                    } else {
                        onUpdate({ stroke: undefined });
                    }
                 }}
                 title={preset.label}
               >
                 {!preset.color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-500 transform rotate-45"></div>
                    </div>
                 )}
               </button>
             ))}
           </div>
        </div>

        {/* Hex Input */}
        <div className="flex gap-2">
           <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 h-8">
              <span className="text-gray-400 mr-2">#</span>
              <input 
                type="text" 
                value={hex.replace('#', '')}
                onChange={(e) => handleHexChange('#' + e.target.value)}
                className="w-full bg-transparent outline-none text-sm uppercase"
              />
           </div>
           <div className="w-16 flex items-center bg-gray-50 border border-gray-200 rounded-md px-2 h-8">
              <input 
                type="number" 
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full bg-transparent outline-none text-sm"
              />
              <span className="text-xs text-gray-400 ml-1">%</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const CornerPanel = ({ 
  cornerRadius, 
  sides,
  starInnerRadius,
  onUpdate, 
  onClose 
}: { 
  cornerRadius: number, 
  sides?: number,
  starInnerRadius?: number,
  onUpdate: (updates: any) => void, 
  onClose: () => void 
}) => {
  const [value, setValue] = useState(cornerRadius);
  const [sidesValue, setSidesValue] = useState(sides || 3);
  const [innerRadiusValue, setInnerRadiusValue] = useState(starInnerRadius !== undefined ? starInnerRadius : 50);

  useEffect(() => {
    setValue(cornerRadius);
  }, [cornerRadius]);

  useEffect(() => {
    if (sides !== undefined) {
      setSidesValue(sides);
    }
  }, [sides]);

  useEffect(() => {
    if (starInnerRadius !== undefined) {
      setInnerRadiusValue(starInnerRadius);
    }
  }, [starInnerRadius]);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onUpdate({ cornerRadius: newValue });
  };

  const handleSidesChange = (newValue: number) => {
    setSidesValue(newValue);
    onUpdate({ sides: newValue });
  };

  const handleInnerRadiusChange = (newValue: number) => {
    setInnerRadiusValue(newValue);
    onUpdate({ starInnerRadius: newValue });
  };

  return (
    <div 
      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 w-[280px] p-4 z-50"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-gray-700">属性调整</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      {/* Corner Radius Slider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500 whitespace-nowrap w-16">圆角</span>
        <input 
          type="range" 
          min="0" 
          max="200" 
          value={value} 
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="w-12 flex items-center bg-gray-50 border border-gray-200 rounded-md px-1 h-8">
           <input 
             type="number" 
             value={value}
             onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
             className="w-full bg-transparent outline-none text-sm text-center"
             min="0"
             max="200"
           />
        </div>
      </div>

      {/* Sides Slider - Only show if sides prop is provided */}
      {sides !== undefined && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500 whitespace-nowrap w-16">顶点</span>
          <input 
            type="range" 
            min="3" 
            max="60" 
            value={sidesValue} 
            onChange={(e) => handleSidesChange(parseInt(e.target.value) || 3)}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="w-12 flex items-center bg-gray-50 border border-gray-200 rounded-md px-1 h-8">
             <input 
               type="number" 
               value={sidesValue}
               onChange={(e) => handleSidesChange(parseInt(e.target.value) || 3)}
               className="w-full bg-transparent outline-none text-sm text-center"
               min="3"
               max="60"
             />
          </div>
        </div>
      )}

      {/* Inner Radius Slider */}
      {starInnerRadius !== undefined && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 whitespace-nowrap w-16">内角半径</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={innerRadiusValue} 
            onChange={(e) => handleInnerRadiusChange(parseInt(e.target.value) || 0)}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="w-16 flex items-center bg-gray-50 border border-gray-200 rounded-md px-1 h-8">
             <input 
               type="number" 
               value={innerRadiusValue}
               onChange={(e) => handleInnerRadiusChange(parseInt(e.target.value) || 0)}
               className="w-full bg-transparent outline-none text-sm text-center"
               min="0"
               max="100"
             />
             <span className="text-xs text-gray-400 mr-1">%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ShapeToolbar({ element, onUpdate, onDownload }: ShapeToolbarProps) {
  const [showStrokePanel, setShowStrokePanel] = useState(false);
  const [showCornerPanel, setShowCornerPanel] = useState(false);
  const strokeButtonRef = useRef<HTMLButtonElement>(null);

  // Cast to ShapeElement-like structure safely
  const el = element as any;
  const color = el.color || '#3b82f6';
  const stroke = el.stroke; 
  // If stroke is undefined, we assume no stroke or transparent.
  // But for the picker, we need a value.
  
  const width = Math.round(el.width);
  const height = Math.round(el.height);
  const strokeWidth = el.strokeWidth || 2;
  
  let defaultCornerRadius = 0;
  if (el.type === 'circle' || el.type === 'circle-text') {
       defaultCornerRadius = Math.min(width, height) / 2;
  }
  const cornerRadius = el.cornerRadius !== undefined ? el.cornerRadius : defaultCornerRadius;
  
  const sides = el.type === 'triangle' ? (el.sides || 3) : (el.type === 'star' ? (el.sides || 5) : undefined);
  const starInnerRadius = el.type === 'star' ? (el.starInnerRadius !== undefined ? el.starInnerRadius : 50) : undefined;

  return (
    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 whitespace-nowrap relative">
      {/* Fill Color */}
      <div className="relative group">
        <div 
            className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer hover:scale-105 transition-transform shadow-sm"
            style={{ backgroundColor: color }}
            onClick={() => document.getElementById('fill-color-input')?.click()}
        />
        <input 
            id="fill-color-input"
            type="color" 
            value={color}
            onChange={(e) => onUpdate({ color: e.target.value })}
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
                onUpdate={onUpdate}
                onClose={() => setShowStrokePanel(false)}
            />
         )}
      </div>

      {/* Corner Radius - Hide for circles */}
      {el.type !== 'circle' && el.type !== 'circle-text' && (
      <div className="relative">
         <button 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            onClick={() => setShowCornerPanel(!showCornerPanel)}
            title="Corner Radius"
         >
            <Scan size={18} />
         </button>
         
         {showCornerPanel && (
            <CornerPanel 
                cornerRadius={cornerRadius}
                sides={sides}
                starInnerRadius={starInnerRadius}
                onUpdate={onUpdate}
                onClose={() => setShowCornerPanel(false)}
            />
         )}
      </div>
      )}

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* Width */}
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
         <span className="text-xs text-gray-500 font-medium">W</span>
         <input 
            type="number" 
            value={width}
            onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
            className="w-12 bg-transparent text-sm outline-none text-gray-700"
         />
      </div>

      <div className="text-gray-300 flex flex-col gap-0.5">
        <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
        <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
      </div>

      {/* Height */}
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
         <span className="text-xs text-gray-500 font-medium">H</span>
         <input 
            type="number" 
            value={height}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
            className="w-12 bg-transparent text-sm outline-none text-gray-700"
         />
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* Download */}
      <button 
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        onClick={onDownload}
        title="Export"
      >
        <ArrowDownToLine size={18} />
      </button>
    </div>
  );
}
