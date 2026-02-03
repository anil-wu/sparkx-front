import React, { useRef } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { BaseElementProps } from '../../types/ElementProps';
import { ToolType } from '../../types/ToolType';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { calculateSnap } from '../utils/snapUtils';

export { type BaseElementProps };

/**
 * ElementWrapper handles common Konva element behaviors:
 * - Position (x, y)
 * - Rotation
 * - Selection handling (onClick/onTap)
 * - Dragging logic (onDragStart, onDragEnd)
 * - Transformation logic (via Transformer in parent, but this updates state)
 */
export const ElementWrapper: React.FC<BaseElementProps & { children?: React.ReactNode }> = ({
  id,
  type,
  x,
  y,
  width, // Passed for reference, but children often handle their own sizing visually
  height,
  rotation,
  locked,
  isSelected,
  isEditing,
  draggable = true,
  children,
  ...rest
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const { activeTool, selectElement, updateElement, setGuidelines } = useWorkspaceStore();

  const handleSelect = (e: Konva.KonvaEventObject<Event>) => {
    if (activeTool === 'select' && !locked) {
      selectElement(id);
      e.cancelBubble = true;
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (locked) return;
    setGuidelines([]);
    updateElement(id, {
      x: e.target.x(),
      y: e.target.y(),
      rotation: e.target.rotation(),
    });
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (locked) return;
    
    const layer = e.target.getLayer();
    if (!layer) return;

    const otherNodes = layer.getChildren().filter(node => {
      return node !== e.target && node.getClassName() === 'Group' && node.id();
    });

    const result = calculateSnap(e.target, otherNodes);

    if (result.x !== null) {
      e.target.x(result.x);
    }
    if (result.y !== null) {
      e.target.y(result.y);
    }

    setGuidelines(result.guidelines);
  };

  const handleDblClick = (e: Konva.KonvaEventObject<Event>) => {
    if (locked) return;
    const textEditableTypes: ToolType[] = ['text', 'chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text'];
    if (type && textEditableTypes.includes(type)) {
      updateElement(id, { isEditing: true });
    }
    e.cancelBubble = true;
  };

  return (
    <Group
      ref={groupRef}
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      draggable={draggable && activeTool === 'select' && !isEditing && !locked}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformEnd={(e) => {
        setGuidelines([]);
        // This is usually handled by the Transformer attached to the node, 
        // but if we wrap everything in a Group, the transformer attaches to the Group.
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale to 1 and adjust width/height
        node.scaleX(1);
        node.scaleY(1);
        
        const nextWidth = Math.max(5, node.width() * scaleX);
        const nextHeight = Math.max(5, node.height() * scaleY);
        const nextUpdates: any = {
          x: node.x(),
          y: node.y(),
          width: nextWidth,
          height: nextHeight,
          rotation: node.rotation(),
        };

        const currentFontSize = (rest as any).fontSize;
        const textLikeTypes: ToolType[] = ['text', 'chat-bubble', 'arrow-left', 'arrow-right', 'rectangle-text', 'circle-text'];
        if (textLikeTypes.includes(type as any) && typeof currentFontSize === 'number') {
          nextUpdates.fontSize = Math.max(5, Math.min(Math.round(currentFontSize * scaleY), 200));
        }

        updateElement(id, nextUpdates);
      }}
    >
      {children}
    </Group>
  );
};
