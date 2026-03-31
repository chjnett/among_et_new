"use client"

import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/data"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { OrderDialog } from "@/components/order-dialog"

const KAKAO_PAYMENT_URL = "https://open.kakao.com/o/sVOBwxli"
const SCROLL_Y_KEY = "home-scroll-y"
const SCROLL_PATH_KEY = "home-scroll-path"
const SCROLL_TARGET_KEY = "home-scroll-target-product-id"

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-[#525252]">해당 카테고리에 상품이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
      {products.map((product, index) => (
        <AnimatedProductCard
          key={product.id}
          product={product}
          index={index}
        />
      ))}
    </div>
  )
}

function AnimatedProductCard({
  product,
  index
}: {
  product: Product;
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation(0.1)
  const saveScrollPosition = (productId: string) => {
    sessionStorage.setItem(SCROLL_Y_KEY, String(window.scrollY))
    sessionStorage.setItem(SCROLL_PATH_KEY, `${window.location.pathname}${window.location.search}`)
    sessionStorage.setItem(SCROLL_TARGET_KEY, productId)
  }

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative transition-all duration-500 ease-out"
    >
      {/* Main Link (Overlay) */}
      <Link href={`/products/${product.id}`} onClick={() => saveScrollPosition(product.id)} className="absolute inset-0 z-10" />

      {/* Product Image with 4:5 aspect ratio - Minimalist */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/20 border border-border/40 transition-all duration-300 group-hover:shadow-sm">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-102"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        />

        {/* External Link Button - Z-index higher than Link */}
        <div className="absolute top-2 right-2 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <OrderDialog
            productName={product.title}
            trigger={
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground/40 backdrop-blur-sm transition-colors hover:bg-foreground hover:text-background border border-border/50"
                title="주문하기"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      </div>

      {/* Product Text Content - Left Aligned & Minimal */}
      <div className="mt-3 space-y-0.5 px-0.5">
        {/* Brand / Subcategory - Top */}
        <p className="text-[10px] font-normal text-muted-foreground/80 lowercase tracking-tight">
          {product.subCategory}
        </p>

        {/* Title - Middle */}
        <h3 className="line-clamp-1 text-xs font-semibold text-foreground md:text-sm">
          {product.title}
        </h3>

        {/* Price - Bottom */}
        {product.price && (
          <p className="font-bold text-foreground text-sm md:text-[15px] tracking-tight">
            {product.price}
          </p>
        )}

        <OrderDialog
          productName={product.title}
          trigger={
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="relative z-20 mt-2 inline-flex items-center justify-center rounded-sm border border-black bg-black px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-white"
            >
              주문하기
            </button>
          }
        />
      </div>
    </div>
  )
}
