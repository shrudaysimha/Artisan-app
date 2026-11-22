"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import React from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

const Providers = ({ children }) => {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LanguageProvider>
    </Provider>
  );
};

export default Providers;
