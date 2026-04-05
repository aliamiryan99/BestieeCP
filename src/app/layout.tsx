import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastHost } from "@/components/system/ToastHost";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barbers CP Admin Panel",
  description: "Admin dashboard panel to manage the barbers",
  icons: [
    {
      rel: "icon",
      url: `barbers.png`,
      type: "image/png",
      sizes: "any",
    },
    {
      rel: "apple-touch-icon",
      url: `barbers.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`font-vazir app-shell antialiased`}>
        <ConvexClientProvider>
          <ToastHost />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
