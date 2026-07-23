import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tiramisucraft.ru"),
  title: {
    default: "TiramisuCraft — механика, небо и магия",
    template: "%s · TiramisuCraft",
  },
  description:
    "Приключенческий Minecraft-сервер с Create Aeronautics, воздушными кораблями, оружием и магией.",
  keywords: [
    "TiramisuCraft",
    "Minecraft сервер",
    "Create Aeronautics",
    "моды",
    "магия",
    "оружие",
  ],
  openGraph: {
    title: "TiramisuCraft — подними свой мир в небо",
    description:
      "Механизмы, воздушные корабли, оружие и магия в одном живом мире.",
    locale: "ru_RU",
    type: "website",
    siteName: "TiramisuCraft",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "TiramisuCraft — подними свой мир в небо",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TiramisuCraft — подними свой мир в небо",
    description: "Механизмы, воздушные корабли, оружие и магия.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
