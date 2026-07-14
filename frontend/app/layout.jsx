import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "./Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "dbManager",
  description: "Gerenciador de Banco de Dados",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-arp="">

      <body
        cz-shortcut-listen="true"
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
          
      </body>

    </html>
  );
}