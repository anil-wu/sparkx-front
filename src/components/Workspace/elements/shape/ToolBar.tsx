"use client";

import React from 'react';
import { BaseElement } from '../../types/BaseElement';
import RectangleToolbar from '../rectangle/ToolBar';
import CircleToolbar from '../circle/ToolBar';
import TriangleToolbar from '../triangle/ToolBar';
import StarToolbar from '../star/ToolBar';
import ChatBubbleToolbar from '../chat-bubble/ToolBar';
import ArrowToolbar from '../arrow/ToolBar';
import TextRectangleToolbar from '../text-rectangle/ToolBar';
import TextCircleToolbar from '../text-circle/ToolBar';

interface ShapeToolbarProps {
  element: BaseElement;
  onUpdate: (updates: Partial<any>) => void;
  onDownload?: () => void;
}

export default function ShapeToolbar(props: ShapeToolbarProps) {
  const { element } = props;

  switch (element.type) {
    case 'rectangle':
      return <RectangleToolbar {...props} />;
    case 'circle':
      return <CircleToolbar {...props} />;
    case 'triangle':
      return <TriangleToolbar {...props} />;
    case 'star':
      return <StarToolbar {...props} />;
    case 'chat-bubble':
      return <ChatBubbleToolbar {...props} />;
    case 'arrow-left':
    case 'arrow-right':
      return <ArrowToolbar {...props} />;
    case 'rectangle-text':
      return <TextRectangleToolbar {...props} />;
    case 'circle-text':
      return <TextCircleToolbar {...props} />;
    default:
      return <RectangleToolbar {...props} />;
  }
}
