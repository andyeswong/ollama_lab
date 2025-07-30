import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ollama VRAM Calculator",
  description: "Calculate VRAM requirements for AI models running on Ollama",
  keywords: ["ollama", "vram", "calculator", "ai", "models", "gpu"],
  authors: [{ name: "VRAM Calculator Team" }],
  openGraph: {
    title: "Ollama VRAM Calculator",
    description: "Calculate VRAM requirements for AI models running on Ollama",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
