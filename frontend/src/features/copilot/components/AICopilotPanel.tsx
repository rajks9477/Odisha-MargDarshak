"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, CopilotResponse } from "../types/copilotTypes";
import { copilotApi } from "../api/copilotApi";
import { VoiceInputButton } from "./VoiceInputButton";
import { ProposedActionCard } from "./ProposedActionCard";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Volume2,
} from "lucide-react";

interface Props {
  defaultOpen?: boolean;
  onClose?: () => void;
}

export const AICopilotPanel: React.FC<Props> = ({ defaultOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [samplePrompts, setSamplePrompts] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial sample prompts and greeting
    copilotApi.getSamplePrompts().then((prompts) => {
      setSamplePrompts(prompts);
    });

    setMessages([
      {
        id: "msg-0",
        sender: "COPILOT",
        text: "Namaste Officer! I am your **NER–MargDarshak Decision Support Copilot**. Ask me anything about highway road passability, verified ground landslides, critical relief shipments, IMD heavy-rainfall warnings, or cascading district risks.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "USER",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const resp = await copilotApi.sendQuery(text, conversationId || undefined);
      setConversationId(resp.conversation_id);

      const copilotMsg: ChatMessage = {
        id: `cop-${Date.now()}`,
        sender: "COPILOT",
        text: resp.answer,
        responsePayload: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (e) {
      console.warn("Copilot query error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "COPILOT",
          text: "I encountered an issue querying system telemetry. Please verify that backend services are active.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (transcriptText: string) => {
    setQuery(transcriptText);
    handleSend(transcriptText);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs rounded-full shadow-2xl shadow-cyan-950/80 border border-cyan-400/40 flex items-center gap-2 transition-all hover:scale-105 group"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
        <span>Ask AI Copilot</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[560px]">
      {/* Drawer Header */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100">NER AI Copilot</h3>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800">
                RAG Engine V1.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Grounded Decision-Support Layer</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "USER" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl text-xs space-y-2 leading-relaxed ${
                m.sender === "USER"
                  ? "bg-indigo-600 text-white rounded-br-none shadow"
                  : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* RAG Tools & Citation Chips */}
              {m.responsePayload && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {m.responsePayload.tools_used.map((tool) => (
                      <span
                        key={tool}
                        className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-900"
                      >
                        ✓ {tool}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Confidence: {m.responsePayload.confidence_score}%</span>
                    <span className="text-slate-500">Source: PostGIS & Live GIS</span>
                  </div>

                  {/* Proposed Action Card (Human in the Loop) */}
                  {m.responsePayload.proposed_action && (
                    <ProposedActionCard action={m.responsePayload.proposed_action} />
                  )}
                </div>
              )}
            </div>

            <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Analyzing multi-modal telemetry and executing platform tools...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Sample Quick Prompts */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
        {samplePrompts.slice(0, 3).map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-[10px] whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Query Input & Voice Button */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <VoiceInputButton onTranscript={handleVoiceTranscript} disabled={loading} />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI Copilot in text or voice (e.g. Which roads are high risk?)..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
