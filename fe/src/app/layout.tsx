import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FocusBuddy - Trợ lý Học tập AI",
  description: "Ứng dụng trợ lý học tập thông minh dành cho sinh viên, kết hợp quản lý học tập, theo dõi cảm xúc và phân tích AI.",
};

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {/* Animated mesh gradient background */}
            <div className="mesh-gradient" />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

