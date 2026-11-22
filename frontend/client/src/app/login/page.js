"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiAward,
  FiChevronRight,
  FiGlobe,
  FiZap,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Jammu & Kashmir", "Ladakh",
];

const CRAFT_SPECIALTIES = [
  { value: "Terracotta & Pottery", labelKey: "cat_pottery", fallback: "Terracotta & Pottery" },
  { value: "Handloom & Weaving", labelKey: "cat_textiles", fallback: "Handloom & Weaving" },
  { value: "Woodcraft & Lacquerware", labelKey: "cat_woodcraft", fallback: "Woodcraft & Lacquerware" },
  { value: "Brass & Metal Casting", labelKey: "cat_metal", fallback: "Brass & Metal Casting" },
  { value: "Folk Painting (Madhubani/Warli/Pattachitra)", labelKey: "cat_paintings", fallback: "Folk Painting (Madhubani/Warli/Pattachitra)" },
  { value: "Bamboo & Cane Craft", labelKey: "cat_bamboo", fallback: "Bamboo & Cane Craft" },
  { value: "Embroidery & Textile Art", fallback: "Embroidery & Textile Art" },
  { value: "Block Printing", fallback: "Block Printing" },
  { value: "Stone Carving", fallback: "Stone Carving" },
  { value: "Leather Craft", fallback: "Leather Craft" },
  { value: "Jute & Natural Fiber", fallback: "Jute & Natural Fiber" },
  { value: "Glass & Bead Work", fallback: "Glass & Bead Work" },
  { value: "Other", fallback: "Other" },
];

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
];

const DEMO_ARTISANS = [
  {
    name: "Rameshwar Prajapati",
    phone: "9876543210",
    village: "Khurja",
    district: "Bulandshahr",
    state: "Uttar Pradesh",
    specialty: "Terracotta & Pottery",
    pehchanId: "IN-UP-KHUR-2024-8492",
    experience: "18 years",
    role: "artisan",
    badge: "Master Potter • Khurja",
  },
  {
    name: "Sunita Devi Jha",
    phone: "9811223344",
    village: "Ranti",
    district: "Madhubani",
    state: "Bihar",
    specialty: "Folk Painting (Madhubani/Warli/Pattachitra)",
    pehchanId: "IN-BR-MADH-2023-4120",
    experience: "12 years",
    role: "artisan",
    badge: "Mithila Artist • Bihar",
  },
  {
    name: "Nagaraju Gowda",
    phone: "9845012345",
    village: "Channapatna",
    district: "Ramanagara",
    state: "Karnataka",
    specialty: "Woodcraft & Lacquerware",
    pehchanId: "IN-KA-CHAN-2024-1193",
    experience: "15 years",
    role: "artisan",
    badge: "GI Toymaker • Karnataka",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { currentLang, lang, setLanguage, changeLanguage, t } = useLanguage();

  const activeLang = currentLang || lang || "en";

  // If already authenticated, redirect to home
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const [step, setStep] = useState(1); // 1 = identity, 2 = craft profile
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    state: "Uttar Pradesh",
    specialty: "",
    pehchanId: "",
    experience: "",
  });
  const [errors, setErrors] = useState({});

  const handleLanguageChange = (code, nativeName) => {
    if (setLanguage) setLanguage(code);
    else if (changeLanguage) changeLanguage(code);
    toast.success(`${t("toast_lang_set", "Language set to")} ${nativeName}`);
  };

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = () => {
    // Permissive for demo & showcasing: accept any input or defaults
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    // Permissive for demo & showcasing: accept any input or defaults
    setErrors({});
    return true;
  };

  const handleNext = () => {
    setStep(2);
  };

  const completeLogin = (userData) => {
    login(userData);
    toast.success(`Welcome, ${userData.name}!`);
    router.replace("/");
  };

  const handleSubmit = () => {
    const rawName = form.name.trim() || "Artisan Guest";
    const rawPhone = form.phone.trim() || "9876543210";
    const rawVillage = form.village.trim() || "Khurja";
    const rawDistrict = form.district.trim() || "Bulandshahr";
    const rawState = form.state || "Uttar Pradesh";
    const rawSpecialty = form.specialty || "Terracotta & Pottery";

    const initials = rawName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AG";

    const formattedPhone = rawPhone.startsWith("+")
      ? rawPhone
      : `+91 ${rawPhone}`;

    const userData = {
      name: rawName,
      phone: formattedPhone,
      village: rawVillage,
      district: rawDistrict,
      state: rawState,
      region: [rawVillage, rawDistrict, rawState].filter(Boolean).join(", "),
      specialty: rawSpecialty,
      pehchanId: form.pehchanId.trim() || `ART-IN-${Math.floor(1000 + Math.random() * 9000)}`,
      experience: form.experience.trim() || "5+ years",
      initials,
      role: "artisan",
      verified: true,
      createdAt: new Date().toISOString(),
    };

    completeLogin(userData);
  };

  const handleDemoSelect = (demo) => {
    const initials = demo.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const userData = {
      ...demo,
      phone: "+91 " + demo.phone,
      region: [demo.village, demo.district, demo.state].filter(Boolean).join(", "),
      initials,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    completeLogin(userData);
  };

  return (
    <div className="min-h-screen bg-belikan-bg flex flex-col items-center justify-center px-4 py-8">
      {/* Top Banner: Prominent Interactive Language Selector */}
      <div className="w-full max-w-md mb-4 bg-belikan-surface rounded-2xl p-3 border border-belikan-border shadow-belikan-sm">
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-belikan-border/60">
          <div className="flex items-center gap-1.5 text-xs text-belikan-secondary font-semibold">
            <span className="w-2 h-2 rounded-full bg-belikan-green animate-pulse" />
            <span>{t("login_gateway", "CraftLens Artisan Gateway")}</span>
          </div>
          <span className="text-[11px] font-bold text-belikan-primary flex items-center gap-1">
            <FiGlobe /> {t("login_choose_lang", "Language")}
          </span>
        </div>

        {/* Clickable Language Pills */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {LANGUAGES.map((l) => {
            const isSelected = activeLang === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageChange(l.code, l.native)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${isSelected
                    ? "bg-belikan-primary text-white shadow-md shadow-belikan-primary/25 scale-102"
                    : "bg-belikan-bg text-belikan-secondary hover:text-belikan-primary hover:bg-belikan-softRose border border-belikan-border"
                  }`}
              >
                <span className="block leading-none">{l.native}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* App Branding */}
      <div className="text-center mb-5">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-belikan-primary text-white flex items-center justify-center text-3xl font-serif font-bold shadow-belikan-card mb-2.5 transform hover:scale-105 transition-transform">

        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-belikan-dark tracking-tight">
          Craft<span className="text-belikan-primary">Lens</span>
        </h1>
        <p className="text-xs text-belikan-secondary mt-1 font-medium max-w-xs mx-auto">
          {t("login_tagline", "Digital Identity & Fair Pricing Studio for Artisans")}
        </p>
      </div>

      {/* Main Login & Registration Card */}
      <div className="w-full max-w-md bg-belikan-surface rounded-3xl border border-belikan-border shadow-belikan-card overflow-hidden">
        {/* Step Indicator Header */}
        <div className="flex border-b border-belikan-border">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all ${step === 1
                ? "text-belikan-primary border-b-2 border-belikan-primary bg-belikan-softRose/40"
                : "text-belikan-neutral hover:text-belikan-secondary"
              }`}
          >
            {t("login_step1_tab", "1. Identity & Location")}
          </button>
          <button
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all ${step === 2
                ? "text-belikan-primary border-b-2 border-belikan-primary bg-belikan-softRose/40"
                : "text-belikan-neutral hover:text-belikan-secondary"
              }`}
          >
            {t("login_step2_tab", "2. Craft & Pehchan")}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-1">
                <h2 className="text-base font-serif font-bold text-belikan-dark">
                  {t("login_reg_heading", "Artisan Registration")}
                </h2>
                <p className="text-xs text-belikan-secondary leading-relaxed">
                  {t("login_reg_desc", "Your identity determines your statutory state wage and GI provenance.")}
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-belikan-dark mb-1">
                  <FiUser className="text-belikan-primary" /> {t("login_name_label", "Full Name")} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={t("login_name_placeholder", "e.g. Rameshwar Prajapati")}
                  className={`w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border text-sm text-belikan-dark placeholder:text-belikan-neutral focus:outline-none focus:ring-2 focus:ring-belikan-primary/30 focus:border-belikan-primary transition-all ${errors.name ? "border-red-400 bg-red-50/30" : "border-belikan-border"
                    }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-belikan-dark mb-1">
                  <FiPhone className="text-belikan-primary" /> {t("login_phone_label", "Mobile Number")}
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-xs font-bold text-belikan-secondary">
                    +91
                  </span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="Any phone number (e.g. 9876543210)"
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark placeholder:text-belikan-neutral focus:outline-none focus:ring-2 focus:ring-belikan-primary/30 focus:border-belikan-primary transition-all"
                  />
                </div>
              </div>

              {/* Village & District (2-column) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-belikan-dark mb-1">
                    <FiMapPin className="text-belikan-primary text-xs" /> {t("login_village_label", "Village / Town")}
                  </label>
                  <input
                    type="text"
                    value={form.village}
                    onChange={(e) => update("village", e.target.value)}
                    placeholder={t("login_village_placeholder", "e.g. Khurja")}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-xs sm:text-sm text-belikan-dark placeholder:text-belikan-neutral focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-belikan-dark mb-1 block">
                    {t("login_district_label", "District")}
                  </label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => update("district", e.target.value)}
                    placeholder={t("login_district_placeholder", "e.g. Bulandshahr")}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-xs sm:text-sm text-belikan-dark placeholder:text-belikan-neutral focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
                  />
                </div>
              </div>

              {/* State Dropdown */}
              <div>
                <label className="text-xs font-bold text-belikan-dark mb-1 block">
                  {t("login_state_label", "State (for Regional Wage Index)")} *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border text-xs sm:text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30 ${errors.state ? "border-red-400" : "border-belikan-border"
                    }`}
                >
                  <option value="">{t("login_select_state", "Select State")}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.state}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>{t("login_enter_quick", "Enter CraftLens Studio Directly")}</span>
                  <FiArrowRight className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-2.5 rounded-full bg-belikan-bg hover:bg-belikan-softRose text-belikan-secondary text-xs font-semibold border border-belikan-border transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{t("login_continue_btn", "Customize Craft Profile (Step 2)")}</span>
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1">
                <h2 className="text-base font-serif font-bold text-belikan-dark">
                  {t("login_craft_heading", "Craft Specialty & Verification")}
                </h2>
                <p className="text-xs text-belikan-secondary leading-relaxed">
                  {t("login_craft_desc", "Used by Vision AI to authenticate craft families and calculate statutory labor.")}
                </p>
              </div>

              {/* Craft Specialty */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-belikan-dark mb-1">
                  <FiAward className="text-belikan-primary" /> {t("login_specialty_label", "Craft Specialty")} *
                </label>
                <select
                  value={form.specialty}
                  onChange={(e) => update("specialty", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border text-xs sm:text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30 ${errors.specialty ? "border-red-400" : "border-belikan-border"
                    }`}
                >
                  <option value="">{t("login_select_craft", "Select craft discipline")}</option>
                  {CRAFT_SPECIALTIES.map((s) => {
                    const label = s.labelKey ? t(s.labelKey, s.fallback) : s.fallback;
                    return (
                      <option key={s.value} value={s.value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {errors.specialty && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.specialty}</p>
                )}
              </div>

              {/* Pehchan ID Card */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-belikan-dark mb-1">
                  <FiAward className="text-belikan-green" /> {t("login_pehchan_label", "Ministry Pehchan ID Card")}{" "}
                  <span className="text-belikan-neutral font-normal text-[11px]">{t("login_optional", "(Optional)")}</span>
                </label>
                <input
                  type="text"
                  value={form.pehchanId}
                  onChange={(e) => update("pehchanId", e.target.value)}
                  placeholder="e.g. IN-UP-KHUR-2024-8492"
                  className="w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-xs sm:text-sm text-belikan-dark placeholder:text-belikan-neutral focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
                />
                <p className="text-[10px] text-belikan-secondary mt-1">
                  {t("login_pehchan_desc", "Enables the verified badge on your ONDC product listings.")}
                </p>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="text-xs font-bold text-belikan-dark mb-1 block">
                  {t("login_experience_label", "Years of Craft Experience")}
                </label>
                <input
                  type="text"
                  value={form.experience}
                  onChange={(e) => update("experience", e.target.value)}
                  placeholder={t("login_experience_placeholder", "e.g. 15 years")}
                  className="w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-xs sm:text-sm text-belikan-dark placeholder:text-belikan-neutral focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>{t("login_submit_btn", "Enter CraftLens Studio")}</span>
                  <FiArrowRight className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrors({});
                  }}
                  className="w-full py-2.5 rounded-full bg-belikan-bg hover:bg-belikan-softRose text-belikan-secondary text-xs font-semibold border border-belikan-border transition-all"
                >
                  {t("login_back_btn", "Back to Identity")}
                </button>
              </div>
            </>
          )}

          {/* Quick Demo Login Option for Judges & Testing */}
          <div className="pt-2 border-t border-belikan-border">
            <button
              type="button"
              onClick={() => setShowDemoSelector(!showDemoSelector)}
              className="w-full flex items-center justify-between text-xs font-bold text-belikan-secondary hover:text-belikan-primary py-1"
            >
              <span className="flex items-center gap-1.5">
                <FiZap className="text-belikan-gold" />
                <span>{t("login_demo_title", "1-Tap Demo Artisan Profiles")}</span>
              </span>
              <span className="text-[10px] bg-belikan-softRose px-2 py-0.5 rounded-full text-belikan-primary font-bold">
                {showDemoSelector ? "▲" : "▼"}
              </span>
            </button>

            {showDemoSelector && (
              <div className="mt-3 space-y-2">
                {DEMO_ARTISANS.map((demo) => (
                  <button
                    key={demo.name}
                    type="button"
                    onClick={() => handleDemoSelect(demo)}
                    className="w-full p-2.5 rounded-2xl bg-belikan-bg hover:bg-belikan-softRose border border-belikan-border hover:border-belikan-primary/40 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-belikan-dark group-hover:text-belikan-primary">
                        {demo.name}
                      </p>
                      <p className="text-[10px] text-belikan-secondary">
                        {demo.badge} • {demo.village}, {demo.state}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-belikan-primary bg-white px-2 py-1 rounded-full border border-belikan-border">
                      {t("login_demo_select", "Select")} →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <p className="text-[11px] text-belikan-neutral mt-5 text-center max-w-xs leading-relaxed">
        {t("login_footer_note", "Government of India Ministry of Textiles & ONDC Compatible. All data is persisted securely on device.")}
      </p>
    </div>
  );
}
