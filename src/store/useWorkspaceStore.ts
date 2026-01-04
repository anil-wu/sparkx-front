import { create } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import { BaseElement, ElementFactory } from '../components/workspace/types/BaseElement';
import { ToolType } from '../components/workspace/types/ToolType';
import { ElementState } from '../components/workspace/types/ElementState';
import { Guideline } from '../components/workspace/types/Guideline';

interface WorkspaceState {
  elements: BaseElement<any>[];
  selectedId: string | null;
  activeTool: ToolType;
  guidelines: Guideline[];
  
  // Actions
  setElements: (elements: BaseElement<any>[]) => void;
  selectElement: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setGuidelines: (guidelines: Guideline[]) => void;
  addElement: (element: BaseElement<any>) => void;
  updateElement: (id: string, updates: Partial<ElementState>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  temporal(
    (set) => {
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
        activeTool: 'select',
        guidelines: [],

        setElements: (elements) => set({ elements }),
        
        selectElement: (id) => set({ selectedId: id }),
        
        setActiveTool: (tool) => set({ activeTool: tool }),

        setGuidelines: (guidelines: Guideline[]) => set({ guidelines }),
        
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
          selectedId: state.selectedId === id ? null : state.selectedId
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
          } as any); // Type assertion needed because update expects Partial<T> but we are modifying ID which might be readonly in some contexts, though here it is in BaseElementState

          return {
            elements: [...state.elements, newElement],
            selectedId: newId
          };
        }),
      };
    },
    {
      // Configuration for zundo
      limit: 100, // Limit history depth
      partialize: (state) => ({ 
        elements: state.elements 
      }), // Only track elements history, ignore selection/tool changes
      equality: (a, b) => {
          return a.elements === b.elements;
      }
    }
  )
);
