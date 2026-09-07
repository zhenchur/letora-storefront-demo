import { useLayoutEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { BEFORE_NAVIGATE, useNavigation } from '../navigation/Navigation'
import 'lenis/dist/lenis.css'

const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

// These GSAP lifecycle APIs are present in 3.15 but omitted from its typings.
type MediaEvent = 'matchMediaInit' | 'matchMedia'
const mediaEvents = gsap as typeof gsap & {
  addEventListener(event: MediaEvent, listener: () => void): void
  removeEventListener(event: MediaEvent, listener: () => void): void
}

export function useSmoothScroll(ready: boolean) {
  const instance = useRef<Lenis | null>(null)
  const { location, phase, finishNavigation } = useNavigation()

  useLayoutEffect(() => {
    if (!ready) return

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      // Native links keep their browser behavior; the router explicitly stops route inertia.
      anchors: false,
      stopInertiaOnNavigate: false,
      respectReducedMotion: true,
    })
    instance.current = lenis

    const tick = (time: number) => lenis.raf(time * 1000)
    let mediaScroll: number | undefined
    const saveMediaScroll = () => { mediaScroll = window.scrollY }
    const restoreMediaScroll = () => {
      if (mediaScroll === undefined) return
      const position = mediaScroll
      mediaScroll = undefined
      // GSAP can lose its saved scroll when a media change removes all triggers.
      lenis.resize()
      lenis.scrollTo(position, { immediate: true, force: true })
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !scrollKeys.has(event.key)) return
      if (lenis.isStopped) {
        event.preventDefault()
        return
      }
      if (event.target instanceof Element &&
        event.target.closest('input, textarea, select, [contenteditable]')) return

      // Let native keyboard scrolling interrupt a wheel tween still settling.
      if (lenis.isScrolling === 'smooth') {
        lenis.scrollTo(lenis.actualScroll, { immediate: true })
      }
    }

    const stopSync = lenis.on('scroll', () => ScrollTrigger.update())
    const stopNavigation = () => lenis.scrollTo(lenis.actualScroll, { immediate: true })
    gsap.ticker.add(tick)
    mediaEvents.addEventListener('matchMediaInit', saveMediaScroll)
    mediaEvents.addEventListener('matchMedia', restoreMediaScroll)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(BEFORE_NAVIGATE, stopNavigation)
    // Child entrances are mounted and the preloader's scroll lock is released.
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      gsap.ticker.remove(tick)
      mediaEvents.removeEventListener('matchMediaInit', saveMediaScroll)
      mediaEvents.removeEventListener('matchMedia', restoreMediaScroll)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(BEFORE_NAVIGATE, stopNavigation)
      window.cancelAnimationFrame(refreshFrame)
      stopSync()
      lenis.destroy()
      instance.current = null
    }
  }, [ready])

  useLayoutEffect(() => {
    const lenis = instance.current
    if (!ready || !lenis) return
    if (phase === 'idle') lenis.start()
    else {
      document.documentElement.setAttribute('data-page-transition', phase)
      lenis.stop()
    }
    return () => {
      document.documentElement.removeAttribute('data-page-transition')
      if (instance.current === lenis) lenis.start()
    }
  }, [ready, phase])

  useLayoutEffect(() => {
    const lenis = instance.current
    if (!ready || !lenis) return

    let target: number | HTMLElement = location.scroll?.y ?? location.fallback.y
    if (!location.scroll && location.hash) {
      try {
        const id = decodeURIComponent(location.hash.slice(1))
        target = document.getElementById(id) ?? document.getElementsByName(id)[0] ?? target
      } catch {
        // A malformed fragment must not prevent navigation.
      }
    }
    lenis.resize()
    lenis.scrollTo(target, { immediate: true, force: true })
    window.scrollTo({ left: location.scroll?.x ?? location.fallback.x, top: window.scrollY, behavior: 'instant' })
    // Page-owned text hooks wait until the destination has its intended scroll position.
    finishNavigation()
    const refreshFrame = requestAnimationFrame(() => {
      lenis.resize()
      ScrollTrigger.refresh()
    })
    return () => cancelAnimationFrame(refreshFrame)
  }, [ready, location, finishNavigation])
}
