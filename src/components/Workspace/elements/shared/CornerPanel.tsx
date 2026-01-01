import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CornerPanelProps {
  cornerRadius: number;
  sides?: number;
  starInnerRadius?: number;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

export const CornerPanel = ({ 
  cornerRadius, 
  sides,
  starInnerRadius,
  onUpdate, 
  onClose 
}: CornerPanelProps) => {
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
