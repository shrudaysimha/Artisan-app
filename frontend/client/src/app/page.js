"use client";

import React, { useState, useEffect } from "react";
import Main from "@/components/shared/layouts/Main";
import ProductCard from "@/components/shared/ProductCard";
import ProductDetailModal from "@/components/shared/ProductDetailModal";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FiCamera,
  FiShield,
  FiZap,
  FiArrowRight,
  FiSliders
} from "react-icons/fi";
import { HiSparkles as FiSparkles } from "react-icons/hi";
import toast from "react-hot-toast";

// Curated authentic Indian GI craft items matching Belikan's marketplace aesthetic
const SEED_PRODUCTS = [
  {
    id: "seed-1",
    title: "Khurja Hand-Glazed Terracotta Tea Kettle",
    craft_type: "Ceramics & Pottery",
    category: "Pottery & Ceramics",
    artisanName: "Ramdev Prajapati",
    region: "Khurja, Uttar Pradesh",
    price: 850,
    originalPrice: 1250,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Khurja Riverbed Clay", "Natural Mineral Glaze"],
    estimated_hours: 4.5,
    description: "Wheel-thrown by master artisans in Khurja, this artisanal kettle undergoes double kiln firing at 1200°C for exceptional durability and natural heat retention.",
  },
  {
    id: "seed-2",
    title: "Channapatna Lacquer Wood Stacking Birds",
    craft_type: "Woodcraft & Toys",
    category: "Woodcraft",
    artisanName: "Nagaraju Gowda",
    region: "Channapatna, Karnataka",
    price: 680,
    originalPrice: 950,
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Ivory Wood (Wrightia Tinctoria)", "Natural Vegetable Lacquer"],
    estimated_hours: 3.0,
    description: "Hand-lathed using non-toxic natural vegetable dyes. A centuries-old GI-protected toy craft practiced in the toy city of Channapatna.",
  },
  {
    id: "seed-3",
    title: "Banarasi Handloom Katan Silk Dupatta",
    craft_type: "Handloom & Weaves",
    category: "Handloom & Weaves",
    artisanName: "Mohd. Zafar Ansari",
    region: "Varanasi, Uttar Pradesh",
    price: 2400,
    originalPrice: 3800,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Pure Katan Mulberry Silk", "Zari Metallic Thread"],
    estimated_hours: 14.0,
    description: "Hand-woven on a traditional pit loom featuring floral kadhwa jaal motifs. Takes over two full weeks of meticulous hand-weaving.",
  },
  {
    id: "seed-4",
    title: "Dhokra Lost-Wax Casted Tribal Musician",
    craft_type: "Metalcraft",
    category: "Brass & Metal",
    artisanName: "Buddhadev Karmakar",
    region: "Bastar, Chhattisgarh",
    price: 1450,
    originalPrice: 2100,
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Recycled Brass Alloy", "Beeswax Mold"],
    estimated_hours: 8.5,
    description: "Created through the ancient 4,000-year-old lost-wax hollow casting technique. No two pieces are ever alike as each clay mold is broken upon cooling.",
  },
  {
    id: "seed-5",
    title: "Jaipur Blue Pottery Floral Wall Plate",
    craft_type: "Pottery & Ceramics",
    category: "Pottery & Ceramics",
    artisanName: "Kripal Singh Studio",
    region: "Jaipur, Rajasthan",
    price: 1100,
    originalPrice: 1600,
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Quartz Stone Powder", "Fuller's Earth", "Cobalt Oxide"],
    estimated_hours: 6.0,
    description: "Distinctive traditional glaze pottery made without clay. Decorated with hand-painted Persian cobalt blue floral motifs.",
  },
  {
    id: "seed-6",
    title: "Madhubani Tree of Life Mithila Folk Art",
    craft_type: "Folk Paintings",
    category: "Folk Art & Madhubani",
    artisanName: "Sunita Devi Jha",
    region: "Madhubani, Bihar",
    price: 1850,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Handmade Cotton Rag Paper", "Twig & Bamboo Nibs", "Organic Dyes"],
    estimated_hours: 12.0,
    description: "Painted using natural pigments extracted from turmeric, indigo, and marigold flowers. Portrays the sacred Tree of Life in traditional Kachni style.",
  },
  {
    id: "seed-7",
    title: "Dokra Bell Metal Tribal Bull Figurine",
    craft_type: "Metalcraft",
    category: "Brass & Metal",
    artisanName: "Ranjit Bagdi",
    region: "Bikna, West Bengal",
    price: 920,
    originalPrice: 1350,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Bell Metal Brass", "Wax Filament Threading"],
    estimated_hours: 5.0,
    description: "Symbol of strength and agricultural heritage, crafted with delicate coiled wax threads by Bengal's indigenous artisans.",
  },
  {
    id: "seed-8",
    title: "Kutch Hand-Embroidered Mirrorwork Clutch",
    craft_type: "Textiles & Embroidery",
    category: "Handloom & Weaves",
    artisanName: "Valbai Rabari",
    region: "Bhuj, Gujarat",
    price: 1250,
    originalPrice: 1750,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80",
    giTagged: true,
    materials: ["Handspun Raw Cotton", "Abhla Glass Mirrors", "Silk Threads"],
    estimated_hours: 7.0,
    description: "Intricate Rabari tribal embroidery featuring real reflective mirrorwork designed to deflect harsh desert sunlight and negative energies.",
  },
];

const CATEGORIES = [
  "All",
  "Pottery & Ceramics",
  "Handloom & Weaves",
  "Woodcraft",
  "Brass & Metal",
  "Folk Art & Madhubani",
];

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "All":
        return t("cat_all", "All");
      case "Pottery & Ceramics":
        return t("cat_pottery", "Pottery & Ceramics");
      case "Textiles & Handloom":
      case "Handloom & Weaves":
        return t("cat_textiles", "Textiles & Handloom");
      case "Woodcraft":
        return t("cat_woodcraft", "Woodcraft");
      case "Brass & Metal":
      case "Metal & Brassware":
        return t("cat_metal", "Metal & Brassware");
      case "Folk Art & Madhubani":
      case "Paintings & Folk Art":
        return t("cat_paintings", "Paintings & Folk Art");
      case "Bamboo & Cane":
        return t("cat_bamboo", "Bamboo & Cane");
      default:
        return cat;
    }
  };

  // Fetch real published items from FastAPI backend
  useEffect(() => {
    fetch("http://localhost:8000/api/catalog/items")
      .then((res) => {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then((data) => {
        const liveItems = data.items || [];
        if (liveItems.length > 0) {
          // Format backend items and prepend to feed
          const mapped = liveItems.map((item) => {
            let itemArtisan = "Verified Artisan";
            try {
              const parsedTags = typeof item.tags === "string" ? JSON.parse(item.tags) : (item.tags || []);
              const foundArtisanTag = Array.isArray(parsedTags) && parsedTags.find(t => typeof t === "string" && t.startsWith("Artisan: "));
              if (foundArtisanTag) itemArtisan = foundArtisanTag.replace("Artisan: ", "");
            } catch (e) { }

            return {
              id: item.id,
              title: item.title,
              craft_type: item.craft_type,
              category: item.craft_type?.includes("Pottery") ? "Pottery & Ceramics" : (item.craft_type?.includes("Wood") ? "Woodcraft" : "Handloom & Weaves"),
              artisanName: itemArtisan,
              region: item.regional_style || "Certified Cluster",
              price: item.final_price || item.retail_recommended || 800,
              originalPrice: Math.round((item.final_price || 800) * 1.3),
              image: item.full_view_path
                ? `http://localhost:8000${item.full_view_path}`
                : "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80",
              giTagged: true,
              materials: item.materials || ["Natural Craft Materials"],
              estimated_hours: 4.0,
              description: item.description || item.craft_story,
            };
          });
          setProducts([...mapped, ...SEED_PRODUCTS]);
        }
      })
      .catch((err) => {
        // Fallback to seed products
        console.log("Using seed products:", err.message);
      });
  }, []);

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/catalog/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setProducts((prev) => prev.filter((p) => p.id !== itemId));
      toast.success(t("deleted_toast", "Craft removed from ONDC catalog"));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete craft. Please try again.");
    }
  };

  // Filter products by selected category
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
        (p) =>
          p.category === selectedCategory ||
          p.craft_type?.toLowerCase().includes(selectedCategory.toLowerCase())
      );

  return (
    <Main onOpenStudio={() => router.push("/studio")}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* Belikan Signature Hero Carousel / Promo Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-belikan-primary via-belikan-accent to-belikan-secondary text-white p-6 sm:p-10 shadow-belikan-card">
          {/* Subtle background ornamentation */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 hidden md:block w-48 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg transform rotate-3">
            <img
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=500&q=80"
              alt="Pottery Artisan"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase">
              <FiSparkles className="text-belikan-gold" /> {t("hero_tag", "CraftLens AI Studio & Marketplace")}
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-tight leading-tight">
              {t("hero_title", "Direct from Rural Hands to Global Collectors.")}
            </h1>

            <p className="text-xs sm:text-sm text-belikan-softRose font-medium leading-relaxed">
              {t("hero_sub", "Every creation is appraised by CraftLens Vision AI — verifying handmade GI heritage, calculating statutory fair wages, and creating instant ONDC listings.")}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Belikan Primary Action Button */}
              <button
                onClick={() => router.push("/studio")}
                className="px-6 py-3 rounded-full bg-belikan-surface text-belikan-primary hover:bg-belikan-softRose text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <FiCamera className="text-base text-belikan-primary" />
                <span>{t("snap_in_studio", "Snap Craft in Studio")}</span>
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
              >
                <span>{t("artisan_portal", "Artisan Portal")}</span>
                <FiArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Belikan Trust Value Pillars (Quick Badges) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-belikan-surface rounded-2xl p-3 border border-belikan-border/80 flex items-center gap-2.5 shadow-belikan-sm">
            <div className="w-8 h-8 rounded-full bg-belikan-softRose text-belikan-primary flex items-center justify-center font-bold text-sm shrink-0">
              📸
            </div>
            <div>
              <p className="text-xs font-bold text-belikan-dark leading-tight">{t("pillar_ai", "Dual-Shot AI")}</p>
              <p className="text-[10px] text-belikan-neutral">{t("pillar_ai_sub", "Texture & silhouette scan")}</p>
            </div>
          </div>

          <div className="bg-belikan-surface rounded-2xl p-3 border border-belikan-border/80 flex items-center gap-2.5 shadow-belikan-sm">
            <div className="w-8 h-8 rounded-full bg-belikan-softRose text-belikan-green flex items-center justify-center font-bold text-sm shrink-0">
              ⚖️
            </div>
            <div>
              <p className="text-xs font-bold text-belikan-dark leading-tight">{t("pillar_wage", "Fair Wage Engine")}</p>
              <p className="text-[10px] text-belikan-neutral">{t("pillar_wage_sub", "Statutory labor rates")}</p>
            </div>
          </div>

          <div className="bg-belikan-surface rounded-2xl p-3 border border-belikan-border/80 flex items-center gap-2.5 shadow-belikan-sm">
            <div className="w-8 h-8 rounded-full bg-belikan-softRose text-belikan-gold flex items-center justify-center font-bold text-sm shrink-0">
              🏅
            </div>
            <div>
              <p className="text-xs font-bold text-belikan-dark leading-tight">{t("pillar_gi", "GI Authenticity")}</p>
              <p className="text-[10px] text-belikan-neutral">{t("pillar_gi_sub", "Anti-counterfeit screening")}</p>
            </div>
          </div>

          <div className="bg-belikan-surface rounded-2xl p-3 border border-belikan-border/80 flex items-center gap-2.5 shadow-belikan-sm">
            <div className="w-8 h-8 rounded-full bg-belikan-softRose text-belikan-slate flex items-center justify-center font-bold text-sm shrink-0">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-belikan-dark leading-tight">{t("pillar_ondc", "ONDC & GeM Ready")}</p>
              <p className="text-[10px] text-belikan-neutral">{t("pillar_ondc_sub", "One-tap government sync")}</p>
            </div>
          </div>
        </div>

        {/* Belikan Scrollable Category Filter Pills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-belikan-dark">
              {t("explore_crafts", "Explore Handcrafts")}
            </h2>
            <span className="text-xs font-semibold text-belikan-neutral">
              {filteredProducts.length} {t("creations_available", "creations available")}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm ${selectedCategory === cat
                  ? "bg-belikan-primary text-white shadow-belikan-primary/20 scale-105"
                  : "bg-belikan-surface text-belikan-secondary hover:text-belikan-dark border border-belikan-border hover:border-belikan-neutral"
                  }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Belikan Signature Two-Column Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>

        {/* Artisan Floating Studio Callout Card */}
        <div className="bg-belikan-surface rounded-3xl p-6 sm:p-8 border border-belikan-border shadow-belikan-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-belikan-softRose text-belikan-primary flex items-center justify-center text-2xl font-bold shrink-0">

            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-belikan-dark">
                {t("callout_title", "Are you an artisan or weaver?")}
              </h3>
              <p className="text-xs sm:text-sm text-belikan-secondary mt-0.5 max-w-md">
                {t("callout_sub", "Photograph your work with CraftLens Studio. In 5 seconds, receive fair pricing, auto background removal, and an ONDC-ready catalog card.")}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/studio")}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-belikan-dark hover:bg-belikan-primary text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <FiCamera className="text-base" />
            <span>{t("launch_camera", "Launch Studio Camera")}</span>
          </button>
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onLaunchStudio={() => router.push("/studio")}
          onDelete={typeof selectedProduct.id === "number" ? handleDeleteItem : undefined}
        />
      )}
    </Main>
  );
}
