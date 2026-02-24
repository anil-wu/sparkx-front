import { create } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import { BaseElement, ElementFactory } from '../components/Workspace/types/BaseElement';
import { ToolType } from '../components/Workspace/types/ToolType';
import { ElementState } from '../components/Workspace/types/ElementState';
import { Guideline } from '../components/Workspace/types/Guideline';
import { mergeElements } from '../components/Workspace/editor/utils/mergeUtils';
import { fileAPI } from '@/lib/file-api';

interface WorkspaceState {
  elements: BaseElement<any>[];
  selectedId: string | null;
  selectedIds: string[];
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  isSelecting: boolean;
  isMerging: boolean;
  activeTool: ToolType;
  guidelines: Guideline[];
  
  // 多选拖动相关
  isDraggingSelection: boolean;
  shouldSuppressContextMenu: boolean;
  dragStartPos: { x: number; y: number } | null;
  selectionBoundingBox: { x: number; y: number; width: number; height: number } | null;
  dragInitialPositions: Map<string, { x: number; y: number }> | null;
  
  // Actions
  setElements: (elements: BaseElement<any>[]) => void;
  selectElement: (id: string | null) => void;
  selectElements: (ids: string[]) => void;
  addSelectedId: (id: string) => void;
  removeSelectedId: (id: string) => void;
  clearSelection: () => void;
  setActiveTool: (tool: ToolType) => void;
  setGuidelines: (guidelines: Guideline[]) => void;
  setSelectionBox: (box: { x: number; y: number; width: number; height: number } | null) => void;
  setIsSelecting: (isSelecting: boolean) => void;
  setIsMerging: (isMerging: boolean) => void;
  setIsDraggingSelection: (isDragging: boolean) => void;
  setShouldSuppressContextMenu: (suppress: boolean) => void;
  setDragStartPos: (pos: { x: number; y: number } | null) => void;
  setSelectionBoundingBox: (box: { x: number; y: number; width: number; height: number } | null) => void;
  setDragInitialPositions: (positions: Map<string, { x: number; y: number }> | null) => void;
  updateSelectionBoundingBox: () => void;
  addElement: (element: BaseElement<any>) => void;
  updateElement: (id: string, updates: Partial<ElementState>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  mergeSelectedElements: (projectId: number) => Promise<void>;
  dragSelectedElements: (deltaX: number, deltaY: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  temporal(
    (set, get) => {
      let initialElements: BaseElement<any>[] = [];
      try {
        if (typeof ElementFactory !== 'undefined') {
          initialElements = [ElementFactory.createDefault('image', 100, 100, 'initial-img')];
        } else {
          console.warn('ElementFactory is undefined during store initialization');
        }
      } catch (error) {
        console.error('Failed to create default elements:', error);
      }

      return {
        elements: initialElements,
        selectedId: null,
        selectedIds: [],
        selectionBox: null,
        isSelecting: false,
        isMerging: false,
        activeTool: 'select',
        guidelines: [],
        isDraggingSelection: false,
        shouldSuppressContextMenu: false,
        dragStartPos: null,
        selectionBoundingBox: null,
        dragInitialPositions: null,

        setElements: (elements) => set({ elements }),
        
        selectElement: (id) => set({ selectedId: id }),
        
        selectElements: (ids) => set({ selectedIds: ids }),
        
        addSelectedId: (id) => set((state) => ({
          selectedIds: state.selectedIds.includes(id) 
            ? state.selectedIds 
            : [...state.selectedIds, id]
        })),
        
        removeSelectedId: (id) => set((state) => ({
          selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
        })),
        
        clearSelection: () => set({ selectedId: null, selectedIds: [], selectionBoundingBox: null }),
        
        setActiveTool: (tool) => set({ activeTool: tool }),

        setGuidelines: (guidelines: Guideline[]) => set({ guidelines }),
        
        setSelectionBox: (box) => set({ selectionBox: box }),
        
        setIsSelecting: (isSelecting) => set({ isSelecting }),
        
        setIsMerging: (isMerging) => set({ isMerging }),
        
        setIsDraggingSelection: (isDragging) => set({ isDraggingSelection: isDragging }),
        
        setShouldSuppressContextMenu: (suppress) => set({ shouldSuppressContextMenu: suppress }),

        setDragStartPos: (pos) => set({ dragStartPos: pos }),

        setSelectionBoundingBox: (box) => set({ selectionBoundingBox: box }),

        setDragInitialPositions: (positions) => set({ dragInitialPositions: positions }),
        
        updateSelectionBoundingBox: () => set((state) => {
          const allSelectedIds = [...state.selectedIds];
          if (state.selectedId && !allSelectedIds.includes(state.selectedId)) {
            allSelectedIds.push(state.selectedId);
          }
          
          if (allSelectedIds.length === 0) {
            return { selectionBoundingBox: null };
          }
          
          const selectedElements = state.elements.filter(el => allSelectedIds.includes(el.id));
          if (selectedElements.length === 0) {
            return { selectionBoundingBox: null };
          }
          
          // 计算包围盒
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          selectedElements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
          });
          
          return {
            selectionBoundingBox: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            }
          };
        }),
        
        dragSelectedElements: (deltaX, deltaY) => set((state) => {
          const allSelectedIds = [...state.selectedIds];
          if (state.selectedId && !allSelectedIds.includes(state.selectedId)) {
            allSelectedIds.push(state.selectedId);
          }

          if (allSelectedIds.length === 0 || !state.dragInitialPositions) {
            return {};
          }

          // 使用初始位置 + 增量来计算新位置，避免累加误差
          return {
            elements: state.elements.map(el => {
              if (allSelectedIds.includes(el.id)) {
                const initialPos = state.dragInitialPositions!.get(el.id);
                if (initialPos) {
                  return el.update({ x: initialPos.x + deltaX, y: initialPos.y + deltaY });
                }
              }
              return el;
            })
          };
        }),
        
        addElement: (element) => set((state) => ({ 
          elements: [...state.elements, element] 
        })),
        
        updateElement: (id, updates) => set((state) => ({
          elements: state.elements.map((el) => 
            el.id === id ? el.update(updates) : el
          )
        })),

        removeElement: (id) => set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          selectedIds: state.selectedIds.filter(selectedId => selectedId !== id)
        })),

        duplicateElement: (id: string) => set((state) => {
          const element = state.elements.find((el) => el.id === id);
          if (!element) return {};

          const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          const newElement = element.clone().update({
            id: newId,
            x: element.x + 20,
            y: element.y + 20,
            name: `${element.name} (Copy)`
          } as any);

          return {
            elements: [...state.elements, newElement],
            selectedId: newId
          };
        }),
        
        mergeSelectedElements: async (projectId: number) => {
          const { elements, selectedIds, selectedId, setElements, selectElement, setIsMerging } = get();
          
          // 收集所有要合并的元素 ID（包括 selectedIds 和 selectedId）
          const allSelectedIds = [...selectedIds];
          if (selectedId && !allSelectedIds.includes(selectedId)) {
            allSelectedIds.push(selectedId);
          }
          
          if (allSelectedIds.length < 2) {
            console.warn('至少需要选择两个元素');
            return;
          }
          
          setIsMerging(true);
          
          try {
            // 1. 获取所有选中的元素
            const selectedElements = elements.filter(el => allSelectedIds.includes(el.id));
            
            if (selectedElements.length < 2) {
              throw new Error('至少需要选择两个元素进行合并');
            }
            
            // 2. 合并元素（生成图片和 Blob）
            const result = await mergeElements(elements, allSelectedIds);
            
            if (!result || !result.canvasBlob) {
              throw new Error('合并失败');
            }
            
            // 3. 计算文件哈希
            const hash = await fileAPI.calculateHash(result.canvasBlob);
            
            // 4. 预上传，获取 OSS 上传 URL
            const fileName = `merged_${Date.now()}.png`;
            const preUploadResp = await fileAPI.preUpload(
              projectId,
              fileName,
              'image',
              'png',
              result.canvasBlob.size,
              hash
            );
            
            if (!preUploadResp) {
              throw new Error('预上传失败');
            }
            
            // 5. 上传到 OSS
            const uploadSuccess = await fileAPI.uploadToOSS(
              preUploadResp.uploadUrl,
              result.canvasBlob,
              preUploadResp.contentType
            );
            
            if (!uploadSuccess) {
              throw new Error('OSS 上传失败');
            }
            
            // 6. 创建最终的图片元素（使用后端下载 URL）
            const downloadUrl = fileAPI.getDownloadUrl(preUploadResp.fileId);
            const finalElement = result.mergedElement.update({
              src: downloadUrl,
            } as any);
            
            // 7. 更新元素列表：删除原元素，添加新元素
            const newElements = [
              ...elements.filter(el => !allSelectedIds.includes(el.id)),
              finalElement,
            ];
            
            setElements(newElements);
            
            // 8. 选中新元素
            selectElement(finalElement.id);
            
          } catch (error) {
            console.error('合并失败:', error);
            throw error;
          } finally {
            setIsMerging(false);
          }
        },
      };
    },
    {
      // Configuration for zundo
      limit: 100, // Limit history depth
      partialize: (state) => ({ 
        elements: state.elements,
        selectedId: state.selectedId,
        selectedIds: state.selectedIds
      }), // Only track elements and selection history
      equality: (a, b) => {
          return a.elements === b.elements;
      }
    }
  )
);
