"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, RotateCcw, Check, Radio, Globe } from "lucide-react";
import { voiceService } from "../services/voiceService";
import { VoiceRecordingResult } from "../types/incidentTypes";

interface Props {
  voiceResult: VoiceRecordingResult | null;
  onRecordingComplete: (result: VoiceRecordingResult | null) => void;
}

const REGIONAL_LANGUAGES = [
  { code: "en-IN", name: "English (Indian)" },
  { code: "hi-IN", name: "हिन्दी (Hindi)" },
  { code: "as-IN", name: "অসমীয়া (Assamese)" },
  { code: "bn-IN", name: "বাংলা (Bengali)" },
];

export const VoiceRecorder: React.FC<Props> = ({
  voiceResult,
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStart = async () => {
    setError(null);
    try {
      await voiceService.startRecording();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Mic access failed", err);
      setError(err.message || "Microphone access denied.");
    }
  };

  const handleStop = async () => {
    try {
      const result = await voiceService.stopRecording(selectedLang);
      setIsRecording(false);
      onRecordingComplete(result);
    } catch (err: any) {
      console.error("Stop recording failed", err);
      setError("Failed to process audio recording.");
      setIsRecording(false);
    }
  };

  const handleCancel = () => {
    voiceService.cancelRecording();
    setIsRecording(false);
    onRecordingComplete(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          5. Voice Report
        </label>
        {/* Language Picker */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Globe className="w-3 h-3 text-cyan-400" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isRecording}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 text-[10px] focus:outline-none"
          >
            {REGIONAL_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Recording Control Box */}
      {!voiceResult ? (
        <div className={`p-3.5 rounded-xl border transition-all ${
          isRecording
            ? "bg-red-950/30 border-red-500/50 shadow-lg shadow-red-950/20"
            : "bg-slate-900/60 border-slate-800"
        }`}>
          {isRecording ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-red-400">Recording Voice Note...</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration} / 01:00
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Speak in your regional language. Audio & transcript will be preserved.
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                Tap to Record
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Voice Note Preview Card */
        <div className="p-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Voice Note Captured</div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  {voiceResult.durationSeconds}s duration • {selectedLang}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 bg-slate-800/80 rounded-lg"
            >
              <RotateCcw className="w-3 h-3" />
              Re-record
            </button>
          </div>

          {/* Transcript preview */}
          {voiceResult.transcript && (
            <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300 italic">
              &quot;{voiceResult.transcript}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
