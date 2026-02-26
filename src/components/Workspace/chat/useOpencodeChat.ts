"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { opencodeClient, opencodeClientV2 } from "./opencodeClients";
import type {
  ChatMessage,
  MessageInfo,
  Part,
  QuestionInfoUI,
  QuestionOptionUI,
  QuestionPart,
  TodoItem,
} from "./types";

export function useOpencodeChat({
  locale,
  t,
  projectId,
  userId,
}: {
  locale: string;
  t: (key: string) => string;
  projectId?: string;
  userId?: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const [provider, setProvider] = useState("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [modelId, setModelId] = useState("qwen/qwen-max");
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [historySessions, setHistorySessions] = useState<Array<{ id: string; title: string; time?: { created: number; updated: number } }>>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const [agents, setAgents] = useState<any[]>([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const isSubscribedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const autoTitledSessionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setTodos([]);
  }, [sessionId]);

  const buildSessionTitle = (text: string) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return "";
    return normalized.length > 32 ? `${normalized.slice(0, 32)}…` : normalized;
  };

  const updateSessionTitle = async (targetSessionId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return false;
    try {
      const response = await opencodeClient.session.update({
        path: { id: targetSessionId },
        body: { title: trimmed },
      });
      const nextTitle = (response as any).data?.title || trimmed;
      setHistorySessions(prev => {
        const idx = prev.findIndex(s => s.id === targetSessionId);
        if (idx >= 0) {
          return prev.map(s => (s.id === targetSessionId ? { ...s, title: nextTitle } : s));
        }
        return [{ id: targetSessionId, title: nextTitle }, ...prev].slice(0, 50);
      });
      autoTitledSessionsRef.current.add(targetSessionId);
      return true;
    } catch {
      return false;
    }
  };

  const ensureSessionTitle = async (targetSessionId: string, seedText: string) => {
    if (autoTitledSessionsRef.current.has(targetSessionId)) return;

    const derived = buildSessionTitle(seedText);
    if (!derived) return;

    autoTitledSessionsRef.current.add(targetSessionId);
    try {
      const existing = await opencodeClient.session.get({ path: { id: targetSessionId } });
      const existingTitle = (existing as any).data?.title as string | undefined;
      if (existingTitle && existingTitle.trim()) return;
      await updateSessionTitle(targetSessionId, derived);
    } catch {
      autoTitledSessionsRef.current.delete(targetSessionId);
    }
  };

  const initSession = useCallback(async () => {
    if (isInitializingRef.current) return;

    setIsLoading(true);
    setError(null);
    isInitializingRef.current = true;
    try {
      const response = await opencodeClient.session.create({});
      if (!response.data?.id) throw new Error("No session ID returned");
      const newSessionId = response.data.id;
      setSessionId(newSessionId);
      setMessages([]);

      try {
        await opencodeClient.session.prompt({
          path: { id: newSessionId },
          body: {
            noReply: true,
            parts: [
              {
                type: "text",
                text: [
                  "你的角色是一个专业的游戏开发助手 SaprkX，用你的一句话开发游戏",
                  "",
                  `userId: ${userId ?? ""}`,
                  `projectId: ${projectId ?? ""}`,
                  "游戏引擎是 Phaser 3。",
                  "setp1 准备工作空间,路径是 workspace/{userId}/{projectId}/ 下面有 client_project 目录、build 目录、logs 目录、artifacts 目录等。",
                  "setp2 分析用户需求制定技术方案，并将方案输出到工作空间 artifacts/design_{版本号}.md 文件中。",
                  "setp3 技术方案制定任务计划，且任务中要有准备游戏环境、实现游戏逻辑、设计游戏资产（无可以忽略）、代码质量检查，构建游戏等任务。",
                  "说明：",
                  "1. 准备游戏环境：环境准备好后需要运行 npm install 安装依赖。",
                  "2. 代码质量检查：运行 npm run lint 检查代码质量。",
                  "3. 构建游戏：运行 npm run build 构建到目录 build/{版本号}。",
                ].join("\n"),
              },
            ],
          },
        });
      } catch {
        return;
      }
    } catch {
      setError(t("chat.error_session_failed"));
    } finally {
      setIsLoading(false);
      isInitializingRef.current = false;
    }
  }, [projectId, t, userId]);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  const normalizeTodos = useCallback((value: unknown): TodoItem[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((t: any) => ({
        content: typeof t?.content === "string" ? t.content : "",
        status: typeof t?.status === "string" ? t.status : "pending",
        priority: typeof t?.priority === "string" ? t.priority : "medium",
      }))
      .filter(t => t.content.trim().length > 0);
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await opencodeClient.config.get();
      const online = !!response.data;
      if (online && !sessionId && !isLoading && !isInitializingRef.current) {
        void initSession();
      }
      setIsOnline(online);
    } catch {
      setIsOnline(false);
    }
  }, [initSession, isLoading, sessionId]);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const fetchConfig = async () => {
    try {
      const configResponse = await opencodeClient.config.get();
      if (configResponse.data) {
        const fullModel = configResponse.data.model || "";
        if (fullModel.includes("/")) {
          const [p, m] = fullModel.split("/");
          setProvider(p);
          setModelId(m);
        }
      }

      const providersResponse = await opencodeClient.config.providers();
      if (providersResponse.data?.providers) {
        setAvailableProviders(providersResponse.data.providers);
      }
    } catch {
      return;
    }
  };

  const fetchAgents = useCallback(async () => {
    setIsAgentsLoading(true);
    setAgentsError(null);
    try {
      const response = await (opencodeClient as any).app.agents();
      const raw = (response as any)?.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.agents) ? raw.agents : [];
      setAgents(list);
    } catch {
      setAgentsError(t("chat.agents_load_failed"));
    } finally {
      setIsAgentsLoading(false);
    }
  }, [t]);

  const formatHistoryTime = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    try {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  const normalizePartForUI = (rawPart: any): Part | null => {
    if (!rawPart?.type) return null;

    if (rawPart.type === "text") {
      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: "text",
        text: rawPart.text || "",
      };
    }

    if (rawPart.type === "reasoning") {
      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: "reasoning",
        text: rawPart.text || "",
        time: rawPart.time,
      };
    }

    if (rawPart.type === "file") {
      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: "file",
        url: rawPart.url,
        filename: rawPart.filename,
        mime: rawPart.mime,
      };
    }

    if (rawPart.type === "tool") {
      const state = rawPart.state || {};
      const status = state.status === "running" ? "executing" : state.status === "error" ? "failed" : state.status;
      const attachments = Array.isArray(state.attachments)
        ? state.attachments.filter((a: any) => a && a.type === "file").map((a: any) => ({ filename: a.filename, url: a.url }))
        : undefined;

      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: "tool",
        tool: rawPart.tool,
        state: {
          status,
          title: state.title,
          input: state.input,
          output: state.output,
          error: state.error,
          attachments,
          time: state.time,
        },
      } as any;
    }

    return null;
  };

  const fetchSessionHistory = async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await opencodeClient.session.list({});
      const sessions = (response.data || []) as Array<{ id: string; title: string; time?: { created: number; updated: number } }>;
      const sorted = [...sessions].sort((a, b) => (b.time?.updated || 0) - (a.time?.updated || 0));
      setHistorySessions(sorted.slice(0, 50));
    } catch {
      setHistoryError(t("chat.history_load_failed"));
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadHistorySession = async (targetSessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await opencodeClient.session.messages({
        path: { id: targetSessionId },
        query: { limit: 200 },
      });

      const items = (response.data || []) as Array<{ info: any; parts: any[] }>;
      const nextMessages: ChatMessage[] = items
        .map(({ info, parts }) => {
          const normalizedParts = (parts || []).map(normalizePartForUI).filter(Boolean) as Part[];
          const content = normalizedParts
            .map(p => {
              if (p.type === "text" || p.type === "reasoning") return (p as any).text;
              return "";
            })
            .join("");
          return {
            id: info.id,
            role: info.role,
            content,
            timestamp: new Date(info.time?.created || Date.now()),
            parts: normalizedParts,
            info,
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setSessionId(targetSessionId);
      setMessages(nextMessages);
      return true;
    } catch {
      setError(t("chat.history_session_load_failed"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistorySession = async (targetSessionId: string) => {
    const ok = confirm(t("chat.history_delete_confirm"));
    if (!ok) return false;

    setDeletingSessionId(targetSessionId);
    setHistoryError(null);
    try {
      await opencodeClient.session.delete({ path: { id: targetSessionId } });

      setHistorySessions(prev => prev.filter(s => s.id !== targetSessionId));

      if (targetSessionId === sessionId) {
        setMessages([]);
        setSessionId(null);
        await initSession();
      }

      await fetchSessionHistory();
      return true;
    } catch {
      setHistoryError(t("chat.history_delete_failed"));
      return false;
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleRenameSession = async (targetSessionId: string) => {
    const currentTitle = historySessions.find(s => s.id === targetSessionId)?.title || "";
    const nextTitle = prompt("会话标题:", currentTitle);
    if (nextTitle === null) return false;
    await updateSessionTitle(targetSessionId, nextTitle);
    await fetchSessionHistory();
    return true;
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    try {
      if (apiKey) {
        await opencodeClient.auth.set({
          path: { id: provider },
          body: { type: "api", key: apiKey },
        });
      }

      await opencodeClient.config.update({
        body: { model: `${provider}/${modelId}` },
      });

      setSettingsFeedback({ type: "success", message: t("chat.settings_saved") });

      if (messages.length === 0) {
        void initSession();
      }

      return true;
    } catch {
      setSettingsFeedback({ type: "error", message: t("chat.settings_failed") });
      return false;
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateQuestionState = useCallback((requestID: string, patch: Partial<NonNullable<QuestionPart["state"]>>) => {
    setMessages(prev =>
      prev.map(m => {
        if (!m.parts || m.parts.length === 0) return m;
        let changed = false;
        const nextParts = m.parts.map(p => {
          if (p.type !== "question") return p;
          const qp = p as QuestionPart;
          if (qp.requestID !== requestID) return p;
          changed = true;
          return {
            ...qp,
            state: {
              status: qp.state?.status || "pending",
              ...qp.state,
              ...patch,
            },
          } as QuestionPart;
        });
        if (!changed) return m;
        return { ...m, parts: nextParts };
      }),
    );
  }, []);

  const handleReplyQuestion = useCallback(async (requestID: string, answers: Array<Array<string>>) => {
    try {
      const res = await opencodeClientV2.question.reply({ requestID, answers });
      if ((res as any)?.error) throw (res as any).error;
      updateQuestionState(requestID, { status: "replied", answers });
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : JSON.stringify(e);
      setError(`问题回答失败：${msg}`);
    }
  }, [updateQuestionState]);

  const handleRejectQuestion = useCallback(async (requestID: string) => {
    try {
      const res = await opencodeClientV2.question.reject({ requestID });
      if ((res as any)?.error) throw (res as any).error;
      updateQuestionState(requestID, { status: "rejected" });
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : JSON.stringify(e);
      setError(`跳过问题失败：${msg}`);
    }
  }, [updateQuestionState]);

  const normalizeQuestionsForUI = useCallback((rawQuestions: any): Array<QuestionInfoUI> => {
    const list = Array.isArray(rawQuestions) ? rawQuestions : [];
    return list
      .map((q: any) => {
        const question = typeof q?.question === "string" ? q.question : "";
        const header = typeof q?.header === "string" ? q.header : undefined;
        const multiple = typeof q?.multiple === "boolean" ? q.multiple : !!q?.multiple;
        const custom = typeof q?.custom === "boolean" ? q.custom : q?.custom === undefined ? true : !!q?.custom;
        const rawOptions = Array.isArray(q?.options) ? q.options : [];
        const options: Array<QuestionOptionUI> = rawOptions
          .map((o: any) => {
            if (typeof o === "string") return { label: o };
            if (o && typeof o.label === "string") {
              return { label: o.label, description: typeof o.description === "string" ? o.description : undefined };
            }
            return null;
          })
          .filter(Boolean) as Array<QuestionOptionUI>;

        if (!question) return null;
        return { header, question, options, multiple, custom } as QuestionInfoUI;
      })
      .filter(Boolean) as Array<QuestionInfoUI>;
  }, []);

  useEffect(() => {
    if (!sessionId || !isOnline) return;
    if (isSubscribedRef.current) return;

    let isCancelled = false;
    isSubscribedRef.current = true;
    let stream: AsyncGenerator<any, any, any> | null = null;

    const setupSSE = async () => {
      try {
        const events = await opencodeClient.event.subscribe();
        if (isCancelled) return;
        stream = events.stream as any;

        for await (const event of events.stream) {
          if (isCancelled) break;

          const eventType: string = event.type;

          if (eventType === "message.part.delta") {
            const { delta, field, messageID, partID, sessionID: eventSessionID } = event.properties as any;
            if (!delta || !messageID || !partID || field !== "text") continue;
            if (eventSessionID !== sessionId) continue;

            setMessages(prev => {
              const existingMsgIndex = prev.findIndex(m => m.id === messageID);

              const baseMsg: ChatMessage =
                existingMsgIndex >= 0
                  ? prev[existingMsgIndex]
                  : {
                      id: messageID,
                      role: "assistant",
                      content: "",
                      timestamp: new Date(),
                      parts: [],
                      info: { sessionID: eventSessionID },
                    };

              const prevParts = baseMsg.parts ?? [];
              const partIndex = prevParts.findIndex(p => p.id === partID);

              let nextParts: Part[];
              if (partIndex >= 0) {
                const existingPart = prevParts[partIndex] as any;
                if (existingPart.type !== "text" && existingPart.type !== "reasoning") return prev;

                const updatedPart = { ...existingPart, text: (existingPart.text || "") + delta } as Part;

                nextParts = [...prevParts];
                nextParts[partIndex] = updatedPart;
              } else {
                nextParts = [
                  ...prevParts,
                  {
                    id: partID,
                    messageID,
                    sessionID: eventSessionID,
                    type: "text",
                    text: delta,
                  } as any,
                ];
              }

              const nextContent = nextParts
                .map(p => {
                  if (p.type === "text" || p.type === "reasoning") return (p as any).text;
                  return "";
                })
                .join("");

              const nextMsg: ChatMessage = { ...baseMsg, parts: nextParts, content: nextContent };

              if (existingMsgIndex >= 0) {
                const nextMessages = [...prev];
                nextMessages[existingMsgIndex] = nextMsg;
                return nextMessages;
              }

              return [...prev, nextMsg];
            });
          } else if (eventType === "message.part.updated") {
            const { part } = event.properties as { part: Part };
            if (!part) continue;
            if ((part as any).sessionID !== sessionId) continue;

            setMessages(prev => {
              const existingMsgIndex = prev.findIndex(m => m.id === (part as any).messageID);

              const baseMsg: ChatMessage =
                existingMsgIndex >= 0
                  ? prev[existingMsgIndex]
                  : {
                      id: (part as any).messageID,
                      role: "assistant",
                      content: "",
                      timestamp: new Date(),
                      parts: [],
                      info: { sessionID: (part as any).sessionID },
                    };

              const prevParts = baseMsg.parts ?? [];
              const partIndex = prevParts.findIndex(p => p.id === (part as any).id);

              let nextPart: Part = part;
              if (partIndex >= 0) {
                const existingPart = prevParts[partIndex] as any;
                if ((part.type === "text" || part.type === "reasoning") && existingPart.type === part.type) {
                  nextPart = { ...(part as any), text: existingPart.text || (part as any).text } as Part;
                }
              }

              const nextParts = [...prevParts];
              if (partIndex >= 0) nextParts[partIndex] = nextPart;
              else nextParts.push(nextPart);

              const nextContent = nextParts
                .map(p => {
                  if (p.type === "text" || p.type === "reasoning") return (p as any).text || "";
                  return "";
                })
                .join("");

              const nextMsg: ChatMessage = { ...baseMsg, parts: nextParts, content: nextContent };

              if (existingMsgIndex >= 0) {
                const nextMessages = [...prev];
                nextMessages[existingMsgIndex] = nextMsg;
                return nextMessages;
              }

              return [...prev, nextMsg];
            });
          } else if (eventType === "message.updated") {
            const { info } = event.properties as { info: MessageInfo };
            if (info.sessionID !== sessionId) continue;

            setMessages(prev => {
              const msgIndex = prev.findIndex(m => m.id === info.id);
              if (msgIndex >= 0) {
                const updatedMsg = { ...prev[msgIndex] };
                updatedMsg.info = { ...updatedMsg.info, ...info };
                updatedMsg.timestamp = new Date(info.time.created);
                if (info.error) {
                  updatedMsg.content = `${updatedMsg.content}\n\n[错误：${info.error.message}]`;
                }
                const newMessages = [...prev];
                newMessages[msgIndex] = updatedMsg;
                return newMessages;
              }
              const newMessage: ChatMessage = {
                id: info.id,
                role: info.role,
                content: "",
                timestamp: new Date(info.time.created),
                info: { ...info },
              };
              return [...prev, newMessage];
            });
          } else if (eventType === "session.status") {
            const { status, sessionID: statusSessionID } = event.properties as any;
            if (statusSessionID !== sessionId) continue;

            switch (status.type) {
              case "idle":
                setIsLoading(false);
                setError(null);
                break;
              case "busy":
                setIsLoading(true);
                setError(null);
                break;
              case "retry":
                setError(`重试中 (${status.attempt}/${status.message})`);
                break;
            }
          } else if (eventType === "session.error") {
            const { error: rawError, sessionID: errorSessionID } = event.properties as any;
            if (errorSessionID && errorSessionID !== sessionId) continue;
            if (rawError) {
              const errorMsg = typeof rawError === "string" ? rawError : JSON.stringify(rawError);
              setError(`会话错误：${errorMsg}`);
              setIsLoading(false);
            }
          } else if (eventType === "question.asked") {
            const req = event.properties as any;
            if (!req?.id || req?.sessionID !== sessionId) continue;
            const requestID: string = req.id;
            const questions = normalizeQuestionsForUI(req.questions);
            if (questions.length === 0) continue;
            const tool = req.tool && typeof req.tool === "object" ? req.tool : undefined;

            setMessages(prev => {
              const existingIdx = prev.findIndex(m => m.id === requestID);
              const message: ChatMessage = {
                id: requestID,
                role: "assistant",
                content: "",
                timestamp: new Date(),
                parts: [
                  {
                    id: `question_${requestID}`,
                    messageID: requestID,
                    sessionID: sessionId,
                    type: "question",
                    requestID,
                    questions,
                    tool,
                    state: { status: "pending" },
                  } as QuestionPart,
                ],
                info: { sessionID: sessionId },
              };

              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = { ...prev[existingIdx], ...message };
                return next;
              }
              return [...prev, message];
            });
          } else if (eventType === "question.replied") {
            const p = event.properties as any;
            if (p?.sessionID !== sessionId || !p?.requestID) continue;
            const answers = Array.isArray(p.answers) ? (p.answers as Array<Array<string>>) : undefined;
            updateQuestionState(p.requestID, { status: "replied", answers });
          } else if (eventType === "question.rejected") {
            const p = event.properties as any;
            if (p?.sessionID !== sessionId || !p?.requestID) continue;
            updateQuestionState(p.requestID, { status: "rejected" });
          } else if (eventType === "todo.updated") {
            const p = event.properties as any;
            if (p?.sessionID && p.sessionID !== sessionId) continue;
            setTodos(normalizeTodos(p?.todos));
          }
        }
      } catch {
        return;
      } finally {
        isSubscribedRef.current = false;
      }
    };

    setupSSE();

    return () => {
      isCancelled = true;
      stream?.return?.(undefined);
      isSubscribedRef.current = false;
    };
  }, [isOnline, normalizeQuestionsForUI, normalizeTodos, sessionId, updateQuestionState]);

  const sendPrompt = async (seedText: string) => {
    if (!seedText.trim() || !sessionId || isLoading) return false;

    setIsLoading(true);
    setError(null);
    try {
      void ensureSessionTitle(sessionId, seedText);
      opencodeClient.session.prompt({
        path: { id: sessionId },
        body: { parts: [{ type: "text", text: seedText }] },
      });
      return true;
    } catch {
      setError(t("chat.error_send_failed"));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      if (confirm(t("chat.new_chat_confirm"))) {
        await initSession();
      }
    } else {
      await initSession();
    }
  };

  return {
    messages,
    setMessages,
    todos,
    sessionId,
    isLoading,
    error,
    isOnline,

    provider,
    setProvider,
    apiKey,
    setApiKey,
    modelId,
    setModelId,
    availableProviders,
    isSavingSettings,
    settingsFeedback,

    historySessions,
    isHistoryLoading,
    historyError,
    deletingSessionId,

    agents,
    isAgentsLoading,
    agentsError,

    checkHealth,
    fetchConfig,
    formatHistoryTime,
    fetchSessionHistory,
    loadHistorySession,
    deleteHistorySession,
    handleRenameSession,
    updateSessionTitle,
    handleSaveSettings,
    initSession,
    sendPrompt,
    handleNewChat,
    handleReplyQuestion,
    handleRejectQuestion,
    fetchAgents,
    setHistoryError,
    setIsLoading,
    setError,
    setSettingsFeedback,
    setHistorySessions,
  };
}
