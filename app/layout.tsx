import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credit Card Benefits Tracker",
  description: "Track and manage your credit card benefits in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

