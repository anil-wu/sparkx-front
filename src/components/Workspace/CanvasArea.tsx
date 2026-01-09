"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Konva from 'konva';
import ToolsPanel from './editor/ToolsPanel';
import ImageInspectorBar from './editor/tools/image/InspectorBar';
import ShapeInspectorBar from './editor/tools/shape/InspectorBar';
import DrawInspectorBar from './editor/tools/shared/DrawInspectorBar';
import DrawSelectionToolbar from './editor/tools/shared/DrawSelectionToolbar';
import TextInspectorBar from './editor/tools/text/InspectorBar';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ContextMenu } from './editor/ContextMenu';
import HistoryControls from './editor/HistoryControls';

// Dynamically import EditorStage to avoid SSR issues with Konva
const EditorStage = dynamic(() => import('./EditorStage'), { ssr: false });

interface CanvasAreaProps {
  isSidebarCollapsed: boolean;
}

export default function CanvasArea({ 
  isSidebarCollapsed, 
}: CanvasAreaProps) {
  const { elements, selectedId, updateElement, activeTool, setActiveTool } = useWorkspaceStore();
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [drawingStyle, setDrawingStyle] = useState({ stroke: '#000000', strokeWidth: 2 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null);

  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);

  const triggerDownload = useCallback((filename: string, href: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = href;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDownload = useCallback(() => {
    if (!selectedId) {
      console.error('Download failed: No selected element');
      return;
    }

    if (!stageInstance) {
      console.error('Download failed: Stage not ready');
      return;
    }

    try {
      const node = stageInstance.findOne('#' + selectedId);
      if (!node) {
        console.error('Download failed: Selected node not found');
        return;
      }

      const dataURL = node.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
      triggerDownload(`element-${selectedId}.png`, dataURL);
    } catch (error) {
      console.error('Error during download:', error);
    }
  }, [selectedId, stageInstance, triggerDownload]);

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

    const isMod = e.ctrlKey || e.metaKey;
    if (isMod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        useWorkspaceStore.temporal.getState().redo();
      } else {
        useWorkspaceStore.temporal.getState().undo();
      }
      return;
    }
    if (isMod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      useWorkspaceStore.temporal.getState().redo();
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const { selectedId, removeElement } = useWorkspaceStore.getState();
      if (selectedId) {
        removeElement(selectedId);
      }
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

  const renderDrawInspector = () => {
    if (!['pencil', 'pen'].includes(activeTool)) return null;

    const selectedElement = selectedId ? elements.find(e => e.id === selectedId) : null;
    const isMatchingElement = selectedElement && selectedElement.type === activeTool;
    
    const element = isMatchingElement ? selectedElement : drawingStyle;
    
    const handleUpdate = (updates: any) => {
        setDrawingStyle(prev => ({ ...prev, ...updates }));
        if (isMatchingElement) {
            updateElement(selectedId!, updates);
        }
    };

    return (
        <div className="absolute z-50 left-1/2 top-4 -translate-x-1/2">
            <DrawInspectorBar
                element={element as any}
                onUpdate={handleUpdate}
                onDownload={isMatchingElement ? handleDownload : undefined}
            />
        </div>
    );
  };

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
          onStageReady={setStageInstance}
          activeTool={activeTool}
          onToolUsed={() => {}}
          onToolChange={setActiveTool}
          zoom={zoom}
          stagePos={stagePos}
          onStagePosChange={setStagePos}
          width={dimensions.width}
          height={dimensions.height}
          drawingStyle={drawingStyle}
          onContextMenu={(e, elementId) => {
            e.evt.preventDefault();
            setContextMenu({
              x: e.evt.clientX,
              y: e.evt.clientY,
              elementId: elementId || null
            });
          }}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Persistent InspectorBar when in pencil/pen mode */}
      {renderDrawInspector()}

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
        const isText = selectedElement.type === 'text';

        // If current tool is pencil/pen, we use the top persistent toolbar, so don't show floating one for draw elements
        if (isDraw && ['pencil', 'pen'].includes(activeTool)) return null;

        if (!isImage && !isShape && !isDraw && !isText) return null;

        const isTextLike = isText || ['chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text'].includes(selectedElement.type);

        if (isText || (selectedElement.isEditing && isTextLike)) {
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
                  onDownload={handleDownload}
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
                  <DrawSelectionToolbar 
                    element={selectedElement}
                    onUpdate={handleUpdate}
                    onDownload={handleDownload}
                  />
              ) : (
                <ShapeInspectorBar 
                  element={selectedElement}
                  onUpdate={handleUpdate}
                  onDownload={handleDownload}
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

      {/* History Controls */}
      <HistoryControls />
    </div>
  );
}
