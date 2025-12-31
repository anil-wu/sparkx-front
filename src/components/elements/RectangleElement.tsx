import React from 'react';
import { Rect } from 'react-konva';
import { BaseElement } from './BaseElement';
import { ShapeElementProps } from './ShapeElement';

export default function RectangleElement(props: ShapeElementProps) {
  const { width, height, color = '#3b82f6', stroke, strokeWidth, strokeStyle, cornerRadius, children } = props;

  const getDash = () => {
    switch (strokeStyle) {
      case 'dashed': return [10, 5];
      case 'dotted': return [2, 2];
      default: return undefined;
    }
  };

  return (
    <BaseElement {...props}>
      <Rect
        width={width}
        height={height}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        dash={getDash()}
        cornerRadius={cornerRadius || 0}
      />
      {children}
    </BaseElement>
  );
}
