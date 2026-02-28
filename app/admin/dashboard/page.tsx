"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import { Plus, Pencil, Trash2, Loader2, LogOut, FolderOpen, Bell } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import { Database } from "@/lib/database.types"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
// import { SeedButton } from "@/components/seed-button"
import { cn } from "@/lib/utils"

type ProductWithCategory = Database['public']['Tables']['products']['Row'] & {
    sub_categories: {
        categories: {
            id: number
            name: string
        } | null
    } | null
}

type Category = Database['public']['Tables']['categories']['Row']

export default function AdminDashboardPage() {
    const [products, setProducts] = useState<ProductWithCategory[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [activeCategory, setActiveCategory] = useState<string>("All")

    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const { toast } = useToast()

    const fetchProducts = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*, sub_categories(categories(id, name))')
            .order('created_at', { ascending: false })

        if (error) {
            toast({
                variant: "destructive",
                title: "데이터 로딩 실패",
                description: error.message,
            })
        } else {
            // @ts-ignore - Supabase type inference for nested joins can be tricky
            setProducts(data || [])
        }
        setIsLoading(false)
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('order', { ascending: true })

        if (data) setCategories(data)
    }

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const filteredProducts = activeCategory === "All"
        ? products
        : products.filter(p => p.sub_categories?.categories?.name === activeCategory)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push("/admin/login")
    }

    const handleDelete = async (id: string) => {
        if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return

        const { error } = await supabase
            .from('products')
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
                description: "상품이 삭제되었습니다.",
            })
            fetchProducts()
        }
    }

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">상품 관리</h1>
                        <p className="text-muted-foreground">등록된 럭셔리 상품을 관리하세요.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Link href="/admin/dashboard/notices">
                                <Bell className="mr-2 h-4 w-4" />
                                공지사항 관리
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Link href="/admin/dashboard/categories">
                                <FolderOpen className="mr-2 h-4 w-4" />
                                카테고리 관리
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            로그아웃
                        </Button>
                        <Button asChild className="bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm">
                            <Link href="/admin/dashboard/products/new">
                                <Plus className="mr-2 h-4 w-4" />
                                상품 등록
                            </Link>
                        </Button>
                    </div>
                </div>



                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveCategory("All")}
                        className={cn(
                            "rounded-full px-4 text-sm font-medium transition-colors",
                            activeCategory === "All"
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                    >
                        전체
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant="ghost"
                            onClick={() => setActiveCategory(cat.name)}
                            className={cn(
                                "rounded-full px-4 text-sm font-medium transition-colors",
                                activeCategory === cat.name
                                    ? "bg-foreground text-background hover:bg-foreground/90"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-md"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/5] bg-muted/10">
                                    {product.img_urls && product.img_urls[0] ? (
                                        <Image
                                            src={product.img_urls[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground/40">
                                            No Image
                                        </div>
                                    )}
                                    {/* Actions Overlay (Desktop Only) */}
                                    <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 md:flex backdrop-blur-[2px]">
                                        <Button
                                            asChild
                                            size="icon"
                                            variant="outline"
                                            className="h-10 w-10 border-border bg-background text-foreground hover:bg-muted"
                                        >
                                            <Link href={`/admin/dashboard/products/${product.id}`}>
                                                <Pencil className="h-5 w-5" />
                                                <span className="sr-only">수정</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-10 w-10"
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                            <span className="sr-only">삭제</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="line-clamp-1 font-bold text-foreground text-lg">{product.name}</h3>
                                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                                                ID: {product.id.slice(0, 8)}
                                            </p>
                                            <p className="text-base font-bold text-foreground pt-1">
                                                {/* @ts-ignore */}
                                                {(() => {
                                                    const priceVal = product.specs?.price;
                                                    if (!priceVal) return '가격 미정';
                                                    // Remove commas if string
                                                    const num = Number(String(priceVal).replace(/,/g, ''));
                                                    if (isNaN(num)) return priceVal; // Return original string if not number (e.g. "문의")

                                                    // Heuristic: If price is less than 10000, assume it's in thousands unit
                                                    // This handles "1250" -> 1,250,000
                                                    const finalPrice = num < 10000 ? num * 1000 : num;
                                                    return `${finalPrice.toLocaleString()}원`;
                                                })()}
                                            </p>
                                        </div>
                                        {/* Mobile Actions (Visible only on mobile) */}
                                        <div className="flex gap-1 md:hidden">
                                            <Button
                                                asChild
                                                size="icon"
                                                variant="ghost"
                                                className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                                <Link href={`/admin/dashboard/products/${product.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-6 flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-tighter">
                                            {new Date(product.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && products.length === 0 && (
                    <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground bg-muted/5">
                        <p className="mb-4 font-medium text-lg">등록된 상품이 없습니다.</p>
                        <Button asChild variant="outline" className="border-border hover:bg-muted">
                            <Link href="/admin/dashboard/products/new">첫 상품 등록하기</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
