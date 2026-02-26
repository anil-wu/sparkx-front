"use client";

import { createOpencodeClient } from "@opencode-ai/sdk";
import { createOpencodeClient as createOpencodeClientV2 } from "@opencode-ai/sdk/v2/client";

export const opencodeClient = createOpencodeClient({
  baseUrl: "http://localhost:4096",
});

export const opencodeClientV2 = createOpencodeClientV2({
  baseUrl: "http://localhost:4096",
});

