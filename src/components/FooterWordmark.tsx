import { useId, useRef } from 'react'
import wordmark from '../assets/home/footer-wordmark.svg'
import wordmarkSource from '../assets/home/footer-wordmark.svg?raw'
import { gsap, ScrollTrigger, useGSAP } from '../motion/gsap'
import { useSiteReady } from '../motion/SiteIntro'
import { createTextRevealVars, TEXT_REVEAL_CLEAR_PROPS } from '../motion/textReveal'

// Preserve every original contour, including the counter inside Р.
const [bar, outline] = Array.from(wordmarkSource.matchAll(/\sd="([^"]+)"/g), (match) => match[1])
const [o, le, a, t, r, counter] = outline.match(/M[^M]+/g)!
const letters = [le, le, t, o, r + counter, a + bar]
const join = 335.284

type FooterWordmarkProps = {
  motion: boolean
  src?: string
  fill?: string
}

export function FooterWordmark({ motion, src = wordmark, fill = '#8CA0B4' }: FooterWordmarkProps) {
  const root = useRef<HTMLDivElement>(null)
  const shown = useRef(false)
  const clipId = useId().replace(/:/g, '')
  const ready = useSiteReady()

  useGSAP(() => {
    const element = root.current
    if (!element || !motion) return
    const original = element.querySelector('img')!
    const layer = element.querySelector('.footer-wordmark-letters')!
    const glyphs = Array.from(element.querySelectorAll('.footer-wordmark-letter'))
    const media = gsap.matchMedia()

    media.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const finish = context.add('finishWordmark', () => {
        shown.current = true
        gsap.set(original, { clearProps: 'visibility' })
        gsap.set(layer, { clearProps: 'visibility' })
        gsap.set(glyphs, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
      })
      if (context.conditions?.reduce || shown.current) {
        finish()
        return
      }

      gsap.set(original, { visibility: 'hidden' })
      if (!ready) return
      const bounds = element.getBoundingClientRect()
      if (bounds.bottom <= 0) {
        finish()
        return
      }

      const { from, to } = createTextRevealVars()
      gsap.set(layer, { visibility: 'visible' })
      gsap.fromTo(glyphs, from, {
        ...to,
        onComplete: () => finish(),
        scrollTrigger: bounds.top < window.innerHeight * 0.88 ? undefined : {
          trigger: element,
          start: 'clamp(top 88%)',
          once: true,
        },
      })
      const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
      return () => cancelAnimationFrame(frame)
    }, element)

    return () => media.revert()
  }, { scope: root, dependencies: [motion, ready, src], revertOnUpdate: true })

  return (
    <div className="site-footer__wordmark" ref={root} role="img" aria-label="Летора">
      <img src={src} width={1851.344} height={391} alt="" aria-hidden="true" />
      {motion && (
        <span className="footer-wordmark-letters" aria-hidden="true">
          {letters.map((path, index) => (
            <span className="footer-wordmark-letter" key={index}>
              <svg viewBox="0 0 1851.34 391" preserveAspectRatio="none" fill={fill} focusable="false">
                {index < 2 && (
                  <defs>
                    <clipPath id={`${clipId}-${index}`} clipPathUnits="userSpaceOnUse">
                      <rect x={index ? join : 0} y="0" width={index ? 1851.34 - join : join} height="391" />
                    </clipPath>
                  </defs>
                )}
                <path d={path} clipPath={index < 2 ? `url(#${clipId}-${index})` : undefined} />
              </svg>
            </span>
          ))}
        </span>
      )}
    </div>
  )
}
