"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.replace("/admin/login")
                return
            }

            // Verify admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (profile?.role === 'admin') {
                router.replace("/admin/dashboard")
            } else {
                await supabase.auth.signOut()
                router.replace("/admin/login")
            }
            setIsLoading(false)
        }

        checkUser()
    }, [router])

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
    )
}
