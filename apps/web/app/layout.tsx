import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "GrocGo — Grocery Pre-Order & Pickup",
  description: "Scan, order, and pick up your groceries without the wait. GrocGo digitizes your local grocery store.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GrocGo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen antialiased bg-white text-gray-900 pt-safe">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              maxWidth: "90vw",
            },
            success: {
              iconTheme: { primary: "#16a34a", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "white" },
            },
          }}
        />
      </body>
    </html>
  );
}
