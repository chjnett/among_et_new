"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    customerName: z.string().min(2, {
        message: "성함을 2자 이상 입력해주세요.",
    }),
    contact: z.string().min(10, {
        message: "정확한 연락처를 입력해주세요.",
    }),
    address: z.string().min(5, {
        message: "주소를 정확히 입력해주세요.",
    }),
    productName: z.string().min(1, {
        message: "주문 제품명을 입력해주세요.",
    }),
})

interface OrderDialogProps {
    productName?: string
    trigger?: React.ReactNode
}

export function OrderDialog({ productName = "", trigger }: OrderDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerName: "",
            contact: "",
            address: "",
            productName: productName,
        },
    })

    // Update productName if it changes via props
    useEffect(() => {
        if (productName) {
            form.setValue("productName", productName)
        }
    }, [productName, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            const { error } = await (supabase as any).from("orders").insert({
                customer_name: values.customerName,
                contact: values.contact,
                address: values.address,
                product_name: values.productName,
            })

            if (error) throw error

            toast({
                title: "주문 접수 완료",
                description: "주문이 성공적으로 접수되었습니다. 곧 연락드리겠습니다.",
            })
            setIsOpen(false)
            form.reset({
                ...form.getValues(),
                customerName: "",
                contact: "",
                address: "",
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "주문 실패",
                description: error.message || "주문 중 오류가 발생했습니다.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="w-full bg-black hover:bg-zinc-800 text-white rounded-none h-12 uppercase tracking-[0.2em] text-[11px] font-bold">
                        주문하기
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-center pt-4">
                        주문서 작성
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">성함</FormLabel>
                                    <FormControl>
                                        <Input placeholder="홍길동" {...field} className="rounded-none border-zinc-200 focus:ring-0 focus:border-black h-11" />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">연락처</FormLabel>
                                    <FormControl>
                                        <Input placeholder="010-0000-0000" {...field} className="rounded-none border-zinc-200 focus:ring-0 focus:border-black h-11" />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">주소</FormLabel>
                                    <FormControl>
                                        <Input placeholder="배송 받으실 주소를 입력해주세요" {...field} className="rounded-none border-zinc-200 focus:ring-0 focus:border-black h-11" />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="productName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">주문제품명</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="rounded-none border-zinc-200 focus:ring-0 focus:border-black h-11" />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black hover:bg-zinc-800 text-white rounded-none h-12 uppercase tracking-[0.2em] text-[11px] font-bold"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                주문 완료하기
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
