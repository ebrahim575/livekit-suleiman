import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter, Prata } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })
const prata = Prata({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Ejaaz AI",
  description: "A futuristic AI-powered voice assistant interface",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={prata.className}>{children}</body>
    </html>
  )
}



import './globals.css'