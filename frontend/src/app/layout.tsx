import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orbit",
  description: "The future of learning.",
  icons: {
    icon: "/orbit-logo.png",
    shortcut: "/orbit-logo.png",
    apple: "/orbit-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${inter.variable} antialiased font-sans bg-[#000000] text-[#f2f2f2]`}
      >
        {children}
      </body>
    </html>
  );
}
