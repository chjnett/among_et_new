"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const SCROLL_Y_KEY = "home-scroll-y"
const SCROLL_PATH_KEY = "home-scroll-path"

export function HomeScrollRestore() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    const savedPath = sessionStorage.getItem(SCROLL_PATH_KEY)
    const savedY = sessionStorage.getItem(SCROLL_Y_KEY)
    if (!savedPath || !savedY) return
    if (savedPath !== currentPath) return

    const y = Number(savedY)
    if (Number.isNaN(y)) return

    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" })
      window.setTimeout(() => {
        window.scrollTo({ top: y, behavior: "auto" })
        sessionStorage.removeItem(SCROLL_Y_KEY)
        sessionStorage.removeItem(SCROLL_PATH_KEY)
      }, 500)
    })
  }, [pathname, searchParams])

  return null
}
