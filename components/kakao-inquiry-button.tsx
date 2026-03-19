"use client"

import { MessageCircle } from "lucide-react"

export function KakaoInquiryButton() {
  return (
    <a
      href="https://open.kakao.com/o/sVOBwxli"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카톡 문의하기"
      className="fixed right-4 z-[1000] flex h-16 w-16 items-center justify-center rounded-full border border-black/20 bg-[#FEE500] text-black ring-2 ring-white shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] md:right-6"
      style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  )
}
