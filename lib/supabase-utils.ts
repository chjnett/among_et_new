
import { supabase } from "@/lib/supabase"

export async function fetchAllProducts() {
    const allData: any[] = []
    let from = 0
    const step = 1000

    while (true) {
        const { data, error } = await supabase
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
            .order('created_at', { ascending: false })
            .range(from, from + step - 1)

        if (error) {
            console.error('Fetch error:', error)
            break
        }

        if (!data || data.length === 0) break

        allData.push(...data)
        if (data.length < step) break
        from += step
    }

    return allData
}
