"use client";

import React from "react";
import Header from "../header/Header";
import BottomNav from "../BottomNav";

const Main = ({ children, onOpenStudio }) => {
  return (
    <div className="min-h-screen flex flex-col bg-belikan-bg text-belikan-dark antialiased">
      <Header openStudioDirect={onOpenStudio} />
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav onOpenStudio={onOpenStudio} />
    </div>
  );
};

export default Main;
