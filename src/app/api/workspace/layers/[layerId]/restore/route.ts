import { NextRequest, NextResponse } from 'next/server';
import { getSparkxApiBaseUrl, fetchSparkxJson } from '@/lib/sparkx-api';

interface LayerRestoreResponse {
  restored: boolean;
  restoredAt: string;
}

// POST /api/workspace/layers/:layerId/restore
export async function POST(
  request: NextRequest,
  { params }: { params: { layerId: string } }
) {
  try {
    const layerId = params.layerId;

    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<LayerRestoreResponse>(
      `${baseUrl}/api/v1/layers/${layerId}/restore`,
      { method: 'POST' }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error restoring layer:', error);
    return NextResponse.json(
      { error: 'Failed to restore layer' },
      { status: 500 }
    );
  }
}
