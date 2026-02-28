"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function AdminLoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        console.log("Login attempt starting for:", email);

        try {
            console.log("Signing in with supabase...");
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.error("Supabase auth error:", error);
                throw error
            }

            console.log("Auth successful, user:", data.user.id);

            // Check if user has admin role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()

            console.log("Profile data:", profile);
            console.log("Profile error:", profileError);

            if (profileError || profile?.role !== 'admin') {
                console.error("Unauthorized: Role is", profile?.role);
                throw new Error("Unauthorized access: Not an admin")
            }

            console.log("Admin verified, redirecting...");

            toast({
                title: "로그인 성공",
                description: "관리자 대시보드로 이동합니다.",
            })

            router.push("/admin/dashboard")
            router.refresh()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "로그인 실패",
                description: error.message || "이메일 또는 비밀번호를 확인해주세요.",
            })
            // Optional: Sign out if auth was successful but role check failed
            await supabase.auth.signOut()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border bg-card text-foreground shadow-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-foreground">RICH Admin</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        관리자 계정으로 로그인해주세요.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">이메일</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@rich.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="border-border bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">비밀번호</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="border-border bg-transparent text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-foreground"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    로그인 중...
                                </>
                            ) : (
                                "로그인"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
