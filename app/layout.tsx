import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StageNZ - AI Virtual Staging for NZ Realtors",
  description: "Transform empty rooms into beautifully staged properties in seconds. AI virtual staging built for New Zealand real estate agents.",
  metadataBase: new URL("https://stagenz.co.nz"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
