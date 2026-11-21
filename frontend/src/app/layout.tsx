import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: "CropDoc — AI Crop Disease Doctor & Farm Weather Guardian",
  description: "Diagnose crop diseases instantly with computer vision, receive verified organic and chemical remedies, and track agro-weather outbreak risks directly from your smartphone.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-512x512.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CropDoc"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
