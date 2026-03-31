"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Review {
    id: string
    author_name: string
    content: string
    rating: number
    image_url: string | null
    is_visible: boolean
    created_at: string
}

export default function ReviewsAdminPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        fetchReviews()
    }, [])

    const fetchReviews = async () => {
        setIsLoading(true)
        const { data, error } = await (supabase as any)
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast({
                variant: "destructive",
                title: "로딩 실패",
                description: error.message,
            })
        } else {
            setReviews(data || [])
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("정말 이 리뷰를 삭제하시겠습니까?")) return

        const { error } = await (supabase as any)
            .from('reviews')
            .delete()
            .eq('id', id)

        if (error) {
            toast({
                variant: "destructive",
                title: "삭제 실패",
                description: error.message,
            })
        } else {
            toast({
                title: "삭제 성공",
                description: "리뷰가 삭제되었습니다.",
            })
            fetchReviews()
        }
    }

    const toggleVisibility = async (id: string, currentStatus: boolean) => {
        const { error } = await (supabase as any)
            .from('reviews')
            .update({ is_visible: !currentStatus })
            .eq('id', id)

        if (error) {
            toast({
                variant: "destructive",
                title: "업데이트 실패",
                description: error.message,
            })
        } else {
            toast({
                title: "업데이트 성공",
                description: `리뷰 노출 상태가 변경되었습니다.`,
            })
            fetchReviews()
        }
    }

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">리뷰 관리</h1>
                        <p className="text-muted-foreground">메인 화면에 노출될 고객 리뷰를 관리하세요.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="border-border hover:bg-muted">
                            <Link href="/admin/dashboard">
                                대시보드로 돌아가기
                            </Link>
                        </Button>
                        <Button asChild className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm">
                            <Link href="/admin/dashboard/reviews/new">
                                <Plus className="mr-2 h-4 w-4" />
                                리뷰 등록
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-foreground/20 hover:shadow-sm"
                            >
                                {review.image_url && (
                                    <div className="relative aspect-video overflow-hidden border-b border-border">
                                        <img
                                            src={review.image_url}
                                            alt={review.author_name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-6 space-y-4 flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted/30"}`}
                                                />
                                            ))}
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${review.is_visible
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-muted text-muted-foreground border border-border'
                                                }`}
                                        >
                                            {review.is_visible ? '노출 중' : '숨김'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-sm font-bold text-foreground">
                                            {review.author_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {review.content}
                                        </p>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between border-t border-border/50">
                                        <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-tight">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleVisibility(review.id, review.is_visible)}
                                                className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 px-2 text-[11px]"
                                            >
                                                {review.is_visible ? '숨기기' : '보이기'}
                                            </Button>
                                            <Button
                                                asChild
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                                <Link href={`/admin/dashboard/reviews/${review.id}`}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDelete(review.id)}
                                                className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && reviews.length === 0 && (
                    <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground bg-muted/5">
                        <p className="mb-4 font-medium text-lg">등록된 리뷰가 없습니다.</p>
                        <Button asChild variant="outline" className="border-border hover:bg-muted">
                            <Link href="/admin/dashboard/reviews/new">첫 리뷰 등록하기</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
