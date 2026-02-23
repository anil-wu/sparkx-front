import { NextRequest, NextResponse } from 'next/server';
import { getSparkxApiBaseUrl, fetchSparkxJson } from '@/lib/sparkx-api';

interface CanvasData {
  id: number;
  projectId: number;
  name: string;
  backgroundColor: string;
  metadata?: {
    gridSize?: number;
    snapEnabled?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

interface LayerData {
  id: number;
  canvasId: number;
  layerType: string;
  name: string;
  zIndex: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  properties: Record<string, any>;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

interface CanvasResponse {
  canvas: CanvasData | null;
  layers: LayerData[];
}

// GET /api/workspace/canvas?projectId=123
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<CanvasResponse>(
      `${baseUrl}/api/v1/projects/${projectId}/canvas`,
      {
        method: 'GET',
      }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: result.status === 404 ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching canvas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canvas' },
      { status: 500 }
    );
  }
}

// POST /api/workspace/canvas
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<{ id: number }>(
      `${baseUrl}/api/v1/projects/${projectId}/canvas`,
      { method: 'POST', body: JSON.stringify(body) }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating canvas:', error);
    return NextResponse.json(
      { error: 'Failed to create canvas' },
      { status: 500 }
    );
  }
}
