"use client";

import React, { useState } from "react";
import Main from "@/components/shared/layouts/Main";
import ProductCard from "@/components/shared/ProductCard";
import ProductDetailModal from "@/components/shared/ProductDetailModal";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FiFilter,
  FiSearch,
  FiShield,
  FiCamera,
  FiMapPin,
  FiCheck
} from "react-icons/fi";

const ALL_CRAFTS = [
  {
    id: "exp-1",
    title: "Khurja Hand-Glazed Terracotta Tea Kettle",
    craft_type: "Ceramics & Pottery",
    category: "Pottery & Ceramics",
    artisanName: "Ramdev Prajapati",
    region: "Uttar Pradesh",
    price: 850,
    originalPrice: 1250,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Khurja Riverbed Clay", "Mineral Glaze"],
    estimated_hours: 4.5,
  },
  {
    id: "exp-2",
    title: "Channapatna Lacquer Wood Stacking Birds",
    craft_type: "Woodcraft & Toys",
    category: "Woodcraft",
    artisanName: "Nagaraju Gowda",
    region: "Karnataka",
    price: 680,
    originalPrice: 950,
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Ivory Wood", "Vegetable Lacquer"],
    estimated_hours: 3.0,
  },
  {
    id: "exp-3",
    title: "Banarasi Handloom Katan Silk Dupatta",
    craft_type: "Handloom & Weaves",
    category: "Handloom & Weaves",
    artisanName: "Mohd. Zafar Ansari",
    region: "Uttar Pradesh",
    price: 2400,
    originalPrice: 3800,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Katan Silk", "Zari"],
    estimated_hours: 14.0,
  },
  {
    id: "exp-4",
    title: "Dhokra Lost-Wax Casted Tribal Musician",
    craft_type: "Metalcraft",
    category: "Brass & Metal",
    artisanName: "Buddhadev Karmakar",
    region: "Chhattisgarh",
    price: 1450,
    originalPrice: 2100,
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Brass Alloy", "Beeswax Mold"],
    estimated_hours: 8.5,
  },
  {
    id: "exp-5",
    title: "Jaipur Blue Pottery Floral Wall Plate",
    craft_type: "Pottery & Ceramics",
    category: "Pottery & Ceramics",
    artisanName: "Kripal Singh Studio",
    region: "Rajasthan",
    price: 1100,
    originalPrice: 1600,
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Quartz Powder", "Cobalt Oxide"],
    estimated_hours: 6.0,
  },
  {
    id: "exp-6",
    title: "Madhubani Tree of Life Mithila Folk Art",
    craft_type: "Folk Paintings",
    category: "Folk Art & Madhubani",
    artisanName: "Sunita Devi Jha",
    region: "Bihar",
    price: 1850,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Handmade Rag Paper", "Organic Pigments"],
    estimated_hours: 12.0,
  },
  {
    id: "exp-7",
    title: "Dokra Bell Metal Tribal Bull Figurine",
    craft_type: "Metalcraft",
    category: "Brass & Metal",
    artisanName: "Ranjit Bagdi",
    region: "West Bengal",
    price: 920,
    originalPrice: 1350,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Bell Metal Brass", "Wax Coiling"],
    estimated_hours: 5.0,
  },
  {
    id: "exp-8",
    title: "Kutch Hand-Embroidered Mirrorwork Clutch",
    craft_type: "Textiles & Embroidery",
    category: "Handloom & Weaves",
    artisanName: "Valbai Rabari",
    region: "Gujarat",
    price: 1250,
    originalPrice: 1750,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Raw Cotton", "Abhla Mirrors"],
    estimated_hours: 7.0,
  },
];

const REGIONS = ["All Regions", "Uttar Pradesh", "Rajasthan", "Karnataka", "West Bengal", "Gujarat", "Chhattisgarh", "Bihar"];

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [giOnly, setGiOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = ALL_CRAFTS.filter((item) => {
    const matchesRegion = selectedRegion === "All Regions" || item.region === selectedRegion;
    const matchesGi = !giOnly || item.giTagged;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesGi && matchesSearch;
  });

  return (
    <Main onOpenStudio={() => router.push("/studio")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-belikan-dark">
              {t("explore_heritage", "Explore Heritage Crafts")}
            </h1>
            <p className="text-xs sm:text-sm text-belikan-secondary mt-0.5">
              {t("explore_heritage_sub", "Browse authentic GI-certified crafts direct from master Indian clusters.")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGiOnly(!giOnly)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                giOnly
                  ? "bg-belikan-gold text-white border-belikan-gold"
                  : "bg-belikan-surface text-belikan-dark border-belikan-border hover:border-belikan-gold"
              }`}
            >
              <FiShield />
              <span>{t("gi_tagged_only", "GI Tagged Only")}</span>
            </button>

            <button
              onClick={() => router.push("/studio")}
              className="px-4 py-2 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <FiCamera />
              <span>{t("visual_search", "Visual Search")}</span>
            </button>
          </div>
        </div>

        {/* Region Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedRegion === reg
                  ? "bg-belikan-dark text-white shadow-sm"
                  : "bg-belikan-surface text-belikan-secondary border border-belikan-border hover:border-belikan-neutral"
              }`}
            >
              {reg === "All Regions" ? t("all_regions", "All Regions") : reg}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onSelect={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-belikan-surface rounded-3xl border border-belikan-border">
            <p className="text-sm font-semibold text-belikan-secondary">
              {t("no_matching", "No matching handicrafts found in this selection.")}
            </p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onLaunchStudio={() => router.push("/studio")}
        />
      )}
    </Main>
  );
}
