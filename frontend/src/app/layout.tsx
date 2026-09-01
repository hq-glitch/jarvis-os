import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Lato,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const libre = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Jarvis | Rouke Ranch OS",
  description: "The executive AI operating system of Rouke Ranch",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${libre.variable} ${lato.variable} antialiased`}
      >
        <div className="flex min-h-screen bg-[#F3EFE7] text-[#2C2C2C]">
          <Sidebar />

          <div className="min-w-0 flex-1">
            <Header />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}