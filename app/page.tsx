import { supabase } from "@/lib/supabase"
import { fetchAllProducts } from "@/lib/supabase-utils"
import { HeroSection } from "@/components/hero-section"
import { ProductSectionClient } from "@/components/product-section-client"
import { NoticePopup } from "@/components/notice-popup"
import type { Category, Product } from "@/lib/data"
import { VisitorTracker } from "@/components/visitor-tracker"
import { BrandFlowStrip } from "@/components/brand-flow-strip"
import { HeaderClient } from "@/components/header-client"
import { HomeScrollRestore } from "@/components/home-scroll-restore"
import { compareLabels } from "@/lib/utils/label-utils"

import { ReviewSection } from "@/components/review-section"

// Use ISR (Incremental Static Regeneration) - 10 minutes revalidation to balance update speed and server costs
export const revalidate = 600

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subCategory?: string; search?: string }>
}) {
  const params = await searchParams
  const categoryParam = (params.category || "전체").trim().normalize("NFC")
  const subCategoryParam = params.subCategory?.trim().normalize("NFC")
  const searchParam = (params.search || "").trim().normalize("NFC")

  // 1. Fetch Categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*, sub_categories(name, id)') // Select sub_categories
    .order('order', { ascending: true })

  // Map to UI Category Interface
  const mappedCategories: Category[] = [
    { name: "전체", subCategories: [] },
    ...(categoriesData?.map((c: any) => ({
      name: c.name,
      subCategories: c.sub_categories?.map((s: any) => s.name) || []
    })) || [])
  ]

  // Manual swap for "시계" and "가방" positions to reflect user preference
  const bagIndex = mappedCategories.findIndex(c => c.name.includes("가방"));
  const watchIndex = mappedCategories.findIndex(c => c.name.includes("시계"));
  if (bagIndex !== -1 && watchIndex !== -1) {
    const temp = mappedCategories[bagIndex];
    mappedCategories[bagIndex] = mappedCategories[watchIndex];
    mappedCategories[watchIndex] = temp;
  }

  // 2. Fetch All Products (Bypassing Supabase 1000 limit)
  const productsData = await fetchAllProducts()

  // 3. Client-side mapping & safety
  const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    category: (p.sub_categories?.categories?.name || "Bag").trim().normalize("NFC"),
    subCategory: (p.sub_categories?.name || "etc").trim().normalize("NFC"),
    image: p.img_urls?.[0] || "",
    gallery: (p.img_urls && p.img_urls.length > 0) ? p.img_urls : (p.img_urls?.[0] ? [p.img_urls[0]] : []),
    externalUrl: p.external_url || "",
    price: (() => {
      const priceVal = p.specs?.price;
      if (!priceVal) return "";
      const num = Number(String(priceVal).replace(/,/g, ''));
      if (isNaN(num)) return priceVal;
      const finalPrice = num < 10000 ? num * 1000 : num;
      return `${finalPrice.toLocaleString()}원`;
    })(),
    specs: {
      modelNo: p.specs?.modelNo || "",
      material: p.specs?.material || "",
      size: p.specs?.size || "",
      color: p.specs?.color || ""
    },
    description: p.description || ""
  })) || []

  const formattedProducts = mappedProducts.filter((product) => {
    if (categoryParam !== "전체" && !compareLabels(product.category, categoryParam)) return false
    if (subCategoryParam && !compareLabels(product.subCategory, subCategoryParam)) return false
    return true
  })

  // 4. Fetch Reviews
  const { data: reviewsData } = await (supabase as any)
    .from('reviews')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-background">
      <HomeScrollRestore />
      <VisitorTracker />
      <HeaderClient categories={mappedCategories} />

      <div className="pt-[64px] md:pt-[72px]">
        <HeroSection />
        <BrandFlowStrip />

        <section id="main-content" className="px-4 py-8 md:px-8 lg:px-16 max-w-6xl mx-auto">
          <ProductSectionClient
            categories={mappedCategories}
            products={formattedProducts}
            selectedCategory={categoryParam}
            selectedSubCategory={subCategoryParam || null}
            searchQuery={searchParam}
          />
        </section>

        <ReviewSection reviews={reviewsData || []} />
      </div>

      <NoticePopup />
    </main>
  )
}
