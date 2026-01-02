"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ToolsPanel from './editor/ToolsPanel';
import { ToolType } from './types/ToolType';
import ImageToolbar from './editor/tools/image/ToolBar';
import ShapeToolbar from './editor/tools/shape/ToolBar';
import PencilToolbar from './editor/tools/pencil/ToolBar';
import PenToolbar from './editor/tools/pen/ToolBar';
import PencilSelectionToolbar from './editor/tools/pencil/SelectionToolBar';
import PenSelectionToolbar from './editor/tools/pen/SelectionToolBar';
import TextToolBar from './editor/tools/text/ToolBar';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

// Dynamically import EditorStage to avoid SSR issues with Konva
const EditorStage = dynamic(() => import('./EditorStage'), { ssr: false });

interface CanvasAreaProps {
  isSidebarCollapsed: boolean;
}

export default function CanvasArea({ 
  isSidebarCollapsed, 
}: CanvasAreaProps) {
  const { elements, selectedId, setElements, selectElement, updateElement } = useWorkspaceStore();
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  // Local state for zoom and dragging
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [drawingStyle, setDrawingStyle] = useState({ stroke: '#000000', strokeWidth: 2 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'h':
          setActiveTool('hand');
          break;
        case 'm':
          setActiveTool('mark');
          break;
        case 'p':
          if (e.shiftKey) {
            setActiveTool('pencil');
          } else {
            setActiveTool('pen');
          }
          break;
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'o':
          setActiveTool('circle');
          break;
        case 't':
          setActiveTool('text');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.1, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.1, 0.1));

  return (
    <div 
      className="flex-1 relative bg-[#fafafa] overflow-hidden"
      ref={containerRef}
    >
      <ToolsPanel 
        isSidebarCollapsed={isSidebarCollapsed} 
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />
      
      {/* Canvas Stage Layer */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <EditorStage 
          activeTool={activeTool}
          onToolUsed={() => {}}
          onToolChange={setActiveTool}
          zoom={zoom}
          stagePos={stagePos}
          onStagePosChange={setStagePos}
          width={dimensions.width}
          height={dimensions.height}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          drawingStyle={drawingStyle}
        />
      )}

      {/* Persistent DrawToolbar when in pencil/pen mode */}
      {['pencil', 'pen'].includes(activeTool) && (
        <div className="absolute z-50 left-1/2 top-4 -translate-x-1/2">
           {activeTool === 'pencil' ? (
             <PencilToolbar 
                element={(() => {
                    if (selectedId) {
                        const el = elements.find(e => e.id === selectedId);
                        if (el && el.type === 'pencil') {
                            return el;
                        }
                    }
                    return drawingStyle as any;
                })()}
                onUpdate={(updates) => {
                    setDrawingStyle(prev => ({ ...prev, ...updates }));
                    
                    if (selectedId) {
                        const el = elements.find(e => e.id === selectedId);
                        if (el && el.type === 'pencil') {
                            updateElement(selectedId, updates);
                        }
                    }
                }}
             />
           ) : (
             <PenToolbar 
                element={(() => {
                    if (selectedId) {
                        const el = elements.find(e => e.id === selectedId);
                        if (el && el.type === 'pen') {
                            return el;
                        }
                    }
                    return drawingStyle as any;
                })()}
                onUpdate={(updates) => {
                    setDrawingStyle(prev => ({ ...prev, ...updates }));
                    
                    if (selectedId) {
                        const el = elements.find(e => e.id === selectedId);
                        if (el && el.type === 'pen') {
                            updateElement(selectedId, updates);
                        }
                    }
                }}
             />
           )}
        </div>
      )}

      {selectedId && !isDragging && (() => {
        const selectedElement = elements.find(el => el.id === selectedId);
        if (!selectedElement) return null;

        // Use stage-relative coordinates, taking zoom and pan into account
        const left = (selectedElement.x + selectedElement.width / 2) * zoom + stagePos.x;
        // Position above the element: y - padding
        const top = selectedElement.y * zoom + stagePos.y - 20;

        const handleUpdate = (updates: any) => {
            updateElement(selectedId, updates);
        };

        const isImage = selectedElement.type === 'image';
        const isShape = ['rectangle', 'triangle', 'star', 'circle', 'chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text'].includes(selectedElement.type);
        const isDraw = ['pencil', 'pen'].includes(selectedElement.type);

        // If current tool is pencil/pen, we use the top persistent toolbar, so don't show floating one for draw elements
        if (isDraw && ['pencil', 'pen'].includes(activeTool)) return null;

        if (!isImage && !isShape && !isDraw) return null;

        // If in text editing mode, show TextToolBar
        if (selectedElement.isEditing) {
          return (
            <div 
              className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
              style={{
                left: left,
                top: top,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="pointer-events-auto">
                <TextToolBar 
                  element={selectedElement}
                  onUpdate={handleUpdate}
                  onDownload={() => {
                    console.log('Download', selectedElement);
                  }}
                />
              </div>
            </div>
          );
        }

        return (
          <div 
            className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
            style={{
              left: left,
              top: top,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="pointer-events-auto">
              {isImage ? (
                <ImageToolbar />
              ) : isDraw ? (
                selectedElement.type === 'pencil' ? (
                  <PencilSelectionToolbar 
                    element={selectedElement}
                    onUpdate={handleUpdate}
                    onDownload={() => {
                      console.log('Download', selectedElement);
                    }}
                  />
                ) : (
                  <PenSelectionToolbar 
                    element={selectedElement}
                    onUpdate={handleUpdate}
                    onDownload={() => {
                      console.log('Download', selectedElement);
                    }}
                  />
                )
              ) : (
                <ShapeToolbar 
                  element={selectedElement}
                  onUpdate={handleUpdate}
                  onDownload={() => {
                    console.log('Download', selectedElement);
                  }}
                />
              )}
            </div>
          </div>
        );
      })()}

      <div className="absolute top-6 right-20 bg-white rounded-lg px-2 py-1.5 shadow-md flex items-center gap-3 text-sm text-gray-700 z-50">
        <button className="p-1 hover:text-black transition-colors" onClick={handleZoomOut}><ZoomOut size={16} /></button>
        <span className="min-w-[40px] text-center font-medium">{Math.round(zoom * 100)}%</span>
        <button className="p-1 hover:text-black transition-colors" onClick={handleZoomIn}><ZoomIn size={16} /></button>
      </div>
    </div>
  );
}
