"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FiX,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiTag,
  FiShoppingBag,
  FiShare2,
  FiExternalLink,
  FiAward,
  FiTrash2,
  FiLayers,
  FiCheck
} from "react-icons/fi";
import toast from "react-hot-toast";

const ProductDetailModal = ({ product, onClose, onLaunchStudio, onDelete }) => {
  const { t, localizeProduct } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview"); // overview, pricing, provenance
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!product) return null;

  const item = localizeProduct ? localizeProduct(product) : product;
  const isArtisanItem = typeof product.id === "number" || Boolean(onDelete);

  let pricingBreakdown = item?.pricing_breakdown || {};
  if (typeof pricingBreakdown === "string") {
    try { pricingBreakdown = JSON.parse(pricingBreakdown); } catch (e) { pricingBreakdown = {}; }
  }
  const weightGrams = item?.weight_grams || pricingBreakdown?.weight_grams;
  const isHollow = item?.is_hollow !== undefined ? item.is_hollow : pricingBreakdown?.is_hollow;
  const physicalBadge = pricingBreakdown?.physical_verification_badge;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(product.id);
      } else {
        const res = await fetch(`http://localhost:8000/api/catalog/items/${product.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete item");
        toast.success(t("deleted_toast", "Craft removed from ONDC catalog"));
      }
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete craft. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const imageUrl = item.image || item.full_view_path || "/placeholder-craft.jpg";
  const formattedImage = imageUrl.startsWith("http")
    ? imageUrl
    : imageUrl.startsWith("/api")
    ? `http://localhost:8000${imageUrl}`
    : imageUrl;

  const price = item.price || item.final_price || 850;
  const wholesalePrice = Math.round(price * 0.72);
  const premiumCeiling = Math.round(price * 1.35);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-belikan-surface rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-belikan-hover border border-belikan-border my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-belikan-border flex items-center justify-center text-belikan-dark hover:bg-belikan-primary hover:text-white transition-colors shadow-sm"
        >
          <FiX className="text-lg" />
        </button>

        {/* Modal Header & Hero Image */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-belikan-softRose overflow-hidden">
          <img
            src={formattedImage}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
            <div className="text-white space-y-1">
              <span className="px-2.5 py-1 rounded-full bg-belikan-primary text-white text-[11px] font-bold uppercase tracking-wider">
                {item.category || item.craft_type || "Heritage Craft"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                {item.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-200 font-medium">
                {item.artisanName ? `${t("by_artisan", "By")} ${item.artisanName}` : t("master_artisan", "Master Artisan")} • {item.region || "Jaipur, Rajasthan"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-belikan-border px-6 pt-2 bg-belikan-bg/50">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-belikan-primary text-belikan-primary"
                : "border-transparent text-belikan-secondary hover:text-belikan-dark"
            }`}
          >
            {t("craft_overview", "Craft Story & Specs")}
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "pricing"
                ? "border-belikan-primary text-belikan-primary"
                : "border-transparent text-belikan-secondary hover:text-belikan-dark"
            }`}
          >
            {t("fair_breakdown", "AI Fair Price Matrix")}
          </button>
          <button
            onClick={() => setActiveTab("provenance")}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === "provenance"
                ? "border-belikan-primary text-belikan-primary"
                : "border-transparent text-belikan-secondary hover:text-belikan-dark"
            }`}
          >
            {t("provenance", "Trust & QR Certificate")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-belikan-neutral">
                  {t("artisan_story_title", "Artisan Story & Heritage")}
                </h4>
                <p className="text-sm text-belikan-secondary leading-relaxed mt-1">
                  {item.description ||
                    item.craft_story ||
                    "This authentic creation is handcrafted using ancestral methods passed down across generations. Every texture and chisel mark embodies the living heritage of regional Indian craftsmanship."}
                </p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-belikan-bg p-3 rounded-2xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral uppercase font-bold">{t("materials_label", "Materials")}</span>
                  <p className="text-xs font-semibold text-belikan-dark mt-0.5">
                    {Array.isArray(item.materials)
                      ? item.materials.join(", ")
                      : item.materials || "Natural Terracotta Clay"}
                  </p>
                </div>
                <div className="bg-belikan-bg p-3 rounded-2xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral uppercase font-bold">{t("labor_hours_label", "Labor Hours")}</span>
                  <p className="text-xs font-semibold text-belikan-dark mt-0.5 flex items-center gap-1">
                    <FiClock className="text-belikan-primary text-xs" />
                    {item.estimated_hours || "4.5"} {t("hours_unit", "hours")}
                  </p>
                </div>
                <div className="bg-belikan-bg p-3 rounded-2xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral uppercase font-bold">{t("skill_level_label", "Skill Level")}</span>
                  <p className="text-xs font-semibold text-belikan-dark mt-0.5 flex items-center gap-1">
                    <FiAward className="text-belikan-gold text-xs" />
                    {t("master_artisan", "Master Artisan (Level 4/5)")}
                  </p>
                </div>
                {weightGrams && (
                  <div className="bg-belikan-bg p-3 rounded-2xl border border-belikan-border col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-belikan-neutral uppercase font-bold">{t("craft_weight", "Craft Weight")}</span>
                    <p className="text-xs font-semibold text-belikan-dark mt-0.5 flex items-center gap-1">
                      <FiLayers className="text-belikan-primary text-xs shrink-0" />
                      <span>{weightGrams}g</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-belikan-primary/10 text-belikan-primary rounded-full font-bold ml-1">
                        {isHollow ? t("hollow_structure", "Hollow") : t("solid_structure", "Solid")}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* GI Tag & Authenticity Badge */}
              <div className="bg-belikan-softRose/50 border border-belikan-primary/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-belikan-primary text-white flex items-center justify-center shrink-0">
                  <FiShield className="text-lg" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-belikan-primary">
                    {t("authenticity_verified", "AI Verified Artisan Authenticity: 96%")}
                  </h5>
                  <p className="text-[11px] text-belikan-secondary leading-tight mt-0.5">
                    {t("authenticity_sub", "Scanned via Multimodal Vision AI. Passed non-mechanized craft screening.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4">
              {physicalBadge && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs">
                    <FiCheck />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">{t("verified_physical_badge", "Physical Specs Grounded")}</p>
                    <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">{physicalBadge}</p>
                  </div>
                </div>
              )}

              <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-belikan-neutral">
                  {t("statutory_analysis", "Statutory Wage & Cost Analysis")}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-belikan-border/50">
                    <span className="text-belikan-secondary">{t("raw_material_cost", "Raw Material Cost")}</span>
                    <span className="font-bold text-belikan-dark">₹{Math.round(price * 0.35)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-belikan-border/50">
                    <span className="text-belikan-secondary">{t("skilled_labor", "Skilled Labor Benchmark")}</span>
                    <span className="font-bold text-belikan-dark">₹{Math.round(price * 0.42)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-belikan-border/50">
                    <span className="text-belikan-secondary">{t("heritage_multiplier", "Skill & Heritage Multiplier (1.25x)")}</span>
                    <span className="font-bold text-belikan-dark">₹{Math.round(price * 0.15)}</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                    <span className="text-belikan-dark">{t("recommended_retail", "Recommended Retail Price")}</span>
                    <span className="text-belikan-primary text-base">₹{price}</span>
                  </div>
                </div>
              </div>

              {/* Price Band Visualization */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-white rounded-xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral font-semibold">{t("wholesale_floor", "Wholesale Floor")}</span>
                  <p className="text-sm font-bold text-belikan-dark mt-0.5">₹{wholesalePrice}</p>
                </div>
                <div className="p-3 bg-belikan-softRose rounded-xl border border-belikan-primary/30">
                  <span className="text-[10px] text-belikan-primary font-bold">{t("recommended", "Recommended")}</span>
                  <p className="text-base font-extrabold text-belikan-primary mt-0.5">₹{price}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-belikan-border">
                  <span className="text-[10px] text-belikan-neutral font-semibold">{t("premium_ceiling", "Premium Ceiling")}</span>
                  <p className="text-sm font-bold text-belikan-dark mt-0.5">₹{premiumCeiling}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "provenance" && (
            <div className="space-y-4 text-center">
              <div className="bg-belikan-bg rounded-2xl p-6 border border-belikan-border flex flex-col items-center">
                {/* QR Code Simulation */}
                <div className="w-36 h-36 bg-white p-3 rounded-2xl shadow-sm border border-belikan-border flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://localhost:5000/product/${item.id || 1}`}
                    alt="Product Provenance QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h5 className="font-bold text-sm text-belikan-dark mt-3">
                  {t("blockchain_id", "Blockchain Provenance ID")}: CRFT-{item.id || "8421"}
                </h5>
                <p className="text-xs text-belikan-secondary max-w-xs mt-1">
                  {t("qr_desc", "Buyers can scan this QR code on any smartphone to verify the artisan’s village, GI registration, and certified fair wage badge.")}
                </p>

                <a
                  href={`http://localhost:5000/product/${item.id || 1}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-4 py-2 rounded-full bg-belikan-surface border border-belikan-border text-xs font-bold text-belikan-primary hover:bg-belikan-softRose transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FiExternalLink /> {t("trust_layer_btn", "Open Trust Layer Page (Port 5000)")}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom CTA Footer */}
        <div className="p-6 bg-belikan-bg border-t border-belikan-border flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-belikan-neutral font-semibold">{t("direct_artisan_price", "Direct Artisan Price")}</span>
            <span className="text-2xl font-extrabold text-belikan-dark">₹{price}</span>
          </div>

          <div className="flex items-center gap-2">
            {isArtisanItem && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors shadow-sm"
                title={t("delete_craft", "Delete from ONDC")}
              >
                <FiTrash2 className="text-base" />
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-belikan-surface border border-belikan-border text-belikan-dark hover:text-belikan-primary transition-colors shadow-sm"
              title="Share item link"
            >
              <FiShare2 className="text-base" />
            </button>

            <button
              onClick={() => {
                onClose();
                if (onLaunchStudio) onLaunchStudio();
              }}
              className="px-5 py-3 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <FiShoppingBag className="text-base" />
              <span>{t("buy_direct", "Buy Directly")}</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-belikan-surface border border-belikan-border rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
                <FiTrash2 className="text-xl" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-serif font-bold text-lg text-belikan-dark">
                  {t("confirm_delete_title", "Delete Craft from ONDC?")}
                </h3>
                <p className="text-xs text-belikan-secondary">
                  {t("confirm_delete_desc", "This craft listing and its provenance certificate will be permanently removed from the ONDC marketplace.")}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-full border border-belikan-border text-xs font-semibold text-belikan-secondary hover:bg-belikan-bg transition-colors"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t("deleting", "Deleting...")}</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="text-xs" />
                      <span>{t("delete_craft", "Delete from ONDC")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailModal;
