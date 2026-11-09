import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Targa Personalizzata",
  description: "Componi la tua targa personalizzata italiana nel formato AA 000 AA, con verifica delle regole in tempo reale.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        <link rel="preload" href="/fonts/BarlowCondensed-SemiBold.ttf" as="font" type="font/ttf" crossOrigin="" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
