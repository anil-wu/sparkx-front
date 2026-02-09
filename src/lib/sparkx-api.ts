import type { Project } from "@/lib/projects";

type SparkxProject = {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  status: "active" | "archived" | string;
  createdAt: string;
  updatedAt: string;
};

type SparkxPagedResponse<T> = {
  list: T[];
  page: {
    page: number;
    pageSize: number;
    total: number;
  };
};

type SparkxApiFailure = {
  ok: false;
  status: number;
  message: string;
};

type SparkxApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type SparkxApiResult<T> = SparkxApiSuccess<T> | SparkxApiFailure;

const normalizeBaseURL = (raw: string): string => {
  const source = raw.trim();
  const withProtocol = /^https?:\/\//i.test(source)
    ? source
    : `http://${source}`;
  return withProtocol.replace(/\/$/, "");
};

const SPARKX_API_BASE_URL = (() => {
  const raw = process.env.SPARKX_API_BASE_URL;
  if (!raw || !raw.trim()) {
    throw new Error("Missing required environment variable: SPARKX_API_BASE_URL");
  }
  return normalizeBaseURL(raw);
})();

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const extractErrorMessage = (payload: unknown): string => {
  if (typeof payload === "string") {
    const normalized = payload.trim();
    return normalized || "Request failed";
  }
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    const msg = (payload as { msg?: unknown }).msg;
    if (typeof msg === "string" && msg.trim()) {
      return msg;
    }
  }
  return "Request failed";
};

export const fetchSparkxJson = async <T>(
  path: string,
  init?: RequestInit,
): Promise<SparkxApiResult<T>> => {
  try {
    console.log(`${SPARKX_API_BASE_URL}${path}`);
    const response = await fetch(`${SPARKX_API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const payload = await parseJsonSafely(response);

    if (!response.ok) {
      console.error(`${SPARKX_API_BASE_URL}${path}`, response.status, payload);
      return {
        ok: false,
        status: response.status,
        message: extractErrorMessage(payload),
      };
    }

    console.log(`${SPARKX_API_BASE_URL}${path}`, response.status, payload);
    return {
      ok: true,
      status: response.status,
      data: payload as T,
    };
  } catch (error) {
    console.error(`${SPARKX_API_BASE_URL}${path}`, error);
    return {
      ok: false,
      status: 502,
      message: error instanceof Error ? error.message : "Upstream request failed",
    };
  }
};

const toIsoString = (raw: string): string => {
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }
  return parsed.toISOString();
};

export const mapSparkxProject = (project: SparkxProject): Project => ({
  id: String(project.id),
  name: project.name,
  description: project.description,
  createdAt: toIsoString(project.createdAt),
  updatedAt: toIsoString(project.updatedAt),
});

export type { SparkxProject, SparkxPagedResponse };
