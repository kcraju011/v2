import type { Metadata } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  title: "BioAttend SaaS",
  description: "Production-grade multi-tenant attendance SaaS powered by Supabase",
  manifest: "/manifest.webmanifest"
};

export const viewport = {
  themeColor: "#4f46e5"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}