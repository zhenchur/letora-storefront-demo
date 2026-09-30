import { useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap'
import { useSiteReady } from '../../motion/SiteIntro'
import { PHOTO_REVEAL_DURATION, PHOTO_REVEAL_EASE, setPhotoMask, waitForPhoto } from '../../motion/photoReveal'

type PhotoState = {
  frame: HTMLElement
  mask: HTMLElement
  layer: HTMLElement
  image: HTMLImageElement
  progress: number
  width: number
  height: number
  requested: boolean
  decoded: boolean
  reveal?: gsap.core.Tween
  trigger?: ScrollTrigger
}

export function useProductV3GalleryMotion(scope: RefObject<HTMLElement | null>) {
  const ready = useSiteReady()
  const shown = useRef(new WeakSet<HTMLElement>())

  useGSAP(() => {
    if (!scope.current) return
    const photos = Array.from(scope.current.querySelectorAll<HTMLElement>('[data-product-v3-photo]')).flatMap((frame) => {
      const layer = frame.querySelector<HTMLElement>('.product-v3__photo-parallax')
      const mask = frame.querySelector<HTMLElement>('.product-v3__photo-mask')
      const image = layer?.querySelector<HTMLImageElement>('img')
      return layer && mask && image ? [{ frame, mask, layer, image }] : []
    })
    const complete = ({ frame, mask }: { frame: HTMLElement; mask: HTMLElement }) => {
      shown.current.add(frame)
      frame.dataset.photoState = 'complete'
      gsap.set(mask, { clearProps: 'clipPath,willChange' })
    }

    for (const photo of photos) {
      const { frame, mask } = photo
      if (shown.current.has(frame)) complete(photo)
      else {
        frame.dataset.photoState = 'pending'
        gsap.set(mask, { clipPath: 'inset(50%)' })
      }
    }

    const media = gsap.matchMedia()
    if (ready) {
      media.add({
        animate: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
      }, (context) => {
        if (context.conditions?.reduce) {
          photos.forEach(complete)
          return
        }

        let disposed = false
        const abort = new AbortController()
        const states: PhotoState[] = photos.map((photo) => ({
          ...photo,
          progress: 0,
          width: photo.frame.clientWidth,
          height: photo.frame.clientHeight,
          requested: false,
          decoded: false,
        }))
        const byFrame = new Map(states.map((state) => [state.frame, state]))
        const resize = new ResizeObserver((entries) => {
          if (disposed) return
          for (const entry of entries) {
            const state = byFrame.get(entry.target as HTMLElement)
            if (!state || shown.current.has(state.frame)) continue
            state.width = entry.contentRect.width
            state.height = entry.contentRect.height
            setPhotoMask(state.mask, state.width, state.height, state.progress)
          }
        })
        const finish = context.add('finishGalleryPhoto', (state: PhotoState) => {
          if (disposed) return
          state.reveal?.kill()
          state.trigger?.kill()
          resize.unobserve(state.frame)
          complete(state)
        })
        const reveal = context.add('revealGalleryPhoto', (state: PhotoState) => {
          if (disposed || shown.current.has(state.frame) || state.reveal) return
          const bounds = state.frame.getBoundingClientRect()
          if (bounds.bottom <= 0) {
            finish(state)
            return
          }
          // Decoding may finish after a reverse scroll has moved the frame below view.
          if (bounds.top >= window.innerHeight) return
          state.frame.dataset.photoState = 'revealing'
          gsap.set(state.mask, { willChange: 'clip-path' })
          state.reveal = gsap.to(state, {
            progress: 1,
            duration: PHOTO_REVEAL_DURATION,
            ease: PHOTO_REVEAL_EASE,
            onUpdate: () => setPhotoMask(state.mask, state.width, state.height, state.progress),
            onComplete: () => finish(state),
          })
        })
        const enter = (state: PhotoState) => {
          if (disposed || shown.current.has(state.frame) || state.reveal) return
          if (state.decoded) {
            reveal(state)
            return
          }
          if (state.requested) return
          state.requested = true
          // A fully clipped lazy image may otherwise wait for the mask to open.
          state.image.loading = 'eager'
          void waitForPhoto(state.image, abort.signal).then(() => {
            if (disposed || abort.signal.aborted) return
            state.decoded = true
            reveal(state)
          })
        }

        for (const state of states) {
          // The stable frame measures scroll; only its inner layer moves.
          gsap.fromTo(state.layer,
            { yPercent: -15 },
            {
              yPercent: 15,
              ease: 'none',
              scrollTrigger: {
                trigger: state.frame,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          )

          if (shown.current.has(state.frame) || state.frame.getBoundingClientRect().bottom <= 0) {
            finish(state)
            continue
          }
          setPhotoMask(state.mask, state.width, state.height, state.progress)
          resize.observe(state.frame)
          state.trigger = ScrollTrigger.create({
            trigger: state.frame,
            start: 'clamp(top bottom)',
            end: 'bottom top',
            onEnter: () => enter(state),
            onEnterBack: () => enter(state),
            onLeave: () => finish(state),
            onRefresh: () => {
              const bounds = state.frame.getBoundingClientRect()
              if (bounds.bottom <= 0) finish(state)
              else if (bounds.top < window.innerHeight) enter(state)
            },
          })
          // Initial refresh may complete an already-passed frame before assignment.
          if (shown.current.has(state.frame)) state.trigger.kill()
          else if (state.frame.getBoundingClientRect().top < window.innerHeight) enter(state)
        }

        const refresh = requestAnimationFrame(() => ScrollTrigger.refresh())
        return () => {
          disposed = true
          abort.abort()
          cancelAnimationFrame(refresh)
          resize.disconnect()
        }
      }, scope.current)
    }

    return () => {
      media.revert()
      photos.forEach(({ frame }) => { delete frame.dataset.photoState })
    }
  }, { scope, dependencies: [ready], revertOnUpdate: true })
}
