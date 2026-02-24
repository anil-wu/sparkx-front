import Konva from 'konva';
import { BaseElement, ImageElement, ShapeElement, TextElement, DrawElement, TextShapeElement } from '../../types/BaseElement';

export interface MergeResult {
  mergedElement: ImageElement;
  thumbnailSrc: string;
  canvasBlob: Blob | null;
  originalElementsCount: number;
}

/**
 * 合并多个元素为一张图片
 * @param elements 所有元素列表
 * @param selectedIds 选中的元素 ID 列表
 * @returns 合并结果
 */
export async function mergeElements(
  elements: BaseElement<any>[],
  selectedIds: string[]
): Promise<MergeResult | null> {
  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  
  if (selectedElements.length < 2) {
    return null;
  }
  
  // 1. 计算包围盒
  const boundingBox = calculateBoundingBox(selectedElements);
  
  // 2. 创建临时 Konva stage (需要 container 避免报错)
  const container = document.createElement('div');
  const stage = new Konva.Stage({
    container: container,
    width: boundingBox.width,
    height: boundingBox.height,
  });
  
  const layer = new Konva.Layer();
  stage.add(layer);
  
  // 3. 将所有选中的元素添加到临时 layer
  // 注意：如果是图片元素，需要确保图片已加载
  const nodePromises = selectedElements.map(el => createKonvaNode(el, boundingBox));
  const nodes = await Promise.all(nodePromises);
  
  nodes.forEach(node => {
    if (node) {
      layer.add(node);
    }
  });
  
  // 4. 渲染
  layer.draw();
  
  // 5. 获取 DataURL（用于预览和临时显示）
  const scale = 2;
  const dataURL = stage.toDataURL({ pixelRatio: scale });
  
  // 6. 转换为 Blob（用于上传）
  const canvasBlob = await new Promise<Blob | null>((resolve) => {
    const canvas = stage.toCanvas({ pixelRatio: scale });
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
  
  // 7. 销毁临时 stage
  stage.destroy();
  
  // 8. 创建合并后的图片元素
  const mergedElement = new ImageElement({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    type: 'image',
    name: `Merged (${selectedElements.length} layers)`,
    x: boundingBox.x,
    y: boundingBox.y,
    width: boundingBox.width,
    height: boundingBox.height,
    rotation: 0,
    visible: true,
    locked: false,
    isEditing: false,
    src: dataURL,  // 临时使用 base64，上传后会更新为后端 URL
  });
  
  return {
    mergedElement,
    thumbnailSrc: dataURL,
    canvasBlob,
    originalElementsCount: selectedElements.length,
  };
}

/**
 * 计算多个元素的包围盒
 */
export function calculateBoundingBox(elements: BaseElement<any>[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  elements.forEach(el => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 根据元素类型创建对应的 Konva 节点
 */
async function createKonvaNode(el: BaseElement<any>, boundingBox: { x: number; y: number }): Promise<Konva.Node | null> {
  // 计算相对坐标
  const x = el.x - boundingBox.x;
  const y = el.y - boundingBox.y;
  
  switch (el.type) {
    case 'rectangle': {
      const shapeEl = el as ShapeElement;
      return new Konva.Rect({
        x,
        y,
        width: el.width,
        height: el.height,
        fill: shapeEl.color,
        stroke: shapeEl.stroke,
        strokeWidth: shapeEl.strokeWidth,
        cornerRadius: shapeEl.cornerRadius,
        rotation: el.rotation,
      });
    }
    
    case 'circle': {
      const shapeEl = el as ShapeElement;
      return new Konva.Ellipse({
        x: x + el.width / 2,
        y: y + el.height / 2,
        radiusX: el.width / 2,
        radiusY: el.height / 2,
        fill: shapeEl.color,
        stroke: shapeEl.stroke,
        strokeWidth: shapeEl.strokeWidth,
        rotation: el.rotation,
      });
    }
    
    case 'triangle': {
      const shapeEl = el as ShapeElement;
      // 使用 Shape 绘制三角形
      const triangle = new Konva.Shape({
        x: x + el.width / 2,
        y: y + el.height / 2,
        fill: shapeEl.color,
        stroke: shapeEl.stroke,
        strokeWidth: shapeEl.strokeWidth,
        rotation: el.rotation,
        sceneFunc: (context, shape) => {
          context.beginPath();
          context.moveTo(0, -el.height / 2);
          context.lineTo(el.width / 2, el.height / 2);
          context.lineTo(-el.width / 2, el.height / 2);
          context.closePath();
          context.fillStrokeShape(shape);
        },
      });
      return triangle;
    }
    
    case 'star': {
      const shapeEl = el as ShapeElement;
      const sides = shapeEl.sides || 5;
      const outerRadius = Math.max(el.width, el.height) / 2;
      const innerRadius = shapeEl.starInnerRadius || outerRadius * 0.5;
      
      const star = new Konva.Star({
        x: x + el.width / 2,
        y: y + el.height / 2,
        numPoints: sides,
        innerRadius,
        outerRadius,
        fill: shapeEl.color,
        stroke: shapeEl.stroke,
        strokeWidth: shapeEl.strokeWidth,
        rotation: el.rotation,
      });
      return star;
    }
    
    case 'text': {
      const textEl = el as TextElement;
      return new Konva.Text({
        x,
        y,
        width: el.width,
        height: el.height,
        text: textEl.text,
        fontSize: textEl.fontSize,
        fontFamily: textEl.fontFamily,
        fill: textEl.textColor,
        fontStyle: textEl.fontStyle,
        align: textEl.align,
        rotation: el.rotation,
      });
    }
    
    case 'image': {
      const imageEl = el as ImageElement;
      
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous'; // 避免画布污染
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = imageEl.src;
      });
      
      return new Konva.Image({
        x,
        y,
        width: el.width,
        height: el.height,
        image: img,
        rotation: el.rotation,
      });
    }
    
    case 'pen':
    case 'pencil': {
      const drawEl = el as DrawElement;
      const points = drawEl.points;
      
      if (!points || points.length < 2) {
        return null;
      }
      
      // 转换为相对坐标
      const relativePoints: number[] = [];
      for (let i = 0; i < points.length; i += 2) {
        relativePoints.push(points[i] - boundingBox.x);
        relativePoints.push(points[i + 1] - boundingBox.y);
      }
      
      const line = new Konva.Line({
        points: relativePoints,
        stroke: drawEl.stroke,
        strokeWidth: drawEl.strokeWidth,
        fill: drawEl.fill,
        lineCap: 'round',
        lineJoin: 'round',
        tension: 0.5,
        rotation: el.rotation,
      });
      
      return line;
    }
    
    case 'chat-bubble':
    case 'arrow-left':
    case 'arrow-right':
    case 'rectangle-text':
    case 'circle-text': {
      const textShapeEl = el as TextShapeElement;
      
      // 创建容器组
      const group = new Konva.Group({
        x: x,
        y: y,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
      });
      
      // 背景形状
      const bg = new Konva.Rect({
        width: el.width,
        height: el.height,
        fill: textShapeEl.color,
        stroke: textShapeEl.stroke,
        strokeWidth: textShapeEl.strokeWidth,
        cornerRadius: textShapeEl.cornerRadius,
      });
      
      // 文本
      const text = new Konva.Text({
        x: 5,
        y: 5,
        width: el.width - 10,
        height: el.height - 10,
        text: textShapeEl.text,
        fontSize: textShapeEl.fontSize,
        fontFamily: textShapeEl.fontFamily,
        fill: textShapeEl.textColor,
        fontStyle: textShapeEl.fontStyle,
        align: textShapeEl.align,
      });
      
      group.add(bg);
      group.add(text);
      
      return group;
    }
    
    default:
      console.warn('Unknown element type:', el.type);
      return null;
  }
}
