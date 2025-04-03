import type { Metadata } from "next";
import { Teko, Sigmar } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";

const sigmar = Sigmar({ subsets: ["latin"], weight: "400" });

const teko = Teko({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "LezzetExpress - Yemek Siparişi",
  description: "En lezzetli yemekleri sipariş edin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${sigmar.className} ${teko.className} antialiased`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
