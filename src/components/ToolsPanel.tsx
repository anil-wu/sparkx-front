"use client";

import React, { useState, useRef } from 'react';
import { MousePointer2, Square, Circle, Type, Pencil, Image as ImageIcon, Clipboard, Triangle, Star, MessageSquare, ArrowLeft, ArrowRight, PenTool, Hand, MapPin } from 'lucide-react';

export type ToolType = 'select' | 'hand' | 'mark' | 'rectangle' | 'circle' | 'triangle' | 'star' | 'message-square' | 'arrow-left' | 'arrow-right' | 'text' | 'pencil' | 'pen' | 'image' | 'clipboard';

interface ToolsPanelProps {
  isSidebarCollapsed: boolean;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export default function ToolsPanel({ isSidebarCollapsed, activeTool, onToolChange }: ToolsPanelProps) {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showPenMenu, setShowPenMenu] = useState(false);
  const [showSelectMenu, setShowSelectMenu] = useState(false);
  const closeMenuTimer = useRef<NodeJS.Timeout | null>(null);

  const mainTools: { id: ToolType; icon: React.ReactNode; isShape?: boolean; isPen?: boolean; isSelect?: boolean }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, isSelect: true },
    { id: 'rectangle', icon: <Square size={20} />, isShape: true },
    { id: 'text', icon: <Type size={20} /> },
    { id: 'pencil', icon: <Pencil size={20} />, isPen: true },
    { id: 'image', icon: <ImageIcon size={20} /> },
    { id: 'clipboard', icon: <Clipboard size={20} /> },
  ];

  const shapes = [
    { id: 'rectangle', icon: <Square size={20} /> },
    { id: 'circle', icon: <Circle size={20} /> },
    { id: 'triangle', icon: <Triangle size={20} /> },
    { id: 'star', icon: <Star size={20} /> },
  ];

  const shapeTexts = [
    { id: 'message-square', icon: <MessageSquare size={20} /> },
    { id: 'arrow-left', icon: <ArrowLeft size={20} /> },
    { id: 'arrow-right', icon: <ArrowRight size={20} /> },
  ];
  
  const pens = [
    { id: 'pencil', icon: <Pencil size={20} />, label: '铅笔', shortcut: 'Shift + P' },
    { id: 'pen', icon: <PenTool size={20} />, label: '钢笔', shortcut: 'P' },
  ];

  const selectTools = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select', shortcut: 'V' },
    { id: 'hand', icon: <Hand size={20} />, label: 'Hand tool', shortcut: 'H' },
    { id: 'mark', icon: <MapPin size={20} />, label: 'Mark', shortcut: 'M' },
  ];

  const openMenu = (menuType: 'select' | 'shape' | 'pen' | null) => {
    if (closeMenuTimer.current) {
      clearTimeout(closeMenuTimer.current);
      closeMenuTimer.current = null;
    }
    
    // Close all menus first if opening a specific one or null (close all)
    setShowSelectMenu(menuType === 'select');
    setShowShapeMenu(menuType === 'shape');
    setShowPenMenu(menuType === 'pen');
  };

  const closeMenu = () => {
    closeMenuTimer.current = setTimeout(() => {
      setShowSelectMenu(false);
      setShowShapeMenu(false);
      setShowPenMenu(false);
    }, 200); // 200ms delay to allow moving mouse to the menu
  };

  const keepMenuOpen = () => {
    if (closeMenuTimer.current) {
      clearTimeout(closeMenuTimer.current);
      closeMenuTimer.current = null;
    }
  };

  const handleToolClick = (toolId: ToolType, isShape?: boolean, isPen?: boolean, isSelect?: boolean) => {
    // If clicking on a tool, we just select it. Menus are handled by hover now.
    // But we still need to handle default selection for grouped tools if needed.
    // For now, let's just select the tool or the default tool of the group.

    if (isShape) {
       // If clicking the main shape button, we might want to select 'rectangle' if current tool is not a shape
       if (!['rectangle', 'circle', 'triangle', 'star', 'message-square', 'arrow-left', 'arrow-right'].includes(activeTool)) {
          onToolChange('rectangle');
       }
    } else if (isPen) {
       if (!['pencil', 'pen'].includes(activeTool)) {
          onToolChange('pencil');
       }
    } else if (isSelect) {
       if (!['select', 'hand', 'mark'].includes(activeTool)) {
          onToolChange('select');
       }
    } else {
      onToolChange(toolId);
    }
  };

  const handleShapeSelect = (toolId: ToolType) => {
    onToolChange(toolId);
    setShowShapeMenu(false);
  };
  
  const handlePenSelect = (toolId: ToolType) => {
    onToolChange(toolId);
    setShowPenMenu(false);
  };

  const handleSelectToolSelect = (toolId: ToolType) => {
    onToolChange(toolId);
    setShowSelectMenu(false);
  };

  const isShapeActive = ['rectangle', 'circle', 'triangle', 'star', 'message-square', 'arrow-left', 'arrow-right'].includes(activeTool);
  const isPenActive = ['pencil', 'pen'].includes(activeTool);
  const isSelectActive = ['select', 'hand', 'mark'].includes(activeTool);

  return (
    <div 
      className={`absolute top-1/2 -translate-y-1/2 flex gap-2 transition-all duration-300 z-40
        ${isSidebarCollapsed ? 'left-4' : 'left-10'}
      `}
    >
      <div className="bg-white rounded-lg p-2 shadow-lg flex flex-col gap-2">
        {mainTools.map((tool) => (
          <button 
            key={tool.id}
            onClick={() => handleToolClick(tool.id, tool.isShape, tool.isPen, tool.isSelect)}
            onMouseEnter={() => {
              if (tool.isSelect) openMenu('select');
              else if (tool.isShape) openMenu('shape');
              else if (tool.isPen) openMenu('pen');
              else openMenu(null);
            }}
            onMouseLeave={closeMenu}
            className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors relative
              ${(tool.isShape ? isShapeActive : (tool.isPen ? isPenActive : (tool.isSelect ? isSelectActive : activeTool === tool.id)))
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-100'
              }
            `}
          >
            {tool.isShape && isShapeActive ? (
              (() => {
                const allShapes = [...shapes, ...shapeTexts];
                const activeShape = allShapes.find(s => s.id === activeTool);
                return activeShape ? activeShape.icon : <Square size={20} />;
              })()
            ) : tool.isPen && isPenActive ? (
               activeTool === 'pen' ? <PenTool size={20} /> : <Pencil size={20} />
            ) : tool.isSelect && isSelectActive ? (
               (() => {
                  const activeSelect = selectTools.find(s => s.id === activeTool);
                  return activeSelect ? activeSelect.icon : <MousePointer2 size={20} />;
               })()
            ) : (
              tool.icon
            )}
          </button>
        ))}
      </div>

      {/* Select Menu Popover */}
      {showSelectMenu && (
        <div 
          className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-[200px] flex flex-col z-50"
          onMouseEnter={keepMenuOpen}
          onMouseLeave={closeMenu}
        >
           {selectTools.map((tool) => (
             <button
               key={tool.id}
               onClick={() => handleSelectToolSelect(tool.id as ToolType)}
               className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm
                 ${activeTool === tool.id 
                   ? 'bg-gray-100 text-gray-900' 
                   : 'text-gray-600 hover:bg-gray-50'
                 }
               `}
             >
               <div className="flex items-center gap-3">
                 {tool.icon}
                 <span>{tool.label}</span>
               </div>
               <span className="text-xs text-gray-400">{tool.shortcut}</span>
             </button>
           ))}
        </div>
      )}

      {/* Shape Menu Popover */}
      {showShapeMenu && (
        <div 
          className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-[240px] flex flex-col gap-4 z-50"
          onMouseEnter={keepMenuOpen}
          onMouseLeave={closeMenu}
        >
          <div>
            <div className="text-xs text-gray-500 mb-2">形状</div>
            <div className="flex flex-wrap gap-2">
              {shapes.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => handleShapeSelect(shape.id as ToolType)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                    ${activeTool === shape.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }
                  `}
                >
                  {shape.icon}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 mb-2">形状文本</div>
            <div className="flex flex-wrap gap-2">
              <button
                 onClick={() => handleShapeSelect('rectangle')}
                 className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                    ${activeTool === 'rectangle-text' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }
                  `}
              >
                <Square size={20} />
              </button>
               <button
                 onClick={() => handleShapeSelect('circle')}
                 className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                    ${activeTool === 'circle-text' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }
                  `}
              >
                <Circle size={20} />
              </button>
              {shapeTexts.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => handleShapeSelect(shape.id as ToolType)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                    ${activeTool === shape.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }
                  `}
                >
                  {shape.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pen Menu Popover */}
      {showPenMenu && (
        <div 
          className="absolute left-full top-[130px] ml-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-[200px] flex flex-col z-50"
          onMouseEnter={keepMenuOpen}
          onMouseLeave={closeMenu}
        >
           {pens.map((pen) => (
             <button
               key={pen.id}
               onClick={() => handlePenSelect(pen.id as ToolType)}
               className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm
                 ${activeTool === pen.id 
                   ? 'bg-gray-100 text-gray-900' 
                   : 'text-gray-600 hover:bg-gray-50'
                 }
               `}
             >
               <div className="flex items-center gap-3">
                 {pen.icon}
                 <span>{pen.label}</span>
               </div>
               <span className="text-xs text-gray-400">{pen.shortcut}</span>
             </button>
           ))}
        </div>
      )}
    </div>
  );
}
