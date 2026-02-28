"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ExternalLink, Share2, Heart, ChevronLeft, ChevronRight, X, MessageCircle } from "lucide-react"
import type { Product } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ProductDetailClient({ product }: { product: Product }) {
    const router = useRouter()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isWishlisted, setIsWishlisted] = useState(false)

    const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image]

    const nextImage = () => {
        if (gallery.length <= 1) return
        setCurrentImageIndex((prev) => (prev + 1) % gallery.length)
    }

    const prevImage = () => {
        if (gallery.length <= 1) return
        setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
    }

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

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-foreground backdrop-blur-md transition-colors hover:bg-muted border border-border/10"
            >
                <X className="h-5 w-5" />
            </button>

            {/* 1. Image Section */}
            <div className="relative h-[50vh] w-full shrink-0 bg-muted/20 lg:h-screen lg:w-[60%] lg:sticky lg:top-0">
                <div className="relative h-full w-full">
                    <Image
                        src={gallery[currentImageIndex] || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-cover object-center"
                        priority
                    />
                    {/* Navigation Arrows */}
                    {gallery.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute top-1/2 left-4 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/20 bg-white/30 text-foreground backdrop-blur-md transition-all hover:bg-white/60"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute top-1/2 right-4 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/20 bg-white/30 text-foreground backdrop-blur-md transition-all hover:bg-white/60"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}

                    {/* Pagination Dots */}
                    {gallery.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                            {gallery.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex
                                        ? "w-8 bg-foreground"
                                        : "w-2 bg-foreground/20 hover:bg-foreground/40"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Content Section */}
            <div className="flex flex-1 flex-col bg-background px-6 py-10 lg:min-h-screen lg:justify-center lg:px-16 lg:py-0">
                <div className="mx-auto w-full max-w-xl space-y-10">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium tracking-tight text-muted-foreground/60 uppercase">
                                {product.category} · {product.subCategory}
                            </p>
                            <div className="flex gap-4">
                                <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Share2 className="h-5 w-5" />
                                </button>
                                <button onClick={() => setIsWishlisted(!isWishlisted)} className={isWishlisted ? "text-foreground" : "text-muted-foreground hover:text-foreground transition-colors"}>
                                    <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                                </button>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground lg:text-5xl text-balance leading-tight">
                            {product.title}
                        </h1>
                    </div>

                    {/* Price Display */}
                    {product.price && (
                        <div className="flex items-center gap-3 py-2">
                            <Badge variant="outline" className="px-4 py-1 text-sm font-semibold tracking-tight text-foreground border-border">
                                PRICE
                            </Badge>
                            <span className="text-xl font-bold text-foreground md:text-2xl">
                                {product.price}
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Description</h3>
                        <p className="text-sm leading-8 text-muted-foreground whitespace-pre-wrap">
                            {product.description}
                        </p>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-6">
                    </div>
                </div>
            </div>
        </div>
    )
}
