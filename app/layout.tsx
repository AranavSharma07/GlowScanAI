import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlowScan AI — Your Personal Skin Companion",
  description: "Understand visible skin concerns and build a gentle, personalized skincare routine with GlowScan AI.",
  applicationName: "GlowScan AI"
};

export const viewport: Viewport = {
  themeColor: "#fbf8f5"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
