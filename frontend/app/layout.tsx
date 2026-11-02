import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Ze: Creatives — Creative Jobs. Real Opportunities.",
    template: "%s | Ze: Creatives",
  },
  description:
    "Ze: Creatives is a curated creative talent marketplace connecting ambitious clients with talented creative professionals across design, photography, film, music, fashion, tech, and more.",
  keywords: ["creative jobs", "creative talent", "design jobs", "creative marketplace", "hire creatives", "creative professionals"],
  authors: [{ name: "Ze: Creatives" }],
  creator: "Ze: Creatives",
  metadataBase: new URL("https://zecreatives.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zecreatives.com",
    siteName: "Ze: Creatives",
    title: "Ze: Creatives — Creative Jobs. Real Opportunities.",
    description: "Discover inspiring creative opportunities and connect with ambitious brands.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ze: Creatives",
    description: "Creative Jobs. Real Opportunities.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-brand-bg antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
