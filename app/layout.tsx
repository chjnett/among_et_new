import React from "react"
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/toaster"
import { KakaoInquiryButton } from "@/components/kakao-inquiry-button"
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-cormorant'
});

export const metadata: Metadata = {
  title: 'RICH',
  description: '시대를 초월한 아이템을 엄선하여 소개합니다',
  generator: 'v0.app',
  openGraph: {
    title: 'RICH',
    description: '시대를 초월한 아이템을 엄선하여 소개합니다',
    url: 'https://rich.vercel.app',
    siteName: 'RICH',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RICH',
    description: '시대를 초월한 아이템을 엄선하여 소개합니다',
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${cormorant.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <KakaoInquiryButton />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
