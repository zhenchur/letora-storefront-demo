import { useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { useSiteReady } from './SiteIntro'
import { PHOTO_REVEAL_START, PHOTO_REVEAL_COMPLETE, PHOTO_REVEAL_DURATION, PHOTO_REVEAL_EASE, setPhotoMask, waitForPhoto } from './photoReveal'

export function usePhotoReveal(scope: RefObject<HTMLElement | null>, enabled = true) {
  const ready = useSiteReady()
  const shown = useRef(new WeakSet<HTMLImageElement>())

  useGSAP(() => {
    if (!scope.current) return
    const images = Array.from(scope.current.querySelectorAll<HTMLImageElement>('img[data-photo-reveal]'))
    const complete = (image: HTMLImageElement) => {
      shown.current.add(image)
      image.dataset.photoState = 'complete'
      gsap.set(image, { clearProps: 'clipPath,willChange' })
      image.dispatchEvent(new Event(PHOTO_REVEAL_COMPLETE))
    }

    for (const image of images) {
      if (!enabled || shown.current.has(image)) complete(image)
      else {
        image.dataset.photoState = 'pending'
        gsap.set(image, { clipPath: 'inset(50%)' })
      }
    }

    const media = gsap.matchMedia()
    if (enabled && ready) {
      media.add({
        animate: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
      }, (context) => {
        if (context.conditions?.reduce) {
          images.forEach(complete)
          return
        }

        let disposed = false
        const abort = new AbortController()
        const states = new Map(images.map((image) => [image, {
          progress: 0,
          width: image.clientWidth,
          height: image.clientHeight,
          started: false,
        }]))
        const resize = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const image = entry.target as HTMLImageElement
            const state = states.get(image)
            if (!state || shown.current.has(image)) continue
            state.width = entry.contentRect.width
            state.height = entry.contentRect.height
            setPhotoMask(image, state.width, state.height, state.progress)
          }
        })
        const play = context.add('playPhoto', (image: HTMLImageElement) => {
          if (disposed || shown.current.has(image)) return
          const state = states.get(image)!
          gsap.set(image, { willChange: 'clip-path' })
          const finish = context.add('finishPhoto', () => {
            resize.unobserve(image)
            complete(image)
          })
          gsap.to(state, {
            progress: 1,
            duration: PHOTO_REVEAL_DURATION,
            ease: PHOTO_REVEAL_EASE,
            onStart: () => {
              image.dataset.photoState = 'revealing'
              image.dispatchEvent(new Event(PHOTO_REVEAL_START))
            },
            onUpdate: () => setPhotoMask(image, state.width, state.height, state.progress),
            onComplete: () => finish(),
          })
        })
        const enter = (image: HTMLImageElement) => {
          const state = states.get(image)!
          if (state.started || shown.current.has(image)) return
          state.started = true
          // A fully clipped lazy image may never load until its mask opens.
          image.loading = 'eager'
          void waitForPhoto(image, abort.signal).then(() => {
            if (!disposed) play(image)
          })
        }
        for (const image of images) {
          if (shown.current.has(image)) {
            complete(image)
            continue
          }
          const bounds = image.getBoundingClientRect()
          // A restored scroll can already be past an image while its caption is visible.
          if (bounds.bottom <= 0) {
            complete(image)
            continue
          }
          resize.observe(image)
          if (bounds.top < window.innerHeight) enter(image)
          else ScrollTrigger.create({
            trigger: image,
            start: 'clamp(top bottom)',
            once: true,
            onEnter: () => enter(image),
          })
        }

        return () => {
          disposed = true
          abort.abort()
          resize.disconnect()
        }
      }, scope.current)
    }

    return () => {
      media.revert()
      images.forEach((image) => { delete image.dataset.photoState })
    }
  }, { scope, dependencies: [ready, enabled], revertOnUpdate: true })
}
