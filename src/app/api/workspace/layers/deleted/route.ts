import { NextRequest, NextResponse } from 'next/server';
import { getSparkxApiBaseUrl, fetchSparkxJson } from '@/lib/sparkx-api';

interface DeletedLayer {
  id: number;
  canvasId: number;
  layerType: string;
  name: string;
  deletedAt: string;
  deletedBy: number;
}

interface DeletedLayersResponse {
  deletedLayers: DeletedLayer[];
  total: number;
}

// GET /api/workspace/layers/deleted?canvasId=123&limit=50
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const canvasId = searchParams.get('canvasId');
    const limit = searchParams.get('limit') || '50';

    if (!canvasId) {
      return NextResponse.json(
        { error: 'canvasId is required' },
        { status: 400 }
      );
    }

    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<DeletedLayersResponse>(
      `${baseUrl}/api/v1/layers/deleted?canvasId=${canvasId}&limit=${limit}`,
      { method: 'GET' }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching deleted layers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deleted layers' },
      { status: 500 }
    );
  }
}
