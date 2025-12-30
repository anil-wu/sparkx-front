import React from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

interface ImageItemProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ImageItem({
  id,
  x,
  y,
  width,
  height,
  rotation,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
}: ImageItemProps) {
  // Use a local placeholder image to avoid network issues
  const imageUrl = '/role.png';

  const [img] = useImage(imageUrl, 'anonymous');

  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      onClick={onSelect}
      onTap={onSelect}
      draggable
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
          width: width,
          height: height,
          rotation: e.target.rotation(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        node.scaleX(1);
        node.scaleY(1);
        
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
        onDragEnd?.();
      }}
    >
      <KonvaImage
        image={img}
        width={width}
        height={height}
        alt="Character"
      />
    </Group>
  );
}
