import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ZkVaultService",
  description: "Private and compliant transactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
