"use client";

import React, { useState } from "react";
import Main from "@/components/shared/layouts/Main";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiUser,
  FiShield,
  FiMapPin,
  FiGlobe,
  FiCheck,
  FiAward,
  FiPhone,
  FiExternalLink,
  FiLock,
  FiChevronRight,
  FiLogOut,
  FiEdit3,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { currentLang, setLanguage, t } = useLanguage();
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "bn", name: "Bengali", native: "বাংলা" },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const startEditing = () => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone?.replace("+91 ", "") || "",
      village: user?.village || "",
      district: user?.district || "",
      specialty: user?.specialty || "",
      experience: user?.experience || "",
    });
    setIsEditing(true);
  };

  const saveEdits = () => {
    const initials = editForm.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    updateUser({
      name: editForm.name.trim(),
      phone: "+91 " + editForm.phone.replace(/\+91\s?/, "").trim(),
      village: editForm.village.trim(),
      district: editForm.district.trim(),
      region: [editForm.village, editForm.district, user?.state].filter(Boolean).join(", "),
      specialty: editForm.specialty,
      experience: editForm.experience.trim(),
      initials,
    });
    setIsEditing(false);
    toast.success("Profile updated!");
  };

  if (!user) return null;

  const initials = user.initials || user.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <Main onOpenStudio={() => router.push("/studio")}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Artisan Header Card */}
        <div className="bg-belikan-surface rounded-3xl p-6 border border-belikan-border shadow-belikan-card flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-belikan-primary text-white font-serif text-3xl font-bold flex items-center justify-center shadow-md">
              {initials}
            </div>
            {user.verified && (
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-belikan-green text-white flex items-center justify-center text-xs shadow-sm"
                title={t("kyc_verified", "Pehchan Verified")}
              >
                ✓
              </div>
            )}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-belikan-dark">
                {user.name}
              </h1>
              <button
                onClick={startEditing}
                className="text-belikan-neutral hover:text-belikan-primary transition-colors"
                title="Edit Profile"
              >
                <FiEdit3 className="text-sm" />
              </button>
            </div>
            <p className="text-xs text-belikan-secondary">
              {user.specialty}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-belikan-neutral">
              <span className="flex items-center gap-1 text-belikan-dark">
                <FiMapPin className="text-belikan-primary" /> {user.region || user.state}
              </span>
              {user.verified && (
                <>
                  <span>•</span>
                  <span className="text-belikan-green font-bold flex items-center gap-1">
                    <FiShield /> {t("kyc_verified", "Pehchan Verified")}
                  </span>
                </>
              )}
            </div>
            {user.phone && (
              <p className="text-[11px] text-belikan-neutral flex items-center gap-1 pt-0.5">
                <FiPhone className="text-belikan-primary text-xs" /> {user.phone}
              </p>
            )}
          </div>
        </div>

        {/* Edit Modal (inline) */}
        {isEditing && (
          <div className="bg-belikan-surface rounded-3xl p-6 border border-belikan-primary/30 shadow-belikan-card space-y-4">
            <h3 className="font-bold text-sm text-belikan-dark flex items-center gap-2">
              <FiEdit3 className="text-belikan-primary" /> Edit Profile
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
              />
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Mobile Number"
                className="w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editForm.village}
                  onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                  placeholder="Village / Town"
                  className="px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
                />
                <input
                  type="text"
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                  placeholder="District"
                  className="px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
                />
              </div>
              <input
                type="text"
                value={editForm.specialty}
                onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                placeholder="Craft Specialty"
                className="w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
              />
              <input
                type="text"
                value={editForm.experience}
                onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                placeholder="Years of Experience"
                className="w-full px-4 py-2.5 rounded-2xl bg-belikan-bg border border-belikan-border text-sm text-belikan-dark focus:outline-none focus:ring-2 focus:ring-belikan-primary/30"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveEdits}
                className="flex-1 py-2.5 rounded-full bg-belikan-primary text-white text-xs font-bold transition-all active:scale-[0.98]"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-full bg-belikan-bg text-belikan-secondary text-xs font-semibold border border-belikan-border transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Identity & KYC Verification Badge */}
        <div className={`rounded-3xl p-5 border space-y-3 ${user.verified ? "bg-belikan-softRose/60 border-belikan-primary/20" : "bg-belikan-bg border-belikan-border"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center ${user.verified ? "bg-belikan-primary" : "bg-belikan-neutral"}`}>
                <FiAward className="text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-belikan-dark">
                  {t("pehchan_card_title", "Ministry of Textiles Pehchan Card")}
                </h3>
                <p className="text-xs text-belikan-secondary">
                  ID: {user.pehchanId || "Not Provided"}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-white text-[10px] font-bold ${user.verified ? "bg-belikan-green" : "bg-belikan-neutral"}`}>
              {user.verified ? t("verified_badge", "VERIFIED") : "UNVERIFIED"}
            </span>
          </div>

          <p className="text-xs text-belikan-secondary leading-relaxed">
            {user.verified
              ? t("pehchan_card_desc", "Your identity guarantees that buyers pay direct fair wages with zero middleman commissions. Products automatically inherit your GI Authenticity certification.")
              : "Add your Pehchan Card ID in profile edit to get verified status and unlock GI certification for your listings."
            }
          </p>
        </div>

        {/* Artisan Details Card */}
        <div className="bg-belikan-surface rounded-3xl p-6 border border-belikan-border shadow-belikan-sm space-y-3">
          <h3 className="font-bold text-sm text-belikan-dark flex items-center gap-2">
            <FiUser className="text-belikan-primary" /> Artisan Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Village / Town", value: user.village },
              { label: "District", value: user.district },
              { label: "State", value: user.state },
              { label: "Experience", value: user.experience },
              { label: "Artisan ID", value: user.pehchanId },
              { label: "Specialty", value: user.specialty },
            ].map(
              (item) =>
                item.value && (
                  <div key={item.label} className="p-3 rounded-2xl bg-belikan-bg border border-belikan-border">
                    <p className="text-[10px] text-belikan-neutral font-semibold">{item.label}</p>
                    <p className="text-xs font-bold text-belikan-dark mt-0.5">{item.value}</p>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Language Preferences */}
        <div className="bg-belikan-surface rounded-3xl p-6 border border-belikan-border shadow-belikan-sm space-y-4">
          <div className="flex items-center gap-2">
            <FiGlobe className="text-belikan-primary text-lg" />
            <h3 className="font-bold text-sm text-belikan-dark">
              {t("language_display", "Interface & Voice Language")}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  toast.success(`${t("toast_lang_set", "Language set to")} ${l.native}`);
                }}
                className={`p-3 rounded-2xl text-left border transition-all ${currentLang === l.code
                    ? "border-belikan-primary bg-belikan-softRose text-belikan-primary"
                    : "border-belikan-border bg-belikan-bg hover:border-belikan-neutral text-belikan-dark"
                  }`}
              >
                <p className="font-bold text-sm leading-tight">{l.native}</p>
                <p className="text-[11px] text-belikan-secondary">{l.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Settings & External Links */}
        <div className="bg-belikan-surface rounded-3xl p-6 border border-belikan-border shadow-belikan-sm space-y-4">
          <h3 className="font-bold text-sm text-belikan-dark">
            {t("gateways_title", "Integrations & Government Gateways")}
          </h3>

          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-belikan-bg border border-belikan-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-belikan-dark">{t("ondc_sync", "ONDC Network Sync")}</p>
                <p className="text-[10px] text-belikan-secondary">{t("ondc_desc", "Open Network for Digital Commerce")}</p>
              </div>
              <span className="text-xs font-bold text-belikan-green flex items-center gap-1">
                ● {t("status_connected", "Connected")}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-belikan-bg border border-belikan-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-belikan-dark">{t("gem_sync", "GeM Portal Integration")}</p>
                <p className="text-[10px] text-belikan-secondary">{t("gem_desc", "Government e-Marketplace procurement")}</p>
              </div>
              <span className="text-xs font-bold text-belikan-green flex items-center gap-1">
                ● {t("status_active", "Active")}
              </span>
            </div>

            <a
              href="http://localhost:5000/product/1"
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-2xl bg-belikan-bg border border-belikan-border flex items-center justify-between hover:bg-belikan-softRose transition-colors group"
            >
              <div>
                <p className="text-xs font-bold text-belikan-dark group-hover:text-belikan-primary">
                  {t("trust_provenance_title", "Trust Provenance Viewer (Flask)")}
                </p>
                <p className="text-[10px] text-belikan-secondary">
                  {t("trust_provenance_desc", "Inspect consumer verification page on Port 5000")}
                </p>
              </div>
              <FiExternalLink className="text-belikan-primary text-sm" />
            </a>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-full bg-belikan-bg hover:bg-red-50 text-red-600 text-sm font-bold border border-belikan-border hover:border-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <FiLogOut className="text-base" />
          Sign Out
        </button>
      </div>
    </Main>
  );
}
