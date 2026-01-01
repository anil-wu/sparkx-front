import React, { useState, useRef, useEffect } from 'react';
import { Text as KonvaText } from 'react-konva';
import { BaseElement, BaseElementProps } from '../BaseElement';
import { Html } from 'react-konva-utils';

interface TextElementProps extends BaseElementProps {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  isEditing?: boolean;
  onEditEnd?: (newText: string) => void;
}

export default function TextElement(props: TextElementProps) {
  const { 
    text = 'Text', 
    fontSize = 20, 
    fontFamily = 'Arial', 
    fill = '#000000',
    isEditing = false,
    onEditEnd,
    width,
    height
  } = props;

  // We can use a textarea for editing
  // For now, let's just render text. Editing logic can be complex with Konva.
  // A simple approach is double click to prompt or overlay.
  
  // Since we are not implementing full inline editing with textarea right now in this turn unless requested,
  // we will stick to rendering.
  // BUT, to be "proactive", let's implement basic inline editing using Html overlay if we can,
  // or just use a simple prompt for now to ensure it works reliably.
  // Better yet, let's support double click to edit via parent handling.

  return (
    <BaseElement {...props}>
       <KonvaText
         text={text}
         fontSize={fontSize}
         fontFamily={fontFamily}
         fill={fill}
         width={width}
         // height={height} // Text height is usually auto unless we wrap
       />
    </BaseElement>
  );
}
