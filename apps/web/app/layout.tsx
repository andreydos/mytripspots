import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ServiceWorkerRegister } from "./sw-register";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MyTripSpots",
  description: "MyTripSpots — trips, map pins, and photos in one PWA."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <ClerkProvider>
          <ServiceWorkerRegister />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
