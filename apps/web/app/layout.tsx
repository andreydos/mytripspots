import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ApolloProviderWithClerk } from "@/lib/graphql/apollo-provider";
import { ServiceWorkerRegister } from "./sw-register";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MyTripSpots",
  description: "MyTripSpots — trips, map pins, and photos in one PWA.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <ClerkProvider>
          <ApolloProviderWithClerk>
            <ServiceWorkerRegister />
            {children}
          </ApolloProviderWithClerk>
        </ClerkProvider>
      </body>
    </html>
  );
}
