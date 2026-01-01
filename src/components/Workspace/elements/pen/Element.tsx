import React from 'react';
import { Line } from 'react-konva';
import { BaseElement } from '../BaseElement';
import { BaseElementProps } from '../../types/ElementProps';

export interface DrawElementProps extends BaseElementProps {
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  tension?: number;
}

export default function PenElement(props: DrawElementProps) {
  const { 
    points = [], 
    stroke = '#000000', 
    strokeWidth = 2, 
    // tension is ignored for pen
    width,
    height 
  } = props;

  // points are relative to the group (which is at x, y)
  // If we normalize points, we don't need to do anything special here.
  
  return (
    <BaseElement {...props}>
      <Line
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={1}
        lineCap="round"
        lineJoin="round"
        // Ensure hit detection works well
        hitStrokeWidth={Math.max(strokeWidth, 10)}
      />
    </BaseElement>
  );
}
