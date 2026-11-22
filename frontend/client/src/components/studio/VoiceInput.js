"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VoiceInput({ value, onChange, placeholder }) {
  const { lang, t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [supportSpeech, setSupportSpeech] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === "en" ? "en-IN" : `${lang}-IN`; // Map lang to BCP-47

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onerror = (event) => {
        setError(`Microphone error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          onChange(value + " " + finalTranscript.trim());
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSupportSpeech(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang, value, onChange]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Handle if already started
        console.error(e);
      }
    }
  };

  const clearText = () => {
    onChange("");
  };

  return (
    <div className="space-y-3">
      {supportSpeech && (
        <div className="flex items-center gap-4 border border-artisan-olive/20 p-3 rounded-xl bg-gray-50">
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? "bg-red-500 animate-pulse text-white shadow-lg shadow-red-500/30" 
                : "bg-artisan-terracotta text-white hover:bg-[#b0553e]"
            }`}
            title="Toggle Microphone"
            aria-label="Toggle Voice Recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-artisan-brown">
              {isRecording ? "Recording... Please speak." : "Tap microphone to speak"}
            </p>
            <p className="text-xs text-artisan-olive">
              Language matched to: {lang.toUpperCase()}
            </p>
          </div>
          {value && (
            <button
              type="button"
              onClick={clearText}
              className="px-3 py-1 text-xs text-artisan-terracotta hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-32 rounded-xl border-gray-300 focus:border-artisan-terracotta focus:ring-artisan-terracotta p-4"
        dir="auto"
      />
    </div>
  );
}
