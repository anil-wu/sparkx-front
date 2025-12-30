"use client";

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Ellipse, Transformer } from 'react-konva';
import ImageItem from './elements/ImageItem';
import { ToolType } from './ToolsPanel';
import Konva from 'konva';

export interface CanvasItem {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
}

interface EditorStageProps {
  elements: CanvasItem[];
  onElementsChange: (elements: CanvasItem[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeTool: ToolType;
  onToolUsed: () => void;
  zoom: number;
  width: number;
  height: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function EditorStage({
  elements,
  onElementsChange,
  selectedId,
  onSelect,
  activeTool,
  onToolUsed,
  zoom,
  width,
  height,
  onDragStart,
  onDragEnd,
}: EditorStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Handle selection transformer
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, elements]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicked on empty area - remove all selections
    if (e.target === e.target.getStage()) {
      if (activeTool === 'select') {
        onSelect(null);
        return;
      }

      // Add new element logic
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Adjust for zoom if needed (stage scale)
      // Since we apply scale to stage, we need to divide pointer position by scale
      // But here we might just rely on raw coordinates if stage isn't scaled yet
      const x = (pointerPosition.x - stage.x()) / stage.scaleX();
      const y = (pointerPosition.y - stage.y()) / stage.scaleY();

      const newId = Date.now().toString();
      let newElement: CanvasItem | null = null;

      if (activeTool === 'rectangle') {
        newElement = { 
          id: newId, 
          type: 'rectangle', 
          x: x - 50, 
          y: y - 50, 
          width: 100, 
          height: 100, 
          rotation: 0, 
          color: '#3b82f6' 
        };
      } else if (activeTool === 'circle') {
        newElement = { 
          id: newId, 
          type: 'circle', 
          x: x - 50, 
          y: y - 50, 
          width: 100, 
          height: 100, 
          rotation: 0, 
          color: '#ef4444' 
        };
      }

      if (newElement) {
        onElementsChange([...elements, newElement]);
        onSelect(newId);
        onToolUsed();
      }
      return;
    }

    // If clicked on an element
    if (activeTool === 'select') {
      // Find the parent group or shape that has an ID
      // For simple shapes, e.target.id() might work if we set it
      // For groups (like character), we might hit a child, so we look up
      const clickedId = e.target.id() || e.target.getParent()?.id();
      if (clickedId) {
        onSelect(clickedId);
      }
    }
  };

  const handleElementChange = (id: string, newAttrs: Partial<CanvasItem>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...newAttrs } : el
    );
    onElementsChange(newElements);
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      onMouseDown={handleStageClick}
      onTouchStart={handleStageClick}
      className="bg-[#fafafa]"
    >
      <Layer>
        {elements.map((el) => {
          if (el.type === 'image') {
            return (
              <ImageItem
                key={el.id}
                id={el.id}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                rotation={el.rotation}
                isSelected={selectedId === el.id}
                onSelect={() => activeTool === 'select' && onSelect(el.id)}
                onChange={(attrs) => handleElementChange(el.id, attrs)}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            );
          } else if (el.type === 'rectangle') {
            return (
              <Rect
                key={el.id}
                id={el.id}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                rotation={el.rotation}
                fill={el.color}
                draggable={activeTool === 'select'}
                onClick={() => activeTool === 'select' && onSelect(el.id)}
                onTap={() => activeTool === 'select' && onSelect(el.id)}
                onDragStart={onDragStart}
                onDragEnd={(e) => {
                  handleElementChange(el.id, {
                    x: e.target.x(),
                    y: e.target.y(),
                    rotation: e.target.rotation(),
                  });
                  onDragEnd?.();
                }}
                onTransformStart={onDragStart}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  handleElementChange(el.id, {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                    rotation: node.rotation(),
                  });
                  onDragEnd?.();
                }}
              />
            );
          } else if (el.type === 'circle') {
            return (
              <Ellipse
                key={el.id}
                id={el.id}
                x={el.x + el.width / 2} // Konva circle x,y is center, but our model might assume top-left
                y={el.y + el.height / 2} // We need to be careful with this conversion
                // Actually, let's stick to our model. 
                // If our model says x,y is top-left, for circle we should adjust or use Ellipse with offset.
                // But standard Circle in Konva uses radius.
                // Let's use Ellipse to support width/height resizing properly
                radiusX={el.width / 2}
                radiusY={el.height / 2}
                rotation={el.rotation}
                fill={el.color}
                draggable={activeTool === 'select'}
                onClick={() => activeTool === 'select' && onSelect(el.id)}
                onTap={() => activeTool === 'select' && onSelect(el.id)}
                onDragStart={onDragStart}
                onDragEnd={(e) => {
                   handleElementChange(el.id, {
                     x: e.target.x() - (e.target.width() * e.target.scaleX()) / 2,
                     y: e.target.y() - (e.target.height() * e.target.scaleY()) / 2,
                     rotation: e.target.rotation(),
                   });
                   onDragEnd?.();
                }}
                onTransformStart={onDragStart}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  const newWidth = Math.max(5, node.width() * scaleX);
                  const newHeight = Math.max(5, node.height() * scaleY);
                  
                  handleElementChange(el.id, {
                    x: node.x() - newWidth / 2,
                    y: node.y() - newHeight / 2,
                    width: newWidth,
                    height: newHeight,
                    rotation: node.rotation(),
                  });
                  onDragEnd?.();
                }}
              />
            );
          }
          return null;
        })}
        <Transformer ref={transformerRef} />
      </Layer>
    </Stage>
  );
}
