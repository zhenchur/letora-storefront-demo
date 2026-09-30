import { useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from './gsap'
import { useSiteReady } from './SiteIntro'
import { createTextRevealVars, TEXT_REVEAL_CLEAR_PROPS } from './textReveal'
import { PHOTO_REVEAL_START, PHOTO_REVEAL_COMPLETE } from './photoReveal'
import './textMotion.css'

const TEXT_REVEAL_START = 'text-reveal-start'
const TEXT_REVEAL_COMPLETE = 'text-reveal-complete'

// Reveal parents/lines; HoverText owns only their inner characters.
export function useTextMotion(scope: RefObject<HTMLElement | null>, enabled = true) {
  const ready = useSiteReady()
  const shown = useRef(new WeakSet<HTMLElement>())

  useGSAP(() => {
    if (!enabled || !scope.current) return

    const elements = Array.from(scope.current.querySelectorAll<HTMLElement>('[data-text-reveal]'))
    const complete = (element: HTMLElement) => {
      shown.current.add(element)
      element.dataset.textState = 'complete'
      element.dispatchEvent(new Event(TEXT_REVEAL_COMPLETE))
    }
    if (!ready) {
      gsap.set(elements, { autoAlpha: 0 })
      return
    }

    const media = gsap.matchMedia()
    media.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      if (context.conditions?.reduce) {
        gsap.set(elements, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
        elements.forEach(complete)
        return
      }

      const splits: SplitText[] = []
      const gates: Array<() => void> = []

      for (const element of elements) {
        let revealed = shown.current.has(element)
        element.dataset.textState = revealed ? 'complete' : 'pending'
        let cancelGate = () => {}
        gates.push(() => cancelGate())
        const photo = element.closest('[data-photo-caption]')?.closest('[data-photo-group]')
          ?.querySelector<HTMLImageElement>('img[data-photo-reveal]')
        const gate = element.closest<HTMLElement>('[data-text-after]')
        const after = gate?.dataset.textAfter
        const linkedPhotoCaption = !!photo && !after && element.dataset.textReveal !== 'copy'
        const startTogether = linkedPhotoCaption || gate?.dataset.textAt === 'start'
        const dependency = after ? document.getElementById(after) : photo
        const isPhoto = dependency?.matches('img[data-photo-reveal]')
        const event = isPhoto ? PHOTO_REVEAL_COMPLETE : TEXT_REVEAL_COMPLETE
        const startEvent = isPhoto ? PHOTO_REVEAL_START : TEXT_REVEAL_START
        const { from, to } = createTextRevealVars({
          bodyCopy: element.dataset.textReveal === 'copy',
          tilt: element.dataset.textReveal === 'heading',
        })
        const reveal = (targets: Element[]) => {
          cancelGate()
          // Restored scroll must not wait for an intro that is already above the viewport.
          if (revealed || (dependency && element.getBoundingClientRect().bottom <= 0)) {
            revealed = true
            const result = gsap.set(targets, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
            complete(element)
            return result
          }

          // A sticky panel reveals as a unit, including its internally scrollable content.
          // A card and its caption enter together, even when the caption is below the fold.
          let inView = linkedPhotoCaption || !!element.closest('[data-text-in-view]') || element.getBoundingClientRect().top < window.innerHeight * 0.88
          // Keep the waiting state through ScrollTrigger refresh/startAt reverts.
          if (dependency) gsap.set(targets, from)
          const tween = gsap.fromTo(targets, from, {
            ...to,
            paused: !!dependency,
            delay: Number(element.dataset.textDelay) || 0,
            onStart: () => {
              element.dataset.textState = 'revealing'
              element.dispatchEvent(new Event(TEXT_REVEAL_START))
            },
            onComplete: () => { revealed = true; complete(element) },
            scrollTrigger: dependency || inView ? undefined : {
              trigger: element,
              start: 'clamp(top 88%)',
              once: true,
            },
          })
          if (dependency) {
            let trigger: ScrollTrigger | undefined
            const play = () => {
              const state = isPhoto ? dependency.dataset.photoState : dependency.dataset.textState
              if (inView && (state === 'complete' || (startTogether && state === 'revealing'))) {
                cancelGate()
                tween.play()
              }
            }
            cancelGate = () => {
              dependency.removeEventListener(event, play)
              if (startTogether) dependency.removeEventListener(startEvent, play)
              trigger?.kill()
            }
            dependency.addEventListener(event, play)
            if (startTogether) dependency.addEventListener(startEvent, play)
            if (!inView) trigger = ScrollTrigger.create({
              trigger: element,
              start: 'clamp(top 88%)',
              once: true,
              onEnter: () => { inView = true; play() },
            })
            play()
          }
          return tween
        }

        if (element.dataset.textReveal === 'lines' || element.dataset.textReveal === 'copy') {
          splits.push(SplitText.create(element, {
            type: 'lines',
            tag: 'span',
            linesClass: 'text-reveal-line',
            // Preserve authored non-breaking spaces in body-copy line measurement.
            reduceWhiteSpace: element.dataset.textReveal !== 'copy',
            autoSplit: true,
            aria: 'auto',
            onSplit: (split) => reveal(split.lines),
          }))
        } else {
          reveal([element])
        }
      }

      const refresh = requestAnimationFrame(() => ScrollTrigger.refresh())
      return () => {
        cancelAnimationFrame(refresh)
        gates.forEach((cancel) => cancel())
        splits.forEach((split) => split.revert())
      }
    }, scope.current)

    return () => {
      media.revert()
      elements.forEach((element) => { delete element.dataset.textState })
    }
  }, { scope, dependencies: [ready, enabled], revertOnUpdate: true })
}
