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
import { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"

// To handle dynamic route params in Next.js 15 (params is a Promise)
interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function ProductEditPage({ params }: PageProps) {
    // Unwrap params using React.use()
    const { id } = use(params)
    const isNew = id === "new"

    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(!isNew)
    const [isSaving, setIsSaving] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        subCategory: "",

        description: "",
        external_url: "",
        price: "",
        img_urls: [] as string[],
        specs: {
            modelNo: "",
            material: "",
            size: "",
            color: ""
        }
    })

    // Dynamic Category Data
    type CategoryWithSubs = {
        id: number
        name: string
        sub_categories: { id: number, name: string }[]
    }
    const [categoriesData, setCategoriesData] = useState<CategoryWithSubs[]>([])

    // Flattened map for quick lookup during submit
    const [subCategoriesMap, setSubCategoriesMap] = useState<{ id: number, name: string, category_id: number }[]>([])

    // Fetch Categories and SubCategories
    useEffect(() => {
        const fetchRefData = async () => {
            console.log("Fetching categories reference data...")

            try {
                // Fetch full tree
                const { data: catData, error: catError } = await supabase
                    .from('categories')
                    .select('*, sub_categories(id, name)')
                    .order('order', { ascending: true })

                if (catError) throw catError

                if (catData) {
                    // Sort subs
                    const sorted = catData.map(c => ({
                        ...c,
                        sub_categories: c.sub_categories.sort((a, b) => a.id - b.id) // Sort by ID or Name
                    }))
                    setCategoriesData(sorted)

                    // Also build the flat map for existing logic
                    const flatSubs = sorted.flatMap(c => c.sub_categories.map(s => ({
                        id: s.id,
                        name: s.name,
                        category_id: c.id
                    })))
                    setSubCategoriesMap(flatSubs)
                }

            } catch (error: any) {
                console.error("Error fetching categories:", error)
                toast({
                    variant: "destructive",
                    title: "카테고리 로딩 실패",
                    description: error.message
                })
            }
        }
        fetchRefData()
    }, [])

    // Fetch Product Data if editing
    useEffect(() => {
        if (isNew) return;

        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                toast({
                    variant: "destructive",
                    title: "상품 로딩 실패",
                    description: error.message,
                })
                router.push("/admin/dashboard")
                return
            }

            const { data: subData } = await supabase
                .from('sub_categories')
                .select('*, categories(*)')
                .eq('id', data.sub_id)
                .single()

            const categoryName = (subData?.categories as any)?.name || ""
            const subCategoryName = subData?.name || ""

            setFormData({
                name: data.name,
                category: categoryName,
                subCategory: subCategoryName,
                description: data.description || "",
                external_url: data.external_url,
                price: (data.specs as any)?.price || "", // Load price from specs
                img_urls: data.img_urls || [],
                specs: (data.specs as any) || { modelNo: "", material: "", size: "", color: "" }
            })
            setIsLoading(false)
        }

        fetchProduct()
    }, [id, isNew])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Submit clicked. Form Data:", formData)

        if (!formData.name.trim()) {
            toast({ variant: "destructive", title: "입력 오류", description: "상품명을 입력해주세요." })
            return
        }
        if (!formData.category || !formData.subCategory) {
            toast({ variant: "destructive", title: "입력 오류", description: "카테고리와 하위 카테고리를 모두 선택해주세요." })
            return
        }

        setIsSaving(true)

        try {
            console.log("SubCategoriesMap:", subCategoriesMap)
            const matchedSub = subCategoriesMap.find(s => s.name === formData.subCategory)

            // If not found in map, it might be a sync issue or truly missing
            if (!matchedSub) {
                console.error(`SubCategory mismatch! Input: "${formData.subCategory}", Map:`, subCategoriesMap)

                // Try to find by direct DB query as fallback
                const { data: directLookUp } = await supabase
                    .from('sub_categories')
                    .select('id')
                    .eq('name', formData.subCategory)
                    .single()

                if (!directLookUp) {
                    throw new Error(`하위 카테고리 "${formData.subCategory}" 정보를 데이터베이스에서 찾을 수 없습니다. 페이지를 새로고침 해주세요.`)
                }

                // If found directly, proceed with this ID
                const payload = {
                    name: formData.name,
                    sub_id: directLookUp.id,
                    description: formData.description,
                    external_url: formData.external_url,
                    // price field does not exist in schema, moving to specs
                    img_urls: formData.img_urls,
                    specs: {
                        ...formData.specs,
                        price: formData.price
                    }
                }
                await submitProduct(payload)
                return
            }

            const payload = {
                name: formData.name,
                sub_id: matchedSub.id,
                description: formData.description,
                external_url: formData.external_url,
                // price field does not exist in schema, moving to specs
                img_urls: formData.img_urls,
                specs: {
                    ...formData.specs,
                    price: formData.price
                }
            }
            await submitProduct(payload)

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

    const submitProduct = async (payload: any) => {
        if (isNew) {
            const { error } = await supabase.from('products').insert(payload)
            if (error) throw error
        } else {
            const { error } = await supabase.from('products').update(payload).eq('id', id)
            if (error) throw error
        }

        toast({
            title: isNew ? "상품 등록 성공" : "상품 수정 성공",
            description: "대시보드로 이동합니다.",
        })
        router.push("/admin/dashboard")
        router.refresh()
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
                            <Link href="/admin/dashboard">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-bold text-foreground">
                            {isNew ? "새 상품 등록" : "상품 수정"}
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
                            <Label className="text-sm font-bold text-foreground/80">상품 이미지</Label>
                            <ImageUploader
                                images={formData.img_urls}
                                onChange={(imgs) => setFormData(prev => ({ ...prev, img_urls: imgs }))}
                            />
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-8 lg:col-span-2">
                        <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">기본 정보</h2>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground/70">상품명</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="border-border bg-background text-foreground h-11 focus-visible:ring-foreground"
                                        placeholder="상품명을 입력하세요"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground/70">카테고리</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, category: val, subCategory: "" }))}
                                        >
                                            <SelectTrigger className="border-border bg-background text-foreground h-11 focus:ring-foreground">
                                                <SelectValue placeholder="선택" />
                                            </SelectTrigger>
                                            <SelectContent className="border-border bg-card text-foreground">
                                                {categoriesData.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.name} className="focus:bg-muted focus:text-foreground">{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground/70">하위 카테고리</Label>
                                        <Select
                                            value={formData.subCategory}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, subCategory: val }))}
                                            disabled={!formData.category}
                                        >
                                            <SelectTrigger className="border-border bg-background text-foreground h-11 focus:ring-foreground">
                                                <SelectValue placeholder="선택" />
                                            </SelectTrigger>
                                            <SelectContent className="border-border bg-card text-foreground">
                                                {(() => {
                                                    const selectedCat = categoriesData.find(c => c.name === formData.category)
                                                    return selectedCat?.sub_categories.map(sub => (
                                                        <SelectItem key={sub.id} value={sub.name} className="focus:bg-muted focus:text-foreground">{sub.name}</SelectItem>
                                                    ))
                                                })()}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground/70">외부 링크 URL</Label>
                                    <Input
                                        value={formData.external_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                                        className="border-border bg-background text-foreground h-11 focus-visible:ring-foreground"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground/70">상품 설명</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="min-h-[150px] border-border bg-background text-foreground focus-visible:ring-foreground resize-none"
                                        placeholder="상품에 대한 설명을 입력하세요"
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground">가격 정보</h2>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-foreground/70">판매 가격</Label>
                                <Input
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    className="border-border bg-background text-foreground h-11 focus-visible:ring-foreground"
                                    placeholder="예: 12,000,000원 (텍스트로 입력 가능)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
