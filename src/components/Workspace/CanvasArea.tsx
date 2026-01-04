"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ToolsPanel from './editor/ToolsPanel';
import { ToolType } from './types/ToolType';
import ImageInspectorBar from './editor/tools/image/InspectorBar';
import ShapeInspectorBar from './editor/tools/shape/InspectorBar';
import PencilInspectorBar from './editor/tools/pencil/InspectorBar';
import PenInspectorBar from './editor/tools/pen/InspectorBar';
import PencilSelectionToolbar from './editor/tools/pencil/SelectionToolBar';
import PenSelectionToolbar from './editor/tools/pen/SelectionToolBar';
import TextInspectorBar from './editor/tools/text/InspectorBar';
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
  const { elements, selectedId, updateElement, activeTool, setActiveTool } = useWorkspaceStore();
  // Local state for zoom and dragging
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [setActiveTool]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          drawingStyle={drawingStyle}
        />
      )}

      {/* Persistent InspectorBar when in pencil/pen mode */}
      {['pencil', 'pen'].includes(activeTool) && (
        <div className="absolute z-50 left-1/2 top-4 -translate-x-1/2">
           {activeTool === 'pencil' ? (
             <PencilInspectorBar 
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
             <PenInspectorBar 
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

      {selectedId && (() => {
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

        const isTextLike = selectedElement.type === 'text' || ['chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text'].includes(selectedElement.type);

        if (selectedElement.isEditing && isTextLike) {
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
                <TextInspectorBar 
                  element={selectedElement}
                  onUpdate={handleUpdate}
                  onDownload={() => {
                    // TODO: Implement download
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
                <ImageInspectorBar />
              ) : isDraw ? (
                selectedElement.type === 'pencil' ? (
                  <PencilSelectionToolbar 
                    element={selectedElement}
                    onUpdate={handleUpdate}
                    onDownload={() => {
                      // TODO: Implement download
                    }}
                  />
                ) : (
                  <PenSelectionToolbar 
                    element={selectedElement}
                    onUpdate={handleUpdate}
                    onDownload={() => {
                      // TODO: Implement download
                    }}
                  />
                )
              ) : (
                <ShapeInspectorBar 
                  element={selectedElement}
                  onUpdate={handleUpdate}
                  onDownload={() => {
                    // TODO: Implement download
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
