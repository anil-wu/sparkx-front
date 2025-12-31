import React from 'react';
import { BaseElementProps } from './BaseElement';
import { ToolType } from '../ToolsPanel';
import RectangleElement from './RectangleElement';
import CircleElement from './CircleElement';
import TriangleElement from './TriangleElement';
import StarElement from './StarElement';

export interface ShapeElementProps extends BaseElementProps {
  type: ToolType;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  sides?: number;
  starInnerRadius?: number;
}

export default function ShapeElement(props: ShapeElementProps) {
  const { type } = props;

  switch (type) {
    case 'rectangle':
      return <RectangleElement {...props} />;
    case 'circle':
      return <CircleElement {...props} />;
    case 'triangle':
      return <TriangleElement {...props} />;
    case 'star':
      return <StarElement {...props} />;
    default:
      return <RectangleElement {...props} />;
  }
}

