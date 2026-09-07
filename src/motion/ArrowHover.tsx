import { useRef } from 'react'
import { gsap, useGSAP } from './gsap'
import './ArrowHover.css'

type ArrowHoverProps = {
  src: string
  className?: string
  direction?: 'right' | 'left'
  width?: number
  height?: number
}

export function ArrowHover({ src, className, direction = 'right', width = 16, height = 16 }: ArrowHoverProps) {
  const arrow = useRef<HTMLSpanElement>(null)
  const track = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const element = arrow.current
    const visual = track.current
    if (!element || !visual) return

    const trigger = element.closest<HTMLElement>('[data-arrow-trigger]')
      ?? element.closest<HTMLElement>('button, a')
      ?? element
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', (context) => {
      const play = context.add('playArrow', () => {
        if (element.closest('[inert]') || (trigger instanceof HTMLButtonElement && trigger.disabled)) return
        gsap.killTweensOf(visual)
        gsap.fromTo(visual, {
          xPercent: 0,
          willChange: 'transform',
        }, {
          xPercent: direction === 'left' ? -100 : 100,
          duration: 0.6,
          ease: 'quart.out',
          overwrite: true,
          clearProps: 'transform,willChange',
        })
      })

      const onPointerEnter = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') play()
      }
      const onFocus = () => {
        if (trigger.matches(':focus-visible')) play()
      }

      trigger.addEventListener('pointerenter', onPointerEnter)
      trigger.addEventListener('focus', onFocus)

      return () => {
        trigger.removeEventListener('pointerenter', onPointerEnter)
        trigger.removeEventListener('focus', onFocus)
        gsap.killTweensOf(visual)
        visual.style.removeProperty('transform')
        visual.style.removeProperty('will-change')
      }
    }, element)

    return () => media.revert()
  }, { scope: arrow, dependencies: [direction], revertOnUpdate: true })

  return (
    <span
      className={`arrow-hover${className ? ` ${className}` : ''}`}
      data-direction={direction}
      aria-hidden="true"
      style={{ width, height }}
      ref={arrow}
    >
      <span className="arrow-hover-track" ref={track}>
        <img src={src} width={width} height={height} alt="" draggable={false} />
        <img className="arrow-hover-copy" src={src} width={width} height={height} alt="" draggable={false} />
      </span>
    </span>
  )
}
