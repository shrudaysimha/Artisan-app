"use client";

import React, { useState } from "react";
import { FiX, FiCheck, FiCpu, FiKey, FiGlobe, FiRadio, FiShield, FiPlay } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";

export default function BhashiniModal({ isOpen, onClose }) {
  const {
    currentLang,
    bhashiniKey,
    bhashiniUserId,
    bhashiniEndpoint,
    saveBhashiniConfig,
    isBhashiniActive,
    t,
  } = useLanguage();

  const [apiKey, setApiKey] = useState(bhashiniKey || "");
  const [userId, setUserId] = useState(bhashiniUserId || "");
  const [endpoint, setEndpoint] = useState(
    bhashiniEndpoint || "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error("Please enter your Bhashini Udhyat API Key first");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const sampleText = "Are you an artisan or weaver? CraftLens Studio calculates fair pricing.";
      const targetLang = currentLang === "en" ? "te" : currentLang;

      const res = await fetch("http://localhost:8000/api/bhashini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          source_lang: "en",
          target_lang: targetLang,
          api_key: apiKey.trim(),
          user_id: userId.trim() || undefined,
          endpoint: endpoint.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          text: data.translated_text,
          lang: targetLang,
        });
        toast.success("Bhashini Dhruva Pipeline Verified!");
      } else {
        setTestResult({
          success: false,
          error: data.error || "Inference failed",
          details: data.details,
        });
        toast.error(data.error || "Connection error");
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message,
      });
      toast.error("Failed to reach backend Bhashini proxy");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveBhashiniConfig(apiKey.trim(), userId.trim(), endpoint.trim());
    toast.success("Bhashini Gateway configuration saved!");
    onClose();
  };

  const handleClear = () => {
    saveBhashiniConfig("", "", "");
    setApiKey("");
    setUserId("");
    toast("Bhashini Gateway deactivated", { icon: "ℹ️" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-belikan-surface rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-belikan-card border border-belikan-border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-belikan-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-belikan-softRose text-belikan-primary flex items-center justify-center text-lg font-bold">
              🇮🇳
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-belikan-dark leading-snug">
                Digital India Bhashini Gateway
              </h3>
              <p className="text-[11px] text-belikan-secondary">
                National Language Translation Mission (NLTM / Udhyat)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-belikan-neutral hover:text-belikan-dark transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Status Pill */}
        <div className="my-4 p-3 rounded-2xl bg-belikan-bg border border-belikan-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isBhashiniActive ? "bg-belikan-green animate-pulse" : "bg-belikan-neutral"
              }`}
            />
            <span className="text-xs font-semibold text-belikan-dark">
              {isBhashiniActive ? "Udhyat Inference Active" : "Local Standalone Dictionary Mode"}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-belikan-surface border border-belikan-border text-belikan-secondary">
            Dhruva / ULCA
          </span>
        </div>

        {/* Configuration Form */}
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-belikan-dark mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FiKey className="text-belikan-primary" /> Bhashini Udhyat API Key *
              </span>
              <span className="text-[10px] text-belikan-secondary font-normal">
                From Bhashini Udhyat Portal
              </span>
            </label>
            <input
              type="password"
              placeholder="Paste your Bhashini / Udhyat Inference API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-belikan-bg border border-belikan-border text-belikan-dark text-xs focus:outline-none focus:border-belikan-primary transition-all font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-belikan-dark mb-1 flex items-center justify-between">
              <span>User ID (Optional)</span>
              <span className="text-[10px] text-belikan-secondary font-normal">
                If provided with your Udhyat grant
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. udhyat_user_id or organization ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-belikan-bg border border-belikan-border text-belikan-dark text-xs focus:outline-none focus:border-belikan-primary transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-belikan-dark mb-1 flex items-center justify-between">
              <span>Inference Pipeline URL</span>
              <span className="text-[10px] text-belikan-secondary font-normal">
                Default: Dhruva ULCA Gateway
              </span>
            </label>
            <input
              type="text"
              placeholder="https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-belikan-bg border border-belikan-border text-belikan-dark text-xs focus:outline-none focus:border-belikan-primary transition-all font-mono"
            />
          </div>

          {/* Test Pipeline Action */}
          <div className="pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
              className="w-full py-2.5 rounded-xl border border-belikan-primary/30 hover:bg-belikan-softRose text-belikan-primary font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiPlay className="text-xs" />
              <span>{testing ? "Testing Pipeline Inference..." : "Test Pipeline Connection"}</span>
            </button>
          </div>

          {/* Test Results Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testResult.success
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {testResult.success ? (
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1 text-green-800">
                    <FiCheck /> Bhashini NMT Translation Verified:
                  </p>
                  <p className="font-serif italic bg-white/70 p-2 rounded-lg border border-green-200">
                    &quot;{testResult.text}&quot;
                  </p>
                  <p className="text-[10px] text-green-700">
                    Source: English → Target: {testResult.lang.toUpperCase()}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-red-800">Connection Note:</p>
                  <p className="text-[11px] mt-0.5">{testResult.error}</p>
                  {testResult.details && (
                    <p className="text-[10px] opacity-80 mt-1 font-mono">{testResult.details}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Capabilities Info Callout */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
            <p className="font-bold">What Bhashini enables in CraftLens:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-amber-800">
              <li>
                <strong>Studio Voice Notes (ASR):</strong> Rural weavers describe techniques in Telugu, Hindi, Bengali, or Kannada; AI transcribes it into catalog copy.
              </li>
              <li>
                <strong>Live NMT:</strong> Dynamic appraisal narratives & customer inquiries translate on the fly.
              </li>
              <li>
                <strong>Hybrid Fallback:</strong> If Bhashini API quota is reached or network is offline, the local CraftLens dictionary renders instantly.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-belikan-border">
          {isBhashiniActive ? (
            <button
              onClick={handleClear}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-belikan-secondary hover:text-belikan-dark transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-belikan-dark hover:bg-belikan-primary text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
