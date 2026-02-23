import { NextRequest, NextResponse } from 'next/server';
import { getSparkxApiBaseUrl, fetchSparkxJson } from '@/lib/sparkx-api';

interface LayerSyncRequest {
  id: string;
  layerType: string;
  name: string;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  properties: Record<string, any>;
}

interface LayerSyncResponse {
  uploaded: number;
  updated: number;
  skipped: number;
  layerMapping: Record<string, number>;
}

// POST /api/workspace/layers/sync?projectId=123
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
    const { layers }: { layers: LayerSyncRequest[] } = body;

    if (!layers || !Array.isArray(layers)) {
      return NextResponse.json(
        { error: 'layers array is required' },
        { status: 400 }
      );
    }

    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<LayerSyncResponse>(
      `${baseUrl}/api/v1/projects/${projectId}/layers/sync`,
      { method: 'POST', body: JSON.stringify({ layers }) }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error syncing layers:', error);
    return NextResponse.json(
      { error: 'Failed to sync layers' },
      { status: 500 }
    );
  }
}
