"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { useI18n } from "@/i18n/client";

import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { HistoryModal } from "./HistoryModal";
import { SettingsModal } from "./SettingsModal";
import { TodoPanel } from "./TodoPanel";
import type { ChatPanelProps } from "./types";
import { useOpencodeChat } from "./useOpencodeChat";

export default function ChatPanel({ isCollapsed, togglePanel, projectId, userId }: ChatPanelProps) {
  const { locale, t } = useI18n();

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isTodoExpanded, setIsTodoExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const chat = useOpencodeChat({ locale, t, projectId, userId });

  useEffect(() => {
    setIsTodoExpanded(false);
  }, [chat.sessionId]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const seedText = inputValue;
    setInputValue("");
    await chat.sendPrompt(seedText);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={togglePanel}
        className="absolute left-4 top-4 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-md hover:bg-gray-50 transition-all duration-200 z-50"
        type="button"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <div className="w-[400px] bg-white h-full flex flex-col rounded-3xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300">
      <ChatHeader
        title={t("workspace.title")}
        isOnline={chat.isOnline}
        onOpenSettings={() => {
          setShowSettings(true);
          void chat.fetchConfig();
        }}
        onNewChat={chat.handleNewChat}
        onOpenHistory={() => {
          setShowHistory(true);
          void chat.fetchSessionHistory();
        }}
        onTogglePanel={togglePanel}
        t={t}
      />

      <ChatMessageList
        messages={chat.messages}
        isLoading={chat.isLoading}
        error={chat.error}
        sessionId={chat.sessionId}
        onRetryInitSession={chat.initSession}
        emptyPlaceholder={t("chat.input_placeholder")}
        onReplyQuestion={chat.handleReplyQuestion}
        onRejectQuestion={chat.handleRejectQuestion}
      />

      <TodoPanel todos={chat.todos} isExpanded={isTodoExpanded} onToggle={() => setIsTodoExpanded(v => !v)} />

      <ChatComposer
        inputValue={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={chat.isLoading}
        placeholder={t("chat.input_placeholder")}
      />

      {showSettings && (
        <SettingsModal
          provider={chat.provider}
          setProvider={chat.setProvider}
          modelId={chat.modelId}
          setModelId={chat.setModelId}
          apiKey={chat.apiKey}
          setApiKey={chat.setApiKey}
          availableProviders={chat.availableProviders}
          isSaving={chat.isSavingSettings}
          feedback={chat.settingsFeedback}
          onSave={async () => {
            const ok = await chat.handleSaveSettings();
            if (ok) setTimeout(() => setShowSettings(false), 1500);
          }}
          onClose={() => setShowSettings(false)}
          t={t}
        />
      )}

      {showHistory && (
        <HistoryModal
          sessions={chat.historySessions}
          currentSessionId={chat.sessionId}
          isLoading={chat.isHistoryLoading}
          error={chat.historyError}
          deletingSessionId={chat.deletingSessionId}
          onRefresh={chat.fetchSessionHistory}
          onLoadSession={async id => {
            const ok = await chat.loadHistorySession(id);
            if (ok) setShowHistory(false);
          }}
          onRenameSession={async id => {
            await chat.handleRenameSession(id);
          }}
          onDeleteSession={async id => {
            await chat.deleteHistorySession(id);
          }}
          onClose={() => setShowHistory(false)}
          formatTime={chat.formatHistoryTime}
          t={t}
        />
      )}
    </div>
  );
}
