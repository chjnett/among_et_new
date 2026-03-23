"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Notice {
    id: string
    title: string
    content: string
    is_active: boolean
    end_date: string | null
    image_url: string | null
}

export function NoticePopup() {
    const [notice, setNotice] = useState<Notice | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetchActiveNotice()
    }, [])

    const fetchActiveNotice = async () => {
        try {
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .eq('is_active', true)
                .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (data && !error) {
                // 오늘 이미 본 공지인지 확인
                const closedNoticeId = localStorage.getItem('closed_notice_id')
                const closedDate = localStorage.getItem('closed_notice_date')
                const today = new Date().toDateString()

                if (closedNoticeId !== data.id || closedDate !== today) {
                    setNotice(data)
                    setIsOpen(true)
                }
            }
        } catch (error) {
            console.log('Notice fetch failed:', error)
        }
    }

    const handleClose = () => {
        if (notice) {
            localStorage.setItem('closed_notice_id', notice.id)
            localStorage.setItem('closed_notice_date', new Date().toDateString())
        }
        setIsOpen(false)
    }

    // 서버 사이드 렌더링 방지
    if (!mounted || !isOpen || !notice) return null

    // Portal을 사용하여 body에 직접 렌더링
    return createPortal(
        <div
            className="notice-popup-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '1rem'
            }}
            onClick={handleClose}
        >
            <div
                className="notice-popup-content"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '28rem',
                    margin: '0 auto',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '0.3rem',
                    padding: '2rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    animation: 'popupFadeIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        color: '#71717a',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        transition: 'opacity 0.2s',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    aria-label="닫기"
                >
                    <X style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>

                {/* 제목 */}
                <h2
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#18181b',
                        marginBottom: '1rem',
                        paddingRight: '2.5rem',
                        lineHeight: '1.4'
                    }}
                >
                    {notice.title}
                </h2>

                {/* 이미지 */}
                {notice.image_url && (
                    <div
                        style={{
                            width: 'calc(100% + 4rem)',
                            marginLeft: '-2rem',
                            marginRight: '-2rem',
                            marginTop: '-1rem',
                            marginBottom: '1.5rem',
                            backgroundColor: '#f4f4f5',
                            overflow: 'hidden'
                        }}
                    >
                        <img
                            src={notice.image_url}
                            alt="공지용 이미지"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'contain',
                                maxHeight: '400px'
                            }}
                        />
                    </div>
                )}

                {/* 내용 */}
                <div
                    style={{
                        fontSize: '0.9rem',
                        color: '#71717a',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '1.5rem'
                    }}
                >
                    {notice.content}
                </div>

                {/* 버튼 */}
                <Button
                    onClick={handleClose}
                    style={{
                        width: '100%',
                        backgroundColor: '#18181b',
                        color: '#ffffff',
                        fontWeight: '500',
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '0.3rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#000000'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
                >
                    오늘 하루 보지 않기
                </Button>
            </div>

            <style jsx global>{`
                @keyframes popupFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                .notice-popup-overlay {
                    -webkit-tap-highlight-color: transparent;
                }
                
                .notice-popup-content {
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
        </div>,
        document.body
    )
}
