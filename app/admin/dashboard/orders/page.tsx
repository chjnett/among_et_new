"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingBag, Loader2, Trash2, CheckCircle2, Clock, Phone, MapPin, User, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface Order {
    id: string
    customer_name: string
    contact: string
    address: string
    product_name: string
    status: string
    created_at: string
}

export default function OrdersAdminPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        setIsLoading(true)
        const { data, error } = await (supabase as any)
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast({
                variant: "destructive",
                title: "로딩 실패",
                description: error.message,
            })
        } else {
            setOrders(data || [])
        }
        setIsLoading(false)
    }

    const deleteOrder = async (id: string) => {
        if (!confirm("정말 이 주문 내역을 삭제하시겠습니까?")) return

        const { error } = await (supabase as any)
            .from('orders')
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
                description: "주문 내역이 삭제되었습니다.",
            })
            fetchOrders()
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await (supabase as any)
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            toast({
                variant: "destructive",
                title: "업데이트 실패",
                description: error.message,
            })
        } else {
            toast({
                title: "업데이트 성공",
                description: `주문 상태가 ${newStatus === 'completed' ? '완료' : '대기'}로 변경되었습니다.`,
            })
            fetchOrders()
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">처리 완료</Badge>
            case 'processing':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">처리 중</Badge>
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">취소됨</Badge>
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">대기 중</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <ShoppingBag className="h-8 w-8" />
                            주문 관리
                        </h1>
                        <p className="text-muted-foreground">고객들이 작성한 주문 정보를 확인하고 관리하세요.</p>
                    </div>
                    <Button asChild variant="outline" className="border-border hover:bg-muted self-start">
                        <Link href="/admin/dashboard">
                            대시보드로 돌아가기
                        </Link>
                    </Button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="group relative rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/20"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(order.status)}
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 rounded-full bg-muted p-2">
                                                    <User className="h-4 w-4 text-foreground/70" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">주문자</p>
                                                    <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 rounded-full bg-muted p-2">
                                                    <Phone className="h-4 w-4 text-foreground/70" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">연락처</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-foreground">{order.contact}</p>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => window.open(`tel:${order.contact}`)}
                                                        >
                                                            <Phone className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 md:col-span-2">
                                                <div className="mt-1 rounded-full bg-muted p-2">
                                                    <MapPin className="h-4 w-4 text-foreground/70" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">주소</p>
                                                    <p className="text-sm font-semibold text-foreground">{order.address}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 md:col-span-2">
                                                <div className="mt-1 rounded-full bg-muted p-2">
                                                    <Package className="h-4 w-4 text-foreground/70" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">주문 제품</p>
                                                    <p className="text-sm font-semibold text-foreground">{order.product_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                                        <Button
                                            onClick={() => updateStatus(order.id, order.status === 'completed' ? 'pending' : 'completed')}
                                            className={order.status === 'completed'
                                                ? "bg-muted text-foreground hover:bg-muted/80"
                                                : "bg-black text-white hover:bg-zinc-800"}
                                            size="sm"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            {order.status === 'completed' ? "대기로 변경" : "처리 완료"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteOrder(order.id)}
                                            className="text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            내역 삭제
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && orders.length === 0 && (
                    <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground bg-muted/5">
                        <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-medium text-lg text-center">아직 접수된 주문이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
