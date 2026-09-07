import type { RefObject } from 'react'
import { gsap, useGSAP } from './gsap'

// Original placeholder-react/src/lib/motion.ts and App.tsx timing.
const EASE = 'power2.inOut'
const PRIMARY_DURATION = 1.05
const SECONDARY_DURATION = 0.9
const DOT_DURATION = 0.18
const FADE_DURATION = 0.6
const ASSET_TIMEOUT = 6000
const FAIL_OPEN_TIMEOUT = 8000

function firstScreenReady(content: HTMLElement | null) {
  const images = Array.from(content?.querySelectorAll('img') ?? []).filter(image => {
    const rect = image.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
      rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth
  })

  return Promise.allSettled([
    document.fonts.ready,
    ...images.map(image => image.decode()),
  ])
}

export function usePreloader(
  root: RefObject<HTMLDivElement | null>,
  content: RefObject<HTMLDivElement | null>,
  onComplete: () => void,
) {
  useGSAP((_context, contextSafe) => {
    const loader = root.current
    if (!loader || !contextSafe) return

    const primary = loader.querySelectorAll<SVGPathElement>('.preloader__mark-line--primary')
    const secondary = loader.querySelectorAll<SVGPathElement>('.preloader__mark-line--secondary')
    const dot = loader.querySelectorAll<SVGPathElement>('.preloader__mark-dot')
    const html = document.documentElement
    const previousLoading = html.getAttribute('data-site-loading')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let finished = false
    let drawn = false
    let assetsReady = false
    let handoffStarted = false
    let drawing: gsap.core.Timeline | undefined
    let handoff: gsap.core.Tween | undefined
    let assetTimeout: number | undefined
    let failOpenTimeout: number | undefined

    html.setAttribute('data-site-loading', '')

    const restoreScroll = () => {
      if (previousLoading === null) html.removeAttribute('data-site-loading')
      else html.setAttribute('data-site-loading', previousLoading)
    }

    const finish = () => {
      if (disposed || finished) return
      finished = true
      window.clearTimeout(assetTimeout)
      window.clearTimeout(failOpenTimeout)
      // Leave this GSAP context before notifying the React entrance consumers.
      window.queueMicrotask(() => { if (!disposed) onComplete() })
    }

    const startHandoff = contextSafe(() => {
      if (disposed || finished || handoffStarted || !drawn || !assetsReady) return
      handoffStarted = true
      handoff = gsap.to(loader, {
        autoAlpha: 0,
        duration: FADE_DURATION,
        ease: EASE,
        onComplete: finish,
      })
    })

    const releaseAssets = () => {
      if (disposed || finished || assetsReady) return
      assetsReady = true
      window.clearTimeout(assetTimeout)
      startHandoff()
    }

    if (reduceMotion) {
      finish()
    } else {
      gsap.set([...primary, ...secondary], {
        autoAlpha: 1,
        strokeDasharray: (_index, path: SVGPathElement) => path.getTotalLength(),
        strokeDashoffset: (_index, path: SVGPathElement) => path.getTotalLength(),
      })
      gsap.set(dot, { autoAlpha: 0 })

      drawing = gsap.timeline({
        defaults: { ease: EASE },
        onComplete: () => { drawn = true; startHandoff() },
      })
        .to(primary, { strokeDashoffset: 0, duration: PRIMARY_DURATION })
        .to(secondary, { strokeDashoffset: 0, duration: SECONDARY_DURATION }, 0.18)
        .to(dot, { autoAlpha: 1, duration: DOT_DURATION, ease: 'power2.out' }, '>-0.1')

      assetTimeout = window.setTimeout(releaseAssets, ASSET_TIMEOUT)
      failOpenTimeout = window.setTimeout(finish, FAIL_OPEN_TIMEOUT)
      void firstScreenReady(content.current).then(releaseAssets)
    }

    return () => {
      disposed = true
      window.clearTimeout(assetTimeout)
      window.clearTimeout(failOpenTimeout)
      drawing?.kill()
      handoff?.kill()
      restoreScroll()
    }
  }, { scope: root, dependencies: [content, onComplete] })
}
