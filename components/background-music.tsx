"use client"

import { useState, useRef, useEffect } from "react"
import { Music, Music2, Volume2, VolumeX, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

const SONGS = [
    "Blooming - bgm.mp3 (128k).mp3",
    "Caramel lights - bgm.mp3 (128k).mp3",
    "Forbidden Love - K'Cherie - Topic (128k).mp3",
    "Forever starts with you - bgm.mp3 (128k).mp3",
    "Jenevieve - Love Quotes [Official Audio] - Jenevieve (128k).mp3",
    "Left the light on - bgm.mp3 (128k).mp3",
    "Like i do - J.Tajor.mp3",
    "Love Looks Like You - bgm.mp3 (128k).mp3",
    "Some summers stay - bgm.mp3 (128k).mp3",
    "THEY. - Play Fight with Tinashe (Official Lyric Video) - THEY. (128k).mp3"
]

export function BackgroundMusic() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [isMuted, setIsMuted] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [mounted, setMounted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setMounted(true)
        // Shuffle playlist indices initially
        setCurrentTrackIndex(Math.floor(Math.random() * SONGS.length))

        // Initial auto-collapse timer (only if we start as expanded)
        startCollapseTimer(8000) // Give more time at start

        return () => {
            if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
        }
    }, [])

    const startCollapseTimer = (delay = 4000) => {
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
        collapseTimerRef.current = setTimeout(() => {
            setIsExpanded(false)
        }, delay)
    }

    useEffect(() => {
        const handleRemotePlay = () => {
            if (audioRef.current && !isPlaying) {
                audioRef.current.play().catch(() => { })
                setIsPlaying(true)
                setHasInteracted(true)
                setIsExpanded(true)
                startCollapseTimer()
            }
        }

        const handleGlobalClick = () => {
            if (audioRef.current && !isPlaying && !hasInteracted) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true)
                    setHasInteracted(true)
                    setIsExpanded(true)
                    startCollapseTimer()
                    window.removeEventListener('mousedown', handleGlobalClick)
                    window.removeEventListener('touchstart', handleGlobalClick)
                }).catch(() => { })
            }
        }

        // Direct method for 100% reliable trigger in click handlers
        (window as any).playMusicDirectly = () => {
            if (audioRef.current && !isPlaying) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true)
                    setHasInteracted(true)
                    setIsExpanded(true)
                    startCollapseTimer()
                }).catch(() => { })
            }
        }

        window.addEventListener('play-bg-music', handleRemotePlay)
        window.addEventListener('mousedown', handleGlobalClick)
        window.addEventListener('touchstart', handleGlobalClick)

        return () => {
            window.removeEventListener('play-bg-music', handleRemotePlay)
            window.removeEventListener('mousedown', handleGlobalClick)
            window.removeEventListener('touchstart', handleGlobalClick)
            delete (window as any).playMusicDirectly
        }
    }, [isPlaying, hasInteracted])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(err => console.log("Autoplay prevented:", err))
        }
        setIsPlaying(!isPlaying)
        setHasInteracted(true)

        // When user manually toggles, keep it expanded for a bit
        setIsExpanded(true)
        startCollapseTimer()
    }

    const handleContainerClick = () => {
        if (!isExpanded) {
            setIsExpanded(true)
            startCollapseTimer()
        }
    }

    const nextTrack = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        const nextIndex = (currentTrackIndex + 1) % SONGS.length
        setCurrentTrackIndex(nextIndex)
        setIsExpanded(true)
        startCollapseTimer()

        if (isPlaying) {
            setTimeout(() => {
                audioRef.current?.play().catch(() => { })
            }, 100)
        }
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!audioRef.current) return
        audioRef.current.muted = !isMuted
        setIsMuted(!isMuted)
        setIsExpanded(true)
        startCollapseTimer()
    }

    const handleEnded = () => {
        nextTrack()
    }

    return (
        <div className="fixed bottom-24 right-5 z-[60] flex flex-col items-end gap-2 md:bottom-10 md:right-10">
            <audio
                ref={audioRef}
                src={`/${SONGS[currentTrackIndex]}`}
                onEnded={handleEnded}
            />

            <div
                onClick={handleContainerClick}
                className={cn(
                    "flex items-center gap-2 overflow-hidden rounded-full bg-white/20 p-1 backdrop-blur-xl border border-white/30 transition-all duration-700 ease-in-out shadow-2xl cursor-pointer",
                    isExpanded ? "w-auto max-w-[280px] px-2 shadow-black/20" : "w-11 px-1 shadow-transparent"
                )}
            >
                <button
                    onClick={togglePlay}
                    className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                        isPlaying ? "bg-black text-white" : "bg-white text-black"
                    )}
                >
                    {isPlaying ? <Music className="h-4 w-4 animate-pulse" /> : <Music2 className="h-4 w-4" />}
                </button>

                {/* Information & Controls (Only visible when expanded) */}
                <div className={cn(
                    "flex items-center gap-3 transition-all duration-500",
                    isExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none w-0"
                )}>
                    <div className="flex flex-col min-w-[80px] max-w-[120px]">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-black/40">Now Playing</span>
                        <span className="text-[10px] font-extrabold text-black truncate">
                            {SONGS[currentTrackIndex].split(' - ')[0]}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 pr-2">
                        <button onClick={toggleMute} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-black/60" /> : <Volume2 className="h-3.5 w-3.5 text-black/60" />}
                        </button>
                        <button onClick={(e) => nextTrack(e)} className="p-1.5 hover:bg-black/5 rounded-full transition-colors">
                            <SkipForward className="h-3.5 w-3.5 text-black/60" />
                        </button>
                    </div>
                </div>
            </div>

            {/* "Click To Play" Badge - Only shown initially if no interaction */}
            {!hasInteracted && isExpanded && (
                <div className="pointer-events-none absolute -left-28 top-1/2 -translate-y-1/2 animate-bounce">
                    <span className="rounded-sm bg-black px-2 py-1 text-[8px] font-bold tracking-[0.2em] text-white uppercase shadow-lg before:absolute before:left-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-l-black">Click To play</span>
                </div>
            )}
        </div>
    )
}
