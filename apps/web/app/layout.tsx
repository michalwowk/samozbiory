import "./globals.css";

// lang is pl: the product is Polish, code and docs are English (ADR 0005).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
