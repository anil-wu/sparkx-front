"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/client";
import type { SparkxSession } from "@/lib/sparkx-session";

type ModelType = "llm" | "vlm" | "embedding";

type ProviderModelConfig = {
  model_type?: ModelType;
  max_input_tokens?: number;
  max_output_tokens?: number;
  support_stream?: boolean;
  support_json?: boolean;
  price_input_per_1k?: number;
  price_output_per_1k?: number;
};

type ProviderConfig = {
  id: string;
  name: string;
  base_url?: string;
  api_key?: string;
  description?: string;
  models?: Record<string, ProviderModelConfig>;
};

type StoredConfig = {
  version: 1;
  providers: ProviderConfig[];
};

const STORAGE_KEY_PREFIX = "sparkplay:llm:providers:v1";

const sanitizeProviderId = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const readStoredConfig = (storageKey: string): StoredConfig => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { version: 1, providers: [] };
    const parsed = JSON.parse(raw) as unknown;
    const providers = Array.isArray((parsed as any)?.providers)
      ? ((parsed as any).providers as unknown[])
          .map((p) => ({
            id: typeof (p as any)?.id === "string" ? String((p as any).id) : "",
            name: typeof (p as any)?.name === "string" ? String((p as any).name) : "",
            base_url: typeof (p as any)?.base_url === "string" ? String((p as any).base_url) : "",
            api_key: typeof (p as any)?.api_key === "string" ? String((p as any).api_key) : "",
            description: typeof (p as any)?.description === "string" ? String((p as any).description) : "",
            models: (p as any)?.models && typeof (p as any).models === "object" ? (p as any).models : {},
          }))
          .filter((p) => p.id && p.name)
      : [];
    return { version: 1, providers };
  } catch {
    return { version: 1, providers: [] };
  }
};

const writeStoredConfig = (storageKey: string, config: StoredConfig) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(config));
  } catch {}
};

export default function UserSettings({ session }: { session: SparkxSession }) {
  const { t } = useI18n();
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}:${session.userId}`, [session.userId]);

  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<{
    id: string;
    name: string;
    base_url: string;
    api_key: string;
    description: string;
  }>({ id: "", name: "", base_url: "", api_key: "", description: "" });

  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<{
    provider_id: string;
    model_id: string;
    model_type: ModelType;
    max_input_tokens: string;
    max_output_tokens: string;
    support_stream: boolean;
    support_json: boolean;
    price_input_per_1k: string;
    price_output_per_1k: string;
  }>({
    provider_id: "",
    model_id: "",
    model_type: "llm",
    max_input_tokens: "",
    max_output_tokens: "",
    support_stream: true,
    support_json: true,
    price_input_per_1k: "",
    price_output_per_1k: "",
  });

  useEffect(() => {
    const stored = readStoredConfig(storageKey);
    setProviders(stored.providers);
    setSelectedProviderId((prev) => {
      if (prev && stored.providers.some((p) => p.id === prev)) return prev;
      return stored.providers[0]?.id ?? "";
    });
  }, [storageKey]);

  useEffect(() => {
    writeStoredConfig(storageKey, { version: 1, providers });
  }, [providers, storageKey]);

  const providersById = useMemo(() => {
    const map = new Map<string, ProviderConfig>();
    for (const p of providers) {
      map.set(p.id, p);
    }
    return map;
  }, [providers]);

  const selectedProvider = selectedProviderId ? providersById.get(selectedProviderId) : undefined;
  const selectedModels = useMemo(() => {
    if (!selectedProvider?.models) return [];
    return Object.entries(selectedProvider.models)
      .map(([modelId, cfg]) => ({
        id: modelId,
        cfg: cfg || {},
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [selectedProvider?.models]);

  const openCreateProvider = () => {
    setEditingProviderId(null);
    setProviderForm({ id: "", name: "", base_url: "", api_key: "", description: "" });
    setProviderDialogOpen(true);
  };

  const openEditProvider = (providerId: string) => {
    const p = providersById.get(providerId);
    if (!p) return;
    setEditingProviderId(providerId);
    setProviderForm({
      id: p.id,
      name: p.name,
      base_url: p.base_url ?? "",
      api_key: p.api_key ?? "",
      description: p.description ?? "",
    });
    setProviderDialogOpen(true);
  };

  const saveProvider = () => {
    const trimmedName = providerForm.name.trim();
    const rawId = providerForm.id.trim() ? providerForm.id.trim() : sanitizeProviderId(trimmedName);
    const nextId = sanitizeProviderId(rawId);
    if (!trimmedName || !nextId) return;

    setProviders((prev) => {
      const nextModels =
        editingProviderId && prev.find((p) => p.id === editingProviderId)?.models
          ? (prev.find((p) => p.id === editingProviderId)?.models ?? {})
          : {};
      const nextProvider: ProviderConfig = {
        id: nextId,
        name: trimmedName,
        base_url: providerForm.base_url.trim(),
        api_key: providerForm.api_key,
        description: providerForm.description.trim(),
        models: nextModels,
      };

      const filtered = editingProviderId
        ? prev.filter((p) => p.id !== editingProviderId && p.id !== nextId)
        : prev.filter((p) => p.id !== nextId);

      return [nextProvider, ...filtered].sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelectedProviderId(nextId);
    setProviderDialogOpen(false);
  };

  const deleteProvider = (providerId: string) => {
    const p = providersById.get(providerId);
    const name = p?.name ? `「${p.name}」` : "";
    const ok = confirm(`确认删除模型提供商${name}吗？将同时删除该提供商下的所有模型。`);
    if (!ok) return;
    setProviders((prev) => prev.filter((it) => it.id !== providerId));
    setSelectedProviderId((prev) => (prev === providerId ? "" : prev));
  };

  const openCreateModel = () => {
    const defaultProvider = selectedProviderId || providers[0]?.id || "";
    if (!defaultProvider) return;
    setEditingModelId(null);
    setModelForm({
      provider_id: defaultProvider,
      model_id: "",
      model_type: "llm",
      max_input_tokens: "",
      max_output_tokens: "",
      support_stream: true,
      support_json: true,
      price_input_per_1k: "",
      price_output_per_1k: "",
    });
    setModelDialogOpen(true);
  };

  const openEditModel = (providerId: string, modelId: string) => {
    const p = providersById.get(providerId);
    const cfg = p?.models?.[modelId];
    if (!p || !cfg) return;

    setEditingModelId(modelId);
    setModelForm({
      provider_id: providerId,
      model_id: modelId,
      model_type: cfg.model_type ?? "llm",
      max_input_tokens: Number.isFinite(cfg.max_input_tokens) ? String(cfg.max_input_tokens) : "",
      max_output_tokens: Number.isFinite(cfg.max_output_tokens) ? String(cfg.max_output_tokens) : "",
      support_stream: cfg.support_stream ?? false,
      support_json: cfg.support_json ?? false,
      price_input_per_1k: Number.isFinite(cfg.price_input_per_1k) ? String(cfg.price_input_per_1k) : "",
      price_output_per_1k: Number.isFinite(cfg.price_output_per_1k) ? String(cfg.price_output_per_1k) : "",
    });
    setModelDialogOpen(true);
  };

  const saveModel = () => {
    const providerId = modelForm.provider_id;
    const modelId = modelForm.model_id.trim();
    if (!providerId || !modelId) return;

    const parseNum = (value: string): number | undefined => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return undefined;
      return n;
    };

    const cfg: ProviderModelConfig = {
      model_type: modelForm.model_type,
      max_input_tokens: parseNum(modelForm.max_input_tokens),
      max_output_tokens: parseNum(modelForm.max_output_tokens),
      support_stream: modelForm.support_stream,
      support_json: modelForm.support_json,
      price_input_per_1k: parseNum(modelForm.price_input_per_1k),
      price_output_per_1k: parseNum(modelForm.price_output_per_1k),
    };

    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        const models = { ...(p.models ?? {}) };
        if (editingModelId && editingModelId !== modelId) {
          delete models[editingModelId];
        }
        models[modelId] = cfg;
        return { ...p, models };
      }),
    );
    setSelectedProviderId(providerId);
    setModelDialogOpen(false);
  };

  const deleteModel = (providerId: string, modelId: string) => {
    const ok = confirm(`确认删除模型「${modelId}」吗？`);
    if (!ok) return;
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        const models = { ...(p.models ?? {}) };
        delete models[modelId];
        return { ...p, models };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">
            {session.isSuper ? t("user_home.settings_admin_title") : t("user_home.settings_title")}
          </CardTitle>
          <CardDescription>管理模型提供商与模型信息（仅保存在当前浏览器）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">模型提供商</div>
              <div className="text-xs text-slate-500">配置名称、Base URL 与 API Key</div>
            </div>
            <Button onClick={openCreateProvider} size="sm" type="button">
              <Plus />
              新增提供商
            </Button>
          </div>

          {providers.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              还没有配置任何提供商
            </div>
          ) : (
            <div className="grid gap-3">
              {providers.map((p) => {
                const modelCount = p.models ? Object.keys(p.models).length : 0;
                return (
                  <div key={p.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500">({p.id})</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-600 truncate">
                          {p.base_url ? `Base URL: ${p.base_url}` : "Base URL: 未设置"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">模型数量: {modelCount}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="icon" type="button" onClick={() => openEditProvider(p.id)} aria-label="编辑提供商">
                          <Edit3 />
                        </Button>
                        <Button variant="destructive" size="icon" type="button" onClick={() => deleteProvider(p.id)} aria-label="删除提供商">
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-px bg-slate-200" />

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">模型</div>
              <div className="text-xs text-slate-500">为指定提供商维护模型列表与能力</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[220px]">
                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreateModel} size="sm" type="button" disabled={!selectedProviderId}>
                <Plus />
                新增模型
              </Button>
            </div>
          </div>

          {!selectedProviderId ? (
            <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              请选择一个提供商来管理模型
            </div>
          ) : selectedModels.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
              当前提供商还没有配置模型
            </div>
          ) : (
            <div className="grid gap-3">
              {selectedModels.map(({ id, cfg }) => (
                <div key={id} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{id}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        类型: {cfg.model_type ?? "llm"}，输入: {cfg.max_input_tokens ?? 0}，输出: {cfg.max_output_tokens ?? 0}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 flex items-center gap-3">
                        <span>流式: {cfg.support_stream ? "支持" : "不支持"}</span>
                        <span>JSON: {cfg.support_json ? "支持" : "不支持"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => openEditModel(selectedProviderId, id)}
                        aria-label="编辑模型"
                      >
                        <Edit3 />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        type="button"
                        onClick={() => deleteModel(selectedProviderId, id)}
                        aria-label="删除模型"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingProviderId ? "编辑提供商" : "新增提供商"}</DialogTitle>
            <DialogDescription>提供商信息将保存在当前浏览器的 localStorage。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="provider-name">名称</Label>
              <Input
                id="provider-name"
                value={providerForm.name}
                onChange={(e) => setProviderForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例如：OpenRouter"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider-id">ID</Label>
              <Input
                id="provider-id"
                value={providerForm.id}
                onChange={(e) => setProviderForm((prev) => ({ ...prev, id: e.target.value }))}
                placeholder="例如：openrouter（留空则自动生成）"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider-baseurl">Base URL</Label>
              <Input
                id="provider-baseurl"
                value={providerForm.base_url}
                onChange={(e) => setProviderForm((prev) => ({ ...prev, base_url: e.target.value }))}
                placeholder="例如：https://openrouter.ai/api/v1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider-apikey">API Key</Label>
              <Input
                id="provider-apikey"
                type="password"
                value={providerForm.api_key}
                onChange={(e) => setProviderForm((prev) => ({ ...prev, api_key: e.target.value }))}
                placeholder="可选"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider-desc">描述</Label>
              <textarea
                id="provider-desc"
                value={providerForm.description}
                onChange={(e) => setProviderForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="可选"
                className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" type="button" onClick={() => setProviderDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={saveProvider}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingModelId ? "编辑模型" : "新增模型"}</DialogTitle>
            <DialogDescription>模型信息将保存在当前浏览器的 localStorage。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>提供商</Label>
              <Select value={modelForm.provider_id} onValueChange={(v) => setModelForm((prev) => ({ ...prev, provider_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-id">模型 ID</Label>
              <Input
                id="model-id"
                value={modelForm.model_id}
                onChange={(e) => setModelForm((prev) => ({ ...prev, model_id: e.target.value }))}
                placeholder="例如：qwen/qwen-max"
              />
            </div>
            <div className="grid gap-2">
              <Label>模型类型</Label>
              <Select value={modelForm.model_type} onValueChange={(v) => setModelForm((prev) => ({ ...prev, model_type: v as ModelType }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择模型类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llm">llm</SelectItem>
                  <SelectItem value="vlm">vlm</SelectItem>
                  <SelectItem value="embedding">embedding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="max-in">最大输入 Token</Label>
                <Input
                  id="max-in"
                  value={modelForm.max_input_tokens}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, max_input_tokens: e.target.value }))}
                  placeholder="例如：32768"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-out">最大输出 Token</Label>
                <Input
                  id="max-out"
                  value={modelForm.max_output_tokens}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, max_output_tokens: e.target.value }))}
                  placeholder="例如：8192"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="price-in">输入价格（每 1k）</Label>
                <Input
                  id="price-in"
                  value={modelForm.price_input_per_1k}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, price_input_per_1k: e.target.value }))}
                  placeholder="例如：0.002"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price-out">输出价格（每 1k）</Label>
                <Input
                  id="price-out"
                  value={modelForm.price_output_per_1k}
                  onChange={(e) => setModelForm((prev) => ({ ...prev, price_output_per_1k: e.target.value }))}
                  placeholder="例如：0.006"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox
                  checked={modelForm.support_stream}
                  onCheckedChange={(v) => setModelForm((prev) => ({ ...prev, support_stream: v === true }))}
                />
                支持流式
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox checked={modelForm.support_json} onCheckedChange={(v) => setModelForm((prev) => ({ ...prev, support_json: v === true }))} />
                支持 JSON
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" type="button" onClick={() => setModelDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={saveModel} disabled={!modelForm.provider_id || !modelForm.model_id.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

