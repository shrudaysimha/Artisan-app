"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import BhashiniModal from "@/components/shared/BhashiniModal";
import {
  FiMapPin,
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiCamera,
  FiMic,
  FiGlobe,
  FiX,
  FiCheck
} from "react-icons/fi";

const Header = ({ onSearchQuery, openStudioDirect }) => {
  const router = useRouter();
  const { currentLang, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showBhashiniModal, setShowBhashiniModal] = useState(false);
  const [gpsLocation, setGpsLocation] = useState("GPS Active");
  const [searchVal, setSearchVal] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let detected = "India (GPS)";
          if (latitude >= 11.5 && latitude <= 18.5 && longitude >= 74.0 && longitude <= 78.6) detected = "Karnataka (GPS)";
          else if (latitude >= 15.8 && latitude <= 19.9 && longitude >= 77.2 && longitude <= 81.8) detected = "Telangana (GPS)";
          else if (latitude >= 12.6 && latitude <= 19.1 && longitude >= 76.7 && longitude <= 84.8) detected = "Andhra Pradesh (GPS)";
          else if (latitude >= 8.0 && latitude <= 13.5 && longitude >= 76.2 && longitude <= 80.3) detected = "Tamil Nadu (GPS)";
          else if (latitude >= 23.0 && latitude <= 30.2 && longitude >= 69.5 && longitude <= 78.3) detected = "Rajasthan (GPS)";
          else if (latitude >= 23.9 && latitude <= 30.4 && longitude >= 77.1 && longitude <= 84.6) detected = "Uttar Pradesh (GPS)";
          
          try {
            const resp = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (resp.ok) {
              const data = await resp.json();
              if (data.city || data.principalSubdivision) {
                detected = `${data.city || data.locality || ""}, ${data.principalSubdivision || ""}`.replace(/^, /, "") + " (GPS)";
              }
            }
          } catch (e) {
            console.warn("Reverse geocode in header:", e);
          }
          setGpsLocation(detected);
        },
        () => {
          setGpsLocation("GPS Active");
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "bn", name: "Bengali", native: "বাংলা" },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchQuery) {
      onSearchQuery(searchVal);
    } else {
      router.push(`/products?q=${encodeURIComponent(searchVal)}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-belikan-bg/95 backdrop-blur-md border-b border-belikan-border/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Top Bar: Location + Brand Logo + Actions */}
          <div className="flex items-center justify-between gap-2 pb-2.5">
            {/* Automatic GPS / Registered Cluster Badge */}
            <div
              onClick={() => router.push("/profile")}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-belikan-surface border border-belikan-border text-xs font-medium text-belikan-secondary shadow-belikan-sm select-none hover:border-belikan-primary transition-all"
              title={user?.region ? `Registered Cluster: ${user.region}` : "Artisan Cluster automatically detected via device GPS"}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <FiMapPin className="text-belikan-primary text-xs" />
              <span className="truncate max-w-[120px] sm:max-w-[180px] text-belikan-dark font-semibold">
                {user?.region || gpsLocation}
              </span>
            </div>

            {/* Brand Logo: CraftLens (Belikan aesthetic) */}
            <div
              onClick={() => router.push("/")}
              className="cursor-pointer flex items-center gap-1.5 text-center select-none"
            >
              <div className="w-8 h-8 rounded-full bg-belikan-primary flex items-center justify-center text-white font-serif text-lg font-bold shadow-sm">
                CL
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-belikan-dark leading-none">
                  Craft<span className="text-belikan-primary">Lens</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-belikan-secondary font-semibold">
                  Belikan Studio
                </span>
              </div>
            </div>

            {/* Right Action Icons (Language, Profile, Catalog) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowLangModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-belikan-surface border border-belikan-border text-xs font-semibold text-belikan-secondary hover:text-belikan-primary hover:border-belikan-primary transition-all shadow-belikan-sm"
                title="Select Language"
              >
                <FiGlobe className="text-sm text-belikan-primary" />
                <span className="uppercase">{currentLang || "EN"}</span>
              </button>

              {/* Logged in Artisan Profile Pill */}
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-belikan-surface border border-belikan-border hover:border-belikan-primary transition-all shadow-belikan-sm group"
                title={user?.name ? `Signed in as ${user.name}` : "Artisan Profile"}
              >
                <div className="w-6 h-6 rounded-full bg-belikan-primary text-white text-[10px] font-bold font-serif flex items-center justify-center shadow-xs">
                  {user?.initials || "AP"}
                </div>
                {user?.name && (
                  <span className="hidden sm:inline text-xs font-semibold text-belikan-dark group-hover:text-belikan-primary truncate max-w-[85px]">
                    {user.name.split(" ")[0]}
                  </span>
                )}
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="relative p-2 rounded-full bg-belikan-surface border border-belikan-border text-belikan-dark hover:text-belikan-primary transition-colors shadow-belikan-sm"
                title="Catalog & Inventory"
              >
                <FiShoppingBag className="text-base" />
              </button>
            </div>
          </div>

          {/* Belikan Signature Search Bar with "Search with Image" Camera & Mic */}
          <form onSubmit={handleSearchSubmit} className="relative mt-1">
            <div className="relative flex items-center bg-belikan-surface rounded-full border border-belikan-border shadow-belikan-sm focus-within:border-belikan-primary focus-within:ring-2 focus-within:ring-belikan-primary/20 transition-all">
              <div className="pl-4 pr-2 text-belikan-neutral">
                <FiSearch className="text-lg" />
              </div>

              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t("search_placeholder", "Search handwoven textiles, pottery, brassware...")}
                className="w-full py-2.5 pr-24 bg-transparent border-0 text-sm font-medium text-belikan-dark placeholder-belikan-neutral focus:outline-none focus:ring-0"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {/* Voice Search button */}
                <button
                  type="button"
                  onClick={() => router.push("/studio")}
                  className="p-1.5 text-belikan-secondary hover:text-belikan-primary rounded-full hover:bg-belikan-softRose transition-colors"
                  title="Voice Search & Story"
                >
                  <FiMic className="text-base" />
                </button>

                {/* Belikan Signature "Search with Image" Studio trigger button */}
                <button
                  type="button"
                  onClick={() => {
                    if (openStudioDirect) {
                      openStudioDirect();
                    } else {
                      router.push("/studio");
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
                  title="Search with Image (Visual AI Studio)"
                >
                  <FiCamera className="text-sm" />
                  <span className="hidden sm:inline">{t("visual_studio", "Visual Studio")}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </header>


      {/* Language Picker Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-belikan-surface rounded-3xl max-w-sm w-full p-6 shadow-belikan-card border border-belikan-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-belikan-border">
              <div className="flex items-center gap-2">
                <FiGlobe className="text-belikan-primary text-xl" />
                <h3 className="font-bold text-lg text-belikan-dark">{t("choose_language", "Choose Language / భాష")}</h3>
              </div>
              <button
                onClick={() => setShowLangModal(false)}
                className="p-1 rounded-full text-belikan-neutral hover:text-belikan-dark"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setShowLangModal(false);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    currentLang === l.code
                      ? "border-belikan-primary bg-belikan-softRose/70 text-belikan-primary"
                      : "border-belikan-border bg-belikan-bg hover:border-belikan-neutral text-belikan-dark"
                  }`}
                >
                  <p className="font-bold text-base leading-tight">{l.native}</p>
                  <p className="text-xs text-belikan-secondary mt-0.5">{l.name}</p>
                </button>
              ))}
            </div>

            {/* Bhashini Gateway Shortcut */}
            <div className="mt-4 pt-3 border-t border-belikan-border">
              <button
                onClick={() => {
                  setShowLangModal(false);
                  setShowBhashiniModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-belikan-bg border border-belikan-border hover:border-belikan-primary flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇮🇳</span>
                  <div>
                    <p className="text-xs font-bold text-belikan-dark group-hover:text-belikan-primary flex items-center gap-1">
                      Bhashini Udhyat AI
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-belikan-softRose text-belikan-primary font-normal">
                        NLTM
                      </span>
                    </p>
                    <p className="text-[10px] text-belikan-secondary">
                      Configure Live NMT & Dialect Voice
                    </p>
                  </div>
                </div>
                <span className="text-xs text-belikan-neutral group-hover:text-belikan-primary">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bhashini Udhyat & Dhruva Configuration Modal */}
      <BhashiniModal
        isOpen={showBhashiniModal}
        onClose={() => setShowBhashiniModal(false)}
      />
    </>
  );
};

export default Header;
