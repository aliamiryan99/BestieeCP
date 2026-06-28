import type { Metadata } from "next";
import { ToastHost } from "@/components/system/ToastHost";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bestiee CP",
  description: "Admin dashboard panel to manage the barbers",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
