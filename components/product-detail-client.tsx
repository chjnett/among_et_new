"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Share2, Heart, X, Minus, Info } from "lucide-react"
import type { Product } from "@/lib/data"
import { OrderDialog } from "@/components/order-dialog"
import { cn } from "@/lib/utils"
import { ReviewSection } from "@/components/review-section"

export default function ProductDetailClient({
    product,
    reviews = []
}: {
    product: Product;
    reviews?: any[]
}) {
    const router = useRouter()
    const [isWishlisted, setIsWishlisted] = useState(false)

    const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image]

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: `RICH - ${product.title}`,
                    url: product.externalUrl || window.location.href,
                })
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(window.location.href)
        }
    }

    const hasSpecs = product.specs && (product.specs.modelNo || product.specs.material || product.specs.size || product.specs.color)

    return (
        <div className="flex min-h-screen flex-col bg-background pb-32 lg:pb-0">
            {/* Minimalist Top Nav */}
            <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/10 bg-white/80 px-4 backdrop-blur-md">
                <button
                    onClick={() => router.back()}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-100"
                >
                    <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest text-black/40 uppercase">Details</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={handleShare} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground">
                        <Share2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setIsWishlisted(!isWishlisted)} className={cn("flex h-9 w-9 items-center justify-center", isWishlisted ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                        <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Content Section (On Top) */}
            <div className="w-full bg-white px-6 pt-10 pb-16 md:pt-16 md:pb-24 lg:px-16 border-b border-border/20">
                <div className="mx-auto w-full max-w-3xl space-y-12">
                    {/* Brand & Category Header */}
                    <div className="space-y-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-[1px] w-8 bg-zinc-200 hidden sm:block"></div>
                            <p className="text-[11px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
                                {product.category} · {product.subCategory}
                            </p>
                            <div className="h-[1px] w-8 bg-zinc-200 hidden sm:block"></div>
                        </div>

                        <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl lg:text-7xl text-balance leading-[0.95] tracking-tighter sm:tracking-[-0.04em]">
                            {product.title}
                        </h1>
                    </div>

                    {/* Pricing Highlight */}
                    {product.price && (
                        <div className="flex flex-col items-center justify-center space-y-1 pt-6 border-t border-border/20">
                            <span className="text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase">Estimation Price</span>
                            <span className="text-4xl font-bold text-black tracking-tighter md:text-5xl">
                                {product.price}
                            </span>
                        </div>
                    )}

                    {/* Dual Column Layout for Description & Specs on Desktop */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 pt-8 border-t border-border/20">
                        {/* 1. Description */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2">
                                <Info className="h-3 w-3 text-zinc-400" />
                                <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Description</h3>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-4 top-0 bottom-0 w-[1px] bg-zinc-100"></div>
                                <p className="text-[15px] leading-[1.8] text-zinc-600 whitespace-pre-wrap font-medium pl-2">
                                    {product.description}
                                </p>
                            </div>
                        </div>

                        {/* 2. Specifications */}
                        {hasSpecs && (
                            <div className="space-y-5">
                                <div className="flex items-center gap-2">
                                    <Minus className="h-3 w-3 text-zinc-400" />
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Specifications</h3>
                                </div>
                                <div className="space-y-4 rounded-lg bg-zinc-50 p-6 md:p-8 border border-zinc-100">
                                    {product.specs.modelNo && (
                                        <div className="flex justify-between border-b border-zinc-200/60 pb-3">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Model</span>
                                            <span className="text-[13px] font-medium text-black">{product.specs.modelNo}</span>
                                        </div>
                                    )}
                                    {product.specs.material && (
                                        <div className="flex justify-between border-b border-zinc-200/60 pb-3">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Material</span>
                                            <span className="text-[13px] font-medium text-black">{product.specs.material}</span>
                                        </div>
                                    )}
                                    {product.specs.size && (
                                        <div className="flex justify-between border-b border-zinc-200/60 pb-3">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Size</span>
                                            <span className="text-[13px] font-medium text-black">{product.specs.size}</span>
                                        </div>
                                    )}
                                    {product.specs.color && (
                                        <div className="flex justify-between pb-1">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Color</span>
                                            <span className="text-[13px] font-medium text-black">{product.specs.color}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action - Desktop Hidden (use sticky bottom) */}
                    <div className="flex justify-center pt-8">
                        <OrderDialog
                            productName={product.title}
                            trigger={
                                <button
                                    className="hidden lg:flex h-16 w-full max-w-md items-center justify-center bg-black px-8 text-[13px] font-bold tracking-[0.4em] text-white uppercase transition-all hover:bg-zinc-800 shadow-2xl hover:-translate-y-0.5 active:scale-95"
                                >
                                    주문 접수하기
                                </button>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* 2. Gallery Section (Immersive) */}
            <div className="w-full bg-zinc-50/30 flex flex-col items-center">
                <div className="w-full max-w-6xl space-y-4 md:space-y-12 py-8 px-0 md:px-6 lg:px-12">
                    <div className="text-center pb-8 opacity-40">
                        <span className="text-[9px] uppercase tracking-[0.5em] font-black">Gallery View</span>
                    </div>
                    {gallery.map((url, index) => (
                        <div key={index} className="w-full overflow-hidden bg-white flex items-center justify-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-transform duration-700 hover:scale-[1.01]">
                            <img
                                src={url || "/placeholder.svg"}
                                alt={`${product.title} view ${index + 1}`}
                                className="w-full h-auto object-contain max-h-[140svh]"
                                loading={index === 0 ? "eager" : "lazy"}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Review Section (Only if reviews exist) */}
            {reviews && reviews.length > 0 && (
                <div className="w-full bg-white border-t border-border/20 py-12 md:py-24">
                    <div className="mx-auto max-w-4xl px-6 md:px-12">
                        <div className="flex flex-col items-center text-center space-y-4 mb-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Feedback</span>
                            <h2 className="text-3xl font-bold tracking-tight text-black">Product Reviews</h2>
                        </div>
                        <ReviewSection reviews={reviews} />
                    </div>
                </div>
            )}

            {/* Enhanced Sticky Bottom Bar for All Viewports (for quick access) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-border/20 p-3 lg:px-12 lg:py-4">
                <div className="mx-auto flex max-w-6xl items-center gap-2 md:gap-4">
                    <OrderDialog
                        productName={product.title}
                        trigger={
                            <button className="h-14 flex-1 bg-black text-white font-bold text-[12px] tracking-[0.2em] uppercase transition-all hover:bg-zinc-800 active:scale-95 shadow-lg rounded-sm">
                                주문하기
                            </button>
                        }
                    />
                    <a
                        href="https://open.kakao.com/o/sVOBwxli"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-14 flex-1 bg-[#FEE500] text-black font-bold text-[12px] tracking-[0.2em] uppercase flex items-center justify-center transition-all hover:bg-[#FDE100] active:scale-95 shadow-lg rounded-sm"
                    >
                        카톡문의하기
                    </a>
                </div>
            </div>
        </div>
    )
}
