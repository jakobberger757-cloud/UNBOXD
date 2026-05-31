import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNBOXD | AI Gift Recommendations",
  description: "Insight-led gift recommendations that make recipients feel seen.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
