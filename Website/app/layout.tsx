import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { VaultProvider } from "./contexts/vault-context"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Hasheger - Secure Password Manager",
  description: "A secure, modern password manager for all your credentials with biometric authentication",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#121212] text-[#F5F5F5] font-sans`}>
        <VaultProvider>
          <Suspense fallback={null}>
            {children}
            <Analytics />
          </Suspense>
        </VaultProvider>
      </body>
    </html>
  )
}
