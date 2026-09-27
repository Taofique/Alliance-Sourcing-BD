import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Alliance Sourcing BD",
    template: "%s | Alliance Sourcing BD",
  },
  description:
    "Professional buying and sourcing services for apparel and garment manufacturing.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
