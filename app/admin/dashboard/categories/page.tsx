"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, Folder, FolderOpen, Loader2, ArrowUp, ArrowDown, Edit, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"

type Category = Database['public']['Tables']['categories']['Row'] & {
    sub_categories: Database['public']['Tables']['sub_categories']['Row'][]
}

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newSubCategoryInput, setNewSubCategoryInput] = useState<{ [key: number]: string }>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Editing states
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
    const [editingCategoryName, setEditingCategoryName] = useState("")
    const [editingSubCategoryId, setEditingSubCategoryId] = useState<number | null>(null)
    const [editingSubCategoryName, setEditingSubCategoryName] = useState("")

    const router = useRouter()
    const { toast } = useToast()

    const fetchCategories = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*, sub_categories(*)')
                .order('order', { ascending: true })

            if (error) throw error

            // Sort sub_categories by name or id since they don't have order yet
            const sortedData = data?.map(cat => ({
                ...cat,
                sub_categories: cat.sub_categories.sort((a, b) => a.id - b.id)
            })) || []

            setCategories(sortedData)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "로딩 실패",
                description: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleMoveCategory = async (id: number, direction: 'up' | 'down') => {
        const index = categories.findIndex(c => c.id === id)
        if (index === -1) return

        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= categories.length) return

        const currentCategory = categories[index]
        const targetCategory = categories[targetIndex]

        // Swap orders optimistically
        const newCategories = [...categories]
        newCategories[index] = { ...targetCategory, order: currentCategory.order }
        newCategories[targetIndex] = { ...currentCategory, order: targetCategory.order }
        setCategories(newCategories)

        try {
            const { error: error1 } = await supabase
                .from('categories')
                .update({ order: targetCategory.order })
                .eq('id', currentCategory.id)

            const { error: error2 } = await supabase
                .from('categories')
                .update({ order: currentCategory.order })
                .eq('id', targetCategory.id)

            if (error1 || error2) throw error1 || error2

            // Re-fetch to ensure sync (optional)
            // fetchCategories() 
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "순서 변경 실패",
                description: "변경된 순서를 저장하지 못했습니다."
            })
            fetchCategories() // Revert on error
        }
    }

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return

        setIsSubmitting(true)
        try {
            // Get max order
            const { data: maxOrderData } = await supabase
                .from('categories')
                .select('order')
                .order('order', { ascending: false })
                .limit(1)

            const nextOrder = (maxOrderData?.[0]?.order ?? 0) + 1

            const { error } = await supabase
                .from('categories')
                .insert({ name: newCategoryName, order: nextOrder })

            if (error) throw error

            setNewCategoryName("")
            toast({ title: "카테고리 추가 성공" })
            fetchCategories()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "추가 실패",
                description: error.message
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("카테고리를 삭제하시겠습니까? 하위 카테고리와 해당 카테고리의 상품들이 영향을 받을 수 있습니다.")) return

        try {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
            toast({ title: "카테고리 삭제 성공" })
            fetchCategories()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "삭제 실패",
                description: error.message
            })
        }
    }

    const handleAddSubCategory = async (categoryId: number) => {
        const name = newSubCategoryInput[categoryId]
        if (!name?.trim()) return

        try {
            const { error } = await supabase
                .from('sub_categories')
                .insert({ category_id: categoryId, name: name })

            if (error) throw error

            setNewSubCategoryInput(prev => ({ ...prev, [categoryId]: "" }))
            toast({ title: "하위 카테고리 추가 성공" })
            fetchCategories()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "추가 실패",
                description: error.message
            })
        }
    }

    const handleDeleteSubCategory = async (id: number) => {
        if (!confirm("하위 카테고리를 삭제하시겠습니까?")) return

        try {
            const { error } = await supabase.from('sub_categories').delete().eq('id', id)
            if (error) throw error
            toast({ title: "삭제 성공" })
            fetchCategories()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "삭제 실패",
                description: error.message
            })
        }
    }

    const handleStartEditCategory = (id: number, name: string) => {
        setEditingCategoryId(id)
        setEditingCategoryName(name)
    }

    const handleSaveCategory = async (id: number) => {
        if (!editingCategoryName.trim()) {
            toast({
                variant: "destructive",
                title: "카테고리 이름을 입력해주세요"
            })
            return
        }

        try {
            const { error } = await supabase
                .from('categories')
                .update({ name: editingCategoryName })
                .eq('id', id)

            if (error) throw error

            toast({ title: "카테고리 수정 성공" })
            setEditingCategoryId(null)
            setEditingCategoryName("")
            fetchCategories()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "수정 실패",
                description: error.message
            })
        }
    }

    const handleCancelEditCategory = () => {
        setEditingCategoryId(null)
        setEditingCategoryName("")
    }

    const handleStartEditSubCategory = (id: number, name: string) => {
        setEditingSubCategoryId(id)
        setEditingSubCategoryName(name)
    }

    const handleSaveSubCategory = async (id: number) => {
        if (!editingSubCategoryName.trim()) {
            toast({
                variant: "destructive",
                title: "하위 카테고리 이름을 입력해주세요"
            })
            return
        }

        try {
            const { error } = await supabase
                .from('sub_categories')
                .update({ name: editingSubCategoryName })
                .eq('id', id)

            if (error) throw error

            toast({ title: "하위 카테고리 수정 성공" })
            setEditingSubCategoryId(null)
            setEditingSubCategoryName("")
            fetchCategories()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "수정 실패",
                description: error.message
            })
        }
    }

    const handleCancelEditSubCategory = () => {
        setEditingSubCategoryId(null)
        setEditingSubCategoryName("")
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl items-center justify-between p-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Link href="/admin/dashboard">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-bold text-foreground">카테고리 관리</h1>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-4 lg:p-8">
                {/* Add New Category */}
                <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-base font-bold text-foreground">새 상위 카테고리 추가</h2>
                    <div className="flex gap-2">
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="카테고리 이름 (예: 신발)"
                            className="bg-transparent text-foreground border-border h-11 focus-visible:ring-foreground"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddCategory()
                            }}
                        />
                        <Button
                            onClick={handleAddCategory}
                            disabled={isSubmitting || !newCategoryName.trim()}
                            className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 shadow-sm transition-colors"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            추가
                        </Button>
                    </div>
                </div>

                {/* Category List */}
                {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category, index) => (
                            <div key={category.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md">
                                {/* Category Header */}
                                <div className="flex items-center justify-between border-b border-border bg-muted/20 p-3">
                                    <div className="flex items-center gap-2 text-foreground font-bold flex-1">
                                        <Folder className="h-4 w-4 text-primary" />
                                        {editingCategoryId === category.id ? (
                                            <div className="flex items-center gap-1 flex-1">
                                                <Input
                                                    value={editingCategoryName}
                                                    onChange={(e) => setEditingCategoryName(e.target.value)}
                                                    className="h-9 text-sm bg-background text-foreground border-border"
                                                    onKeyDown={(e) => {
                                                        if (e.nativeEvent.isComposing) return
                                                        if (e.key === 'Enter') handleSaveCategory(category.id)
                                                        if (e.key === 'Escape') handleCancelEditCategory()
                                                    }}
                                                    autoFocus
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleSaveCategory(category.id)}
                                                >
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={handleCancelEditCategory}
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="truncate">{category.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    onClick={() => handleStartEditCategory(category.id, category.name)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                            onClick={() => handleMoveCategory(category.id, 'up')}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                            onClick={() => handleMoveCategory(category.id, 'down')}
                                            disabled={index === categories.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteCategory(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Sub Categories */}
                                <div className="p-4 flex-1 flex flex-col gap-4">
                                    <ul className="space-y-1.5">
                                        {category.sub_categories.map((sub) => (
                                            <li key={sub.id} className="group flex items-center justify-between rounded px-3 py-2 transition-colors hover:bg-muted/50">
                                                {editingSubCategoryId === sub.id ? (
                                                    <div className="flex items-center gap-1 flex-1">
                                                        <Input
                                                            value={editingSubCategoryName}
                                                            onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                                            className="h-8 text-xs bg-background text-foreground border-border"
                                                            onKeyDown={(e) => {
                                                                if (e.nativeEvent.isComposing) return
                                                                if (e.key === 'Enter') handleSaveSubCategory(sub.id)
                                                                if (e.key === 'Escape') handleCancelEditSubCategory()
                                                            }}
                                                            autoFocus
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleSaveSubCategory(sub.id)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={handleCancelEditSubCategory}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-medium text-foreground/70 flex-1 truncate">{sub.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleStartEditSubCategory(sub.id, sub.name)}
                                                                className="p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubCategory(sub.id)}
                                                                className="p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                        {category.sub_categories.length === 0 && (
                                            <li className="py-4 text-center text-xs text-muted-foreground/40 italic">하위 카테고리 없음</li>
                                        )}
                                    </ul>

                                    {/* Add Sub Category Input */}
                                    <div className="mt-auto pt-4 flex gap-2">
                                        <Input
                                            value={newSubCategoryInput[category.id] || ""}
                                            onChange={(e) => setNewSubCategoryInput(prev => ({ ...prev, [category.id]: e.target.value }))}
                                            placeholder="하위 추가..."
                                            className="h-10 text-xs bg-muted/30 text-foreground border-border focus-visible:ring-foreground"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddSubCategory(category.id)
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 shrink-0 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                                            onClick={() => handleAddSubCategory(category.id)}
                                            disabled={!newSubCategoryInput[category.id]?.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
