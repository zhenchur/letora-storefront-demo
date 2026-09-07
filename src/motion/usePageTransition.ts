import { useLayoutEffect, useRef, type RefObject } from 'react'
import { gsap, useGSAP } from './gsap'
import { TEXT_EXIT_MOTION } from './textReveal'
import { useNavigation, type PageTransition } from '../navigation/Navigation'
import './pageTransition.css'

// Storefront shell adaptation of placeholder-react/App.tsx and lib/motion.ts.
const BACKGROUND_EXIT = { duration: 1, ease: 'power2.out' }
const BACKGROUND_ENTER = { duration: 1.8, ease: 'power2.inOut' }

export function usePageTransition(
  shell: RefObject<HTMLDivElement | null>,
  content: RefObject<HTMLDivElement | null>,
  backdrop: RefObject<HTMLDivElement | null>,
) {
  const { phase, swapPage, releaseEntrance, finishTransition } = useNavigation()
  const play = useRef<(phase: PageTransition) => void>(() => {})

  useGSAP((_context, contextSafe) => {
    const page = content.current
    const background = backdrop.current
    if (!page || !background || !contextSafe) return

    let timeline: gsap.core.Timeline | null = null
    let disposed = false
    let revision = 0
    let previousPhase: PageTransition = 'idle'
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const backgroundColor = () => {
      const hero = page.querySelector<HTMLElement>('.hero')
      const bounds = hero?.getBoundingClientRect()
      const token = bounds && bounds.top >= -1 && bounds.bottom >= window.innerHeight - 1
        ? '--palette-porcelain' : '--palette-white'
      return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    }

    play.current = contextSafe((next: PageTransition) => {
      timeline?.kill()
      timeline = null
      const version = ++revision
      // React mounts the next page outside the outgoing GSAP context.
      const defer = (callback: () => void) => queueMicrotask(() => {
        if (!disposed && revision === version) callback()
      })

      if (next === 'idle') {
        gsap.set(page, { clearProps: 'opacity,willChange' })
        gsap.set(background, { clearProps: 'opacity,backgroundColor,willChange' })
      } else if (next === 'preparing') {
        gsap.set([page, background], { opacity: 0 })
      } else if (next === 'exiting') {
        if (previousPhase === 'idle') gsap.set(background, { backgroundColor: backgroundColor() })
        if (motion.matches) {
          gsap.set([page, background], { opacity: 0 })
          defer(swapPage)
        } else {
          gsap.set([page, background], { willChange: 'opacity' })
          timeline = gsap.timeline({ onComplete: () => defer(swapPage) })
            .to(page, { opacity: 0, duration: TEXT_EXIT_MOTION.duration, ease: TEXT_EXIT_MOTION.ease }, 0)
            .to(background, { opacity: 0, ...BACKGROUND_EXIT }, TEXT_EXIT_MOTION.stagger)
        }
      } else {
        gsap.set(background, { backgroundColor: backgroundColor(), opacity: 0 })
        gsap.set(page, { opacity: 0 })
        if (motion.matches) {
          gsap.set([page, background], { opacity: 1 })
          defer(releaseEntrance)
          defer(finishTransition)
        } else {
          gsap.set([page, background], { willChange: 'opacity' })
          timeline = gsap.timeline({ onComplete: () => defer(finishTransition) })
            .to(background, { opacity: 1, ...BACKGROUND_ENTER }, 0)
            .to(page, { opacity: 1, duration: TEXT_EXIT_MOTION.duration, ease: TEXT_EXIT_MOTION.ease }, 0)
            .call(() => defer(releaseEntrance), [], TEXT_EXIT_MOTION.duration)
        }
      }
      previousPhase = next
    })

    const onMotionChange = contextSafe(() => {
      if (motion.matches) timeline?.progress(1)
    })
    motion.addEventListener('change', onMotionChange)
    return () => {
      disposed = true
      revision++
      timeline?.kill()
      motion.removeEventListener('change', onMotionChange)
      play.current = () => {}
    }
  }, { scope: shell })

  useLayoutEffect(() => play.current(phase), [phase])
}
