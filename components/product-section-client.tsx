"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CategoryNav } from "@/components/category-nav"
import { ProductGrid } from "@/components/product-grid"
import type { Category, Product } from "@/lib/data"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface ProductSectionClientProps {
  categories: Category[]
  products: Product[]
  selectedCategory: string
  selectedSubCategory: string | null
  searchQuery: string
}

interface EditorialCard {
  id?: string
  title: string
  subtitle: string
  body: string
  image_url?: string | null
  link_url?: string | null
}

const editorialImageOrder = ["/editorial1.jpeg", "/editorial2.png", "/editorial3.jpeg"] as const

const editorialCards = [
  {
    id: "default-1",
    title: "이번 주 큐레이션",
    subtitle: "데일리 럭셔리 핵심 아이템",
    body: "매일 들어도 질리지 않는 컬러와 실루엣 중심으로 선별했어요.",
    image_url: editorialImageOrder[0],
    link_url: "",
  },
  {
    id: "default-2",
    title: "베스트 3",
    subtitle: "가장 반응 좋은 라인업",
    body: "조회수와 저장수를 기준으로 지금 가장 인기 있는 제품만 모았어요.",
    image_url: editorialImageOrder[1],
    link_url: "",
  },
  {
    id: "default-3",
    title: "신상 한정",
    subtitle: "빠르게 품절되는 신상",
    body: "입고 수량이 적은 제품들입니다. 늦기 전에 먼저 확인해보세요.",
    image_url: editorialImageOrder[2],
    link_url: "",
  },
]

interface EditorialBlock {
  id: string
  title: string
  subtitle: string
  body: string
  image_url?: string | null
  link_url?: string | null
  sort_order: number
  is_active: boolean
}

const KAKAO_PAYMENT_URL = "https://open.kakao.com/o/sVOBwxli"
const SCROLL_Y_KEY = "home-scroll-y"
const SCROLL_PATH_KEY = "home-scroll-path"
const SCROLL_TARGET_KEY = "home-scroll-target-product-id"
const MOBILE_UI_STATE_KEY = "home-mobile-ui-state"

export function ProductSectionClient({
  categories,
  products,
  selectedCategory,
  selectedSubCategory,
  searchQuery,
}: ProductSectionClientProps) {
  const [mobileSubSelections, setMobileSubSelections] = useState<Record<string, string>>({})
  const [mobileVisibleCounts, setMobileVisibleCounts] = useState<Record<string, number>>({})
  const [editorialItems, setEditorialItems] = useState<EditorialCard[]>(editorialCards)
  const mobileSectionRef = useRef<HTMLDivElement | null>(null)

  const safeSrc = (src?: string) => (src?.trim() ? src : "/placeholder.svg")
  const normalizeLabel = (value: string) => value.trim().normalize("NFC")
  const saveScrollPosition = (productId?: string) => {
    sessionStorage.setItem(SCROLL_Y_KEY, String(window.scrollY))
    sessionStorage.setItem(SCROLL_PATH_KEY, `${window.location.pathname}${window.location.search}`)
    if (productId) {
      sessionStorage.setItem(SCROLL_TARGET_KEY, productId)
    }
    sessionStorage.setItem(
      MOBILE_UI_STATE_KEY,
      JSON.stringify({
        path: `${window.location.pathname}${window.location.search}`,
        mobileSubSelections,
        mobileVisibleCounts,
      })
    )
  }
  const resolveEditorialHref = (card: EditorialCard) => {
    const rawLink = card.link_url?.trim()

    if (rawLink && rawLink !== "#") {
      if (rawLink.startsWith("/") || rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
        return rawLink
      }

      return `/${rawLink.replace(/^\/+/, "")}`
    }

    if (card.id) {
      return `/editorial/${encodeURIComponent(card.id)}`
    }

    return "/editorial"
  }

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          product.title.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.specs?.modelNo?.toLowerCase().includes(query)
        )
      }),
    [products, searchQuery]
  )

  const displayProducts = searchQuery && filteredProducts.length === 0 ? products : filteredProducts

  const categoryNamesFromDb = categories
    .map((category) => normalizeLabel(category.name))
    .filter((name) => name && name !== "전체")

  const categoryNamesFromProducts = Array.from(
    new Set(displayProducts.map((product) => normalizeLabel(product.category)).filter(Boolean))
  )

  const orderedCategoryNames = [
    ...categoryNamesFromDb,
    ...categoryNamesFromProducts.filter((name) => !categoryNamesFromDb.includes(name)),
  ]

  const getSubOptions = (categoryName: string, items: Product[]) => {
    const fromDb =
      categories
        .find((cat) => normalizeLabel(cat.name) === categoryName)
        ?.subCategories?.map((sub) => normalizeLabel(sub))
        .filter(Boolean) || []

    const fromItems = Array.from(new Set(items.map((item) => normalizeLabel(item.subCategory)).filter(Boolean)))
    const merged = [...fromDb, ...fromItems.filter((sub) => !fromDb.includes(sub))]
    return ["전체", ...merged]
  }

  const findCategoryByKeywords = (keywords: string[]) =>
    orderedCategoryNames.find((name) => {
      const lower = name.toLowerCase()
      return keywords.some((keyword) => lower.includes(keyword))
    })

  const watchCategory = findCategoryByKeywords(["시계", "watch"])
  const bagCategory = findCategoryByKeywords(["가방", "bag"])
  const prioritizedSections = [watchCategory, bagCategory].filter(Boolean) as string[]
  const defaultMobileSectionCategories = [
    ...prioritizedSections,
    ...orderedCategoryNames.filter((name) => !prioritizedSections.includes(name)),
  ]
  const normalizedSelectedCategory = normalizeLabel(selectedCategory || "전체")
  const isSpecificCategorySelected = normalizedSelectedCategory !== "전체"
  const mobileSectionCategories =
    isSpecificCategorySelected && orderedCategoryNames.includes(normalizedSelectedCategory)
      ? [normalizedSelectedCategory]
      : defaultMobileSectionCategories

  useEffect(() => {
    const fetchEditorialBlocks = async () => {
      const { data, error } = await supabase
        .from("editorial_blocks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (error || !data || data.length === 0) return

      const mapped = (data as EditorialBlock[]).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        body: item.body,
        image_url: item.image_url?.trim() || editorialImageOrder[item.sort_order - 1] || "/placeholder.jpg",
        link_url: item.link_url || "",
      }))

      setEditorialItems(mapped)
    }

    fetchEditorialBlocks()
  }, [])

  useEffect(() => {
    const currentPath = `${window.location.pathname}${window.location.search}`
    const rawState = sessionStorage.getItem(MOBILE_UI_STATE_KEY)
    if (!rawState) return

    try {
      const parsed = JSON.parse(rawState) as {
        path?: string
        mobileSubSelections?: Record<string, string>
        mobileVisibleCounts?: Record<string, number>
      }
      if (parsed.path !== currentPath) return
      if (parsed.mobileSubSelections) setMobileSubSelections(parsed.mobileSubSelections)
      if (parsed.mobileVisibleCounts) setMobileVisibleCounts(parsed.mobileVisibleCounts)
    } catch {
      // ignore invalid session cache
    }
  }, [])

  useEffect(() => {
    const targetProductId = sessionStorage.getItem(SCROLL_TARGET_KEY)
    if (!targetProductId) return

    const tryScroll = () => {
      const target = document.getElementById(`product-card-${targetProductId}`)
      if (!target) return false
      target.scrollIntoView({ block: "center", behavior: "auto" })
      sessionStorage.removeItem(SCROLL_TARGET_KEY)
      return true
    }

    if (tryScroll()) return
    const t1 = window.setTimeout(tryScroll, 250)
    const t2 = window.setTimeout(tryScroll, 700)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [displayProducts.length, mobileVisibleCounts, mobileSubSelections])

  useEffect(() => {
    const root = mobileSectionRef.current
    if (!root || typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let isPaused = false
    let resumeTimer: ReturnType<typeof setTimeout> | null = null
    const scrollers = Array.from(root.querySelectorAll<HTMLElement>('[data-auto-scroll="true"]'))

    if (scrollers.length === 0) return

    const pauseAutoScroll = () => {
      isPaused = true
      if (resumeTimer) clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => {
        isPaused = false
      }, 5000)
    }

    const tick = () => {
      if (isPaused) return

      scrollers.forEach((scroller) => {
        if (scroller.scrollWidth <= scroller.clientWidth + 8) return

        const step = Number(scroller.dataset.scrollStep || "132")
        const maxLeft = scroller.scrollWidth - scroller.clientWidth
        const nextLeft = scroller.scrollLeft + step

        if (nextLeft >= maxLeft - 4) {
          scroller.scrollTo({ left: 0, behavior: "smooth" })
          return
        }

        scroller.scrollBy({ left: step, behavior: "smooth" })
      })
    }

    const intervalId = window.setInterval(tick, 2600)

    scrollers.forEach((scroller) => {
      scroller.addEventListener("touchstart", pauseAutoScroll, { passive: true })
      scroller.addEventListener("pointerdown", pauseAutoScroll)
      scroller.addEventListener("wheel", pauseAutoScroll, { passive: true })
    })

    return () => {
      window.clearInterval(intervalId)
      if (resumeTimer) clearTimeout(resumeTimer)
      scrollers.forEach((scroller) => {
        scroller.removeEventListener("touchstart", pauseAutoScroll)
        scroller.removeEventListener("pointerdown", pauseAutoScroll)
        scroller.removeEventListener("wheel", pauseAutoScroll)
      })
    }
  }, [displayProducts.length, searchQuery])

  return (
    <>
      <div ref={mobileSectionRef} className="space-y-9 md:hidden">
        <section className="space-y-3">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground">EDITORIAL</p>
          <div
            data-auto-scroll="true"
            data-scroll-step="296"
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
          >
            {editorialItems.map((card) => (
              <Link
                key={card.id || `${card.title}-${card.subtitle}`}
                href={resolveEditorialHref(card)}
                className="group min-w-[284px] max-w-[284px] snap-start overflow-hidden rounded-md border border-border/60 bg-white"
              >
                <div className="relative h-[152px] overflow-hidden bg-muted/20">
                  <img
                    src={card.image_url || "/placeholder.jpg"}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[0.98]"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg"
                    }}
                  />
                </div>
                <div className="space-y-1 p-3">
                  <p className="text-[10px] tracking-[0.16em] text-muted-foreground">{card.subtitle}</p>
                  <h3 className="line-clamp-1 text-[19px] font-semibold leading-tight tracking-tight text-foreground">{card.title}</h3>
                  <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">{card.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          {mobileSectionCategories.map((categoryName) => {
            const categoryItems = displayProducts.filter(
              (product) => normalizeLabel(product.category) === categoryName
            )
            const subOptions = getSubOptions(categoryName, categoryItems)
            const selectedSub = mobileSubSelections[categoryName] || "전체"
            const visibleItems =
              selectedSub === "전체"
                ? categoryItems
                : categoryItems.filter((item) => normalizeLabel(item.subCategory) === selectedSub)
            const currentVisibleCount = isSpecificCategorySelected
              ? visibleItems.length
              : (mobileVisibleCounts[categoryName] ?? 4)
            const shownItems = visibleItems.slice(0, currentVisibleCount)
            const hasMore = shownItems.length < visibleItems.length

            return (
              <section key={categoryName} className="space-y-3 rounded-sm border border-border/60 bg-[#f8f8f6] p-2.5">
                <div className="flex items-end border-b border-border/60 px-0.5 pb-2">
                  <h3 className="text-[28px] font-semibold tracking-tight text-foreground">{categoryName}</h3>
                </div>

                {!isSpecificCategorySelected && (
                  <div className="-mx-4 overflow-x-auto px-4 pb-1">
                    <div className="inline-flex items-center gap-2">
                      {subOptions.map((sub) => {
                        const active = selectedSub === sub
                        return (
                          <button
                            key={`${categoryName}-${sub}`}
                            onClick={() => {
                              setMobileSubSelections((prev) => ({ ...prev, [categoryName]: sub }))
                              setMobileVisibleCounts((prev) => ({ ...prev, [categoryName]: 4 }))
                            }}
                            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] tracking-[0.08em] transition-colors ${active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border/70 bg-white text-foreground/70"
                              }`}
                          >
                            {sub}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                  {shownItems.map((product) => (
                    <Link
                      key={product.id}
                      id={`product-card-${product.id}`}
                      href={`/products/${product.id}`}
                      onClick={() => saveScrollPosition(product.id)}
                      className="group block overflow-hidden rounded-sm border border-border/70 bg-white"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#efefec]">
                        <img
                          src={safeSrc(product.image)}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[0.98]"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                      </div>

                      <div className="space-y-1.5 border-t border-border/50 px-2 py-2">
                        <p className="truncate text-[11px] tracking-[0.04em] text-foreground/55">
                          {product.subCategory || categoryName}
                        </p>
                        <h4 className="line-clamp-2 min-h-[40px] text-[15px] leading-5 text-foreground">{product.title}</h4>
                        <p className="truncate text-[15px] font-semibold leading-5 text-foreground">
                          {product.price || "\u00A0"}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.open(KAKAO_PAYMENT_URL, "_blank", "noopener,noreferrer")
                          }}
                          className="mt-1 inline-flex items-center justify-center rounded-sm border border-black bg-black px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-white"
                        >
                          주문하기
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>

                {visibleItems.length > 4 && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileVisibleCounts((prev) => ({
                          ...prev,
                          [categoryName]: hasMore ? currentVisibleCount + 4 : 4,
                        }))
                      }}
                      className={cn(
                        "rounded-full border border-border/70 bg-white px-4 py-2 text-[12px] tracking-[0.08em] text-foreground/70",
                        isSpecificCategorySelected && "hidden"
                      )}
                    >
                      {hasMore ? "더보기" : "접기"}
                    </button>
                  </div>
                )}
              </section>
            )
          })}

          {mobileSectionCategories.length === 0 && (
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              표시할 카테고리 상품이 없습니다.
            </div>
          )}
        </section>

        {searchQuery && filteredProducts.length === 0 && (
          <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            검색 결과가 없어 전체 상품을 보여주고 있습니다.
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
        />
        <ProductGrid products={displayProducts} />
      </div>
    </>
  )
}
