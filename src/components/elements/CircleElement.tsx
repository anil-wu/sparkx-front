import React from 'react';
import { Ellipse } from 'react-konva';
import { BaseElement } from './BaseElement';
import { ShapeElementProps } from './ShapeElement';

export default function CircleElement(props: ShapeElementProps) {
  const { width, height, color = '#3b82f6', stroke, strokeWidth, strokeStyle, children } = props;

  const getDash = () => {
    switch (strokeStyle) {
      case 'dashed': return [10, 5];
      case 'dotted': return [2, 2];
      default: return undefined;
    }
  };

  return (
    <BaseElement {...props}>
      <Ellipse
        x={width / 2}
        y={height / 2}
        radiusX={width / 2}
        radiusY={height / 2}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        dash={getDash()}
      />
      {children}
    </BaseElement>
  );
}
