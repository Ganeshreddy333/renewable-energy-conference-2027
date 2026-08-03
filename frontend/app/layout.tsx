import type { Metadata } from "next";
import "./globals.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "Renewable Energy Conference 2027",
  description: "A global forum for renewable energy innovation and collaboration",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <ScrollToTop />
            {children}
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
