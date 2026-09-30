import { useId, useRef, useState } from 'react'
import { ArrowHover } from '../../motion/ArrowHover'
import { StringDivider } from '../../motion/StringDivider'
import { gsap, ScrollTrigger, useGSAP } from '../../motion/gsap'
import { siteUrl } from '../../navigation/paths'

type ProductQuestionProps = { title: string; answer?: string; last: boolean; defaultExpanded?: boolean }

export function ProductQuestion({ title, answer, last, defaultExpanded = false }: ProductQuestionProps) {
  const id = useId()
  const row = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const open = useRef(defaultExpanded)
  const toggle = useRef<(next: boolean) => void>(() => {})
  const [expanded, setExpanded] = useState(defaultExpanded)

  useGSAP(() => {
    const region = panel.current
    const copy = content.current
    if (!region || !copy || !answer) return

    const media = gsap.matchMedia()
    media.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      let disposed = false
      let frame = 0
      const settle = context.add('settleQuestion', () => {
        if (disposed) return
        gsap.set(region, { height: open.current ? 'auto' : 0, autoAlpha: open.current ? 1 : 0 })
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh() })
      })
      const timeline = context.conditions?.animate
        ? gsap.timeline({ paused: true, onComplete: () => settle(), onReverseComplete: () => settle() })
          .fromTo(region, { height: 0, autoAlpha: 0 }, {
            height: () => copy.offsetHeight,
            autoAlpha: 1,
            duration: 0.45,
            ease: 'power2.inOut',
            immediateRender: false,
          })
        : null

      if (open.current) timeline?.progress(1, true)
      gsap.set(region, { height: open.current ? 'auto' : 0, autoAlpha: open.current ? 1 : 0 })

      const change = context.add('toggleQuestion', (next: boolean) => {
        if (disposed) return
        open.current = next
        setExpanded(next)
        if (!timeline) {
          settle()
          return
        }
        if (!timeline.isActive()) {
          if (timeline.progress() === 1) {
            timeline.invalidate().progress(1, true)
          } else if (timeline.progress() === 0) {
            timeline.invalidate()
          }
        }
        if (next) timeline.play()
        else timeline.reverse()
      })
      toggle.current = (next) => change(next)

      const onResize = context.add('resizeQuestion', () => {
        if (open.current && !timeline?.isActive()) settle()
      })
      const resize = new ResizeObserver(() => onResize())
      resize.observe(copy)

      return () => {
        disposed = true
        cancelAnimationFrame(frame)
        resize.disconnect()
        timeline?.kill()
        toggle.current = () => {}
      }
    }, row.current!)

    return () => media.revert()
  }, { scope: row, dependencies: [answer], revertOnUpdate: true })

  return (
    <article className="product-question" ref={row}>
      <StringDivider />
      <div className="product-question-heading">
        <h3 id={`${id}-title`} data-text-reveal="block">{title}</h3>
        <button
          type="button"
          aria-disabled={!answer || undefined}
          data-text-reveal="block"
          aria-expanded={expanded}
          aria-controls={answer ? `${id}-answer` : undefined}
          aria-label={`${expanded ? 'Свернуть' : 'Открыть'}: ${title}`}
          onClick={answer ? () => toggle.current(!open.current) : undefined}
        >
          <span className="product-question-action">{expanded ? 'Свернуть' : 'Открыть'}</span>
          <ArrowHover src={siteUrl('assets/product/chevron-right.svg')} className="product-question-arrow" />
        </button>
      </div>
      {answer && (
        <div
          className="product-question-panel"
          ref={panel}
          id={`${id}-answer`}
          role="region"
          aria-labelledby={`${id}-title`}
          aria-hidden={!expanded}
          inert={!expanded}
        >
          <div className="product-question-content" ref={content}>
            <p>{answer}</p>
          </div>
        </div>
      )}
      {last && <StringDivider className="product-question-divider-bottom" />}
    </article>
  )
}
