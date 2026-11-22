import Auth from "./auth";
import Providers from "./providers";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "CraftLens — Belikan Artisanal E-Commerce & AI Studio",
  description: "AI-Powered visual appraisal, fair pricing, and smart listing platform for rural Indian artisans. Inspired by Belikan e-commerce design.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-belikan-bg text-belikan-dark min-h-screen selection:bg-belikan-primary selection:text-white antialiased">
        <Providers>
          <Auth>{children}</Auth>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#110B08',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
