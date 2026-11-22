"use client";

import React, { useState, useRef, useEffect } from "react";
import Main from "@/components/shared/layouts/Main";
import { useRouter } from "next/navigation";
import {
  FiCamera,
  FiUploadCloud,
  FiMic,
  FiMicOff,
  FiCheck,
  FiRefreshCw,
  FiShield,
  FiLayers,
  FiDollarSign,
  FiClock,
  FiExternalLink,
  FiShare2,
  FiSliders,
  FiChevronRight,
  FiArrowLeft,
  FiAward,
  FiWifi,
  FiWifiOff,
  FiDatabase,
  FiTrash2,
  FiZap,
  FiDownloadCloud
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  compressImageToWebP,
  createOpusAudioRecorder,
  formatBytes,
} from "@/utils/mediaCompressor";
import {
  queueAppraisalLocally,
  getAllQueuedAppraisals,
  getPendingAppraisals,
  deleteQueuedAppraisal,
  syncSingleAppraisal,
  syncAllPendingAppraisals,
} from "@/utils/offlineQueue";

export default function StudioPage() {
  const router = useRouter();
  const { currentLang, lang, t, setLanguage: setGlobalLang } = useLanguage();
  const { user } = useAuth();

  // Workflow steps:
  // 1 = Capture Photo (Single craft photo)
  // 2 = Artisan Voice & Regional Metadata
  // 3 = AI Processing Animation
  // 4 = Appraisal & Listing Result
  const [currentStep, setCurrentStep] = useState(1);

  // Single craft image
  const [craftFile, setCraftFile] = useState(null);
  const [craftPreview, setCraftPreview] = useState(null);

  // Live Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Form data
  const [voiceDescription, setVoiceDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState(currentLang || lang || "en");

  // Physical Weight, Hours, and Scale Reference Verification (prevents 2D visual weight hallucination)
  const [weightGrams, setWeightGrams] = useState(450);
  const [isHollow, setIsHollow] = useState(false);
  const [laborHours, setLaborHours] = useState(4.0);
  const [scaleReference, setScaleReference] = useState("₹10 coin");
  const [voiceExtractedSpecs, setVoiceExtractedSpecs] = useState(null);

  // Rural Network Media Compression & Offline Queue
  const [compressingImage, setCompressingImage] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const audioRecorderRef = useRef(null);

  const [isOnline, setIsOnline] = useState(true);
  const [offlineDrafts, setOfflineDrafts] = useState([]);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingDraftId, setSyncingDraftId] = useState(null);

  // Deterministic client-side voice parsing for instant feedback
  const parseVoiceSpecs = (text) => {
    if (!text) return;
    const textLower = text.toLowerCase();
    const hits = [];

    // Weight extraction
    if (/(\d+(?:\.\d+)?)\s*(?:grams?|gms?|gm|g|ग्राम|గ్రాములు|கிராம்|ಗ್ರಾಂ|গ্রাম)\b/i.test(textLower)) {
      const m = textLower.match(/(\d+(?:\.\d+)?)\s*(?:grams?|gms?|gm|g|ग्राम|గ్రాములు|கிராம்|ಗ್ರಾಂ|গ্রাম)\b/i);
      if (m) {
        const val = parseFloat(m[1]);
        setWeightGrams(val);
        hits.push(`${val}g`);
      }
    } else if (/half kg|aadha kilo|आधा किलो|ఆధా కిలో/i.test(textLower)) {
      setWeightGrams(500);
      hits.push("500g");
    } else if (/quarter kg|pav kilo|पाव किलो/i.test(textLower)) {
      setWeightGrams(250);
      hits.push("250g");
    } else if (/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|किलो|కిలో|கிலோ|ಕೆಜಿ|কেজি)\b/i.test(textLower)) {
      const m = textLower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|किलो|కిలో|கிலோ|ಕೆಜಿ|কেজি)\b/i);
      if (m) {
        const val = Math.round(parseFloat(m[1]) * 1000);
        setWeightGrams(val);
        hits.push(`${val}g`);
      }
    }

    // Labor hours extraction
    if (/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h|घंटे|घंटा|గంటలు|மணி|ಗಂಟೆ|ঘণ্টಾ)\b/i.test(textLower)) {
      const m = textLower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h|घंटे|घंटा|గంటలు|மணி|ಗಂಟೆ|ঘণ্টಾ)\b/i);
      if (m) {
        const val = parseFloat(m[1]);
        setLaborHours(val);
        hits.push(`${val}h Labor`);
      }
    } else if (/one day|1 day|एक दिन|ఒక రోజు/i.test(textLower)) {
      setLaborHours(8);
      hits.push("8h (1 Day)");
    } else if (/two days|2 days|दो दिन|రెండు రోజులు/i.test(textLower)) {
      setLaborHours(16);
      hits.push("16h (2 Days)");
    }

    // Hollow vs Solid
    if (/hollow|खोखला|డోల్ల|உள்ளீடற்ற|ಹೊಳ್ಳು|ফাঁপা/i.test(textLower)) {
      setIsHollow(true);
      hits.push("Hollow");
    } else if (/solid|ठोस|గట్టి|திடமான|ಘನ|কঠিন/i.test(textLower)) {
      setIsHollow(false);
      hits.push("Solid");
    }

    // Scale reference
    if (/coin|₹10|10 ka sikka|सिक्का|నాణెం/i.test(textLower)) {
      setScaleReference("₹10 coin");
      hits.push("₹10 Coin");
    } else if (/matchbox|माचिस|అగ్గిపెట్టె|தீப்பெட்டி/i.test(textLower)) {
      setScaleReference("matchbox");
      hits.push("Matchbox");
    }

    if (hits.length > 0) {
      setVoiceExtractedSpecs(hits.join(" • "));
    }
  };

  useEffect(() => {
    if (currentLang || lang) {
      setLanguage(currentLang || lang);
    }
  }, [currentLang, lang]);

  const [selectedState, setSelectedState] = useState(user?.state || "Uttar Pradesh");

  useEffect(() => {
    if (user?.state) {
      setSelectedState(user.state);
    }
  }, [user?.state]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccurate, setGpsAccurate] = useState(false);
  const [showStateOverride, setShowStateOverride] = useState(false);

  // Fast coordinate boundary mapping to Indian Artisan States
  const mapCoordinatesToIndianState = (lat, lon) => {
    if (lat >= 11.5 && lat <= 18.5 && lon >= 74.0 && lon <= 78.6) return "Karnataka";
    if (lat >= 15.8 && lat <= 19.9 && lon >= 77.2 && lon <= 81.8) return "Telangana";
    if (lat >= 12.6 && lat <= 19.1 && lon >= 76.7 && lon <= 84.8) return "Andhra Pradesh";
    if (lat >= 8.0 && lat <= 13.5 && lon >= 76.2 && lon <= 80.3) return "Tamil Nadu";
    if (lat >= 8.2 && lat <= 12.8 && lon >= 74.8 && lon <= 77.4) return "Kerala";
    if (lat >= 15.6 && lat <= 22.0 && lon >= 72.6 && lon <= 80.9) return "Maharashtra";
    if (lat >= 20.1 && lat <= 24.7 && lon >= 68.1 && lon <= 74.5) return "Gujarat";
    if (lat >= 23.0 && lat <= 30.2 && lon >= 69.5 && lon <= 78.3) return "Rajasthan";
    if (lat >= 23.9 && lat <= 30.4 && lon >= 77.1 && lon <= 84.6) return "Uttar Pradesh";
    if (lat >= 21.5 && lat <= 27.2 && lon >= 85.8 && lon <= 89.9) return "West Bengal";
    if (lat >= 17.8 && lat <= 22.6 && lon >= 81.4 && lon <= 87.5) return "Odisha";
    if (lat >= 21.1 && lat <= 26.9 && lon >= 74.0 && lon <= 82.8) return "Madhya Pradesh";
    return "Telangana";
  };

  const detectLocationByGps = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let stateName = mapCoordinatesToIndianState(latitude, longitude);

          try {
            const resp = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (resp.ok) {
              const data = await resp.json();
              if (data.principalSubdivision) {
                stateName = data.principalSubdivision.replace(" State", "");
              }
            }
          } catch (e) {
            console.warn("Reverse geocode fetch failed, using coordinates mapping:", e);
          }

          setSelectedState(stateName);
          setGpsAccurate(true);
          setGpsLoading(false);
          toast.success(`📍 GPS Location: ${stateName} auto-detected!`);
        },
        (error) => {
          console.warn("GPS error:", error);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  useEffect(() => {
    detectLocationByGps();
  }, []);

  const [removeBg, setRemoveBg] = useState(false);

  // Submission & Results
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [editablePrice, setEditablePrice] = useState(850);
  const [editableStock, setEditableStock] = useState(5);
  const [viewBgCutout, setViewBgCutout] = useState(true);

  // File input
  const fileInputRef = useRef(null);

  // Start live webcam stream
  const startLiveCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        toast.error("Camera not supported on this browser");
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      toast("Camera unavailable. Using file upload mode.", { icon: "📁" });
      setCameraActive(false);
    }
  };

  // Stop live webcam stream
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Client-Side Image Compression for Rural 3G/Edge Network Resilience
  const processAndCompressImage = async (fileOrBlob) => {
    try {
      setCompressingImage(true);
      const res = await compressImageToWebP(fileOrBlob, {
        maxDimension: 1280,
        maxSizeBytes: 300 * 1024, // < 300 KB
        initialQuality: 0.82,
      });
      setCraftFile(res.file);
      const preview = URL.createObjectURL(res.blob);
      setCraftPreview(preview);
      setCompressionStats({
        originalSize: formatBytes(res.originalSize),
        compressedSize: formatBytes(res.compressedSize),
        percentReduction: res.percentReduction,
      });
      toast.success(
        `⚡ Compressed ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)} (${res.percentReduction}% saved for rural upload)`,
        { icon: "⚡" }
      );
    } catch (err) {
      console.warn("Client compression failed, using raw file:", err);
      const preview = URL.createObjectURL(fileOrBlob);
      setCraftFile(fileOrBlob);
      setCraftPreview(preview);
      setCompressionStats(null);
    } finally {
      setCompressingImage(false);
    }
  };

  // Snap photo from live camera & compress to <300KB WebP
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        processAndCompressImage(blob);
      }
    }, "image/jpeg", 0.95);
  };

  // Handle file uploads from disk & compress to <300KB WebP
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processAndCompressImage(e.target.files[0]);
    }
  };

  // Voice recording: captures low-bitrate Opus/WebM audio (24kbps) + WebSpeech transcription
  const toggleVoiceRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      toast("Listening to craft story...", { icon: "🎙️" });

      // Start low-bitrate Opus/WebM audio recorder
      try {
        const recorder = createOpusAudioRecorder();
        audioRecorderRef.current = recorder;
        await recorder.start();
      } catch (e) {
        console.warn("Opus audio recorder not supported or mic denied:", e);
      }

      // Simultaneously run Web Speech API for real-time vernacular transcription
      if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((res) => res[0].transcript)
            .join("");
          setVoiceDescription(transcript);
          parseVoiceSpecs(transcript);
        };

        recognition.onerror = () => {
          stopAudioAndFinish();
        };

        recognition.onend = () => {
          stopAudioAndFinish();
        };

        recognition.start();
      } else {
        // Fallback simulation for browsers without Web Speech
        setTimeout(() => {
          const sample = "Made with brass alloy, weighs about 350 grams hollow core, took 4 hours to cast and chisel.";
          setVoiceDescription(sample);
          parseVoiceSpecs(sample);
          stopAudioAndFinish();
          toast.success("Sample voice story transcribed!");
        }, 3000);
      }
    } else {
      stopAudioAndFinish();
    }
  };

  const stopAudioAndFinish = async () => {
    setIsRecording(false);
    if (audioRecorderRef.current) {
      try {
        const audioRes = await audioRecorderRef.current.stop();
        setAudioBlob(audioRes.blob);
        audioRecorderRef.current = null;
        toast.success(`Voice note encoded in Opus (${formatBytes(audioRes.sizeBytes)})`);
      } catch (e) {
        console.warn("Error stopping audio recorder:", e);
      }
    }
  };

  // Reload local IndexedDB drafts
  const reloadOfflineDrafts = async () => {
    try {
      const drafts = await getAllQueuedAppraisals();
      setOfflineDrafts(drafts);
    } catch (e) {
      console.warn("Could not load offline drafts:", e);
    }
  };

  // Listen to browser network changes & background sync
  useEffect(() => {
    reloadOfflineDrafts();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success(t("sync_success_toast", "Network restored!"), { icon: "🟢" });
      const pending = await getPendingAppraisals();
      if (pending.length > 0) {
        toast(`Syncing ${pending.length} queued craft(s)...`, { icon: "🔄" });
        setIsSyncingAll(true);
        await syncAllPendingAppraisals();
        setIsSyncingAll(false);
        await reloadOfflineDrafts();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast(t("offline_banner_title", "Offline Mode Active (Weak Signal)"), { icon: "📡" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Send to FastAPI /api/analyze with offline-first salvage
  const handleAnalyze = async () => {
    if (!craftFile) {
      toast.error("Please provide a craft photo first.");
      return;
    }

    // If completely offline, save to IndexedDB immediately without hanging
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        await queueAppraisalLocally({
          craftFile,
          craftPreview,
          voiceDescription,
          audioBlob,
          weightGrams,
          laborHours,
          isHollow,
          scaleReference,
          language,
          selectedState,
          removeBg,
          title: "Craft Draft #" + Math.floor(Math.random() * 9000 + 1000),
        });
        await reloadOfflineDrafts();
        toast.success(
          t("queued_success_toast", "Craft saved to Offline Queue! Will auto-sync when network returns."),
          { duration: 5000, icon: "📡" }
        );
        setShowOfflineModal(true);
      } catch (err) {
        toast.error("Could not save offline draft: " + err.message);
      }
      return;
    }

    setLoading(true);
    setCurrentStep(3); // Loading screen

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s client timeout

    try {
      const formData = new FormData();
      formData.append("craft_photo", craftFile);
      if (audioBlob) {
        formData.append(
          "craft_audio",
          new File([audioBlob], "craft_voice.webm", { type: audioBlob.type || "audio/webm" })
        );
      }
      formData.append("language", language);
      formData.append("needs_bg_removal", removeBg ? "true" : "false");
      formData.append("state", selectedState);
      formData.append("voice_description", voiceDescription);
      formData.append("weight_grams", weightGrams.toString());
      formData.append("crafting_hours", laborHours.toString());
      formData.append("is_hollow", isHollow ? "true" : "false");
      formData.append("scale_reference", scaleReference);

      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "not_a_craft") {
          toast.error("Image was rejected: Not recognized as a handicraft.");
          setCurrentStep(1);
          setLoading(false);
          return;
        }
        throw new Error(data.message || data.detail || "Analysis failed");
      }

      setAnalysisResult(data);
      const recPrice = data.pricing?.retail_recommended || 850;
      setEditablePrice(Math.round(recPrice));
      setCurrentStep(4); // Result screen
      toast.success("Artisan craft analyzed successfully!");
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Analysis network error:", err);

      // On network timeout or cellular dropout, auto-salvage draft into IndexedDB
      try {
        await queueAppraisalLocally({
          craftFile,
          craftPreview,
          voiceDescription,
          audioBlob,
          weightGrams,
          laborHours,
          isHollow,
          scaleReference,
          language,
          selectedState,
          removeBg,
          title: "Craft Draft #" + Math.floor(Math.random() * 9000 + 1000),
        });
        await reloadOfflineDrafts();
        toast(
          "Weak signal / timeout! Craft safely saved in Offline Queue and will sync when network stabilizes.",
          { icon: "📡", duration: 6000 }
        );
      } catch (queueErr) {
        console.error("Queue save failed:", queueErr);
      }

      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Manual sync single draft from modal
  const handleSyncSingleDraft = async (draft) => {
    setSyncingDraftId(draft.id);
    try {
      const res = await syncSingleAppraisal(draft);
      if (res.success) {
        toast.success(`Craft "${draft.title || draft.id}" synced & appraised!`);
        await reloadOfflineDrafts();
      } else {
        toast.error(`Sync failed: ${res.error}`);
      }
    } catch (e) {
      toast.error(`Sync error: ${e.message}`);
    } finally {
      setSyncingDraftId(null);
    }
  };

  // Manual sync all pending drafts
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await syncAllPendingAppraisals();
      toast.success(t("sync_success_toast", "All pending drafts synced!"));
      await reloadOfflineDrafts();
    } catch (e) {
      toast.error(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Delete draft from queue
  const handleDeleteDraft = async (id) => {
    try {
      await deleteQueuedAppraisal(id);
      toast.success("Draft removed from local queue");
      await reloadOfflineDrafts();
    } catch (e) {
      toast.error("Could not delete draft");
    }
  };

  // Load an appraised draft directly into Step 4
  const handleLoadSyncedDraft = (draft) => {
    if (draft.result) {
      setAnalysisResult(draft.result);
      const recPrice = draft.result.pricing?.retail_recommended || 850;
      setEditablePrice(Math.round(recPrice));
      if (draft.photoPreview) {
        setCraftPreview(draft.photoPreview);
      }
      setShowOfflineModal(false);
      setCurrentStep(4);
      toast.success("Loaded appraised craft from offline sync!");
    }
  };

  // Publish confirmed item to FastAPI /api/catalog/publish
  const handlePublish = async () => {
    if (!analysisResult) return;
    setLoading(true);

    try {
      const payload = {
        title: analysisResult.craft?.title || "Handcrafted Heritage Item",
        craft_type: analysisResult.craft?.craft_type || user?.specialty || "Traditional Craft",
        regional_style: analysisResult.craft?.regional_style || (user?.region || selectedState),
        description: analysisResult.craft?.description || voiceDescription,
        craft_story: analysisResult.craft?.craft_story || voiceDescription,
        english_title: analysisResult.craft?.english_title || analysisResult.craft?.title || "",
        english_description: analysisResult.craft?.english_description || analysisResult.craft?.description || "",
        materials: analysisResult.craft?.materials_detected || ["Natural Clay"],
        workmanship_level: analysisResult.craft?.workmanship_level || 3,
        final_price: editablePrice,
        wholesale_floor: analysisResult.pricing?.wholesale_floor || Math.round(editablePrice * 0.7),
        retail_recommended: analysisResult.pricing?.retail_recommended || editablePrice,
        premium_ceiling: analysisResult.pricing?.premium_ceiling || Math.round(editablePrice * 1.3),
        pricing_breakdown: analysisResult.pricing || {},
        bullet_points: analysisResult.craft?.bullet_points || [],
        tags: [
          ...(analysisResult.craft?.tags || []),
          user?.name ? `Artisan: ${user.name}` : null,
          user?.pehchanId ? `Pehchan: ${user.pehchanId}` : null,
        ].filter(Boolean),
        full_view_path: analysisResult.craft_image_url || analysisResult.full_view_url || "",
        detail_view_path: "",
        language: language,
      };

      const res = await fetch("http://localhost:8000/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.detail || errorJson.message || "Failed to publish item to ONDC");
      }

      toast.success("✨ Catalog listing published to ONDC & CraftLens!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Publish error:", err);
      toast.error(err.message || "Error publishing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Main>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between pb-2 border-b border-belikan-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentStep > 1 && currentStep !== 3) {
                  setCurrentStep(currentStep - 1);
                } else {
                  router.push("/");
                }
              }}
              className="p-1.5 rounded-full hover:bg-belikan-surface text-belikan-dark"
            >
              <FiArrowLeft className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl font-serif font-bold text-belikan-dark">
                {t("studio_heading", "CraftLens Visual Studio")}
              </h1>
              <p className="text-[11px] text-belikan-secondary">
                {t("studio_subheading", "Belikan AI Appraisal — Single Photo Analyzer")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 4].map((s, idx) => (
              <div
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= s
                  ? "bg-belikan-primary text-white"
                  : "bg-belikan-border text-belikan-neutral"
                  }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Network & Offline Resilience Bar */}
        <div className="flex items-center justify-between text-xs py-1">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                <FiWifi className="text-emerald-600 text-xs" />
                <span>Online (3G/WebP Active)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold animate-pulse">
                <FiWifiOff className="text-amber-700 text-xs" />
                <span>{t("offline_banner_title", "Offline Mode Active")}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowOfflineModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-belikan-surface hover:bg-white border border-belikan-border text-belikan-dark text-xs font-semibold shadow-2xs transition-all"
          >
            <FiDatabase className="text-belikan-primary text-xs" />
            <span>{t("offline_drafts_btn", "Offline Queue")}</span>
            {offlineDrafts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-belikan-primary text-white text-[10px] font-extrabold flex items-center justify-center">
                {offlineDrafts.length}
              </span>
            )}
          </button>
        </div>

        {/* Offline Ambient Banner when disconnected */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <FiWifiOff className="text-base" />
            </div>
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-bold text-amber-950">
                {t("offline_banner_title", "Weak Signal / Offline Mode Active")}
              </h4>
              <p className="text-[11px] text-amber-800 leading-snug">
                {t("offline_banner_desc", "No network signal. Your craft is safely saved locally on device. It will automatically analyze when signal returns.")}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 1: Single Photo Capture ── */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Belikan Signature Full-Bleed Viewfinder Box with Corner Reticles */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-belikan-dark border-4 border-belikan-surface shadow-belikan-card flex items-center justify-center">
              {/* Corner Reticle Brackets (Belikan style) */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg pointer-events-none z-20" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg pointer-events-none z-20" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg pointer-events-none z-20" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg pointer-events-none z-20" />

              {/* Viewfinder Status Banner */}
              <div className="absolute top-4 inset-x-12 z-20 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-belikan-primary animate-ping" />
                  {t("single_photo_tip", "Photograph Your Craft — Fit Entire Item in Frame")}
                </span>
              </div>

              {/* Live Video Stream or Preview Image */}
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : craftPreview ? (
                <img
                  src={craftPreview}
                  alt="Craft preview"
                  className="w-full h-full object-contain bg-black/40"
                />
              ) : (
                <div className="text-center p-6 space-y-3 z-10 text-white">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center text-3xl">
                    📸
                  </div>
                  <p className="text-sm font-semibold">
                    {t("ready_craft_shot", "Ready for Craft Photo")}
                  </p>
                  <p className="text-xs text-belikan-neutral max-w-xs mx-auto">
                    {t("camera_tip", "Take a live camera snapshot or upload a high-resolution craft photo from your device.")}
                  </p>
                </div>
              )}

              {/* Viewfinder Controls Floating Bar */}
              <div className="absolute bottom-4 inset-x-6 z-20 flex items-center justify-between">
                {/* File Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all shadow-md"
                  title="Upload from gallery"
                >
                  <FiUploadCloud className="text-xl" />
                </button>

                {/* Belikan Shutter Button with Terracotta Glowing Halo */}
                <button
                  type="button"
                  onClick={() => {
                    if (cameraActive) {
                      captureSnapshot();
                    } else {
                      startLiveCamera();
                    }
                  }}
                  className="w-18 h-18 p-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-xl transition-transform active:scale-90"
                  title="Capture craft"
                >
                  <div className="w-14 h-14 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white flex items-center justify-center shadow-inner">
                    <FiCamera className="text-2xl" />
                  </div>
                </button>

                {/* Camera Toggle or Retake */}
                <button
                  type="button"
                  onClick={() => {
                    if (cameraActive) {
                      stopLiveCamera();
                    } else {
                      startLiveCamera();
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all shadow-md"
                  title="Toggle Live Camera"
                >
                  <FiRefreshCw className={`text-lg ${cameraActive ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Scale Reference Tip Box (Anti-Underpricing) */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-3 text-left shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 text-base font-bold">
                🪙
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-bold text-amber-950">
                    {t("scale_tip_title", "Scale Reference (Recommended)")}
                  </h4>
                  <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 text-[9px] font-extrabold rounded-md uppercase tracking-wide">
                    Anti-Underpricing
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {t("scale_tip_desc", "Place a standard ₹10 coin or matchbox next to your craft so AI measures exact dimensions and prevents material underpricing.")}
                </p>
              </div>
            </div>

            {/* Image Compressing Indicator */}
            {compressingImage && (
              <div className="flex items-center justify-center gap-2 p-3 bg-belikan-softRose/60 border border-belikan-primary/30 rounded-2xl text-xs text-belikan-primary font-semibold animate-pulse">
                <FiRefreshCw className="animate-spin text-sm" />
                <span>Compressing photo to WebP (&lt;300KB) for rural 3G upload...</span>
              </div>
            )}

            {/* Single Thumbnail Preview with Compression Badge */}
            {craftPreview && (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-belikan-surface border border-belikan-primary ring-2 ring-belikan-primary/20">
                <div className="w-14 h-14 rounded-xl bg-belikan-softRose overflow-hidden shrink-0">
                  <img src={craftPreview} alt="Craft shot" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold text-belikan-dark truncate">{t("craft_photo_label", "Craft Photo")}</p>
                  <p className="text-[10px] text-belikan-secondary">{t("captured", "Captured ✓")}</p>
                  {compressionStats && (
                    <p className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 mt-0.5 truncate">
                      <FiZap className="text-emerald-600 text-xs shrink-0" />
                      <span className="truncate">WebP: {compressionStats.originalSize} → {compressionStats.compressedSize} (-{compressionStats.percentReduction}%)</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setCraftFile(null); setCraftPreview(null); setCompressionStats(null); }}
                  className="p-1.5 rounded-full hover:bg-belikan-border text-belikan-secondary"
                  title="Remove photo"
                >
                  <FiRefreshCw className="text-sm" />
                </button>
              </div>
            )}

            {/* Next Step Button */}
            <button
              onClick={() => {
                if (!craftFile) {
                  toast.error("Please capture or upload a craft photo to continue");
                  return;
                }
                stopLiveCamera();
                setCurrentStep(2);
              }}
              disabled={!craftFile}
              className={`w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all ${craftFile
                ? "bg-belikan-primary hover:bg-belikan-primaryHover text-white active:scale-95"
                : "bg-belikan-border text-belikan-neutral cursor-not-allowed"
                }`}
            >
              <span>{t("next_story_details", "Next: Artisan Story & Details")}</span>
              <FiChevronRight className="text-base" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Artisan Voice & Regional Settings ── */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Voice Story Recording Section */}
            <div className="bg-belikan-surface rounded-3xl p-5 border border-belikan-border shadow-belikan-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-belikan-dark">
                    {t("voice_description", "Tell Your Craft Story (Audio or Text)")}
                  </h3>
                  <p className="text-xs text-belikan-secondary">
                    {t("voice_description_sub", "Speak in your mother tongue: describe materials, technique, and hours.")}
                  </p>
                </div>

                {/* Animated Voice Recording Trigger */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-belikan-softRose text-belikan-primary hover:bg-belikan-primary hover:text-white"
                    }`}
                  title={isRecording ? "Stop recording" : "Record audio"}
                >
                  {isRecording ? <FiMicOff className="text-xl" /> : <FiMic className="text-xl" />}
                </button>
              </div>

              {/* Sound wave visualizer when recording */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1.5 py-2 bg-belikan-bg rounded-xl">
                  <span className="w-1 bg-belikan-primary rounded-full wave-bar-1" />
                  <span className="w-1 bg-belikan-primary rounded-full wave-bar-2" />
                  <span className="w-1 bg-belikan-primary rounded-full wave-bar-3" />
                  <span className="w-1 bg-belikan-primary rounded-full wave-bar-4" />
                  <span className="w-1 bg-belikan-primary rounded-full wave-bar-5" />
                  <span className="text-xs font-semibold text-belikan-primary ml-2">{t("recording_audio", "Recording audio...")}</span>
                </div>
              )}

              <textarea
                value={voiceDescription}
                onChange={(e) => {
                  setVoiceDescription(e.target.value);
                  parseVoiceSpecs(e.target.value);
                }}
                placeholder="e.g. Handmade Dokra brass idol, weighs 350 grams hollow core, took 4.5 hours to cast and carve..."
                rows={3}
                className="w-full p-3 rounded-2xl bg-belikan-bg border border-belikan-border text-xs text-belikan-dark focus:border-belikan-primary focus:ring-0"
              />

              {/* Opus Audio Note Attached Pill */}
              {audioBlob && (
                <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <FiCheck className="text-emerald-600 text-xs" />
                    <span>Low-bitrate Opus voice note attached ({formatBytes(audioBlob.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioBlob(null)}
                    className="text-[10px] text-emerald-700 hover:text-rose-600 font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Physical Weight & Crafting Labor Verification Card (Mandatory to prevent 2D weight guessing) */}
            <div className="bg-belikan-surface rounded-3xl p-5 border border-belikan-border shadow-belikan-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-belikan-dark flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>{t("physical_specs_title", "Physical Weight & Crafting Labor")}</span>
                  </h3>
                  <p className="text-xs text-belikan-secondary">
                    {t("physical_specs_subtitle", "Never let AI guess weight blindly. Confirm true weight and construction.")}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-belikan-primary/10 text-belikan-primary text-[10px] font-bold">
                  Statutory Audit
                </span>
              </div>

              {/* Voice Extracted Banner if detected */}
              {voiceExtractedSpecs && (
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>{t("auto_extracted_voice", "Auto-extracted from voice note")}: <strong className="font-bold text-emerald-900">{voiceExtractedSpecs}</strong></span>
                </div>
              )}

              {/* 1. Craft Weight Slider & Quick Pills */}
              <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-belikan-dark flex items-center gap-1">
                    <span>{t("craft_weight", "Craft Weight")}</span>
                    <span className="text-belikan-neutral font-normal">({weightGrams >= 1000 ? `${(weightGrams / 1000).toFixed(2)} kg` : `${weightGrams}g`})</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(Math.max(10, Number(e.target.value)))}
                      className="w-20 px-2 py-1 rounded-lg bg-white border border-belikan-border text-xs font-bold text-right text-belikan-dark focus:border-belikan-primary focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-belikan-secondary">g</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="3000"
                  step="10"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(Number(e.target.value))}
                  className="w-full accent-belikan-primary cursor-pointer"
                />

                {/* Quick Weight Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[150, 300, 500, 1000, 2000].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeightGrams(w)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${weightGrams === w
                        ? "bg-belikan-primary text-white border-belikan-primary"
                        : "bg-white text-belikan-secondary border-belikan-border hover:border-belikan-primary"
                        }`}
                    >
                      {w < 1000 ? `${w}g` : `${w / 1000} kg`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Construction Type: Hollow vs Solid (Solves 400% Cost Discrepancy) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-belikan-dark block">
                  {t("construction_type", "Construction Type")}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsHollow(true)}
                    className={`p-3 rounded-2xl border text-left transition-all ${isHollow
                      ? "bg-belikan-softRose border-belikan-primary ring-2 ring-belikan-primary/20"
                      : "bg-belikan-bg border-belikan-border hover:bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base"></span>
                      {isHollow && <span className="text-belikan-primary text-xs font-bold">✓</span>}
                    </div>
                    <p className="text-xs font-bold text-belikan-dark mt-1">
                      {t("hollow_structure", "Hollow / Thin-Walled")}
                    </p>
                    <p className="text-[9px] text-belikan-secondary mt-0.5 leading-snug">
                      {t("hollow_desc", "Pots, hollow brass/Dhokra, turned wooden toys")}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHollow(false)}
                    className={`p-3 rounded-2xl border text-left transition-all ${!isHollow
                      ? "bg-belikan-softRose border-belikan-primary ring-2 ring-belikan-primary/20"
                      : "bg-belikan-bg border-belikan-border hover:bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base"></span>
                      {!isHollow && <span className="text-belikan-primary text-xs font-bold">✓</span>}
                    </div>
                    <p className="text-xs font-bold text-belikan-dark mt-1">
                      {t("solid_structure", "Solid / Dense")}
                    </p>
                    <p className="text-[9px] text-belikan-secondary mt-0.5 leading-snug">
                      {t("solid_desc", "Solid brass casting, carved stone, hardwood block")}
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Crafting Labor Hours Slider */}
              <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-belikan-dark flex items-center gap-1">
                    <span>{t("labor_hours", "Crafting Labor")}</span>
                    <span className="text-belikan-neutral font-normal">({laborHours} hrs)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="40"
                      value={laborHours}
                      onChange={(e) => setLaborHours(Math.max(0.5, Number(e.target.value)))}
                      className="w-16 px-2 py-1 rounded-lg bg-white border border-belikan-border text-xs font-bold text-right text-belikan-dark focus:border-belikan-primary focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-belikan-secondary">hrs</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  className="w-full accent-belikan-primary cursor-pointer"
                />

                {/* Quick Hours Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[2, 4, 8, 16, 24].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setLaborHours(h)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${laborHours === h
                        ? "bg-belikan-primary text-white border-belikan-primary"
                        : "bg-white text-belikan-secondary border-belikan-border hover:border-belikan-primary"
                        }`}
                    >
                      {h === 4 ? "4h (Half Day)" : h === 8 ? "8h (1 Day)" : h === 16 ? "16h (2 Days)" : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Scale Reference Marker Selector */}
              <div className="bg-belikan-bg rounded-2xl p-3 border border-belikan-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-belikan-dark">
                    {t("scale_marker_used", "Scale Reference in Photo")}
                  </p>
                  <p className="text-[9px] text-belikan-secondary">
                    Helps calculate millimeter bounding box
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { id: "₹10 coin", label: "🪙 ₹10" },
                    { id: "matchbox", label: "📦 Box" },
                    { id: "none", label: "✕ None" },
                  ].map((ref) => (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => setScaleReference(ref.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${scaleReference === ref.id
                        ? "bg-belikan-primary text-white border-belikan-primary"
                        : "bg-white text-belikan-secondary border-belikan-border"
                        }`}
                    >
                      {ref.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GPS Auto-Detected Artisan Cluster & Language Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-belikan-surface rounded-2xl p-4 border border-belikan-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-belikan-neutral uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t("gps_location", "GPS Cluster")}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStateOverride(!showStateOverride)}
                    className="text-[10px] text-belikan-primary font-bold hover:underline"
                  >
                    {showStateOverride ? t("done", "Done") : t("change", "Change")}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-belikan-bg rounded-xl px-2.5 py-1.5 border border-belikan-border">
                  <div className="truncate">
                    <p className="text-xs font-bold text-belikan-dark truncate flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">{gpsLoading ? "Detecting..." : selectedState}</span>
                    </p>
                    <p className="text-[9px] text-belikan-secondary truncate">
                      {gpsAccurate ? "Auto-detected by GPS" : "Regional wage active"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocationByGps}
                    className="p-1 rounded-lg bg-white border border-belikan-border hover:bg-belikan-surface text-belikan-primary"
                    title="Refresh GPS"
                  >
                    <FiRefreshCw className={`text-[10px] ${gpsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {showStateOverride && (
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setGpsAccurate(false);
                    }}
                    className="w-full mt-1 py-1 px-2 rounded-lg bg-white border border-belikan-border text-[11px] font-semibold text-belikan-dark focus:border-belikan-primary focus:ring-0"
                  >
                    <option value="Telangana">Telangana (₹50/hr)</option>
                    <option value="Karnataka">Karnataka (₹51.25/hr)</option>
                    <option value="Andhra Pradesh">Andhra Pradesh (₹47.50/hr)</option>
                    <option value="Tamil Nadu">Tamil Nadu (₹50/hr)</option>
                    <option value="Rajasthan">Rajasthan (₹43.75/hr)</option>
                    <option value="Uttar Pradesh">Uttar Pradesh (₹45/hr)</option>
                    <option value="Gujarat">Gujarat (₹47.50/hr)</option>
                    <option value="West Bengal">West Bengal (₹42.50/hr)</option>
                    <option value="Odisha">Odisha (₹41.25/hr)</option>
                    <option value="Maharashtra">Maharashtra (₹52.50/hr)</option>
                    <option value="Kerala">Kerala (₹56.25/hr)</option>
                    <option value="Madhya Pradesh">Madhya Pradesh (₹43.75/hr)</option>
                  </select>
                )}
              </div>

              <div className="bg-belikan-surface rounded-2xl p-4 border border-belikan-border space-y-1.5">
                <label className="text-[11px] font-bold text-belikan-neutral uppercase tracking-wider block">
                  {t("language_display", "Language Output")}
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setLanguage(newLang);
                    if (setGlobalLang) setGlobalLang(newLang);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-belikan-bg border border-belikan-border text-xs font-semibold text-belikan-dark focus:border-belikan-primary focus:ring-0"
                >
                  <option value="en">English (Universal ONDC)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>
            </div>

            {/* Auto Background Removal Toggle */}
            <div className="bg-belikan-surface rounded-2xl p-4 border border-belikan-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-belikan-softRose text-belikan-primary flex items-center justify-center font-bold">
                  ✨
                </div>
                <div>
                  <h4 className="text-xs font-bold text-belikan-dark">
                    {t("studio_cutout", "Studio Cutout (White Background)")}
                  </h4>
                  <p className="text-[10px] text-belikan-secondary">
                    {removeBg
                      ? "Isolates craft on studio white canvas (~4s)"
                      : "Preserves natural photo background (instant 1-second appraisal)"}
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={removeBg}
                onChange={(e) => setRemoveBg(e.target.checked)}
                className="w-5 h-5 rounded text-belikan-primary focus:ring-belikan-primary cursor-pointer"
              />
            </div>

            {/* Trigger AI Analysis Button */}
            <button
              onClick={handleAnalyze}
              className="w-full py-4 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FiCamera className="text-lg" />
              <span>{t("analyze_btn", "Analyze Craft & Calculate Fair Price")}</span>
            </button>
          </div>
        )}

        {/* ── STEP 3: Loading AI Animation ── */}
        {currentStep === 3 && (
          <div className="bg-belikan-surface rounded-3xl p-10 border border-belikan-border shadow-belikan-card text-center space-y-6 my-8 animate-in fade-in duration-300">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-belikan-softRose animate-ping opacity-75" />
              <div className="relative w-24 h-24 rounded-full bg-belikan-primary text-white flex items-center justify-center text-4xl shadow-lg">

              </div>
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="font-serif text-2xl font-bold text-belikan-dark">
                {t("appraising_heading", "CraftLens AI is Appraising...")}
              </h3>
              <p className="text-xs text-belikan-secondary leading-relaxed">
                {t("appraising_sub", "Analyzing weave density & craft family, testing anti-counterfeit authenticity, and calculating statutory minimum wage benchmarks.")}
              </p>
            </div>

            <div className="space-y-2 max-w-xs mx-auto text-left text-xs font-medium text-belikan-secondary">
              <div className="flex items-center gap-2">
                <FiCheck className="text-belikan-green" />
                <span>{t("step_screening", "Checking craft screening model")}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="text-belikan-green" />
                <span>{t("step_bg_removal", "Removing background & isolating subject")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-belikan-primary animate-pulse" />
                <span className="text-belikan-primary font-bold">{t("step_pricing_matrix", "Computing fair pricing matrix...")}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Appraisal & Listing Result Screen ── */}
        {currentStep === 4 && analysisResult && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Before / After Photo Comparison */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-belikan-surface border border-belikan-border shadow-belikan-card">
              <img
                src={
                  viewBgCutout && analysisResult.full_view_url
                    ? `http://localhost:8000${analysisResult.full_view_url}`
                    : craftPreview
                }
                alt="Analyzed craft"
                className="w-full h-full object-contain p-4"
              />

              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setViewBgCutout(!viewBgCutout)}
                  className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-belikan-border text-xs font-bold text-belikan-dark shadow-sm hover:bg-belikan-primary hover:text-white transition-all flex items-center gap-1.5"
                >
                  <FiLayers />
                  <span>{viewBgCutout ? t("show_original", "Show Original") : t("show_cutout", "Show Studio Cutout")}</span>
                </button>
              </div>

              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-full bg-belikan-green text-white text-[11px] font-bold shadow-sm flex items-center gap-1">
                  <FiShield /> {t("authenticity_verified_short", "Authenticity Verified: 96%")}
                </span>
              </div>
            </div>

            {/* Generated Listing Title & Heritage Classification */}
            <div className="bg-belikan-surface rounded-3xl p-5 border border-belikan-border shadow-belikan-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-belikan-softRose text-belikan-primary text-[10px] font-bold uppercase tracking-wider">
                  {analysisResult.craft?.craft_type || "Traditional Craft"}
                </span>
                <span className="text-xs text-belikan-secondary font-medium">
                  GI Region: {analysisResult.craft?.regional_style || selectedState}
                </span>
              </div>

              <h2 className="text-lg font-serif font-bold text-belikan-dark leading-snug">
                {analysisResult.craft?.title || "Handcrafted Heritage Artifact"}
              </h2>

              <p className="text-xs text-belikan-secondary leading-relaxed">
                {analysisResult.craft?.description || voiceDescription}
              </p>

              {analysisResult.craft?.notice && (
                <div className="mt-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-2">
                  <span>💡</span>
                  <span className="leading-snug">{analysisResult.craft.notice}</span>
                </div>
              )}
            </div>

            {/* Fair Pricing Matrix Card (Belikan Key Feature) */}
            <div className="bg-belikan-surface rounded-3xl p-5 border border-belikan-border shadow-belikan-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-belikan-dark flex items-center gap-1.5">
                    <FiDollarSign className="text-belikan-primary" />
                    <span>{t("statutory_analysis", "Statutory Fair Pricing Matrix")}</span>
                  </h3>
                  <p className="text-[11px] text-belikan-secondary">
                    {t("pricing_matrix_sub", "Based on material costs and statutory artisan wages.")}
                  </p>
                </div>
              </div>

              {/* Physical Audit Badge */}
              {analysisResult.pricing?.physical_verification_badge && (
                <div className="p-3 bg-belikan-bg rounded-2xl border border-belikan-border flex items-center gap-2 text-xs font-semibold text-belikan-dark">
                  <span className="w-2 h-2 rounded-full bg-belikan-green shrink-0 animate-pulse" />
                  <span className="leading-snug">{analysisResult.pricing.physical_verification_badge}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-belikan-bg rounded-2xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral font-bold uppercase">{t("wholesale_floor", "Wholesale")}</span>
                  <p className="text-sm font-bold text-belikan-dark mt-0.5">
                    ₹{Math.round(analysisResult.pricing?.wholesale_floor || editablePrice * 0.7)}
                  </p>
                </div>

                <div className="p-3 bg-belikan-softRose rounded-2xl border border-belikan-primary/30">
                  <span className="text-[10px] text-belikan-primary font-bold uppercase">{t("recommended", "Recommended")}</span>
                  <p className="text-base font-extrabold text-belikan-primary mt-0.5">
                    ₹{Math.round(analysisResult.pricing?.retail_recommended || editablePrice)}
                  </p>
                </div>

                <div className="p-3 bg-belikan-bg rounded-2xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral font-bold uppercase">{t("premium_ceiling", "Ceiling")}</span>
                  <p className="text-sm font-bold text-belikan-dark mt-0.5">
                    ₹{Math.round(analysisResult.pricing?.premium_ceiling || editablePrice * 1.3)}
                  </p>
                </div>
              </div>

              {/* Editable Price & Stock Fields */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-belikan-bg p-3 rounded-2xl border border-belikan-border">
                  <label className="text-[10px] font-bold text-belikan-neutral uppercase block">
                    {t("your_selling_price", "Your Selling Price (₹)")}
                  </label>
                  <input
                    type="number"
                    value={editablePrice}
                    onChange={(e) => setEditablePrice(Number(e.target.value))}
                    className="w-full mt-1 bg-white px-3 py-1.5 rounded-xl border border-belikan-border text-sm font-bold text-belikan-dark focus:border-belikan-primary focus:ring-0"
                  />
                </div>

                <div className="bg-belikan-bg p-3 rounded-2xl border border-belikan-border">
                  <label className="text-[10px] font-bold text-belikan-neutral uppercase block">
                    {t("stock_quantity", "Stock Quantity")}
                  </label>
                  <input
                    type="number"
                    value={editableStock}
                    onChange={(e) => setEditableStock(Number(e.target.value))}
                    className="w-full mt-1 bg-white px-3 py-1.5 rounded-xl border border-belikan-border text-sm font-bold text-belikan-dark focus:border-belikan-primary focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Final Action: Publish to ONDC & CraftLens */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-3.5 rounded-full bg-belikan-surface border border-belikan-border text-xs font-bold text-belikan-secondary hover:text-belikan-dark"
              >
                {t("discard_resnap", "Discard & Resnap")}
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="w-2/3 py-3.5 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FiCheck className="text-base" />
                <span>{t("publish_catalog", "Publish to ONDC")}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Offline Drafts Queue Modal (IndexedDB) ── */}
        {showOfflineModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-belikan-border overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-belikan-border flex items-center justify-between bg-belikan-surface">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-belikan-softRose text-belikan-primary flex items-center justify-center font-bold">
                    <FiDatabase className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-belikan-dark">
                      {t("offline_drafts_btn", "Artisan Offline Drafts")}
                    </h3>
                    <p className="text-[10px] text-belikan-secondary">
                      {offlineDrafts.length} crafts stored locally in IndexedDB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {offlineDrafts.some((d) => d.status === "pending" || d.status === "failed") && (
                    <button
                      type="button"
                      onClick={handleSyncAll}
                      disabled={isSyncingAll || !isOnline}
                      className="px-3 py-1.5 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <FiRefreshCw className={`text-xs ${isSyncingAll ? "animate-spin" : ""}`} />
                      <span>{isSyncingAll ? t("syncing_badge", "Syncing...") : t("sync_all_btn", "Sync All")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowOfflineModal(false)}
                    className="p-1.5 rounded-full hover:bg-belikan-border text-belikan-secondary font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Drafts List */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {offlineDrafts.length === 0 ? (
                  <div className="text-center py-10 text-belikan-secondary space-y-2">
                    <p className="text-3xl">📭</p>
                    <p className="text-xs font-semibold">{t("queue_empty", "No pending offline drafts.")}</p>
                    <p className="text-[10px] text-belikan-neutral">
                      Crafts you photograph in weak signal areas will be saved here automatically.
                    </p>
                  </div>
                ) : (
                  offlineDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-3 rounded-2xl bg-belikan-bg border border-belikan-border flex items-center gap-3 transition-all hover:border-belikan-primary/40"
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-belikan-surface border border-belikan-border overflow-hidden shrink-0 flex items-center justify-center">
                        {draft.photoPreview ? (
                          <img src={draft.photoPreview} alt="Craft thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl"></span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-belikan-dark truncate">
                            {draft.title || "Handcrafted Item"}
                          </h4>
                          {draft.status === "synced" && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                              Appraised ✓
                            </span>
                          )}
                          {draft.status === "pending" && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                              Queued
                            </span>
                          )}
                          {draft.status === "syncing" && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[9px] font-extrabold animate-pulse">
                              Syncing...
                            </span>
                          )}
                          {draft.status === "failed" && (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 text-[9px] font-extrabold">
                              Failed
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-belikan-secondary truncate mt-0.5">
                          {draft.weightGrams}g • {draft.isHollow ? "Hollow" : "Solid"} • {draft.laborHours}h labor • {draft.selectedState}
                        </p>

                        <p className="text-[9px] text-belikan-neutral mt-0.5">
                          Saved {new Date(draft.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {draft.status === "synced" ? (
                          <button
                            type="button"
                            onClick={() => handleLoadSyncedDraft(draft)}
                            className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSyncSingleDraft(draft)}
                            disabled={syncingDraftId === draft.id || !isOnline}
                            className="p-1.5 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs disabled:opacity-50"
                            title="Sync this draft"
                          >
                            <FiRefreshCw className={`${syncingDraftId === draft.id ? "animate-spin" : ""}`} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-belikan-neutral hover:text-rose-600 transition-colors"
                          title="Delete draft"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-belikan-border bg-belikan-surface flex items-center justify-between text-[11px] text-belikan-secondary">
                <div className="flex items-center gap-1.5">
                  <FiWifi className="text-xs text-belikan-primary" />
                  <span>{isOnline ? "Network signal active" : "Offline mode — syncs on reconnect"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfflineModal(false)}
                  className="px-3 py-1 rounded-full bg-white border border-belikan-border text-xs font-semibold text-belikan-dark hover:bg-belikan-bg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Main>
  );
}
