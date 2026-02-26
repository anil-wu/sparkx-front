"use client";

import React from "react";
import { ArrowUp, AtSign, Box, Globe, Lightbulb, Paperclip, Zap } from "lucide-react";

export function ChatComposer({
  inputValue,
  onChange,
  onSend,
  isLoading,
  placeholder,
}: {
  inputValue: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder: string;
}) {
  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="border border-gray-200 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-shadow bg-white">
        <textarea
          value={inputValue}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className="w-full h-16 resize-none outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-gray-400">
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" type="button">
              <Paperclip size={16} />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" type="button">
              <AtSign size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all" type="button">
                <Lightbulb size={16} />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all" type="button">
                <Zap size={16} />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all" type="button">
                <Globe size={16} />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all" type="button">
                <Box size={16} />
              </button>
            </div>
            <button
              onClick={onSend}
              disabled={!inputValue.trim() || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${
                !inputValue.trim() || isLoading ? "bg-gray-300" : "bg-blue-500 hover:bg-blue-600"
              }`}
              type="button"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

