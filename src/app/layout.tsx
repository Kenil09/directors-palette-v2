import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PromptProvider } from "@/components/providers/PromptProvider"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Directors Palette",
  description: "Visual story and music video breakdown tool",
  generator: 'Directors Palette v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PromptProvider>
            {children}
          </PromptProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
