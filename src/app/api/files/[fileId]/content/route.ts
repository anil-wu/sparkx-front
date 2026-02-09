import { type NextRequest, NextResponse } from "next/server";

import { getSparkxApiBaseUrl } from "@/lib/sparkx-api";
import { getSparkxSessionFromHeaders } from "@/lib/sparkx-session";

const unauthorizedResponse = () =>
  NextResponse.json({ message: "Unauthorized" }, { status: 401 });

const parseFileId = (raw: string): number | null => {
  const numeric = Number.parseInt(raw, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
};

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } },
) {
  const session = getSparkxSessionFromHeaders(request.headers);
  if (!session) return unauthorizedResponse();

  const fileId = parseFileId(params.fileId);
  if (!fileId) {
    return NextResponse.json({ message: "Invalid file id" }, { status: 400 });
  }

  const upstream = await fetch(
    `${getSparkxApiBaseUrl()}/api/v1/files/${fileId}/content`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const message = await upstream.text();
    return NextResponse.json(
      { message: message || "Failed to fetch file content" },
      { status: upstream.status },
    );
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const cacheControl = upstream.headers.get("cache-control") || "private, max-age=3600";
  const arrayBuffer = await upstream.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}
