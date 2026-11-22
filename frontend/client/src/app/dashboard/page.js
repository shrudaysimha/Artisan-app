"use client";

import React, { useEffect, useState } from "react";
import Main from "@/components/shared/layouts/Main";
import ProductDetailModal from "@/components/shared/ProductDetailModal";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiPlus,
  FiShield,
  FiExternalLink,
  FiCheckCircle,
  FiClock,
  FiShare2,
  FiPackage,
  FiDollarSign,
  FiZap,
  FiArrowRight,
  FiTrash2
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/catalog/items")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching catalog:", err);
        setLoading(false);
      });
  }, []);

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/catalog/items/${itemToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete item");
      }
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      if (selectedProduct && selectedProduct.id === itemToDelete.id) {
        setSelectedProduct(null);
      }
      toast.success(t("deleted_toast", "Craft removed from ONDC catalog"));
      setItemToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete craft. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCatalogValue = items.reduce(
    (acc, curr) => acc + (curr.final_price || curr.retail_recommended || 800),
    0
  );

  return (
    <Main onOpenStudio={() => router.push("/studio")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Artisan Profile & KPI Stat Cards (Belikan Style) */}
        <div className="bg-belikan-surface rounded-3xl p-6 sm:p-8 border border-belikan-border shadow-belikan-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-belikan-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-belikan-primary text-white font-serif text-2xl font-bold flex items-center justify-center shadow-md">
                {user?.initials || (user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "RP")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-belikan-dark">
                    {user?.name || t("artisan_name", "Rameshwar Prajapati")}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${user?.verified !== false
                      ? "bg-belikan-green/15 text-belikan-green border-belikan-green/20"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                    ✓ {user?.verified !== false ? t("verified_master_artisan", "Verified Master Artisan") : t("master_artisan", "Registered Artisan")}
                  </span>
                </div>
                <p className="text-xs text-belikan-secondary mt-0.5">
                  {user?.specialty ? `${user.specialty} • ` : ""}
                  Cluster: {user?.region || user?.state || "Khurja, Uttar Pradesh"} • ID: {user?.pehchanId || "CL-IN-8492"}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/studio")}
              className="px-6 py-3 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <FiPlus className="text-base" />
              <span>{t("snap_new_craft", "Snap New Craft (Studio)")}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-belikan-neutral">
                {t("total_listed", "Total Listed")}
              </span>
              <p className="text-2xl font-serif font-extrabold text-belikan-dark mt-1">
                {items.length}
              </p>
              <span className="text-[10px] text-belikan-green font-semibold">
                ● {t("live_ondc", "Live on ONDC & GeM")}
              </span>
            </div>

            <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-belikan-neutral">
                {t("catalog_valuation", "Catalog Valuation")}
              </span>
              <p className="text-2xl font-serif font-extrabold text-belikan-dark mt-1">
                ₹{totalCatalogValue.toLocaleString()}
              </p>
              <span className="text-[10px] text-belikan-secondary font-medium">
                {t("fair_mrp", "Fair Market MRP")}
              </span>
            </div>

            <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-belikan-neutral">
                {t("gi_auth", "GI Authenticity")}
              </span>
              <p className="text-2xl font-serif font-extrabold text-belikan-gold mt-1">
                100%
              </p>
              <span className="text-[10px] text-belikan-secondary font-medium">
                {t("anti_counterfeit", "Anti-counterfeit verified")}
              </span>
            </div>

            <div className="bg-belikan-bg rounded-2xl p-4 border border-belikan-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-belikan-neutral">
                {t("blockchain_qr", "Blockchain QR")}
              </span>
              <p className="text-2xl font-serif font-extrabold text-belikan-primary mt-1">
                {t("status_active", "Active")}
              </p>
              <span className="text-[10px] text-belikan-secondary font-medium">
                {t("trust_layer", "Port 5000 Trust Layer")}
              </span>
            </div>
          </div>
        </div>

        {/* Catalog Items Header & Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-belikan-dark">
              {t("artisan_catalog", "Artisan Catalog")}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-belikan-surface border border-belikan-border text-belikan-secondary">
              {items.length} {t("items_count", "items")}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-belikan-surface p-1 rounded-full border border-belikan-border text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-full transition-all ${activeTab === "all"
                  ? "bg-belikan-primary text-white"
                  : "text-belikan-secondary hover:text-belikan-dark"
                }`}
            >
              {t("tab_all", "All")}
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={`px-3 py-1.5 rounded-full transition-all ${activeTab === "published"
                  ? "bg-belikan-primary text-white"
                  : "text-belikan-secondary hover:text-belikan-dark"
                }`}
            >
              {t("tab_published", "ONDC Synced")}
            </button>
          </div>
        </div>

        {/* Loading / Empty / Item Grid */}
        {loading ? (
          <div className="text-center py-20 bg-belikan-surface rounded-3xl border border-belikan-border">
            <div className="w-10 h-10 border-4 border-belikan-softRose border-t-belikan-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-belikan-secondary">
              {t("loading_crafts", "Loading your verified crafts...")}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-belikan-surface rounded-3xl p-12 text-center border border-belikan-border shadow-belikan-card space-y-4">
            <div className="w-20 h-20 bg-belikan-softRose text-belikan-primary rounded-full flex items-center justify-center text-3xl mx-auto">

            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-lg font-serif font-bold text-belikan-dark">
                {t("no_products_digitized", "No products digitized yet")}
              </h3>
              <p className="text-xs text-belikan-secondary leading-relaxed">
                {t(
                  "no_products_desc",
                  "Use the CraftLens Studio to take two photos of your craft. In 5 seconds, AI calculates statutory fair pricing and creates an ONDC listing."
                )}
              </p>
            </div>
            <button
              onClick={() => router.push("/studio")}
              className="px-6 py-3 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white text-xs font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <FiPlus className="text-base" />
              <span>{t("launch_camera", "Launch Studio Camera")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedProduct(item)}
                className="group cursor-pointer bg-belikan-surface rounded-3xl overflow-hidden border border-belikan-border shadow-belikan-card hover:shadow-belikan-hover hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-belikan-bg overflow-hidden">
                  <img
                    src={
                      item.full_view_path
                        ? `http://localhost:8000${item.full_view_path}`
                        : "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-belikan-dark/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold">
                    ₹{item.final_price || item.retail_recommended || 850}
                  </div>
                  <div className="absolute top-2 left-2 bg-belikan-green text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {t("status_active", "ONDC Active")}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-belikan-neutral">
                      {item.craft_type || "Traditional Craft"}
                    </span>
                    <h3 className="font-serif font-bold text-sm text-belikan-dark line-clamp-1 mt-0.5 group-hover:text-belikan-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-belikan-secondary line-clamp-2 mt-1">
                      {item.description || item.craft_story || "Handmade artisan creation."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-belikan-border/80 flex items-center justify-between">
                    <a
                      href={`http://localhost:5000/product/${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold text-belikan-primary hover:underline flex items-center gap-1"
                      title="View Trust Provenance Page"
                    >
                      <FiShield className="text-xs" />
                      <span>{t("qr_provenance", "QR Provenance")}</span>
                    </a>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(`http://localhost:5000/product/${item.id}`);
                            toast.success(t("toast_qr_copied", "QR link copied!"));
                          }
                        }}
                        className="p-1.5 rounded-full hover:bg-belikan-bg text-belikan-secondary hover:text-belikan-dark transition-colors"
                        title={t("share_listing", "Share Provenance")}
                      >
                        <FiShare2 className="text-sm" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1.5 rounded-full hover:bg-red-50 text-belikan-secondary hover:text-red-600 transition-colors"
                        title={t("delete_craft", "Delete from ONDC")}
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-belikan-surface border border-belikan-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <FiTrash2 className="text-xl" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-belikan-dark">
                    {t("confirm_delete_title", "Delete Craft from ONDC?")}
                  </h3>
                  <p className="text-xs text-belikan-secondary mt-0.5">
                    {t("confirm_delete_desc", "This craft listing and its provenance certificate will be permanently removed from the ONDC marketplace.")}
                  </p>
                </div>
              </div>

              {/* Preview card of item being deleted */}
              <div className="p-3 bg-belikan-bg rounded-2xl border border-belikan-border flex items-center gap-3">
                <img
                  src={
                    itemToDelete.full_view_path
                      ? `http://localhost:8000${itemToDelete.full_view_path}`
                      : "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={itemToDelete.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-belikan-border"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=200&q=80";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-serif font-bold text-belikan-dark truncate">
                    {itemToDelete.title}
                  </h4>
                  <p className="text-xs text-belikan-secondary mt-0.5">
                    ₹{itemToDelete.final_price || itemToDelete.retail_recommended || 850} • {itemToDelete.craft_type || "Traditional Craft"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2.5 rounded-full border border-belikan-border text-xs sm:text-sm font-semibold text-belikan-secondary hover:text-belikan-dark hover:bg-belikan-bg transition-colors"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteItem}
                  className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t("deleting", "Deleting...")}</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="text-sm" />
                      <span>{t("delete_craft", "Delete from ONDC")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onLaunchStudio={() => router.push("/studio")}
            onDelete={async (id) => {
              const res = await fetch(`http://localhost:8000/api/catalog/items/${id}`, {
                method: "DELETE",
              });
              if (!res.ok) throw new Error("Failed to delete item");
              setItems((prev) => prev.filter((i) => i.id !== id));
              toast.success(t("deleted_toast", "Craft removed from ONDC catalog"));
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </Main>
  );
}
