import { useRef } from 'react'
import { gsap, useGSAP } from './gsap'
import './StringDivider.css'

const HEIGHT = 40
const BASELINE = HEIGHT / 2

type PointerPosition = { x: number; y: number; id: number }

export function StringDivider({ className = '' }: { className?: string }) {
  const divider = useRef<SVGSVGElement>(null)

  useGSAP(() => {
    const svg = divider.current
    const path = svg?.querySelector('path')
    if (!svg || !path) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', (context) => {
      let width = 100
      let left = 0
      let baseline = 0
      let visible = false
      let anchor = 0.5
      let amplitude = 0
      let frame = 0
      let previous: PointerPosition | null = null
      const displacement = { value: 0 }

      const draw = () => {
        const x = anchor * width
        const y = BASELINE + displacement.value
        const before = x / 2
        const after = x + (width - x) / 2
        path.setAttribute('d', displacement.value === 0
          ? `M0 ${BASELINE} H${width}`
          : `M0 ${BASELINE} C${before} ${BASELINE} ${before} ${y} ${x} ${y} C${after} ${y} ${after} ${BASELINE} ${width} ${BASELINE}`)
      }

      const measure = () => {
        const bounds = svg.getBoundingClientRect()
        width = Math.max(1, bounds.width)
        left = bounds.left
        baseline = bounds.top + HEIGHT / 2
        visible = bounds.width > 0 && baseline >= 0 && baseline <= window.innerHeight
        previous = null
        svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`)
        draw()
      }

      // Reuse one timeline so repeated crossings do not accumulate animations.
      const spring = gsap.timeline({ paused: true, onUpdate: draw })
        .to(displacement, { value: () => amplitude, duration: 0.08, ease: 'power2.out' })
        .to(displacement, { value: 0, duration: 1.05, ease: 'elastic.out(1, 0.25)' })

      const strum = context.add('strum', (position: number, strength: number) => {
        anchor = position
        amplitude = strength
        spring.invalidate().restart()
      })

      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch' || svg.closest('[inert]') || !visible || frame) {
          previous = null
          return
        }
        const current = { x: event.clientX, y: event.clientY, id: event.pointerId }
        const last = previous
        previous = current
        if (!last || last.id !== current.id) return

        const distance = current.y - last.y
        const crossed = (last.y <= baseline && current.y > baseline)
          || (last.y >= baseline && current.y < baseline)
        if (!crossed || distance === 0) return

        const ratio = (baseline - last.y) / distance
        const crossing = last.x + (current.x - last.x) * ratio - left
        if (crossing <= 0 || crossing >= width) return
        const strength = Math.sign(distance) * Math.min(14, 10 + Math.abs(distance) * 0.1)
        strum(crossing / width, strength)
      }

      const resetPointer = () => { previous = null }
      const onPointerOut = (event: PointerEvent) => {
        if (!event.relatedTarget) resetPointer()
      }
      const scheduleMeasure = () => {
        resetPointer()
        if (!frame) frame = requestAnimationFrame(() => {
          frame = 0
          measure()
        })
      }

      measure()
      const resize = new ResizeObserver(scheduleMeasure)
      resize.observe(svg)
      if (svg.parentElement) resize.observe(svg.parentElement)
      if (svg.parentElement?.parentElement) resize.observe(svg.parentElement.parentElement)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerout', onPointerOut, { passive: true })
      window.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true })
      window.addEventListener('resize', scheduleMeasure, { passive: true })
      window.addEventListener('blur', resetPointer)

      return () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerout', onPointerOut)
        window.removeEventListener('scroll', scheduleMeasure, true)
        window.removeEventListener('resize', scheduleMeasure)
        window.removeEventListener('blur', resetPointer)
        resize.disconnect()
        cancelAnimationFrame(frame)
        spring.kill()
        displacement.value = 0
        draw()
      }
    }, svg)

    return () => media.revert()
  }, { scope: divider })

  return (
    <svg
      className={`string-divider${className ? ` ${className}` : ''}`}
      ref={divider}
      viewBox={`0 0 100 ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={`M0 ${BASELINE} H100`} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
