"use client"

import { useEffect, useState, useRef } from "react"
import { Star } from "lucide-react"

interface Review {
    id: string
    author_name: string
    content: string
    rating: number
    image_url: string | null
    created_at: string
}

export function ReviewSection({ reviews }: { reviews: Review[] }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const root = containerRef.current
        if (!root || typeof window === "undefined" || reviews.length === 0) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        let isPaused = false
        const scrollers = Array.from(root.querySelectorAll<HTMLElement>('[data-auto-scroll="true"]'))

        if (scrollers.length === 0) return

        const tick = () => {
            if (isPaused) return

            scrollers.forEach((scroller) => {
                if (scroller.scrollWidth <= scroller.clientWidth + 8) return

                const step = 280 // approximate card width
                const maxLeft = scroller.scrollWidth - scroller.clientWidth
                const nextLeft = scroller.scrollLeft + step

                if (nextLeft >= maxLeft - 4) {
                    scroller.scrollTo({ left: 0, behavior: "smooth" })
                    return
                }

                scroller.scrollBy({ left: step, behavior: "smooth" })
            })
        }

        const intervalId = window.setInterval(tick, 3000)

        const pauseAutoScroll = () => {
            isPaused = true
            setTimeout(() => {
                isPaused = false
            }, 5000)
        }

        scrollers.forEach((scroller) => {
            scroller.addEventListener("touchstart", pauseAutoScroll, { passive: true })
            scroller.addEventListener("pointerdown", pauseAutoScroll)
            scroller.addEventListener("wheel", pauseAutoScroll, { passive: true })
        })

        return () => {
            window.clearInterval(intervalId)
            scrollers.forEach((scroller) => {
                scroller.removeEventListener("touchstart", pauseAutoScroll)
                scroller.removeEventListener("pointerdown", pauseAutoScroll)
                scroller.removeEventListener("wheel", pauseAutoScroll)
            })
        }
    }, [reviews.length])

    if (!reviews || reviews.length === 0) return null

    return (
        <section className="py-16 md:py-24 overflow-hidden border-t border-border/40" ref={containerRef}>
            <div className="mx-auto max-w-6xl px-4 md:px-8 space-y-8">
                <div className="text-center space-y-3">
                    <p className="text-[11px] tracking-[0.2em] font-semibold text-muted-foreground uppercase">
                        Testimonials
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        고객님들의 소중한 리뷰
                    </h2>
                </div>

                <div
                    data-auto-scroll="true"
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="flex-none w-[280px] snap-center rounded-lg border border-border bg-card overflow-hidden shadow-sm"
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted/30"}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[15px] leading-relaxed text-foreground min-h-[60px] line-clamp-4">
                                    "{review.content}"
                                </p>
                                {review.image_url && (
                                    <div className="relative aspect-video rounded-md overflow-hidden bg-muted/20">
                                        <img
                                            src={review.image_url}
                                            alt="Review attachment"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">
                                        {review.author_name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
