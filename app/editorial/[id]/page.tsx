import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { EditorialRelatedProducts } from "@/components/editorial-related-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

const formatPrice = (raw: unknown) => {
  if (raw === null || raw === undefined) return ""
  const value = String(raw).trim()
  if (!value) return ""
  const asNumber = Number(value.replace(/,/g, ""))
  if (Number.isNaN(asNumber)) return value
  const normalized = asNumber < 10000 ? asNumber * 1000 : asNumber
  return `${normalized.toLocaleString()}원`
}

const fallbackEditorialMap: Record<
  string,
  { title: string; subtitle: string; body: string; image_url: string }
> = {
  "default-1": {
    title: "이번 주 큐레이션",
    subtitle: "데일리 럭셔리 핵심 아이템",
    body: "매일 들어도 질리지 않는 컬러와 실루엣 중심으로 선별했어요.",
    image_url: "/placeholder.jpg",
  },
  "default-2": {
    title: "베스트 3",
    subtitle: "가장 반응 좋은 라인업",
    body: "조회수와 저장수를 기준으로 지금 가장 인기 있는 제품만 모았어요.",
    image_url: "/placeholder.jpg",
  },
  "default-3": {
    title: "신상 한정",
    subtitle: "빠르게 품절되는 신상",
    body: "입고 수량이 적은 제품들입니다. 늦기 전에 먼저 확인해보세요.",
    image_url: "/placeholder.jpg",
  },
}

export default async function EditorialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fallbackData = fallbackEditorialMap[id]

  if (fallbackData) {
    return (
      <main className="min-h-screen bg-background">
        <article className="mx-auto max-w-3xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
          <Link href="/" className="mb-6 inline-block text-xs tracking-[0.14em] text-muted-foreground">
            BACK TO HOME
          </Link>

          <div className="overflow-hidden rounded-md border border-border/50 bg-muted/20">
            <img
              src={fallbackData.image_url}
              alt={fallbackData.title}
              className="h-[280px] w-full object-cover md:h-[420px]"
              loading="eager"
            />
          </div>

          <p className="mt-6 text-[11px] tracking-[0.16em] text-muted-foreground">{fallbackData.subtitle}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            {fallbackData.title}
          </h1>
          <div className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
            {fallbackData.body}
          </div>
        </article>
      </main>
    )
  }

  const { data, error } = await supabase
    .from("editorial_blocks")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  const editorial = data as any
  if (error || !editorial) notFound()

  const { data: linkedProductsData } = await supabase
    .from("editorial_block_products")
    .select(`
      id,
      sort_order,
      products (
        id,
        name,
        img_urls,
        specs,
        sub_categories (
          name,
          categories (
            name
          )
        )
      )
    `)
    .eq("editorial_block_id", id)
    .order("sort_order", { ascending: true })

  const linkedProducts = ((linkedProductsData || []) as any[])
    .map((item) => {
      const product = item.products
      if (!product?.id) return null
      return {
        id: product.id as string,
        name: product.name as string,
        image: (product.img_urls?.[0] as string) || "/placeholder.svg",
        category: (product.sub_categories?.categories?.name as string) || "기타",
        subCategory: (product.sub_categories?.name as string) || "",
        price: formatPrice(product.specs?.price),
      }
    })
    .filter(Boolean) as Array<{
    id: string
    name: string
    image: string
    category: string
    subCategory: string
    price: string
  }>

  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto max-w-3xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <Link href="/" className="mb-6 inline-block text-xs tracking-[0.14em] text-muted-foreground">
          BACK TO HOME
        </Link>

        <div className="overflow-hidden rounded-md border border-border/50 bg-muted/20">
          <img
            src={editorial.image_url || "/placeholder.jpg"}
            alt={editorial.title}
            className="h-[280px] w-full object-cover md:h-[420px]"
            loading="eager"
          />
        </div>

        <p className="mt-6 text-[11px] tracking-[0.16em] text-muted-foreground">{editorial.subtitle}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
          {editorial.title}
        </h1>
        <div className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
          {editorial.body}
        </div>

        {linkedProducts.length > 0 && <EditorialRelatedProducts products={linkedProducts} />}
      </article>
    </main>
  )
}
