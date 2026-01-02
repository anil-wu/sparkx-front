"use client";

import React, { useState } from 'react';
import { Play, Square, Monitor } from 'lucide-react';

export default function GamePanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolution, setResolution] = useState('1920x1080');

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex justify-start p-2 shrink-0">
        <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isPlaying 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <div className="flex items-center gap-2">
              <Monitor size={16} className="text-gray-500" />
              <select 
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none"
              >
                  <option value="1920x1080">1920 x 1080 (FHD)</option>
                  <option value="1280x720">1280 x 720 (HD)</option>
                  <option value="800x600">800 x 600</option>
                  <option value="mobile">Mobile (375x667)</option>
              </select>
          </div>
        </div>
      </div>

      {/* Game Display Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-gray-200/50">
        <div 
            className="bg-black shadow-2xl relative transition-all duration-300"
            style={{
                aspectRatio: resolution === 'mobile' ? '375/667' : resolution.replace('x', '/'),
                width: resolution === 'mobile' ? 'auto' : '100%',
                height: resolution === 'mobile' ? '100%' : 'auto',
                maxWidth: '100%',
                maxHeight: '100%'
            }}
        >
            {/* Game Content Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center text-white/20">
                {isPlaying ? (
                    <div className="text-center animate-pulse">
                        <p className="text-2xl font-bold">Game Running...</p>
                        <p className="text-sm mt-2">Resolution: {resolution}</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-xl">Game Paused</p>
                        <p className="text-sm mt-2">Press Play to start</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
