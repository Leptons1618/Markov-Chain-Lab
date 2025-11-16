import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "MarkovLearn | Interactive Markov Chains Learning Platform",
  description:
    "Master Markov chains and advanced mathematics through interactive visualizations, step-by-step tutorials, and hands-on tools.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (!theme) {
                    // Set dracula as default if no theme is set
                    document.documentElement.classList.add('dark', 'dracula-theme');
                  } else if (theme === 'dracula') {
                    document.documentElement.classList.add('dark', 'dracula-theme');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dracula" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
