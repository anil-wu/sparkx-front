import { NextRequest, NextResponse } from 'next/server';
import { getSparkxApiBaseUrl, fetchSparkxJson } from '@/lib/sparkx-api';

interface LayerUpdateRequest {
  name?: string;
  zIndex?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  properties?: Record<string, any>;
}

interface LayerDeleteResponse {
  deleted: boolean;
  deletedAt: string;
}

interface LayerRestoreResponse {
  restored: boolean;
  restoredAt: string;
}

// PUT /api/workspace/layers/:layerId
export async function PUT(
  request: NextRequest,
  { params }: { params: { layerId: string } }
) {
  try {
    const layerId = params.layerId;
    const body = await request.json();
    const updates: LayerUpdateRequest = body;

    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<any>(
      `${baseUrl}/api/v1/layers/${layerId}`,
      { method: 'PUT', body: JSON.stringify(updates) }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating layer:', error);
    return NextResponse.json(
      { error: 'Failed to update layer' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspace/layers/:layerId
export async function DELETE(
  request: NextRequest,
  { params }: { params: { layerId: string } }
) {
  try {
    const layerId = params.layerId;

    const baseUrl = getSparkxApiBaseUrl();
    const result = await fetchSparkxJson<LayerDeleteResponse>(
      `${baseUrl}/api/v1/layers/${layerId}`,
      { method: 'DELETE' }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error deleting layer:', error);
    return NextResponse.json(
      { error: 'Failed to delete layer' },
      { status: 500 }
    );
  }
}
