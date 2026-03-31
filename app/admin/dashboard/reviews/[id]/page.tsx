"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"

import { Loader2, ChevronLeft, Save } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ImageUploader } from "@/components/admin/image-uploader"
import { supabase } from "@/lib/supabase"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function ReviewEditPage({ params }: PageProps) {
    const { id } = use(params)
    const isNew = id === "new"

    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(!isNew)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        author_name: "",
        content: "",
        rating: "5",
        image_url: "",
        is_visible: true
    })

    // Fetch Review Data if editing
    useEffect(() => {
        if (isNew) return

        const fetchReview = async () => {
            const { data, error } = await (supabase as any)
                .from('reviews')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                toast({
                    variant: "destructive",
                    title: "리뷰 로딩 실패",
                    description: error.message,
                })
                router.push("/admin/dashboard/reviews")
                return
            }

            setFormData({
                author_name: data.author_name,
                content: data.content,
                rating: String(data.rating),
                image_url: data.image_url || "",
                is_visible: data.is_visible
            })
            setIsLoading(false)
        }

        fetchReview()
    }, [id, isNew])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.author_name.trim()) {
            toast({ variant: "destructive", title: "입력 오류", description: "작성자 이름을 입력해주세요." })
            return
        }
        if (!formData.content.trim()) {
            toast({ variant: "destructive", title: "입력 오류", description: "리뷰 내용을 입력해주세요." })
            return
        }

        setIsSaving(true)

        try {
            const payload = {
                author_name: formData.author_name,
                content: formData.content,
                rating: parseInt(formData.rating),
                image_url: formData.image_url || null,
                is_visible: formData.is_visible
            }

            if (isNew) {
                const { error } = await (supabase as any).from('reviews').insert(payload)
                if (error) throw error
            } else {
                const { error } = await (supabase as any).from('reviews').update(payload).eq('id', id)
                if (error) throw error
            }

            toast({
                title: isNew ? "리뷰 등록 성공" : "리뷰 수정 성공",
                description: "리뷰 관리 페이지로 이동합니다.",
            })
            router.push("/admin/dashboard/reviews")
            router.refresh()

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "저장 실패",
                description: error.message,
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20 text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl items-center justify-between p-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Link href="/admin/dashboard/reviews">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-bold text-foreground">
                            {isNew ? "새 리뷰 등록" : "리뷰 수정"}
                        </h1>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm px-6"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin text-background" />}
                        <Save className="mr-2 h-4 w-4" />
                        저장
                    </Button>
                </div>
            </header>

            {/* Form Content */}
            <main className="mx-auto max-w-5xl p-4 lg:p-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Images */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            <Label className="text-sm font-bold text-foreground/80">리뷰 이미지 (선택)</Label>
                            <ImageUploader
                                images={formData.image_url ? [formData.image_url] : []}
                                onChange={(imgs) => setFormData(prev => ({ ...prev, image_url: imgs[0] || "" }))}
                                maxImages={1}
                            />
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-8 lg:col-span-2">
                        <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">기본 정보</h2>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground/70">작성자 이름</Label>
                                    <Input
                                        value={formData.author_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                                        className="border-border bg-background text-foreground h-11 focus-visible:ring-foreground"
                                        placeholder="고객명 또는 별명"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground/70">평점</Label>
                                    <Select
                                        value={formData.rating}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, rating: val }))}
                                    >
                                        <SelectTrigger className="border-border bg-background text-foreground h-11 focus:ring-foreground w-1/3">
                                            <SelectValue placeholder="평점 1~5" />
                                        </SelectTrigger>
                                        <SelectContent className="border-border bg-card text-foreground">
                                            {[5, 4, 3, 2, 1].map(r => (
                                                <SelectItem key={r} value={String(r)} className="focus:bg-muted focus:text-foreground">
                                                    {r} 점
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground/70">리뷰 내용</Label>
                                    <Textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        className="min-h-[150px] border-border bg-background text-foreground focus-visible:ring-foreground resize-none"
                                        placeholder="고객의 리뷰 내용을 입력하세요"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
