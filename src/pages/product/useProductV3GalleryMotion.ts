import { type RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap'
import { useSiteReady } from '../../motion/SiteIntro'

export function useProductV3GalleryMotion(scope: RefObject<HTMLElement | null>) {
  const ready = useSiteReady()

  useGSAP(() => {
    if (!scope.current || !ready) return
    const photos = scope.current.querySelectorAll<HTMLElement>('[data-product-v3-photo]')
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', () => {
      for (const frame of photos) {
        const layer = frame.querySelector<HTMLElement>('.product-v3__photo-parallax')
        if (!layer) continue

        // Photos stay visible; the stable frame measures only the inner parallax.
        gsap.fromTo(layer,
          { yPercent: -15 },
          {
            yPercent: 15,
            ease: 'none',
            scrollTrigger: {
              trigger: frame,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
      }

      const refresh = requestAnimationFrame(() => ScrollTrigger.refresh())
      return () => cancelAnimationFrame(refresh)
    }, scope.current)

    return () => media.revert()
  }, { scope, dependencies: [ready], revertOnUpdate: true })
}
