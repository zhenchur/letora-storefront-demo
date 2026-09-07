import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../motion/gsap'
import { useSiteReady } from '../../motion/SiteIntro'

export function useProductStack(scope: RefObject<HTMLElement | null>) {
  const ready = useSiteReady()

  useGSAP(() => {
    const gallery = scope.current?.querySelector<HTMLElement>('.product-photos')
    if (!ready || !gallery) return

    const photos = Array.from(gallery.querySelectorAll<HTMLElement>('.product-photo'))
    if (photos.length < 2) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gallery.dataset.stack = 'active'

      photos.slice(0, -1).forEach((photo, index) => {
        const frame = photo.querySelector<HTMLElement>('.product-photo-frame')!
        // Read the normal gallery flow, never the moving/sticky photo bounds.
        // This keeps refresh, resize and restored scroll deterministic.
        const nextTop = () => {
          const height = photo.offsetHeight
          const gap = parseFloat(getComputedStyle(gallery).rowGap) || 0
          const top = parseFloat(getComputedStyle(photo).top) || 0
          return gallery.getBoundingClientRect().top + window.scrollY
            + (index + 1) * (height + gap) - top
        }

        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: `product-stack-${index}`,
            trigger: gallery,
            start: () => nextTop() - photo.offsetHeight,
            end: nextTop,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
          .to(frame, { scale: 0.92, autoAlpha: 0.5, duration: 0.7 })
          .to(frame, { scale: 0.9, autoAlpha: 0, duration: 0.3 })
      })

      return () => { delete gallery.dataset.stack }
    }, gallery)

    return () => media.revert()
  }, { scope, dependencies: [ready], revertOnUpdate: true })
}
