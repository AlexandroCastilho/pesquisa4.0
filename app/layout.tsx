import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const primaryFont = Manrope({
  variable: "--font-primary",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pesquisa 4.0",
  description: "Plataforma corporativa de pesquisas de satisfação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${primaryFont.variable} ${monoFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
