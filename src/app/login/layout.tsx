import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionInitializer } from "@/components/system/SessionInitializer";
import { ToastHost } from "@/components/system/ToastHost";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ورود | Barbers CP",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-vazir app-shell antialiased">
        <SessionInitializer />
        <ToastHost />
        <main className="flex min-h-screen items-center justify-center p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
