"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

interface RelatedProduct {
  id: string
  name: string
  image: string
  category: string
  subCategory: string
  price: string
}

interface EditorialRelatedProductsProps {
  products: RelatedProduct[]
}

const STEP = 4
const SCROLL_Y_KEY = "home-scroll-y"
const SCROLL_PATH_KEY = "home-scroll-path"

export function EditorialRelatedProducts({ products }: EditorialRelatedProductsProps) {
  const [visibleCount, setVisibleCount] = useState(STEP)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount])
  const hasMore = visibleCount < products.length
  const saveScrollPosition = () => {
    sessionStorage.setItem(SCROLL_Y_KEY, String(window.scrollY))
    sessionStorage.setItem(SCROLL_PATH_KEY, `${window.location.pathname}${window.location.search}`)
  }

  useEffect(() => {
    setVisibleCount(STEP)
  }, [products])

  useEffect(() => {
    if (!hasMore) return
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setVisibleCount((prev) => Math.min(prev + STEP, products.length))
      },
      { rootMargin: "120px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, products.length])

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-[11px] tracking-[0.16em] text-muted-foreground">RELATED PRODUCTS</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            onClick={saveScrollPosition}
            className="group overflow-hidden rounded-sm border border-border/60 bg-card"
          >
            <div className="aspect-[4/5] overflow-hidden bg-muted/20">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="space-y-1.5 border-t border-border/60 px-2.5 py-2.5">
              <p className="truncate text-[11px] text-muted-foreground">
                {product.category}
                {product.subCategory ? ` / ${product.subCategory}` : ""}
              </p>
              <p className="line-clamp-2 text-[14px] leading-5 text-foreground">{product.name}</p>
              <p className="text-[14px] font-semibold text-foreground">{product.price || "\u00A0"}</p>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-8 w-full" />}
    </section>
  )
}
