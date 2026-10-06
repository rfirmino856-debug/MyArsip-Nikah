import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyArsip Nikah - Desa Pelang Kidul",
  description: "Sistem Pengarsipan & Administrasi Pernikahan Digital Desa Pelang Kidul",
  icons: {
    icon: "/maskot.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
