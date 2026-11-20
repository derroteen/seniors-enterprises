import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { WhatsAppFloatingButton } from "@/components/store/whatsapp-floating-button";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND.name} | Considered everyday essentials`,
    template: `%s | ${BRAND.name}`,
  },
  description: `Shop thoughtfully selected everyday essentials from ${BRAND.name}.`,
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: BRAND.name,
    title: `${BRAND.name} | Considered everyday essentials`,
    description: `Shop thoughtfully selected everyday essentials from ${BRAND.name}.`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: BRAND.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | Considered everyday essentials`,
    description: `Shop thoughtfully selected everyday essentials from ${BRAND.name}.`,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfairDisplay.variable} min-h-screen`}>
        <ThemeProvider>
          {children}
          <WhatsAppFloatingButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
