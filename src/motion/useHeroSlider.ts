import { useCallback, useRef, useState, type RefObject } from 'react'
import { gsap, SplitText, useGSAP } from './gsap'
import { useSiteReady } from './SiteIntro'
import { createTextRevealVars, TEXT_EXIT_MOTION, TEXT_REVEAL_CLEAR_PROPS } from './textReveal'
import { HERO_PHOTO_DURATION, HERO_PHOTO_EASE, HERO_PHOTO_ORIGIN, HERO_PHOTO_SCALE } from './useHeroIntro'

const SLIDE_DURATION = 6
const noop = () => {}

export function useHeroSlider(
  root: RefObject<HTMLElement | null>,
  ready: boolean,
  count: number,
) {
  const siteReady = useSiteReady()
  const [activeIndex, setActiveIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [paused, setPaused] = useState(true)
  const [autoplayEnabled, setAutoplayEnabled] = useState(true)
  const manualPause = useRef(false)
  const controls = useRef({ next: noop, previous: noop, togglePause: noop })

  useGSAP((_context, contextSafe) => {
    const section = root.current
    if (!section || !contextSafe) return

    const photos = Array.from(section.querySelectorAll<HTMLImageElement>('.hero__photo'))
    const captions = Array.from(section.querySelectorAll<HTMLElement>('.hero__caption'))
    const captionText = captions.map((caption) =>
      Array.from(caption.querySelectorAll<HTMLElement>('[data-text-reveal]')))
    const chrome = Array.from(section.querySelectorAll<HTMLElement>('.hero__detail, .hero__slider > button'))
    const progress = section.querySelector<HTMLElement>('.hero__progress')
    const total = Math.min(count, photos.length, captions.length)
    if (!progress || !total) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const bounds = section.getBoundingClientRect()
    let inView = bounds.bottom > 0 && bounds.top < window.innerHeight
    let reducedMotion = motionPreference.matches
    let index = 0
    let changing = false
    let disposed = false
    let timer: gsap.core.Tween | null = null
    let fade: gsap.core.Timeline | null = null
    let intro: gsap.core.Timeline | null = null
    let splits: SplitText[] = []

    const revertSplits = () => {
      splits.forEach((split) => split.revert())
      splits = []
    }

    const revealCaption = (timeline: gsap.core.Timeline, slideIndex: number, position: number) => {
      captionText[slideIndex].forEach((element, elementIndex) => {
        const bodyCopy = element.dataset.textReveal === 'copy'
        const { from, to } = createTextRevealVars({ bodyCopy })
        const start = position + elementIndex * to.stagger.each
        if (bodyCopy) {
          splits.push(SplitText.create(element, {
            type: 'lines',
            tag: 'span',
            linesClass: 'text-reveal-line',
            reduceWhiteSpace: false,
            autoSplit: true,
            aria: 'auto',
            onSplit: contextSafe((split: SplitText) => {
              // Resize replacements stay at the same place in the entrance timeline.
              const tween = gsap.fromTo(split.lines, from, to)
              timeline.add(tween, start)
              return tween
            }),
          }))
        } else {
          timeline.fromTo(element, from, to, start)
        }
      })
    }

    const clearCaptionText = () => {
      gsap.set(captionText.flat(), { clearProps: TEXT_REVEAL_CLEAR_PROPS })
      if (!siteReady || !ready) gsap.set(captionText.flat(), { autoAlpha: 0 })
    }

    const clearChrome = () => {
      gsap.set(chrome, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
      if (!siteReady || !ready) gsap.set(chrome, { autoAlpha: 0 })
    }

    const settleSlide = () => {
      photos.forEach((photo, slideIndex) => {
        gsap.set(photo, { autoAlpha: slideIndex === index ? 1 : 0, zIndex: 0 })
        // The initial photo transform belongs to useHeroIntro until it finishes.
        if (ready) gsap.set(photo, { clearProps: 'transform,transformOrigin,willChange' })
      })
      captions.forEach((caption, slideIndex) => {
        gsap.set(caption, { autoAlpha: slideIndex === index ? 1 : 0 })
      })
    }

    const syncPause = () => {
      if (disposed) return
      const shouldPause = !siteReady || !ready || changing || total < 2 || reducedMotion
        || manualPause.current || document.hidden || !inView
      setPaused(shouldPause)
      if (shouldPause) timer?.pause()
      else timer?.resume()
    }

    const resetTimer = () => {
      timer?.kill()
      timer = null
      gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' })
      if (siteReady && ready && total > 1 && !reducedMotion) {
        timer = gsap.to(progress, {
          scaleX: 1,
          duration: SLIDE_DURATION,
          ease: 'none',
          paused: true,
          onComplete: contextSafe(() => changeSlide(index + 1)),
        })
      }
      syncPause()
    }

    const finishTransition = contextSafe(() => {
      if (disposed) return
      revertSplits()
      settleSlide()
      clearCaptionText()
      fade = null
      changing = false
      setTransitioning(false)
      resetTimer()
    })

    function changeSlide(requestedIndex: number) {
      if (disposed || !siteReady || !ready || changing || total < 2) return
      const nextIndex = (requestedIndex + total) % total
      const nextPhoto = photos[nextIndex]

      // Keep the current artwork until the replacement has actually loaded.
      if (!nextPhoto.complete || !nextPhoto.naturalWidth) {
        resetTimer()
        return
      }

      timer?.kill()
      timer = null
      gsap.set(progress, { scaleX: 0 })
      const previousIndex = index
      index = nextIndex
      setActiveIndex(index)

      if (reducedMotion) {
        settleSlide()
        clearCaptionText()
        resetTimer()
        return
      }

      changing = true
      setTransitioning(true)
      // The outgoing photo stays opaque underneath the incoming photo.
      gsap.set(photos[previousIndex], { autoAlpha: 1, zIndex: 0 })
      gsap.set(nextPhoto, {
        autoAlpha: 0,
        zIndex: 1,
        scale: HERO_PHOTO_SCALE,
        transformOrigin: HERO_PHOTO_ORIGIN,
        willChange: 'opacity,transform',
      })
      gsap.set(captions[nextIndex], { autoAlpha: 0 })

      fade = gsap.timeline({ onComplete: finishTransition })
        .to(nextPhoto, {
          autoAlpha: 1,
          scale: 1,
          duration: HERO_PHOTO_DURATION,
          ease: HERO_PHOTO_EASE,
        }, 0)
        .to(captions[previousIndex], {
          autoAlpha: 0,
          ...TEXT_EXIT_MOTION,
        }, 0)
        .set(captions[nextIndex], { autoAlpha: 1 }, TEXT_EXIT_MOTION.duration)
      revealCaption(fade, nextIndex, TEXT_EXIT_MOTION.duration)
    }

    const onVisibilityChange = contextSafe(syncPause)
    const onIntersection = contextSafe((entries: IntersectionObserverEntry[]) => {
      inView = entries[0].isIntersecting
      syncPause()
    })
    const onMotionChange = contextSafe(() => {
      if (disposed) return
      reducedMotion = motionPreference.matches
      setAutoplayEnabled(!reducedMotion)
      intro?.kill()
      intro = null
      fade?.kill()
      fade = null
      revertSplits()
      changing = false
      setTransitioning(false)
      settleSlide()
      clearCaptionText()
      clearChrome()
      resetTimer()
    })

    controls.current = {
      next: contextSafe(() => changeSlide(index + 1)),
      previous: contextSafe(() => changeSlide(index - 1)),
      togglePause: contextSafe(() => {
        if (disposed || reducedMotion) return
        manualPause.current = !manualPause.current
        syncPause()
      }),
    }

    settleSlide()
    clearCaptionText()
    clearChrome()
    if (siteReady && ready && !reducedMotion) {
      changing = true
      const { from, to } = createTextRevealVars()
      intro = gsap.timeline({
        onComplete: contextSafe(() => {
          if (disposed) return
          revertSplits()
          intro = null
          changing = false
          setTransitioning(false)
          syncPause()
        }),
      })
      revealCaption(intro, index, 0)
      intro.fromTo(chrome, from, to, captionText[index].length * to.stagger.each)
    }
    setAutoplayEnabled(!reducedMotion)
    setActiveIndex(0)
    setTransitioning(changing)
    resetTimer()

    const observer = new IntersectionObserver(onIntersection, { threshold: 0 })
    observer.observe(section)
    document.addEventListener('visibilitychange', onVisibilityChange)
    motionPreference.addEventListener('change', onMotionChange)

    return () => {
      disposed = true
      controls.current = { next: noop, previous: noop, togglePause: noop }
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      motionPreference.removeEventListener('change', onMotionChange)
      timer?.kill()
      fade?.kill()
      intro?.kill()
      revertSplits()
    }
  }, { scope: root, dependencies: [siteReady, ready, count], revertOnUpdate: true })

  const next = useCallback(() => controls.current.next(), [])
  const previous = useCallback(() => controls.current.previous(), [])
  const togglePause = useCallback(() => controls.current.togglePause(), [])

  return { activeIndex, transitioning, paused, autoplayEnabled, next, previous, togglePause }
}
