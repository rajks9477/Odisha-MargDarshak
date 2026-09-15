"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe2, Check, X } from "lucide-react";
import { useLanguage, SupportedLanguage, LanguageMeta } from "@/context/LanguageContext";

interface Props {
  variant?: "CIRCLE_ICON" | "FLOATING_GLASS" | "COMPACT";
  className?: string;
}

export const LanguageSelector: React.FC<Props> = ({ variant = "CIRCLE_ICON", className = "" }) => {
  const { language, setLanguage, currentMeta, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative pointer-events-auto ${className}`}>
      {/* 1. Simple Clean Circle Shaped Trigger Button */}
      {variant === "CIRCLE_ICON" ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-95 ${
            isOpen
              ? "bg-emerald-800 text-white border-2 border-emerald-600 shadow-emerald-900/20"
              : "bg-white/95 backdrop-blur-md border border-stone-200/90 text-stone-800 hover:border-emerald-600 hover:text-emerald-800"
          }`}
          title={`Language: ${currentMeta.nativeName} (${currentMeta.name}) - Click to Change`}
        >
          <div className="flex flex-col items-center justify-center">
            <Globe2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800" />
            <span className="text-[8px] font-black uppercase tracking-tighter leading-none mt-0.5 text-stone-900">
              {currentMeta.code.toUpperCase()}
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 hover:border-emerald-600 text-stone-800 shadow-md cursor-pointer"
        >
          <Globe2 className="w-4 h-4 text-emerald-800" />
          <span className="text-xs font-bold">{currentMeta.nativeName}</span>
        </button>
      )}

      {/* 2. Simple, Clean, Normal Dropdown UI */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-white/98 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-stone-900">
                Select Language
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Languages Grid */}
          <div className="max-h-64 overflow-y-auto p-1 space-y-1 mt-1 scrollbar-thin">
            {languages.map((l: LanguageMeta) => {
              const isSelected = l.code === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold"
                      : "hover:bg-stone-100 text-stone-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{l.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-900">
                        {l.nativeName}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {l.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
