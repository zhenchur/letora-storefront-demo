import { useId, useRef } from 'react'
import artwork from '../../assets/home/brand-signature.svg?raw'
import { gsap, useGSAP } from '../../motion/gsap'
import { useSiteReady } from '../../motion/SiteIntro'

// Centerline masks reveal the original filled artwork without changing its weight.
const strokes = [
  { id: 'Vector 3254', trace: 'M2.42 34.10 C3.15 33.87 4.12 33.16 4.42 32.61 C4.95 31.35 2.73 32.09 1.53 33.50 C0.31 34.94 0.63 36.40 1.90 37.08 C2.82 37.72 4.07 37.75 5.21 37.53 C9.30 36.65 12.89 34.40 16.37 32.14 C28.65 23.46 39.35 12.78 51.06 3.37 C52.35 2.37 54.77 0.72 55.33 1.02 C56.22 1.37 53.94 4.24 53.28 4.99 C49.88 9.23 46.30 13.37 43.06 17.74 C40.79 20.77 38.60 23.87 36.85 27.22 C35.60 29.70 34.66 32.12 34.80 33.82 C34.70 35.98 35.84 37.35 37.59 37.58 C39.32 37.95 41.23 37.64 43.12 37.26 C49.35 35.84 55.34 33.57 61.21 31.11 C63.54 30.08 65.96 29.11 68.06 27.71', width: 3.6 },
  { id: 'Vector 3255', trace: 'M68.15 27.67 C65.33 31.01 62.30 34.59 59.28 38.03 C60.65 36.55 61.78 34.94 63.64 33.59 C64.96 32.87 66.74 32.92 67.92 33.70 C70.04 34.85 72.52 33.95 73.88 31.91', width: 3.4 },
  { id: 'Vector 3256', trace: 'M78.02 30.07 C77.45 29.99 76.55 30.29 75.62 30.73 C74.53 31.27 73.57 31.95 72.87 32.78 C71.81 34.06 71.10 35.43 71.04 36.48 C70.95 37.48 71.66 37.94 72.74 37.94 C75.35 37.80 77.62 36.18 79.41 34.38 C80.28 33.43 81.35 31.86 81.46 30.66 C81.65 28.14 77.63 28.75 77.70 31.48 C77.59 33.30 79.08 33.92 80.90 34.22 C85.03 34.58 89.12 33.49 93.09 32.48 L95.53 31.79', width: 3.4 },
  { id: 'Vector 3257', trace: 'M99.74 32.28 C99.89 31.89 100.02 31.54 99.98 31.20 C99.97 30.64 99.61 30.20 98.75 30.20 C97.27 30.19 95.79 31.41 94.83 32.67 C94.15 33.50 93.59 34.42 93.23 35.42 C92.94 36.23 92.76 37.03 93.46 37.63 C93.76 37.90 94.26 38.01 94.86 37.85 C97.18 37.15 98.98 35.38 100.54 33.55 C101.59 32.25 102.54 30.78 102.77 29.13 C103.23 26.20 102.54 23.35 102.74 20.33 C102.85 19.27 103.17 18.25 103.82 17.50 C104.40 16.78 105.15 16.20 105.92 15.71 C110.07 13.26 114.94 12.42 119.68 11.84 C120.65 11.73 121.63 11.64 122.61 11.57', width: 2.4 },
  { id: 'Vector 3258', trace: 'M98.94 34.92 C99.25 35.31 99.67 35.49 100.08 35.51 C100.48 35.61 100.89 35.66 101.21 35.68 C108.67 35.58 116.04 33.22 122.49 29.51 C122.86 29.28 123.23 29.03 123.57 28.77', width: 2.1 },
  { id: 'Vector 3259', trace: 'M124.44 27.92 C123.26 29.07 122.13 30.27 121.05 31.51 C120.09 32.64 119.15 33.80 118.42 35.10 C118.17 35.55 117.94 36.03 117.86 36.50 C117.73 37.21 118.02 37.57 118.56 37.65 C119.56 37.92 120.44 37.44 121.48 37.05 C125.83 35.17 129.76 32.49 133.60 29.75 L135.75 28.13 C134.69 29.05 133.69 30.09 132.71 31.13 C131.65 32.37 130.65 33.70 130.01 35.21 C129.70 35.96 129.46 36.80 129.63 37.60 C129.79 38.40 130.55 38.96 131.34 39.19 C133.88 39.79 136.47 39.10 138.96 38.52 C144.59 37.04 150.02 34.87 155.33 32.52 C161.39 30.16 167.59 27.63 174.15 27.38 C175.04 27.41 175.94 27.49 176.82 27.69 C178.39 28.03 180.15 28.80 180.65 30.44', width: 2.4 },
]

// Keep the source SVG as the single source of the final letter shapes and color.
const shapes = new Map(Array.from(
  artwork.matchAll(/<path id="([^"]+)" d="([^"]+)" fill="([^"]+)"/g),
  ([, id, d, fill]) => [id, { d, fill }] as const,
))

export function BrandSignature() {
  const root = useRef<SVGSVGElement>(null)
  const shown = useRef(false)
  const maskId = useId()
  const ready = useSiteReady()

  useGSAP(() => {
    if (!root.current) return
    if (!ready) {
      gsap.set(root.current, { autoAlpha: 0 })
      return
    }

    const paths = Array.from(root.current.querySelectorAll<SVGPathElement>('mask path'))
    const letters = root.current.querySelectorAll('[data-signature-ink]')
    const media = gsap.matchMedia()
    media.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const complete = context.add('completeSignature', () => {
        shown.current = true
        gsap.set(letters, { attr: { mask: 'none' } })
        gsap.set(paths, { clearProps: 'strokeDasharray,strokeDashoffset' })
      })
      if (context.conditions?.reduce || shown.current || root.current!.getBoundingClientRect().bottom <= 0) {
        complete()
        return
      }

      const lengths = paths.map((path) => Math.ceil(path.getTotalLength()) + 4)
      const total = lengths.reduce((sum, length) => sum + length, 0)
      gsap.set(paths, {
        strokeDasharray: (index) => `${lengths[index]} ${lengths[index]}`,
        strokeDashoffset: (index) => lengths[index],
      })
      const setters = paths.map((path) => gsap.quickSetter(path, 'strokeDashoffset'))
      const pen = { distance: 0 }
      const inView = root.current!.getBoundingClientRect().top < window.innerHeight * 0.88

      gsap.to(pen, {
        distance: total,
        // The source demo's line-drawing timing, shared across all pen strokes.
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          let start = 0
          lengths.forEach((length, index) => {
            setters[index](Math.max(0, Math.min(length, length - (pen.distance - start))))
            start += length
          })
        },
        onComplete: () => complete(),
        scrollTrigger: inView ? undefined : {
          trigger: root.current,
          start: 'clamp(top 88%)',
          once: true,
        },
      })
    }, root.current)

    return () => media.revert()
  }, { scope: root, dependencies: [ready], revertOnUpdate: true })

  return (
    <svg ref={root} className="brand-intro__signature" width={181.172} height={40.2762}
      viewBox="0 0 181.172 40.2762" role="img" aria-label="Люби">
      <defs>
        {strokes.map(({ id, trace, width }, index) => (
          <mask key={id} id={`${maskId}-${index}`} maskUnits="userSpaceOnUse"
            x="-4" y="-4" width="190" height="49" style={{ maskType: 'luminance' }}>
            <path d={trace} fill="none" stroke="white" strokeWidth={width}
              strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        ))}
      </defs>
      {strokes.map(({ id }, index) => (
        <path key={id} {...shapes.get(id)} data-signature-ink mask={`url(#${maskId}-${index})`} />
      ))}
    </svg>
  )
}
