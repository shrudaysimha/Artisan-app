"use client";

import React, { useState } from "react";
import { FiHeart, FiShield, FiTag, FiEye } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductCard = ({ product, onSelect }) => {
  const { t, localizeProduct } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);

  // Localize item strings based on active language
  const item = localizeProduct ? localizeProduct(product) : product;

  // Normalize image url
  const imageUrl = item.image || item.full_view_path || "/placeholder-craft.jpg";
  const formattedImage = imageUrl.startsWith("http")
    ? imageUrl
    : imageUrl.startsWith("/api")
    ? `http://localhost:8000${imageUrl}`
    : imageUrl;

  const price = item.price || item.final_price || 850;
  const originalPrice = item.originalPrice || Math.round(price * 1.35);
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className="group relative bg-belikan-surface rounded-3xl p-3 border border-belikan-border/80 shadow-belikan-card hover:shadow-belikan-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-belikan-softRose/50">
        <img
          src={formattedImage}
          alt={item.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Top Badges (Handmade / GI / Trust) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {item.giTagged ? (
            <span className="px-2 py-0.5 rounded-full bg-belikan-gold/90 text-white text-[10px] font-bold tracking-wide shadow-sm backdrop-blur-sm flex items-center gap-1">
              <FiShield className="text-[10px]" /> {t("gi_verified", "GI Tagged")}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-belikan-green/90 text-white text-[10px] font-bold tracking-wide shadow-sm backdrop-blur-sm">
              {t("artisan_100", "✓ 100% Artisan")}
            </span>
          )}
          {item.fairWage !== false && (
            <span className="px-2 py-0.5 rounded-full bg-belikan-surface/90 text-belikan-dark text-[9px] font-semibold backdrop-blur-sm border border-belikan-border">
              {t("fair_price", "Fair Wage")}
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-sm ${
            isLiked
              ? "bg-belikan-primary text-white scale-110"
              : "bg-white/80 text-belikan-dark hover:bg-white hover:text-belikan-primary"
          }`}
          title={t("save_favorites", "Save to favorites")}
        >
          <FiHeart className={`text-sm ${isLiked ? "fill-white" : ""}`} />
        </button>

        {/* Quick View Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-full bg-white text-belikan-dark text-xs font-bold shadow-md flex items-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <FiEye className="text-belikan-primary" /> {t("view_details", "Inspect Details")}
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="mt-3 flex flex-col flex-1">
        <p className="text-[11px] font-semibold text-belikan-neutral uppercase tracking-wider line-clamp-1">
          {item.category || item.craft_type || "Traditional Craft"}
        </p>

        <h3 className="font-bold text-sm sm:text-base text-belikan-dark line-clamp-2 mt-0.5 group-hover:text-belikan-primary transition-colors leading-snug">
          {item.title}
        </h3>

        <div className="flex items-center gap-1.5 mt-1 text-xs text-belikan-secondary">
          <span className="truncate">
            {item.artisanName ? `${t("by_artisan", "By")} ${item.artisanName}` : t("master_artisan", "Master Artisan")}
          </span>
          <span>•</span>
          <span className="truncate">{item.region || "India"}</span>
        </div>

        {/* Pricing & Value */}
        <div className="mt-2.5 pt-2 border-t border-belikan-border/60 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-extrabold text-belikan-dark">
              ₹{price}
            </span>
            {originalPrice > price && (
              <span className="text-xs text-belikan-neutral line-through">
                ₹{originalPrice}
              </span>
            )}
          </div>

          {discount > 0 && (
            <span className="text-[10px] font-extrabold text-belikan-primary bg-belikan-softRose px-2 py-0.5 rounded-full">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
