"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<Props> = ({ onTranscript, disabled }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSpeechSupported(true);
    }
  }, []);

  const handleToggleListen = () => {
    if (!speechSupported) {
      // Fallback demo speech simulation
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        onTranscript("Which highway corridors are high risk with active landslides today?");
      }, 1500);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        onTranscript(transcriptText);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error", e);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleListen}
      disabled={disabled}
      title={isListening ? "Listening... Speak your query" : "Voice Input (Speech-to-Text)"}
      className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
        isListening
          ? "bg-red-500/20 text-red-400 border-red-500 animate-pulse shadow-lg shadow-red-950/50"
          : "bg-slate-900 text-slate-300 border-slate-800 hover:text-cyan-300 hover:border-cyan-500/40"
      }`}
    >
      {isListening ? (
        <Volume2 className="w-4 h-4 text-red-400 animate-bounce" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};
