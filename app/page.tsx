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

// Use ISR (Incremental Static Regeneration) - Revalidate every hour
// This significantly reduces CPU usage on Vercel
// Use ISR - Revalidate every hour for production, but faster for updates
export const revalidate = 60

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

  // 2. Fetch All Products (Bypassing Supabase 1000 limit)
  const productsData = await fetchAllProducts()

  // 3. Client-side mapping & safety (already filtered by DB)
  const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    category: (p.sub_categories?.categories?.name || "Bag").trim().normalize("NFC"),
    subCategory: (p.sub_categories?.name || "etc").trim().normalize("NFC"),
    image: p.img_urls?.[0] || "",
    gallery: p.img_urls || [],
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
    if (categoryParam !== "전체" && product.category.toLowerCase() !== categoryParam.toLowerCase()) return false
    if (subCategoryParam && product.subCategory.toLowerCase() !== subCategoryParam.toLowerCase()) return false
    return true
  })

  console.log(`[DEBUG] HomePage - Found ${mappedProducts.length} total products. After filter (${categoryParam}/${subCategoryParam}): ${formattedProducts.length}`)

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
      </div>

      <NoticePopup />
    </main>
  )
}
