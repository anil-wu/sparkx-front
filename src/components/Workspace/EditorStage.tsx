"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer, Circle } from 'react-konva';
import ImageElement from './editor/tools/image/Element';
import ShapeElement from './editor/tools/shape/Element';
import TextElement from './editor/tools/text/Element';
import TextRectangleElement from './editor/tools/text-rectangle/Element';
import TextCircleElement from './editor/tools/text-circle/Element';
import TextChatBubbleElement from './editor/tools/chat-bubble/Element';
import TextArrowLeftElement from './editor/tools/arrow/LeftElement';
import TextArrowRightElement from './editor/tools/arrow/RightElement';
import PencilElement from './editor/tools/pencil/Element';
import PenElement from './editor/tools/pen/Element';
import { ToolType } from './types/ToolType';
import Konva from 'konva';
import { 
  BaseElement as BaseElementModel, 
  ElementFactory, 
  ShapeElement as ShapeElementModel, 
  ImageElement as ImageElementModel, 
  TextElement as TextElementModel, 
  TextShapeElement as TextShapeElementModel,
  DrawElement as DrawElementModel
} from './types/BaseElement';

import { useWorkspaceStore } from '@/store/useWorkspaceStore';

interface EditorStageProps {
  activeTool: ToolType;
  onToolUsed: () => void;
  zoom: number;
  stagePos?: { x: number, y: number };
  onStagePosChange?: (pos: { x: number, y: number }) => void;
  width: number;
  height: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onToolChange?: (tool: ToolType) => void;
  drawingStyle?: { stroke: string; strokeWidth: number };
}

export default function EditorStage({
  activeTool,
  onToolUsed,
  zoom,
  stagePos = { x: 0, y: 0 },
  onStagePosChange,
  width,
  height,
  onDragStart,
  onDragEnd,
  onToolChange,
  drawingStyle,
}: EditorStageProps) {
  const { elements, selectedId, setElements, selectElement, addElement, updateElement } = useWorkspaceStore();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState({ x: 0, y: 0 });
  const [previewElement, setPreviewElement] = useState<BaseElementModel | null>(null);
  const [isClosingPath, setIsClosingPath] = useState(false);

  // Handle stage position updates (centering)
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.position(stagePos);
      stageRef.current.batchDraw();
    }
  }, [stagePos]);

  // Update cursor based on tool
  useEffect(() => {
    if (stageRef.current) {
      if (activeTool === 'hand') {
        stageRef.current.container().style.cursor = 'grab';
      } else {
        stageRef.current.container().style.cursor = 'default';
      }
    }
  }, [activeTool]);

  // Handle selection transformer
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current && !isDrawing) {
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
  }, [selectedId, elements, isDrawing]);

  const getStagePos = (stage: Konva.Stage, pointerPosition: { x: number, y: number }) => {
    return {
      x: (pointerPosition.x - stage.x()) / stage.scaleX(),
      y: (pointerPosition.y - stage.y()) / stage.scaleY(),
    };
  };

  const finishPenDrawing = (drawEl: DrawElementModel, closePath: boolean = false) => {
      let points = drawEl.points || [];
      
      // If closing path, make sure last point matches first
      if (closePath && points.length >= 2) {
          points = [...points.slice(0, points.length - 2), points[0], points[1]];
      } else {
          // If just finishing, remove the last "moving" point (last 2 coords)
          // because it was just tracking the cursor and not clicked yet.
          if (points.length >= 2) {
              points = points.slice(0, points.length - 2);
          }
      }

      if (points.length < 4) {
          setIsDrawing(false);
          setPreviewElement(null);
          return;
      }

      // Normalize points
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      for (let i = 0; i < points.length; i += 2) {
          const px = points[i];
          const py = points[i+1];
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
      }
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      const newPoints = points.map((val, i) => {
          return i % 2 === 0 ? val - minX : val - minY;
      });
      
      const finalElement = drawEl.update({
          x: minX,
          y: minY,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
          points: newPoints
      });

      addElement(finalElement);
      selectElement(finalElement.id);
      onToolUsed();
      
      setIsDrawing(false);
      setPreviewElement(null);
      setIsClosingPath(false);
  };

  const handleStageDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'pen' && isDrawing && previewElement) {
          finishPenDrawing(previewElement as DrawElementModel);
      }
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicked on empty area - remove all selections
    if (e.target === e.target.getStage()) {
      if (activeTool === 'select') {
        // If we are deselecting, we should also stop editing any element
        if (selectedId) {
             const selectedElement = elements.find(el => el.id === selectedId);
             if (selectedElement && selectedElement.isEditing) {
                 updateElement(selectedId, { isEditing: false });
             }
        }
        selectElement(null);
        return;
      }

      // Start drawing new element
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      const { x, y } = getStagePos(stage, pointerPosition);

      if (activeTool === 'pencil') {
         setIsDrawing(true);
         setDrawStartPos({ x, y });
         
         const newEl = ElementFactory.createDefault(activeTool, 0, 0);
         // For pencil, we start with points in absolute coordinates (relative to stage)
         // We set x,y to 0 during drawing, and normalize them on mouse up
         const drawEl = newEl as DrawElementModel;
         drawEl.points = [x, y];
         drawEl.x = 0;
         drawEl.y = 0;
         
         if (drawingStyle) {
           drawEl.stroke = drawingStyle.stroke;
           drawEl.strokeWidth = drawingStyle.strokeWidth;
         }

         setPreviewElement(drawEl);
         
         if (selectedId) {
             const selectedElement = elements.find(el => el.id === selectedId);
             if (selectedElement && selectedElement.isEditing) {
                 updateElement(selectedId, { isEditing: false });
             }
         }
         selectElement(null);
         return;
      }

      if (activeTool === 'pen') {
         if (selectedId) {
             const selectedElement = elements.find(el => el.id === selectedId);
             if (selectedElement && selectedElement.isEditing) {
                 updateElement(selectedId, { isEditing: false });
             }
             selectElement(null);
         }

         if (!isDrawing) {
             // Start new Pen path
             setIsDrawing(true);
             setDrawStartPos({ x, y });
             
             const newEl = ElementFactory.createDefault(activeTool, 0, 0);
             const drawEl = newEl as DrawElementModel;
             drawEl.points = [x, y, x, y]; // Start + Preview Point
             drawEl.x = 0;
             drawEl.y = 0;
             
             if (drawingStyle) {
               drawEl.stroke = drawingStyle.stroke;
               drawEl.strokeWidth = drawingStyle.strokeWidth;
             }
             setPreviewElement(drawEl);
         } else {
             // Continue existing Pen path
             const drawEl = previewElement as DrawElementModel;
             const points = drawEl.points || [];
             
             // Check for closing path (click near start)
             if (points.length >= 4) {
                 const startX = points[0];
                 const startY = points[1];
                 const dist = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                 if (dist < 20) {
                     // Close path
                     finishPenDrawing(drawEl, true);
                     return;
                 }
             }

             // Add new point for the next segment
             const newPoints = [...points, x, y];
             setPreviewElement(drawEl.update({ points: newPoints }));
         }
         return;
      }

      if (['rectangle', 'circle', 'triangle', 'star', 'chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text', 'text', 'image'].includes(activeTool)) {
         setIsDrawing(true);
         setDrawStartPos({ x, y });
         // Create a temporary element with 0 size
         const newEl = ElementFactory.createDefault(activeTool, x, y);
         newEl.width = 0;
         newEl.height = 0;
         setPreviewElement(newEl);
         
         // Deselect current and stop editing
         if (selectedId) {
             const selectedElement = elements.find(el => el.id === selectedId);
             if (selectedElement && selectedElement.isEditing) {
                 updateElement(selectedId, { isEditing: false });
             }
         }
         selectElement(null);
      }
      return;
    }

    // If clicked on an element
    if (activeTool === 'select') {
      const clickedId = e.target.id() || e.target.getParent()?.id();
      if (clickedId) {
        // If clicking a different element, stop editing the previous one
        if (selectedId && selectedId !== clickedId) {
             const selectedElement = elements.find(el => el.id === selectedId);
             if (selectedElement && selectedElement.isEditing) {
                 updateElement(selectedId, { isEditing: false });
             }
        }
        selectElement(clickedId);
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !previewElement) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const { x, y } = getStagePos(stage, pointerPosition);

    if (activeTool === 'pencil') {
       const drawEl = previewElement as DrawElementModel;
       // Add new point
       const newPoints = (drawEl.points || []).concat([x, y]);
       setPreviewElement(drawEl.update({ points: newPoints }));
       return;
    }

    if (activeTool === 'pen') {
       const drawEl = previewElement as DrawElementModel;
       const points = [...(drawEl.points || [])];
       if (points.length >= 2) {
           // Update last point to follow cursor
           points[points.length - 2] = x;
           points[points.length - 1] = y;
           setPreviewElement(drawEl.update({ points }));

           // Check if we can close path
           if (points.length >= 6) { // At least start + 1 point + cursor point (2*3=6 coords)
             const startX = points[0];
             const startY = points[1];
             const dist = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
             
             // Increase threshold to 20px
             if (dist < 20) {
                 setIsClosingPath(true);
                 // Snap the last point to the start point
                 points[points.length - 2] = startX;
                 points[points.length - 1] = startY;
                 setPreviewElement(drawEl.update({ points }));
             } else {
                 setIsClosingPath(false);
             }
           } else {
             setIsClosingPath(false);
           }
       }
       return;
    }

    const width = Math.abs(x - drawStartPos.x);
    const height = Math.abs(y - drawStartPos.y);
    const newX = Math.min(x, drawStartPos.x);
    const newY = Math.min(y, drawStartPos.y);

    const updatedPreview = previewElement.update({
      x: newX,
      y: newY,
      width: width,
      height: height
    });

    setPreviewElement(updatedPreview);
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !previewElement) return;

    const stage = e.target.getStage();
    if (!stage) {
       setIsDrawing(false);
       setPreviewElement(null);
       return;
    }

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) {
       setIsDrawing(false);
       setPreviewElement(null);
       setIsClosingPath(false);
       return;
    }

    const { x, y } = getStagePos(stage, pointerPosition);
    
    let finalElement = previewElement;

    if (activeTool === 'pen') {
       // Pen drawing is not finished on mouse up (unless we implement click-drag-release logic, 
       // but here we are doing click-click logic).
       return;
    }

    if (activeTool === 'pencil') {
       const drawEl = previewElement as DrawElementModel;
       const points = drawEl.points || [];
       if (points.length < 4) { // Need at least 2 points
           setIsDrawing(false);
           setPreviewElement(null);
           return;
       }
       
       // Normalize points
       let minX = Infinity;
       let minY = Infinity;
       let maxX = -Infinity;
       let maxY = -Infinity;
       
       for (let i = 0; i < points.length; i += 2) {
           const px = points[i];
           const py = points[i+1];
           minX = Math.min(minX, px);
           minY = Math.min(minY, py);
           maxX = Math.max(maxX, px);
           maxY = Math.max(maxY, py);
       }
       
       const width = maxX - minX;
       const height = maxY - minY;
       
       const newPoints = points.map((val, i) => {
           return i % 2 === 0 ? val - minX : val - minY;
       });
       
       finalElement = drawEl.update({
           x: minX,
           y: minY,
           width: Math.max(width, 1),
           height: Math.max(height, 1),
           points: newPoints
       });
    } else {
        // Calculate diagonal distance
        const dx = x - drawStartPos.x;
        const dy = y - drawStartPos.y;
        const diagonal = Math.sqrt(dx * dx + dy * dy);

        // Threshold for click vs drag (e.g. 10 pixels)
        if (diagonal < 10) {
           // If it's a click on empty area and we are in a drawing mode, 
           // reset to select tool instead of creating a default element.
           if (activeTool !== 'select') {
              setIsDrawing(false);
              setPreviewElement(null);
              setIsClosingPath(false);
              onToolChange?.('select');
              return;
           }
        }
    }

    addElement(finalElement);
    selectElement(finalElement.id);
    onToolUsed();
    
    setIsDrawing(false);
    setPreviewElement(null);
    setIsClosingPath(false);
  };

  const handleElementChange = (id: string, newAttrs: any) => {
    updateElement(id, newAttrs);
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={stagePos.x}
      y={stagePos.y}
      draggable={activeTool === 'hand'}
      onDragStart={() => {
        if (activeTool === 'hand') {
          if (stageRef.current) stageRef.current.container().style.cursor = 'grabbing';
          onDragStart?.();
        }
      }}
      onDragEnd={(e) => {
        if (activeTool === 'hand') {
          if (stageRef.current) stageRef.current.container().style.cursor = 'grab';
          onStagePosChange?.({ x: e.target.x(), y: e.target.y() });
          onDragEnd?.();
        }
      }}
      onMouseDown={handleStageMouseDown}
      onTouchStart={handleStageMouseDown as any}
      onMouseMove={handleStageMouseMove}
      onTouchMove={handleStageMouseMove as any}
      onMouseUp={handleStageMouseUp}
      onTouchEnd={handleStageMouseUp as any}
      onDblClick={handleStageDblClick}
      className="bg-[#fafafa]"
    >
      <Layer>
        {[...elements, ...(previewElement ? [previewElement] : [])].map((el) => {
          if (!el.visible) return null;
          
          const commonProps = {
            id: el.id,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
            isSelected: selectedId === el.id,
            onSelect: () => activeTool === 'select' && selectElement(el.id),
            onChange: (attrs: any) => handleElementChange(el.id, attrs),
            onDragStart: onDragStart,
            onDragEnd: onDragEnd,
            draggable: activeTool === 'select',
            isEditing: el.isEditing,
          };

          if (el.type === 'image') {
            return (
              <ImageElement
                key={el.id}
                {...commonProps}
                src={(el as ImageElementModel).src}
              />
            );
          } else if (el.type === 'text') {
             return (
               <TextElement
                  key={el.id}
                  {...commonProps}
                  text={(el as TextElementModel).text}
                  fontSize={(el as TextElementModel).fontSize}
                  fontFamily={(el as TextElementModel).fontFamily}
                  fill={(el as TextElementModel).textColor}
               />
             );
          } else if (['chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text'].includes(el.type)) {
             // Shape Text Elements
             const shapeTextProps = {
                ...commonProps,
                color: (el as TextShapeElementModel).color,
                stroke: (el as TextShapeElementModel).stroke,
                strokeWidth: (el as TextShapeElementModel).strokeWidth,
                strokeStyle: (el as TextShapeElementModel).strokeStyle,
                cornerRadius: (el as TextShapeElementModel).cornerRadius,
                text: (el as TextShapeElementModel).text,
                fontSize: (el as TextShapeElementModel).fontSize,
                fontFamily: (el as TextShapeElementModel).fontFamily,
                textColor: (el as TextShapeElementModel).textColor,
                textStroke: (el as TextShapeElementModel).textStroke,
                textStrokeWidth: (el as TextShapeElementModel).textStrokeWidth,
                fontStyle: (el as TextShapeElementModel).fontStyle,
                align: (el as TextShapeElementModel).align,
                lineHeight: (el as TextShapeElementModel).lineHeight,
                letterSpacing: (el as TextShapeElementModel).letterSpacing,
                textDecoration: (el as TextShapeElementModel).textDecoration,
                textTransform: (el as TextShapeElementModel).textTransform,
             };

             switch (el.type) {
               case 'rectangle-text':
                 return <TextRectangleElement key={el.id} {...shapeTextProps} />;
               case 'circle-text':
                 return <TextCircleElement key={el.id} {...shapeTextProps} />;
               case 'chat-bubble':
                 return <TextChatBubbleElement key={el.id} {...shapeTextProps} />;
               case 'arrow-left':
                 return <TextArrowLeftElement key={el.id} {...shapeTextProps} />;
               case 'arrow-right':
                 return <TextArrowRightElement key={el.id} {...shapeTextProps} />;
               default:
                 return null;
             }
          } else if (el.type === 'pencil') {
             return (
               <PencilElement 
                 key={el.id}
                 {...commonProps}
                 points={(el as DrawElementModel).points}
                 stroke={(el as DrawElementModel).stroke}
                 strokeWidth={(el as DrawElementModel).strokeWidth}
                 fill={(el as DrawElementModel).fill}
               />
             );
          } else if (el.type === 'pen') {
             return (
               <PenElement 
                 key={el.id}
                 {...commonProps}
                 // If it is the preview element, treat it as selected so nodes are shown
                 isSelected={commonProps.isSelected || el.id === previewElement?.id}
                 points={(el as DrawElementModel).points}
                 stroke={(el as DrawElementModel).stroke}
                 strokeWidth={(el as DrawElementModel).strokeWidth}
                 fill={(el as DrawElementModel).fill}
               />
             );
          } else if (['rectangle', 'circle', 'triangle', 'star'].includes(el.type)) {
            return (
              <ShapeElement
                key={el.id}
                {...commonProps}
                type={el.type}
                color={(el as ShapeElementModel).color}
                stroke={(el as ShapeElementModel).stroke}
                strokeWidth={(el as ShapeElementModel).strokeWidth}
                strokeStyle={(el as ShapeElementModel).strokeStyle}
                cornerRadius={(el as ShapeElementModel).cornerRadius}
                sides={(el as ShapeElementModel).sides}
                starInnerRadius={(el as ShapeElementModel).starInnerRadius}
              />
            );
          }
          return null;
        })}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
        
        {/* Draw start point indicator for closing path */}
        {isClosingPath && activeTool === 'pen' && isDrawing && previewElement && (
           <Circle 
             x={(previewElement as DrawElementModel).points?.[0] || 0}
             y={(previewElement as DrawElementModel).points?.[1] || 0}
             radius={8}
             stroke="#3b82f6"
             strokeWidth={2}
             fill="transparent"
           />
        )}
      </Layer>
    </Stage>
  );
}
