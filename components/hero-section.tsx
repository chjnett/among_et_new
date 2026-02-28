"use client"

import { useEffect, useState } from "react"

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setIsLoaded(true)

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToContent = () => {
    const content = document.getElementById('main-content')
    if (content) {
      content.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Animation Checkpoints
  // Storytelling sequence optimized for medium-short scroll (70vh)

  // Logo: 0 -> 150
  const logoOpacity = Math.max(0, 1 - scrollY / 150)
  const logoScale = 1 + scrollY / 1200
  const logoBlur = Math.min(6, scrollY / 15)

  // Headline: "True Luxury is Timeless"
  // Fades in after logo starts fading out (100 -> 250)
  const headlineOpacity = Math.min(1, Math.max(0, (scrollY - 100) / 150))
  const headlineTranslateY = (scrollY - 100) * 0.2 // Parallax starts when it appears
  const headlineBlur = 0

  // Subtext: "시간이 흘러도..."
  // Fades in after headline starts appearing (200 -> 350)
  const subtextOpacity = Math.min(1, Math.max(0, (scrollY - 200) / 150))
  const subtextTranslateY = (scrollY - 200) * 0.1 // Parallax starts when it appears
  const subtextBlur = 0

  // Scroll Prompt
  const scrollPromptOpacity = Math.max(0, 1 - scrollY / 50)

  return (
    <section className="relative h-[70vh] bg-background">
      <div className="sticky top-0 h-[70vh] w-full overflow-hidden flex flex-col items-center justify-center px-4">

        {/* Background Glow - Subtle light theme version */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/40 blur-[120px] transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ opacity: isLoaded ? 0.2 : 0 }}
          />
        </div>

        {/* Logo Container */}
        <div
          className="relative z-10 text-center will-change-transform"
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            filter: `blur(${logoBlur}px)`,
            display: logoOpacity <= 0.01 ? 'none' : 'block'
          }}
        >
          <h1 className={`text-4xl font-bold tracking-[0.4em] text-foreground md:text-5xl lg:text-7xl transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            RICH
          </h1>
          <div className={`mt-4 flex items-center justify-center gap-3 transition-opacity duration-1000 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <span className="h-px w-8 bg-border" />
            <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase md:text-xs">
              리치.com
            </p>
            <span className="h-px w-8 bg-border" />
          </div>
        </div>

        {/* Headline Container */}
        <div
          className="absolute z-10 max-w-lg text-center will-change-transform"
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineTranslateY}px)`,
            filter: `blur(${headlineBlur}px)`,
            display: headlineOpacity <= 0 ? 'none' : 'block'
          }}
        >
          <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl lg:text-4xl tracking-tight">
            True Luxury is Timeless
          </p>
        </div>

        {/* Subtext Container */}
        <div
          className="absolute z-10 max-w-lg text-center will-change-transform top-[60%]"
          style={{
            opacity: subtextOpacity,
            transform: `translateY(${subtextTranslateY}px)`,
            filter: `blur(${subtextBlur}px)`
          }}
        >
          <p className="text-sm font-medium leading-7 text-muted-foreground md:text-base">
            시간이 흘러도 변치 않는 가치
          </p>
        </div>

        {/* Scroll Prompt */}
        <div
          onClick={scrollToContent}
          className={`absolute bottom-4 left-1/2 z-20 -translate-x-1/2 cursor-pointer transition-opacity duration-500`}
          style={{ opacity: isLoaded ? scrollPromptOpacity : 0 }}
        >
          <div className="flex flex-col items-center gap-1 animate-bounce">
            <span className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
              Start
            </span>
            <div className="h-8 w-px bg-foreground/20" />
          </div>
        </div>

      </div>
    </section>
  )
}
