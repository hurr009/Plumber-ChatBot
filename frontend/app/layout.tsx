import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plumber Bot",
  description: "RAG-powered support chatbot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
