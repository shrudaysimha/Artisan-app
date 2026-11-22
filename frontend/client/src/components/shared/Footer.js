"use client";

import React from "react";
import Container from "./Container";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-artisan-brown text-artisan-ivory py-12 mt-auto">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-artisan-olive/30 pb-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Kalaa Studio</h2>
            <p className="text-artisan-olive text-sm">Empowering artisans with fair pricing & AI insights.</p>
          </div>
          <div className="flex gap-4 md:justify-end">
            <Link href="/dashboard" className="hover:text-artisan-terracotta transition-colors">My Products</Link>
            <Link href="/studio" className="hover:text-artisan-terracotta transition-colors">Studio</Link>
          </div>
        </div>
        <div className="text-center text-sm text-artisan-olive">
          © {year} Kalaa Studio. All rights reserved.
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
