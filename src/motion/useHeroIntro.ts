import { useRef, useState, type RefObject } from 'react'
import { gsap, useGSAP } from './gsap'
import { useSiteReady } from './SiteIntro'
import { PHOTO_REVEAL_START, PHOTO_REVEAL_COMPLETE, waitForPhoto } from './photoReveal'

// Mask-free artwork entrance from placeholder-react/CursorReveal.
export const HERO_PHOTO_DURATION = 1.8
export const HERO_PHOTO_EASE = 'power4.inOut'
export const HERO_PHOTO_SCALE = 1.025
export const HERO_PHOTO_ORIGIN = '50% 42%'

export function useHeroIntro(
  media: RefObject<HTMLDivElement | null>,
  selector = '.hero__photo',
  backdrop?: RefObject<HTMLElement | null>,
) {
  const ready = useSiteReady()
  const [complete, setComplete] = useState(false)
  const hasPlayed = useRef(false)

  useGSAP(() => {
    const layer = media.current
    const photo = layer?.querySelector<HTMLImageElement>(selector)
    if (!layer || !photo) return
    const fadeLayers = backdrop?.current ? [layer, backdrop.current] : [layer]

    photo.dataset.photoState = hasPlayed.current ? 'complete' : 'pending'
    if (!ready) {
      gsap.set(fadeLayers, { autoAlpha: 0 })
      return
    }

    let disposed = false
    const finish = () => queueMicrotask(() => {
      if (disposed) return
      hasPlayed.current = true
      photo.dataset.photoState = 'complete'
      photo.dispatchEvent(new Event(PHOTO_REVEAL_COMPLETE))
      setComplete(true)
    })
    const motion = gsap.matchMedia()
    motion.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      if (hasPlayed.current) return
      if (context.conditions?.reduce) {
        finish()
        return
      }

      const abort = new AbortController()
      gsap.set(fadeLayers, { autoAlpha: 0 })
      const play = context.add('playHeroPhoto', () => {
        if (disposed || abort.signal.aborted) return
        photo.dataset.photoState = 'revealing'
        photo.dispatchEvent(new Event(PHOTO_REVEAL_START))
        gsap.timeline({
          defaults: { duration: HERO_PHOTO_DURATION, ease: HERO_PHOTO_EASE },
          onComplete: finish,
        })
          .fromTo(fadeLayers,
            { autoAlpha: 0, willChange: 'opacity' },
            { autoAlpha: 1, clearProps: 'opacity,visibility,willChange' },
            0,
          )
          .fromTo(photo,
            { scale: HERO_PHOTO_SCALE, transformOrigin: HERO_PHOTO_ORIGIN, willChange: 'transform' },
            { scale: 1, clearProps: 'transform,transformOrigin,willChange' },
            0,
          )
      })
      // Keep the first entrance intact if the loader's asset timeout expires first.
      void waitForPhoto(photo, abort.signal).then(() => play())
      return () => abort.abort()
    })

    return () => {
      disposed = true
      motion.revert()
      delete photo.dataset.photoState
    }
  }, { scope: media, dependencies: [ready, selector, backdrop], revertOnUpdate: true })

  return complete
}
