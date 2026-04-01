"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Review {
    id: string
    author_name: string
    content: string
    rating: number
    image_url: string | null
    created_at: string
}

export function ReviewSection({ reviews }: { reviews: Review[] }) {
    const [isMounted, setIsMounted] = useState(false)
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ""
        const d = new Date(dateStr)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}. ${month}. ${day}.`
    }

    if (!reviews || reviews.length === 0) return null

    return (
        <section className="space-y-3 py-4">
            <div className="flex items-center justify-between px-1">
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase font-semibold">
                    Customer Reviews
                </p>
                <div className="h-[1px] flex-1 bg-border/40 mx-4 hidden md:block"></div>
            </div>

            <div
                data-auto-scroll="true"
                data-scroll-step="296"
                className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
            >
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="group min-w-[284px] max-w-[284px] snap-start overflow-hidden rounded-md border border-border/60 bg-white shadow-sm transition-all hover:shadow-md h-auto cursor-pointer"
                        onClick={() => setSelectedReview(review)}
                    >
                        {/* Image Block - Editorial Style */}
                        <div className="relative h-[152px] overflow-hidden bg-muted/20">
                            {review.image_url ? (
                                <img
                                    src={review.image_url}
                                    alt="Review photo"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-50 p-6 text-center">
                                    <div className="flex gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted/20"}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em]">Verified Purchase</p>
                                </div>
                            )}
                            {/* Floating Stars if image exists */}
                            {review.image_url && (
                                <div className="absolute bottom-2 left-2 flex gap-0.5 rounded-full bg-white/80 px-2 py-1 backdrop-blur-sm">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-2.5 w-2.5 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-zinc-300"}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content Block - Editorial Style */}
                        <div className="space-y-1.5 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] tracking-[0.12em] text-muted-foreground font-bold uppercase">
                                    {review.author_name}
                                </p>
                                <p className="text-[9px] text-muted-foreground/50">
                                    {isMounted ? formatDate(review.created_at) : ""}
                                </p>
                            </div>
                            <p className="text-[14px] font-medium leading-relaxed tracking-tight text-foreground line-clamp-2 min-h-[40px] whitespace-pre-wrap">
                                {review.content}
                            </p>
                            <div className="pt-2">
                                <span
                                    className="inline-block text-[10px] font-bold text-black border-b border-black uppercase tracking-widest pb-0.5"
                                >
                                    Read more
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Detail Modal */}
            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg p-0 overflow-hidden border-none bg-white">
                    <DialogHeader className="p-0">
                        <DialogTitle className="sr-only">Review Detail</DialogTitle>
                    </DialogHeader>
                    {selectedReview && (
                        <div className="flex flex-col">
                            {selectedReview.image_url && (
                                <div className="relative aspect-square w-full bg-muted">
                                    <img
                                        src={selectedReview.image_url}
                                        alt="Full review photo"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Customer</p>
                                        <p className="text-[15px] font-bold text-black">{selectedReview.author_name}</p>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-3 w-3 ${i < selectedReview.rating ? "fill-yellow-500 text-yellow-500" : "text-zinc-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-medium">{formatDate(selectedReview.created_at)}</p>
                                    </div>
                                </div>

                                <div className="h-[1px] w-full bg-zinc-100"></div>

                                <div className="pt-2">
                                    <p className="text-[15px] leading-[1.7] text-zinc-600 whitespace-pre-wrap font-medium">
                                        {selectedReview.content}
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <button
                                        onClick={() => setSelectedReview(null)}
                                        className="w-full h-12 bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] transition-all hover:bg-zinc-800"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    )
}
