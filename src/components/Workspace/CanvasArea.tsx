"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { BaseElement } from './types/BaseElement';
import { ElementState } from './types/ElementState';
import { ToolType } from './types/ToolType';
import { isDrawTool, isShapeTool, isTextLikeTool } from './types/toolGroups';

// Dynamically import EditorStage to avoid SSR issues with Konva
const EditorStage = dynamic(() => import('./EditorStage'), { ssr: false });

interface CanvasAreaProps {
  isSidebarCollapsed: boolean;
}

type DrawingStyle = { stroke: string; strokeWidth: number };
type ContextMenuState = { x: number; y: number; elementId: string | null };
type StagePosition = { x: number; y: number };
type CanvasDimensions = { width: number; height: number };

const TOOL_SHORTCUTS: Partial<Record<string, ToolType>> = {
  v: 'select',
  h: 'hand',
  r: 'rectangle',
  o: 'circle',
  t: 'text',
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
};

const getInspectorPosition = (
  element: BaseElement<any>,
  zoom: number,
  stagePos: StagePosition,
) => ({
  left: (element.x + element.width / 2) * zoom + stagePos.x,
  top: element.y * zoom + stagePos.y - 20,
});

export default function CanvasArea({
  isSidebarCollapsed,
}: CanvasAreaProps) {
  const { elements, selectedId, updateElement, activeTool, setActiveTool } = useWorkspaceStore();
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions>({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState<StagePosition>({ x: 0, y: 0 });
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>({ stroke: '#000000', strokeWidth: 2 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);

  const selectedElement = useMemo(
    () => (selectedId ? elements.find((element) => element.id === selectedId) ?? null : null),
    [elements, selectedId],
  );

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
    if (isTypingTarget(e.target)) {
      return;
    }

    const isMod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (isMod && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        useWorkspaceStore.temporal.getState().redo();
      } else {
        useWorkspaceStore.temporal.getState().undo();
      }
      return;
    }

    if (isMod && key === 'y') {
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

    if (key === 'p') {
      setActiveTool(e.shiftKey ? 'pencil' : 'pen');
      return;
    }

    const nextTool = TOOL_SHORTCUTS[key];
    if (nextTool) {
      setActiveTool(nextTool);
    }
  }, [setActiveTool]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleZoomIn = () => setZoom((value) => Math.min(value * 1.1, 3));
  const handleZoomOut = () => setZoom((value) => Math.max(value / 1.1, 0.1));

  const renderDrawInspector = () => {
    if (!isDrawTool(activeTool)) {
      return null;
    }

    const isMatchingElement = Boolean(selectedElement && selectedElement.type === activeTool);
    const element = isMatchingElement ? selectedElement : drawingStyle;

    const handleUpdate = (updates: Partial<ElementState>) => {
      setDrawingStyle((previous) => ({ ...previous, ...updates }));
      if (isMatchingElement && selectedId) {
        updateElement(selectedId, updates);
      }
    };

    return (
      <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2">
        <DrawInspectorBar
          element={element as any}
          onUpdate={handleUpdate}
          onDownload={isMatchingElement ? handleDownload : undefined}
        />
      </div>
    );
  };

  const renderSelectedInspector = () => {
    if (!selectedElement || !selectedId) {
      return null;
    }

    const isImage = selectedElement.type === 'image';
    const isDraw = isDrawTool(selectedElement.type);
    const isShape = isShapeTool(selectedElement.type);
    const isText = selectedElement.type === 'text';

    // Drawing tools use the fixed top bar while active.
    if (isDraw && isDrawTool(activeTool)) {
      return null;
    }

    if (!isImage && !isShape && !isDraw && !isText) {
      return null;
    }

    const { left, top } = getInspectorPosition(selectedElement, zoom, stagePos);
    const handleUpdate = (updates: Partial<ElementState>) => {
      updateElement(selectedId, updates);
    };

    const shouldUseTextInspector = isText || (selectedElement.isEditing && isTextLikeTool(selectedElement.type));

    let inspector: React.ReactNode;
    if (shouldUseTextInspector) {
      inspector = (
        <TextInspectorBar
          element={selectedElement}
          onUpdate={handleUpdate}
          onDownload={handleDownload}
        />
      );
    } else if (isImage) {
      inspector = <ImageInspectorBar />;
    } else if (isDraw) {
      inspector = (
        <DrawSelectionToolbar
          element={selectedElement}
          onUpdate={handleUpdate}
          onDownload={handleDownload}
        />
      );
    } else {
      inspector = (
        <ShapeInspectorBar
          element={selectedElement}
          onUpdate={handleUpdate}
          onDownload={handleDownload}
        />
      );
    }

    return (
      <div
        className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
        style={{
          left,
          top,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="pointer-events-auto">{inspector}</div>
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
              elementId: elementId || null,
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

      {renderSelectedInspector()}

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
