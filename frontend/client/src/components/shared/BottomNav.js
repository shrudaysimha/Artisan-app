"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FiHome,
  FiCompass,
  FiCamera,
  FiGrid,
  FiUser
} from "react-icons/fi";

const BottomNav = ({ onOpenStudio }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t("nav_shop", "Shop"),
      icon: FiHome,
      path: "/",
      isStudio: false,
    },
    {
      label: t("nav_explore", "Explore"),
      icon: FiCompass,
      path: "/products",
      isStudio: false,
    },
    {
      label: t("nav_studio", "Studio"),
      icon: FiCamera,
      path: "/studio",
      isStudio: true, // Belikan center prominent elevated camera button
    },
    {
      label: t("nav_catalog", "Catalog"),
      icon: FiGrid,
      path: "/dashboard",
      isStudio: false,
    },
    {
      label: t("nav_profile", "Profile"),
      icon: FiUser,
      path: "/profile",
      isStudio: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-belikan-surface/95 backdrop-blur-lg border-t border-belikan-border shadow-belikan-nav py-1 px-4 sm:px-8">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          if (item.isStudio) {
            return (
              <div key={item.label} className="relative -top-5 flex flex-col items-center">
                <button
                  onClick={() => {
                    if (onOpenStudio) {
                      onOpenStudio();
                    } else {
                      router.push("/studio");
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-belikan-primary hover:bg-belikan-primaryHover text-white flex items-center justify-center shadow-lg shadow-belikan-primary/30 transition-all transform hover:scale-105 active:scale-95 animate-belikan-pulse focus:outline-none"
                  title="Search with Image / CraftLens AI Studio"
                >
                  <Icon className="text-2xl" />
                </button>
                <span className="text-[11px] font-bold text-belikan-primary mt-1 tracking-tight">
                  {t("nav_studio", "Studio")}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-belikan-primary font-bold scale-105"
                  : "text-belikan-neutral hover:text-belikan-secondary"
              }`}
            >
              <Icon className={`text-xl ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "font-bold text-belikan-primary" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
