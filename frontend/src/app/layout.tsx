import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Jarvis OS",
  description: "Sarah's personal AI operating system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-slate-950">
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