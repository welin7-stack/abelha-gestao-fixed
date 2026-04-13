import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abelha Rainha - Gestão de Entregas",
  description: "Sistema de gestão de entregas e logística da Abelha Rainha. Acompanhe suas entregas em tempo real.",
  keywords: ["Abelha Rainha", "Logística", "Entregas", "Gestão", "Transporte"],
  authors: [{ name: "Abelha Rainha" }],
  icons: {
    icon: "https://play-lh.googleusercontent.com/wAZe4EgTT5MYO4dEYYPs0jhqIYDeDqX817W7h4o0_Ty3M6qaenLbYoOH6JeTswUls3UP",
  },
  openGraph: {
    title: "Abelha Rainha - Gestão de Entregas",
    description: "Sistema de gestão de entregas e logística",
    siteName: "Abelha Rainha",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
