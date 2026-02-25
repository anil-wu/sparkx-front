"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, History, Share2, Copy, Minimize2, Paperclip, AtSign, Lightbulb, Zap, Globe, Box, ArrowUp, ChevronLeft, Sparkles, Settings, X, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { createOpencodeClient } from "@opencode-ai/sdk";

interface ChatPanelProps {
  isCollapsed: boolean;
  togglePanel: () => void;
}

// OpenCode 消息模型类型定义
interface MessageTokens {
  input: number;
  output: number;
  cache?: { read: number; write: number };
  total?: number;
}

interface MessageTime {
  created: number;
  completed?: number;
  started?: number;
  compacted?: number;
}

interface MessageInfo {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  parentID?: string;
  time: MessageTime;
  agent: string;
  model?: {
    providerID: string;
    modelID: string;
  };
  tokens?: MessageTokens;
  cost?: number;
  error?: {
    name: string;
    message: string;
  };
  abort?: boolean;
  finish?: 'stop' | 'tool-calls';
  summary?: {
    title?: string;
    body?: string;
  };
}

// ReasoningPart 组件 - 推理片段
interface ReasoningPartComponentProps {
  part: ReasoningPart;
  idx: number;
}

const ReasoningPartComponent: React.FC<ReasoningPartComponentProps> = ({ part, idx }) => {
  // 当 time.end 存在时表示推理结束
  const isCompleted = !!part.time?.end;
  const [isCollapsed, setIsCollapsed] = useState(isCompleted);
  
  // 当 time.end 出现时自动折叠
  useEffect(() => {
    if (isCompleted) {
      setIsCollapsed(true);
    }
  }, [isCompleted]);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-xs text-purple-800">
      <div 
        className="flex items-center gap-2 mb-2 font-medium text-purple-700 cursor-pointer select-none hover:bg-purple-100/50 rounded px-2 py-1 transition-colors"
        onClick={toggleCollapse}
      >
        <Sparkles size={12} />
        <span>{isCompleted ? '思考' : '推理中...'}</span>
        <ChevronLeft 
          size={12} 
          className={`ml-auto transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
        />
      </div>
      {!isCollapsed && (
        <div className="whitespace-pre-wrap opacity-80">{part.text}</div>
      )}
    </div>
  );
};

// ToolPart 组件 - 工具调用片段
interface ToolPartComponentProps {
  part: ToolPart;
  idx: number;
}

const ToolPartComponent: React.FC<ToolPartComponentProps> = ({ part, idx }) => {
  const state = part.state;
  const toolName = part.tool || 'Unknown';
  const isCompleted = state?.status === 'completed' || state?.status === 'failed' || state?.status === 'error';
  const [isCollapsed, setIsCollapsed] = useState(true); // 默认收缩
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <div key={idx} className="p-3 bg-white/50 rounded-lg border border-amber-200">
      <div 
        className="flex items-center gap-2 mb-2 text-xs font-medium text-amber-700 cursor-pointer select-none hover:bg-amber-50 rounded px-2 py-1 transition-colors"
        onClick={toggleCollapse}
      >
        <Zap size={12} />
        <span>工具：{toolName}</span>
        {isCompleted && (
          <ChevronLeft 
            size={12} 
            className={`ml-auto transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
          />
        )}
      </div>
      
      {!isCollapsed && (
        <>
          {state?.status === 'pending' && (
            <div className="text-xs text-amber-600">等待执行...</div>
          )}
          
          {(state?.status === 'executing' || state?.status === 'running') && (
            <div className="text-xs text-amber-600">
              正在执行{state.title ? `: ${state.title}` : '...'}
            </div>
          )}
          
          {state?.status === 'completed' && (
            <div className="text-xs text-green-600">
              <div className="font-medium mb-1">执行完成</div>
              {state.title && <div className="text-gray-500 mb-1">{state.title}</div>}
              {state.output && (
                <pre className="mt-2 p-2 bg-gray-50 rounded text-[10px] overflow-auto max-h-32">
                  {typeof state.output === 'string' ? state.output : JSON.stringify(state.output, null, 2)}
                </pre>
              )}
              {state.attachments && state.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {state.attachments.map((attachment, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Paperclip size={10} />
                      <span>{attachment.filename || 'Attachment'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {(state?.status === 'failed' || state?.status === 'error') && (
            <div className="text-xs text-red-600">
              <div className="font-medium mb-1">执行失败</div>
              <pre className="mt-1 p-2 bg-red-50 rounded text-[10px] overflow-auto max-h-32">
                {state.error || 'Unknown error'}
              </pre>
            </div>
          )}
        </>
      )}
      
      {isCollapsed && isCompleted && (
        <div className="text-xs">
          {state?.status === 'completed' && (
            <span className="text-green-600">✓ 已完成</span>
          )}
          {(state?.status === 'failed' || state?.status === 'error') && (
            <span className="text-red-600">✗ 已失败</span>
          )}
        </div>
      )}
    </div>
  );
};

// Part 类型定义
interface BasePart {
  id: string;
  messageID: string;
  sessionID: string;
}

interface TextPart extends BasePart {
  type: 'text';
  text: string;
  state?: {
    status: 'pending' | 'generating' | 'completed';
    text: string;
    time?: { started?: number; completed?: number };
  };
}

interface ToolPart extends BasePart {
  type: 'tool';
  tool: string;
  state?: {
    status: 'pending' | 'executing' | 'running' | 'completed' | 'failed' | 'error';
    title?: string;
    input?: object;
    output?: string | object;
    error?: string;
    attachments?: Array<{ filename: string; url?: string }>;
    time?: { started?: number; completed?: number };
  };
}

interface ReasoningPart extends BasePart {
  type: 'reasoning';
  text: string;
  time?: {
    start?: number;
    end?: number;
  };
  state?: {
    status: 'pending' | 'generating' | 'completed';
    text: string;
    time?: { started?: number; completed?: number };
  };
}

interface FilePart extends BasePart {
  type: 'file';
  url: string;
  filename?: string;
  mime?: string;
}

interface OutputPart extends BasePart {
  type: 'output';
  format: string;
  content: string;
}

type Part = TextPart | ToolPart | ReasoningPart | FilePart | OutputPart;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  parts?: Part[];
  info?: Partial<MessageInfo>;
}

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
});

// Part 渲染组件
function renderPart(part: Part, idx: number) {
  // TextPart - 文本片段
  if (part.type === 'text') {
    return <div key={idx} className="whitespace-pre-wrap">{part.text}</div>;
  }
  
  // ToolPart - 工具调用片段
  if (part.type === 'tool') {
    return <ToolPartComponent key={idx} part={part} idx={idx} />;
  }
  
  // ReasoningPart - 推理片段
  if (part.type === 'reasoning') {
    return <ReasoningPartComponent key={idx} part={part} idx={idx} />;
  }
  
  // FilePart - 文件片段
  if (part.type === 'file') {
    const fileUrl = part.url?.startsWith('http') ? part.url : `http://localhost:4096${part.url}`;
    
    if (part.mime?.startsWith('image/')) {
      return (
        <div key={idx} className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-white">
          <img 
            src={fileUrl} 
            alt={part.filename || 'Generated Image'} 
            className="w-full h-auto object-contain max-h-[300px]"
            loading="lazy"
          />
          {part.filename && (
            <div className="px-2 py-1 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100 truncate">
              {part.filename}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 text-xs">
        <Paperclip size={14} className="text-gray-400" />
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">
          {part.filename || 'Download File'}
        </a>
      </div>
    );
  }
  
  // OutputPart - 输出片段
  if (part.type === 'output') {
    return (
      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-blue-700">
          <Box size={12} />
          <span>输出：{part.format}</span>
        </div>
        <pre className="text-xs text-blue-800 whitespace-pre-wrap overflow-auto max-h-64">
          {part.content}
        </pre>
      </div>
    );
  }
  
  // 未知类型
  return null;
}

export default function ChatPanel({ isCollapsed, togglePanel }: ChatPanelProps) {
  const { locale, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 设置相关的状态
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('qwen/qwen-max');
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState<Array<{ id: string; title: string; time?: { created: number; updated: number } }>>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  // SSE 订阅状态跟踪
  const isSubscribedRef = useRef(false);
  const isInitializingRef = useRef(false);

  // 检查服务健康状态
  const checkHealth = async () => {
    try {
      const response = await client.config.get();
      const online = !!response.data;
      
      // 如果服务上线了且当前没有会话 ID，自动尝试初始化
      if (online && !sessionId && !isLoading && !isInitializingRef.current) {
        console.log("Service is online, auto-initializing session...");
        initSession();
      }
      
      setIsOnline(online);
    } catch (err) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // const timer = setInterval(checkHealth, 30000); // 每30秒检查一次
    // return () => clearInterval(timer);
  }, []);

  // 获取当前配置
  const fetchConfig = async () => {
    try {
      // 获取当前配置的默认模型
      const configResponse = await client.config.get();
      if (configResponse.data) {
        const fullModel = configResponse.data.model || '';
        if (fullModel.includes('/')) {
          const [p, m] = fullModel.split('/');
          setProvider(p);
          setModelId(m);
        }
      }

      // 获取所有可用的提供商和模型
      const providersResponse = await client.config.providers();
      if (providersResponse.data?.providers) {
        setAvailableProviders(providersResponse.data.providers);
      }
    } catch (err) {
      console.error("Failed to fetch config or providers:", err);
    }
  };

  useEffect(() => {
    if (showSettings) {
      fetchConfig();
    }
  }, [showSettings]);

  const formatHistoryTime = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  const normalizePartForUI = (rawPart: any): Part | null => {
    if (!rawPart?.type) return null;

    if (rawPart.type === 'text') {
      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: 'text',
        text: rawPart.text || ''
      };
    }

    if (rawPart.type === 'reasoning') {
      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: 'reasoning',
        text: rawPart.text || '',
        time: rawPart.time
      };
    }

    if (rawPart.type === 'file') {
      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: 'file',
        url: rawPart.url,
        filename: rawPart.filename,
        mime: rawPart.mime
      };
    }

    if (rawPart.type === 'tool') {
      const state = rawPart.state || {};
      const status = state.status === 'running' ? 'executing' : state.status === 'error' ? 'failed' : state.status;
      const attachments = Array.isArray(state.attachments)
        ? state.attachments
            .filter((a: any) => a && a.type === 'file')
            .map((a: any) => ({ filename: a.filename, url: a.url }))
        : undefined;

      return {
        id: rawPart.id,
        messageID: rawPart.messageID,
        sessionID: rawPart.sessionID,
        type: 'tool',
        tool: rawPart.tool,
        state: {
          status,
          title: state.title,
          input: state.input,
          output: state.output,
          error: state.error,
          attachments,
          time: state.time
        }
      } as ToolPart;
    }

    return null;
  };

  const fetchSessionHistory = async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await client.session.list({});
      const sessions = (response.data || []) as Array<{ id: string; title: string; time?: { created: number; updated: number } }>;
      const sorted = [...sessions].sort((a, b) => (b.time?.updated || 0) - (a.time?.updated || 0));
      setHistorySessions(sorted.slice(0, 50));
    } catch (err) {
      console.error("Failed to fetch session history:", err);
      setHistoryError(t('chat.history_load_failed'));
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadHistorySession = async (targetSessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.session.messages({
        path: { id: targetSessionId },
        query: { limit: 200 }
      });

      const items = (response.data || []) as Array<{ info: any; parts: any[] }>;
      const nextMessages: ChatMessage[] = items
        .map(({ info, parts }) => {
          const normalizedParts = (parts || []).map(normalizePartForUI).filter(Boolean) as Part[];
          const content = normalizedParts
            .map(p => {
              if (p.type === 'text' || p.type === 'reasoning') return p.text;
              return '';
            })
            .join('');
          return {
            id: info.id,
            role: info.role,
            content,
            timestamp: new Date(info.time?.created || Date.now()),
            parts: normalizedParts,
            info
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setSessionId(targetSessionId);
      setMessages(nextMessages);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to load history session:", err);
      setError(t('chat.history_session_load_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistorySession = async (targetSessionId: string) => {
    const ok = confirm(t('chat.history_delete_confirm'));
    if (!ok) return;

    setDeletingSessionId(targetSessionId);
    setHistoryError(null);
    try {
      await client.session.delete({ path: { id: targetSessionId } });

      setHistorySessions(prev => prev.filter(s => s.id !== targetSessionId));

      if (targetSessionId === sessionId) {
        setMessages([]);
        setSessionId(null);
        await initSession();
      }

      await fetchSessionHistory();
    } catch (err) {
      console.error("Failed to delete history session:", err);
      setHistoryError(t('chat.history_delete_failed'));
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    try {
      // 1. 设置 API Key
      if (apiKey) {
        await client.auth.set({
          path: { id: provider },
          body: { type: 'api', key: apiKey }
        });
      }

      // 2. 更新默认模型
      await client.config.update({
        body: { model: `${provider}/${modelId}` }
      });

      setSettingsFeedback({ type: 'success', message: t('chat.settings_saved') });
      
      // 保存成功后，如果当前没有正在进行的对话，或者用户确认，则重置会话以应用新设置
      if (messages.length === 0) {
        initSession();
      }

      setTimeout(() => setShowSettings(false), 1500);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSettingsFeedback({ type: 'error', message: t('chat.settings_failed') });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 初始化或重置会话
  const initSession = async () => {
    // 防止重复初始化
    if (isInitializingRef.current) {
      console.log("initSession already in progress, skipping...");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    isInitializingRef.current = true;
    try {

      console.log("initSession------------------------------------------>>");
      const response = await client.session.create({});
      if (response.data?.id) {
        const newSessionId = response.data.id;
        setSessionId(newSessionId);
        setMessages([]);
        
        // 注入系统指令（不触发响应）
        try {
          await client.session.prompt({ 
            path: { id: newSessionId }, 
            body: { 
              noReply: true, // 仅注入上下文，不触发响应 
              parts: [{ 
                type: "text", 
                text: "你的角色是一个专业的游戏开发助手 SaprkX，用你的一句话开发游戏" 
              }] 
            } 
          });
          console.log("System instruction injected successfully");
        } catch (injectError) {
          console.error("Failed to inject system instruction:", injectError);
        }
      } else {
        throw new Error("No session ID returned");
      }
    } catch (error) {
      console.error("Failed to initialize OpenCode session:", error);
      setError(t('chat.error_session_failed'));
    } finally {
      setIsLoading(false);
      isInitializingRef.current = false;
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, error]);

  // 监听实时推送消息 (SSE)
  useEffect(() => {
    if (!sessionId || !isOnline) {
      console.log("SSE not ready:", { sessionId, isOnline });
      return;
    }
    
    // 检查是否已经订阅，防止重复订阅
    if (isSubscribedRef.current) {
      console.log("SSE already subscribed for session:", sessionId);
      return;
    }
    
    console.log("Setting up SSE for session:", sessionId);
    
    let isCancelled = false;
    isSubscribedRef.current = true;
    let stream: AsyncGenerator<any, any, any> | null = null;
    
    const setupSSE = async () => {
      try {
        const events = await client.event.subscribe();
        
        if (isCancelled) return;
        
        console.log("SSE subscription established for session:", sessionId);
        stream = events.stream as any;
        
        for await (const event of events.stream) {
          if (isCancelled) break;
          
          const eventType: string = event.type;
          
          // 消息部分增量更新（流式输出）
          // 只更新已存在的消息和 Part，不创建新消息
          if (eventType === 'message.part.delta') {
            const { delta, field, messageID, partID, sessionID: eventSessionID } = event.properties as any;
            
            if (!delta || !messageID || !partID || field !== 'text') return;
            if (eventSessionID !== sessionId) return;
            
            setMessages(prev => {
              const existingMsgIndex = prev.findIndex(m => m.id === messageID);

              const baseMsg: ChatMessage =
                existingMsgIndex >= 0
                  ? prev[existingMsgIndex]
                  : {
                      id: messageID,
                      role: 'assistant',
                      content: '',
                      timestamp: new Date(),
                      parts: [],
                      info: { sessionID: eventSessionID }
                    };

              const prevParts = baseMsg.parts ?? [];
              const partIndex = prevParts.findIndex(p => p.id === partID);

              let nextParts: Part[];
              if (partIndex >= 0) {
                const existingPart = prevParts[partIndex];
                if (existingPart.type !== 'text' && existingPart.type !== 'reasoning') return prev;

                const updatedPart = {
                  ...existingPart,
                  text: (existingPart.text || '') + delta
                } as Part;

                nextParts = [...prevParts];
                nextParts[partIndex] = updatedPart;
              } else {
                nextParts = [
                  ...prevParts,
                  {
                    id: partID,
                    messageID,
                    sessionID: eventSessionID,
                    type: 'text',
                    text: delta
                  } as TextPart
                ];
              }

              const nextContent = nextParts
                .map(p => {
                  if (p.type === 'text' || p.type === 'reasoning') return p.text;
                  return '';
                })
                .join('');

              const nextMsg: ChatMessage = { ...baseMsg, parts: nextParts, content: nextContent };

              if (existingMsgIndex >= 0) {
                const nextMessages = [...prev];
                nextMessages[existingMsgIndex] = nextMsg;
                return nextMessages;
              }

              return [...prev, nextMsg];
            });
          }
          
          // 消息部分完整更新
          // 负责创建或更新 Part 对象
          else if (eventType === 'message.part.updated') {
            const { part } = event.properties as { part: Part };
            
            if (!part) return;
            if ((part as any).sessionID !== sessionId) return;
            
            setMessages(prev => {
              const existingMsgIndex = prev.findIndex(m => m.id === (part as any).messageID);

              const baseMsg: ChatMessage =
                existingMsgIndex >= 0
                  ? prev[existingMsgIndex]
                  : {
                      id: (part as any).messageID,
                      role: 'assistant',
                      content: '',
                      timestamp: new Date(),
                      parts: [],
                      info: { sessionID: (part as any).sessionID }
                    };

              const prevParts = baseMsg.parts ?? [];
              const partIndex = prevParts.findIndex(p => p.id === (part as any).id);

              let nextPart: Part = part;
              if (partIndex >= 0) {
                const existingPart = prevParts[partIndex];
                if ((part.type === 'text' || part.type === 'reasoning') && existingPart.type === part.type) {
                  nextPart = { ...(part as any), text: (existingPart as any).text || (part as any).text } as Part;
                }
              }

              const nextParts = [...prevParts];
              if (partIndex >= 0) {
                nextParts[partIndex] = nextPart;
              } else {
                nextParts.push(nextPart);
              }

              const nextContent = nextParts
                .map(p => {
                  if (p.type === 'text' || p.type === 'reasoning') return (p as any).text || '';
                  return '';
                })
                .join('');

              const nextMsg: ChatMessage = { ...baseMsg, parts: nextParts, content: nextContent };

              if (existingMsgIndex >= 0) {
                const nextMessages = [...prev];
                nextMessages[existingMsgIndex] = nextMsg;
                return nextMessages;
              }

              return [...prev, nextMsg];
            });
          }
          
          // 消息元数据更新
          // 负责创建或更新消息（包括用户消息和助手消息）
          else if (eventType === 'message.updated') {
            const { info } = event.properties as { info: MessageInfo };

            if (info.sessionID !== sessionId) return;
            
            setMessages(prev => {
              const msgIndex = prev.findIndex(m => m.id === info.id);
              if (msgIndex >= 0) {
                // 消息已存在，更新信息
                const updatedMsg = { ...prev[msgIndex] };
                updatedMsg.info = { ...updatedMsg.info, ...info };
                updatedMsg.timestamp = new Date(info.time.created);
                
                // 如果有错误信息，更新内容
                if (info.error) {
                  updatedMsg.content = `${updatedMsg.content}\n\n[错误：${info.error.message}]`;
                }
                
                const newMessages = [...prev];
                newMessages[msgIndex] = updatedMsg;
                return newMessages;
              } else {
                // 消息不存在，创建新消息
                const newMessage: ChatMessage = {
                  id: info.id,
                  role: info.role,
                  content: '',
                  timestamp: new Date(info.time.created),
                  info: { ...info }
                };
                return [...prev, newMessage];
              }
            });
          }
          
          // 会话状态更新
          else if (eventType === 'session.status') {
            const { status, sessionID: statusSessionID } = event.properties as any;
            if (statusSessionID !== sessionId) return;
            
            switch (status.type) {
              case 'idle':
                setIsLoading(false);
                setError(null);
                break;
              case 'busy':
                setIsLoading(true);
                setError(null);
                break;
              case 'retry':
                setError(`重试中 (${status.attempt}/${status.message})`);
                break;
            }
          }
          
          // 会话错误
          else if (eventType === 'session.error') {
            const { error, sessionID: errorSessionID } = event.properties as any;
            if (errorSessionID && errorSessionID !== sessionId) return;
            if (error) {
              const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
              setError(`会话错误：${errorMsg}`);
              setIsLoading(false);
            }
          }
          
          // 权限请求
          else if (eventType === 'permission.asked' || eventType === 'permission.updated') {
            const perm = event.properties as any;
            console.log('权限请求:', perm.title || perm.type, perm);
            // TODO: 显示权限请求对话框
          }
          
          // Todo 列表更新
          else if (eventType === 'todo.updated') {
            const { todos } = event.properties as { todos: Array<{ content: string; status: string; priority: string }> };
            console.log('Todo 列表更新:', todos);
            // TODO: 在 UI 中显示 Todo 列表
          }
          
          // 文件编辑通知
          else if (eventType === 'file.edited') {
            const { file } = event.properties as { file: string };
            console.log('文件已编辑:', file);
            // TODO: 显示文件编辑通知
          }
          
          // 命令执行通知
          else if (eventType === 'command.executed') {
            const { name, arguments: args } = event.properties as { name: string; arguments?: string };
            console.log('命令已执行:', name, args);
            // TODO: 显示命令执行结果
          }
          
          // 会话差异更新
          else if (eventType === 'session.diff') {
            const { diff } = event.properties as { diff: Array<{ path: string; additions: number; deletions: number }> };
            console.log('会话文件变更:', diff);
            // TODO: 显示文件变更摘要
          }
          
          // 其他事件暂时忽略
          else {
            console.log('未处理的事件:', eventType, event.properties);
          }
        }
      } catch (error) {
        if (!isCancelled) console.error('SSE error:', error);
      } finally {
        isSubscribedRef.current = false;
      }
    };

    setupSSE();

    // 清理函数
    return () => {
      console.log('Cleaning up SSE for session:', sessionId);
      isCancelled = true;
      stream?.return?.(undefined);
      isSubscribedRef.current = false;
    };
  }, [sessionId, isOnline]);

  const handleNewChat = () => {
    if (messages.length > 0) {
      if (confirm(t('chat.new_chat_confirm'))) {
        initSession();
      }
    } else {
      initSession();
    }
  };

  const handleOpenHistory = async () => {
    setShowHistory(true);
    await fetchSessionHistory();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    // setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending prompt to OpenCode session:", sessionId, inputValue);
      client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: "text", text: inputValue}]
        }

      });
    } catch (error) {
      console.error("Failed to send message to OpenCode:", error);
      setError(t('chat.error_send_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCollapsed) {
    return (
      <button 
        onClick={togglePanel}
        className="absolute left-4 top-4 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-md hover:bg-gray-50 transition-all duration-200 z-50"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <div className="w-[400px] bg-white h-full flex flex-col rounded-3xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300">
      {/* Header Menu Area */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">{t('workspace.title')}</h2>
          {isOnline !== null && (
            <div 
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                isOnline ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}
              title={isOnline ? 'OpenCode Service Online' : 'OpenCode Service Offline'}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <button 
            onClick={() => setShowSettings(true)}
            className="hover:text-gray-900 transition-colors"
            title={t('chat.settings')}
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={handleNewChat}
            className="hover:text-gray-900 transition-colors" 
            title={t('chat.new_chat')}
          >
            <PlusCircle size={18} />
          </button>
          <button
            onClick={handleOpenHistory}
            className="hover:text-gray-900 transition-colors"
            title={t('chat.history')}
          >
            <History size={18} />
          </button>
          <button className="hover:text-gray-900"><Share2 size={18} /></button>
          <button className="hover:text-gray-900"><Copy size={18} /></button>
          <button onClick={togglePanel} className="hover:text-gray-900"><Minimize2 size={18} /></button>
        </div>
      </div>

      {/* Middle Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-6">
        {messages.length === 0 && !error && !isLoading ? (
          <div className="text-center text-gray-400 mt-20">
            <Sparkles className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-sm">{t('chat.input_placeholder')}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              // 根据消息中的 Part 类型确定消息类型
              const getMessageTypeFromParts = (): 'thinking' | 'tool_call' | 'tool_result' | 'error' | 'message' => {
                if (!msg.parts || msg.parts.length === 0) return 'message';
                
                // 检查是否有错误
                if (msg.info?.error) return 'error';
                
                // 检查是否有工具调用
                const hasToolPart = msg.parts.some(p => p.type === 'tool');
                if (hasToolPart) {
                  const toolPart = msg.parts.find(p => p.type === 'tool') as ToolPart | undefined;
                  if (toolPart?.state?.status === 'failed' || (toolPart as any)?.state?.status === 'error') return 'error';
                  if (toolPart?.state?.status === 'completed') return 'tool_result';
                  return 'tool_call';
                }
                
                // 检查是否有推理片段
                const hasReasoningPart = msg.parts.some(p => p.type === 'reasoning');
                if (hasReasoningPart) return 'thinking';
                
                return 'message';
              };

              const messageType = getMessageTypeFromParts();
              
              const getMessageStyles = () => {
                if (msg.role === 'user') {
                  return 'bg-blue-500 text-white rounded-tr-none';
                }
                
                switch (messageType) {
                  case 'thinking':
                    return 'bg-purple-50 text-purple-800 rounded-tl-none border border-purple-100 italic';
                  case 'tool_call':
                    return 'bg-amber-50 text-amber-800 rounded-tl-none border border-amber-100';
                  case 'tool_result':
                    return 'bg-green-50 text-green-800 rounded-tl-none border border-green-100';
                  case 'error':
                    return 'bg-red-50 text-red-800 rounded-tl-none border border-red-100';
                  default:
                    return 'bg-gray-50 text-gray-800 rounded-tl-none shadow-sm border border-gray-100';
                }
              };

              const getMessageIcon = () => {
                if (msg.role === 'user') return null;
                
                switch (messageType) {
                  case 'thinking':
                    return <Sparkles size={14} className="text-purple-500 mr-2" />;
                  case 'tool_call':
                    return <Zap size={14} className="text-amber-500 mr-2" />;
                  case 'tool_result':
                    return <Check size={14} className="text-green-500 mr-2" />;
                  case 'error':
                    return <AlertCircle size={14} className="text-red-500 mr-2" />;
                  default:
                    return null;
                }
              };

              const getMessageTypeLabel = () => {
                switch (messageType) {
                  case 'thinking':
                    return '思考中...';
                  case 'tool_call':
                    return '工具调用';
                  case 'tool_result':
                    return '工具结果';
                  case 'error':
                    return '错误';
                  default:
                    return '';
                }
              };

              return (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl p-3 text-sm leading-relaxed ${getMessageStyles()} ${msg.role === 'assistant' ? 'w-[300px]' : 'max-w-[85%]'}`}>
                    {msg.role === 'assistant' && messageType !== 'message' && (
                      <div className="flex items-center mb-2 text-xs font-medium opacity-80">
                        {getMessageIcon()}
                        <span>{getMessageTypeLabel()}</span>
                      </div>
                    )}
                    
                    {msg.parts && msg.parts.length > 0 ? (
                      <div className="space-y-3">
                        {msg.parts.map((part, idx) => renderPart(part, idx))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl flex flex-col gap-2">
                <p>{error}</p>
                {!sessionId && (
                  <button 
                    onClick={initSession}
                    className="text-red-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Zap size={12} /> 重试连接
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Chat Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="border border-gray-200 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-shadow bg-white">
          <textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chat.input_placeholder')}
            className="w-full h-16 resize-none outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          ></textarea>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-gray-400">
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><Paperclip size={16} /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><AtSign size={16} /></button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Lightbulb size={16} /></button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Zap size={16} /></button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Globe size={16} /></button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"><Box size={16} /></button>
              </div>
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${
                  !inputValue.trim() || isLoading ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[320px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Settings size={16} className="text-blue-500" />
                {t('chat.settings')}
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">{t('chat.model_provider')}</label>
                <select 
                  value={provider}
                  onChange={(e) => {
                    const newProvider = e.target.value;
                    setProvider(newProvider);
                    // 切换提供商时，尝试选择第一个可用模型
                    const pData = availableProviders.find(p => p.id === newProvider);
                    if (pData && pData.models && Object.keys(pData.models).length > 0) {
                      setModelId(Object.keys(pData.models)[0]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                >
                  {availableProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.id}</option>
                  ))}
                  {availableProviders.length === 0 && (
                    <option value={provider}>{provider}</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">{t('chat.model_id')}</label>
                <select 
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                >
                  {(() => {
                    const pData = availableProviders.find(p => p.id === provider);
                    if (pData && pData.models) {
                      return Object.keys(pData.models).map(mId => (
                        <option key={mId} value={mId}>{mId}</option>
                      ));
                    }
                    return <option value={modelId}>{modelId}</option>;
                  })()}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">{t('chat.api_key')}</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t('chat.api_key_placeholder')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                  />
                </div>
              </div>

              {settingsFeedback && (
                <div className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                  settingsFeedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {settingsFeedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  {settingsFeedback.message}
                </div>
              )}

              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isSavingSettings ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 active:scale-[0.98]'
                }`}
              >
                {isSavingSettings && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t('chat.save_settings')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <History size={16} className="text-blue-500" />
                {t('chat.history')}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {isHistoryLoading ? t('chat.history_loading') : `${historySessions.length}`}
                </div>
                <button
                  onClick={fetchSessionHistory}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  disabled={isHistoryLoading}
                >
                  {t('chat.history_refresh')}
                </button>
              </div>

              {historyError && (
                <div className="text-xs p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
                  {historyError}
                </div>
              )}

              {!isHistoryLoading && historySessions.length === 0 && !historyError && (
                <div className="text-sm text-gray-500 py-8 text-center">
                  {t('chat.history_empty')}
                </div>
              )}

              <div className="max-h-[360px] overflow-auto space-y-2">
                {historySessions.map(s => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (deletingSessionId) return;
                      loadHistorySession(s.id);
                    }}
                    onKeyDown={(e) => {
                      if (deletingSessionId) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadHistorySession(s.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      s.id === sessionId ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                    } ${deletingSessionId === s.id ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {s.title || s.id}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {formatHistoryTime(s.time?.updated || s.time?.created)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.id === sessionId && (
                          <div className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            {t('chat.history_current')}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (deletingSessionId) return;
                            deleteHistorySession(s.id);
                          }}
                          disabled={!!deletingSessionId}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                          title={t('chat.history_delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
