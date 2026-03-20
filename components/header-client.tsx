"use client"

import { Search, X, ShoppingBag } from "lucide-react"
import type { Category } from "@/lib/data"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"

export function HeaderClient({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const menuCategories = categories.filter((cat) => cat.name !== "전체")

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery("")
  }

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white">
      <div className="relative mx-auto flex h-[58px] max-w-[2000px] items-center px-4 md:h-[68px] md:px-8">
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-foreground"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="메뉴 열기"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="6" x2="20" y2="6" />
              <line x1="2" y1="12" x2="20" y2="12" />
              <line x1="2" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          <button className="p-1.5 text-foreground" onClick={() => setSearchOpen(true)} aria-label="검색">
            <Search className="h-[19px] w-[19px] stroke-[1.6]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false)
            setSearchOpen(false)
            setSearchQuery("")
            router.push("/")
          }}
          className="absolute left-1/2 z-20 -translate-x-1/2 text-[28px] leading-none tracking-tight text-[#1a1a1a] md:text-[40px]"
          aria-label="메인으로 이동"
        >
          SELECT
        </button>

        <button className="ml-auto p-1.5 text-foreground" aria-label="장바구니">
          <ShoppingBag className="h-[19px] w-[19px] stroke-[1.6]" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[300] md:hidden">
          <button
            aria-label="메뉴 닫기 오버레이"
            className="absolute inset-0 bg-black/20"
            onClick={closeMenu}
          />

          <aside className="absolute inset-y-0 left-0 w-screen overflow-y-auto bg-white shadow-[18px_0_40px_rgba(0,0,0,0.22)]">
            <div className="relative h-[240px] overflow-hidden border-b border-black/80">
              <img src="/side_bar.jpeg" alt="Sidebar preview" className="h-full w-full object-cover" />
              <button
                onClick={closeMenu}
                className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
                aria-label="메뉴 닫기"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-[34px] leading-none tracking-tight">SELECT</p>
                <p className="mt-1 text-[13px] tracking-[0.06em]">PREMIUM LINE</p>
              </div>
            </div>

            <nav className="space-y-5 px-5 py-6">
              {menuCategories.map((cat) => (
                <section key={cat.name} className="space-y-2 border-b border-black/10 pb-4">
                  <button
                    onClick={() => {
                      router.push(`/?category=${encodeURIComponent(cat.name)}`)
                      closeMenu()
                    }}
                    className="block text-left text-[28px] leading-none tracking-tight text-[#111]"
                  >
                    {cat.name}
                  </button>

                  {cat.subCategories.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                      {cat.subCategories.map((sub) => (
                        <button
                          key={`${cat.name}-${sub}`}
                          onClick={() => {
                            router.push(`/?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(sub)}`)
                            closeMenu()
                          }}
                          className="text-left text-[15px] tracking-tight text-black/75"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-white/95 px-6 pt-[120px] backdrop-blur-sm">
          <button
            className="absolute right-6 top-6 p-2 text-gray-500"
            onClick={() => {
              setSearchOpen(false)
              setSearchQuery("")
            }}
            aria-label="검색 닫기"
          >
            <X className="h-6 w-6 stroke-[1.5]" />
          </button>

          <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-gray-400">검색</p>

          <form onSubmit={handleSearch} className="w-full max-w-xl">
            <div className="flex items-center gap-3 border-b-2 border-black pb-3">
              <Search className="h-5 w-5 shrink-0 stroke-[1.5] text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명, 카테고리 검색..."
                className="flex-1 bg-transparent text-[18px] font-light tracking-wide text-black placeholder:text-gray-300 outline-none md:text-[22px]"
              />
            </div>

            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="mt-8 w-full bg-black py-4 text-[11px] font-medium uppercase tracking-[0.25em] text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              검색하기
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
