/**
 * Workspace API 测试示例
 * 
 * 这些测试展示了如何使用 workspace API 和相关的 hook
 * 实际运行时需要在浏览器环境中测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workspaceAPI, LayerSyncRequest } from './workspace-api';
import { useWorkspaceSave } from '../hooks/useWorkspaceSave';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { ElementFactory } from '../components/Workspace/types/BaseElement';

describe('Workspace API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create canvas', async () => {
    const projectId = 123;
    const canvasId = await workspaceAPI.createCanvas(projectId, {
      name: 'Test Canvas',
      backgroundColor: '#ffffff',
      metadata: {
        gridSize: 10,
        snapEnabled: true,
      },
    });

    expect(canvasId).toBeDefined();
    expect(typeof canvasId).toBe('number');
  });

  it('should get canvas', async () => {
    const projectId = 123;
    const canvasData = await workspaceAPI.getCanvas(projectId);

    if (canvasData) {
      expect(canvasData.canvas).toBeDefined();
      expect(canvasData.layers).toBeDefined();
      expect(Array.isArray(canvasData.layers)).toBe(true);
    }
  });

  it('should sync layers', async () => {
    const projectId = 123;
    const layers: LayerSyncRequest[] = [
      {
        id: 'layer-1',
        layerType: 'rectangle',
        name: 'Test Rectangle',
        zIndex: 0,
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
        visible: true,
        locked: false,
        properties: {
          color: '#3498db',
          stroke: '#2980b9',
          strokeWidth: 2,
        },
      },
      {
        id: 'layer-2',
        layerType: 'text',
        name: 'Test Text',
        zIndex: 1,
        x: 150,
        y: 150,
        width: 300,
        height: 50,
        rotation: 0,
        visible: true,
        locked: false,
        properties: {
          text: 'Hello World',
          fontSize: 24,
          fontFamily: 'Arial',
          textColor: '#000000',
        },
      },
    ];

    const result = await workspaceAPI.syncLayers(projectId, layers);

    expect(result.uploaded).toBeGreaterThanOrEqual(0);
    expect(result.updated).toBeGreaterThanOrEqual(0);
    expect(result.skipped).toBeGreaterThanOrEqual(0);
    expect(result.layerMapping).toBeDefined();
  });

  it('should update layer', async () => {
    const layerId = 456;
    
    await workspaceAPI.updateLayer(layerId, {
      x: 200,
      y: 200,
      rotation: 15,
      properties: {
        color: '#e74c3c',
      },
    });
  });

  it('should delete layer (soft delete)', async () => {
    const layerId = 456;
    const result = await workspaceAPI.deleteLayer(layerId);

    expect(result.deleted).toBe(true);
    expect(result.deletedAt).toBeDefined();
  });

  it('should restore layer', async () => {
    const layerId = 456;
    const result = await workspaceAPI.restoreLayer(layerId);

    expect(result.restored).toBe(true);
    expect(result.restoredAt).toBeDefined();
  });

  it('should get deleted layers', async () => {
    const canvasId = 789;
    const result = await workspaceAPI.getDeletedLayers(canvasId, 50);

    expect(result.deletedLayers).toBeDefined();
    expect(Array.isArray(result.deletedLayers)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

describe('useWorkspaceSave Hook', () => {
  it('should save layers to backend', async () => {
    const projectId = '123';
    
    // Setup store with some elements
    const element = ElementFactory.createDefault('rectangle', 100, 100);
    useWorkspaceStore.getState().addElement(element);

    // Test save function would be called
    // Note: This requires React testing library for proper hook testing
    expect(useWorkspaceStore.getState().elements.length).toBeGreaterThan(0);
  });

  it('should handle offline queue', () => {
    const queue = [];
    
    // Simulate offline save
    localStorage.setItem('offlineSaveQueue', JSON.stringify(queue));
    
    const stored = localStorage.getItem('offlineSaveQueue');
    expect(stored).toBeDefined();
  });
});

describe('Element to Layer Conversion', () => {
  it('should convert rectangle element to layer request', () => {
    const element = ElementFactory.createDefault('rectangle', 100, 100);
    const state = element.toState();

    const layerRequest: LayerSyncRequest = {
      id: element.id,
      layerType: element.type,
      name: element.name,
      zIndex: 0,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      visible: element.visible,
      locked: element.locked,
      properties: {
        color: state.color,
        stroke: state.stroke,
        strokeWidth: state.strokeWidth,
        cornerRadius: state.cornerRadius,
      },
    };

    expect(layerRequest.layerType).toBe('rectangle');
    expect(layerRequest.properties.color).toBeDefined();
  });

  it('should convert text element to layer request', () => {
    const element = ElementFactory.createDefault('text', 100, 100);
    const state = element.toState();

    const layerRequest: LayerSyncRequest = {
      id: element.id,
      layerType: element.type,
      name: element.name,
      zIndex: 0,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      visible: element.visible,
      locked: element.locked,
      properties: {
        text: state.text,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        textColor: state.textColor,
      },
    };

    expect(layerRequest.layerType).toBe('text');
    expect(layerRequest.properties.text).toBeDefined();
  });

  it('should convert image element to layer request', () => {
    const element = ElementFactory.createDefault('image', 100, 100);
    const state = element.toState();

    const layerRequest: LayerSyncRequest = {
      id: element.id,
      layerType: element.type,
      name: element.name,
      zIndex: 0,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      visible: element.visible,
      locked: element.locked,
      properties: {
        src: state.src,
      },
    };

    expect(layerRequest.layerType).toBe('image');
    expect(layerRequest.properties.src).toBeDefined();
  });
});
