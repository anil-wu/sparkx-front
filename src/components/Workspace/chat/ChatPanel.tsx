"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, History, Share2, Copy, Minimize2, Paperclip, AtSign, Lightbulb, Zap, Globe, Box, ArrowUp, ChevronLeft, Sparkles, Settings, X, Check, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { createOpencodeClient } from "@opencode-ai/sdk";

interface ChatPanelProps {
  isCollapsed: boolean;
  togglePanel: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  parts?: any[];
}

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
});

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

  // 检查服务健康状态
  const checkHealth = async () => {
    try {
      const response = await client.config.get();
      const online = !!response.data;
      
      // 如果服务上线了且当前没有会话 ID，自动尝试初始化
      if (online && !sessionId && !isLoading) {
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
    const timer = setInterval(checkHealth, 30000); // 每30秒检查一次
    return () => clearInterval(timer);
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
    setIsLoading(true);
    setError(null);
    try {
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
    if (!sessionId || !isOnline) return;

    let abortController: AbortController | null = null;
    let eventStream: any = null;

    const setupSSE = async () => {
      try {
        console.log("Setting up SSE event stream for session:", sessionId);
        
        // 创建 AbortController 用于取消订阅
        abortController = new AbortController();
        
        // 使用 SDK 的 event.subscribe 方法，传入 onSseEvent 回调
        const result = await client.event.subscribe({
          signal: abortController.signal,
          onSseEvent: (event: any) => {
            console.log("SSE event received------》:", event);
            if (!event || !event.data) return;
            
            const data = event.data;
            console.log("SSE event received:", data);
            
            // 过滤当前会话相关的事件
            if (data.sessionID === sessionId) {
              const { type, properties } = data;
              
              if (type === 'message.part.updated' || type === 'message.updated' || type === 'message.part.removed') {
                setMessages(prev => {
                  const msgId = properties?.messageID || properties?.part?.messageID;
                  const existingMsgIdx = prev.findIndex(m => m.id === msgId);
                  
                  if (existingMsgIdx !== -1) {
                    const newMessages = [...prev];
                    const existingMsg = { ...newMessages[existingMsgIdx] };
                    
                    if (type === 'message.part.updated' && properties?.part) {
                      const part = properties.part;
                      const existingParts = [...(existingMsg.parts || [])];
                      const partIdx = existingParts.findIndex((p: any) => p.id === part.id);
                      
                      if (partIdx !== -1) {
                        existingParts[partIdx] = part;
                      } else {
                        existingParts.push(part);
                      }
                      
                      existingMsg.parts = existingParts;
                      existingMsg.content = existingParts.map((p: any) => p.text || '').filter(Boolean).join('\n');
                    } else if (type === 'message.part.removed') {
                      const existingParts = (existingMsg.parts || []).filter((p: any) => p.id !== properties.id);
                      existingMsg.parts = existingParts;
                      existingMsg.content = existingParts.map((p: any) => p.text || '').filter(Boolean).join('\n');
                    } else if (type === 'message.updated' && properties.message) {
                      existingMsg.content = properties.message.parts?.map((p: any) => p.text || '').filter(Boolean).join('\n') || existingMsg.content;
                      existingMsg.parts = properties.message.parts || existingMsg.parts;
                    }
                    
                    newMessages[existingMsgIdx] = existingMsg;
                    return newMessages;
                  } else if (type === 'message.updated' && properties.message && properties.message.role === 'assistant') {
                    return [...prev, {
                      id: msgId,
                      role: 'assistant',
                      content: properties.message.parts?.map((p: any) => p.text || '').filter(Boolean).join('\n') || '',
                      timestamp: new Date(),
                      parts: properties.message.parts
                    }];
                  }
                  
                  return prev;
                });
              }
            }
          }
        });
        
        eventStream = result;
        console.log("SSE event stream established");
      } catch (err) {
        console.error("Failed to setup SSE:", err);
      }
    };

    setupSSE();

    return () => {
      if (abortController) {
        abortController.abort();
        console.log("SSE event stream aborted");
      }
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

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending prompt to OpenCode session:", sessionId, inputValue);
      const response = await client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: "text", text: inputValue }]
        }
      });

      console.log("OpenCode prompt response:", response);

      if (response.data) {
        const assistantMessage: ChatMessage = {
          id: response.data.info?.id || Date.now().toString(),
          role: 'assistant',
          content: response.data.parts?.map((p: any) => p.text || '').filter(Boolean).join('\n') || '',
          timestamp: new Date(),
          parts: response.data.parts
        };
        
        // 如果没有内容也没有零件，显示一条提示信息以便调试
        if (!assistantMessage.content && (!assistantMessage.parts || assistantMessage.parts.length === 0)) {
          assistantMessage.content = "(收到空回复，请检查模型配置或 API Key)";
        }
        
        setMessages(prev => [...prev, assistantMessage]);
      } else if (response.error) {
        console.error("OpenCode error response:", response.error);
        setError(t('chat.error_send_failed') + ": " + JSON.stringify(response.error));
      } else {
        console.warn("Received empty response from OpenCode prompt");
        setError(t('chat.error_send_failed') + " (空响应)");
      }
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
          <button className="hover:text-gray-900"><History size={18} /></button>
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
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none' 
                    : 'bg-gray-50 text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                }`}>
                  {msg.parts && msg.parts.length > 0 ? (
                    <div className="space-y-3">
                      {msg.parts.map((part, idx) => {
                        if (part.type === 'text') {
                          return <div key={idx} className="whitespace-pre-wrap">{part.text}</div>;
                        }
                        if (part.type === 'file' && part.mime?.startsWith('image/')) {
                          return (
                            <div key={idx} className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-white">
                              <img 
                                src={part.url.startsWith('http') ? part.url : `http://localhost:4096${part.url}`} 
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
                        if (part.type === 'file') {
                          return (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 text-xs">
                              <Paperclip size={14} className="text-gray-400" />
                              <a href={part.url.startsWith('http') ? part.url : `http://localhost:4096${part.url}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">
                                {part.filename || 'Download File'}
                              </a>
                            </div>
                          );
                        }
                        if (part.type === 'subtask') {
                          return (
                            <div key={idx} className="p-2 bg-blue-50/50 rounded-lg border border-blue-100/50 text-xs">
                              <div className="flex items-center gap-2 mb-1 font-medium text-blue-700">
                                <Box size={12} />
                                <span>{part.agent || 'Subtask'}</span>
                              </div>
                              <p className="text-blue-600/80">{part.description || part.prompt}</p>
                            </div>
                          );
                        }
                        if (part.type === 'agent') {
                          return (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100/50 rounded-lg text-xs italic text-gray-500">
                              <Sparkles size={12} />
                              <span>{part.name} is thinking...</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
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
    </div>
  );
}
