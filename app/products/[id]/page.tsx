
import { Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ProductDetailClient from "@/components/product-detail-client"
import type { Product } from "@/lib/data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProductPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    // Fetch product data
    const { data: productData, error } = await supabase
        .from('products')
        .select(`
        *,
        sub_categories (
            name,
            categories (
                name
            )
        )
    `)
        .eq('id', id)
        .single()

    if (error || !productData) {
        notFound()
    }

    // Map to UI Product Interface
    const pd = productData as any;
    const product: Product = {
        id: pd.id,
        title: pd.name,
        category: pd.sub_categories?.categories?.name || "가방",
        subCategory: pd.sub_categories?.name || "가방",
        image: pd.img_urls?.[0] || "",
        gallery: pd.img_urls || [],
        externalUrl: pd.external_url || "",
        price: (() => {
            const priceVal = pd.specs?.price;
            if (!priceVal) return "";
            const num = Number(String(priceVal).replace(/,/g, ''));
            if (isNaN(num)) return priceVal;
            const finalPrice = num < 10000 ? num * 1000 : num;
            return `${finalPrice.toLocaleString()}원`;
        })(),
        specs: {
            modelNo: pd.specs?.modelNo || "",
            material: pd.specs?.material || "",
            size: pd.specs?.size || "",
            color: pd.specs?.color || ""
        },
        description: pd.description || ""
    }

    // 2. Fetch Reviews for this product
    const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_visible', true)
        .eq('product_id', id)
        .order('created_at', { ascending: false })

    return (
        <main className="min-h-screen bg-background">
            <Suspense fallback={<div>Loading...</div>}>
                <ProductDetailClient product={product} reviews={(reviewsData as any) || []} />
            </Suspense>
        </main>
    )
}
