"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

import imageCompression from 'browser-image-compression'

interface ImageUploaderProps {
    images: string[]
    onChange: (images: string[]) => void
    maxImages?: number // Optional limit (we will not use it practically but good for API)
}

export function ImageUploader({ images, onChange, maxImages = Infinity }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        const newImages = [...images]

        try {
            for (let i = 0; i < files.length; i++) {
                if (newImages.length >= maxImages) break

                const file = files[i]

                // 브라우저 딴에서 이미지 압축 진행
                const options = {
                    maxSizeMB: 0.3, // 최대 300KB로 제한
                    maxWidthOrHeight: 1200, // 최대 해상도 1200px
                    useWebWorker: true // 업로드 중 화면 멈춤 방지
                }

                let compressedFile = file;
                try {
                    compressedFile = await imageCompression(file, options);
                } catch (error) {
                    console.error('이미지 압축 실패, 원본으로 대체합니다:', error);
                }

                const fileExt = file.name.split('.').pop() || 'jpeg'
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, compressedFile)

                if (uploadError) {
                    console.error('Error uploading file:', uploadError)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath)

                newImages.push(publicUrl)
            }

            onChange(newImages)
        } catch (error) {
            console.error('Error uploading images:', error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const removeImage = (indexToRemove: number) => {
        onChange(images.filter((_, index) => index !== indexToRemove))
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((url, index) => (
                    <div key={index} className="group relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-muted/20 shadow-sm transition-all hover:shadow-md">
                        <Image
                            src={url}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 rounded-full bg-white/80 p-1.5 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-background backdrop-blur-sm">
                                대표 이미지
                            </div>
                        )}
                    </div>
                ))}

                {images.length < maxImages && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-secondary/30 text-muted-foreground transition-all hover:border-foreground/40 hover:bg-secondary/50 hover:text-foreground",
                            isUploading && "pointer-events-none opacity-50"
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                        ) : (
                            <>
                                <Upload className="h-6 w-6" />
                                <span className="text-xs font-semibold">이미지 업로드</span>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
                multiple
                accept="image/*"
            />
            <p className="text-[11px] font-medium text-muted-foreground/60 leading-relaxed uppercase tracking-tight">
                * 첫 번째 이미지가 대표 이미지로 설정됩니다.
                <br />
                * 여러 장의 이미지를 동시에 선택할 수 있습니다.
            </p>
        </div>
    )
}
