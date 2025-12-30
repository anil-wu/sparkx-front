"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ToolsPanel, { ToolType } from './ToolsPanel';
import ImageToolbar from './ImageToolbar';
import { ZoomIn, ZoomOut } from 'lucide-react';

// Dynamically import EditorStage to avoid SSR issues with Konva
const EditorStage = dynamic(() => import('./EditorStage'), { ssr: false });

interface CanvasAreaProps {
  isSidebarCollapsed: boolean;
}

interface CanvasItem {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
}

export default function CanvasArea({ isSidebarCollapsed }: CanvasAreaProps) {
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [elements, setElements] = useState<CanvasItem[]>([
    { id: '1', type: 'image', x: 100, y: 100, width: 400, height: 600, rotation: 0 }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
          elements={elements}
          onElementsChange={setElements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeTool={activeTool}
          onToolUsed={() => setActiveTool('select')}
          zoom={zoom}
          width={dimensions.width}
          height={dimensions.height}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        />
      )}

      {selectedId && !isDragging && (() => {
        const selectedElement = elements.find(el => el.id === selectedId);
        if (!selectedElement) return null;

        // Use stage-relative coordinates, taking zoom and pan into account (if pan is added later)
        // Currently we only have zoom.
        // Konva element x/y are relative to the stage top-left (0,0).
        // The stage itself might be transformed, but here we apply zoom to stage scale.
        // So screen coordinate = element coordinate * zoom
        
        // Ensure we're using the latest element position
        const left = (selectedElement.x + selectedElement.width / 2) * zoom;
        const top = selectedElement.y * zoom;

        return (
          <div 
            className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
            style={{
              left: left,
              top: top,
              transform: 'translate(-50%, -100%) translateY(-12px)'
            }}
          >
            <div className="pointer-events-auto">
              <ImageToolbar />
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
