import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enrique & Manuel - 30 de Mayo, 2025",
  description: "Únete a nuestra celebración de boda en la playa de Tarifa, España",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/tqk3qdr.css" precedence="default" />
      </head>
      <body className={'antialiased'} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
