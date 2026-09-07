import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useNavigation } from '../../navigation/Navigation'
import { useSiteReady } from '../SiteIntro'
import { CursorLineEffect, CursorPointEffect, FINE_POINTER_QUERY, type CursorInput } from './cursorEffects.js'
import './SectionCursor.css'

type Point = { x: number; y: number }

function findExit(region: Element, from: Point, to: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const bounds = region.getBoundingClientRect()
  let progress = 1
  if (dx > 0) progress = Math.min(progress, (bounds.right - from.x) / dx)
  if (dx < 0) progress = Math.min(progress, (bounds.left - from.x) / dx)
  if (dy > 0) progress = Math.min(progress, (bounds.bottom - from.y) / dy)
  if (dy < 0) progress = Math.min(progress, (bounds.top - from.y) / dy)

  // Hit-testing also finds the visible boundary when a fixed header covers the section.
  if (document.elementFromPoint(from.x, from.y)?.closest('[data-line-cursor]') === region) {
    let start = 0
    let end = 1
    for (let step = 0; step < 12; step++) {
      const middle = (start + end) / 2
      const target = document.elementFromPoint(from.x + dx * middle, from.y + dy * middle)
      if (target?.closest('[data-line-cursor]') === region) start = middle
      else end = middle
    }
    progress = Math.min(progress, start)
  }
  progress = Math.max(0, Math.min(1, progress))
  return { x: from.x + dx * progress, y: from.y + dy * progress }
}

export function SectionCursor({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const point = useRef<HTMLDivElement>(null)
  const ready = useSiteReady()
  const { phase } = useNavigation()

  useLayoutEffect(() => {
    const root = scope.current
    const lineElement = canvas.current
    const pointElement = point.current
    if (!ready || phase !== 'idle' || !root || !lineElement || !pointElement) return

    const color = getComputedStyle(document.documentElement).getPropertyValue('--palette-bluish-grey').trim()
    const line = new CursorLineEffect(lineElement, { strokeStyle: /^#[\da-f]{6}$/i.test(color) ? color : '#8ca0b4' })
    const dot = new CursorPointEffect(pointElement, {
      pointerSelector: 'a[href], button, [role="button"], [data-cursor="pointer"]',
      dragSelector: ':not(*)',
    })
    const fine = matchMedia(FINE_POINTER_QUERY)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let input: CursorInput | null = null
    let pressed = false
    let activeRegion: Element | null = null
    let trailRegion: Element | null = null
    let lastInside: Point | null = null
    let scrollX = window.scrollX
    let scrollY = window.scrollY
    let frame = 0

    const stop = () => {
      activeRegion = null
      trailRegion = null
      lastInside = null
      lineElement.dataset.cursorRegion = 'inactive'
      line.stop()
      dot.stop()
    }
    const release = () => {
      if (!activeRegion || !input || !lastInside) return
      const exit = findExit(activeRegion,
        { x: lastInside.x - scrollX, y: lastInside.y - scrollY },
        { x: input.clientX, y: input.clientY })
      activeRegion = null
      lastInside = null
      lineElement.dataset.cursorRegion = 'inactive'
      line.releaseAt(exit.x, exit.y)
      dot.stop()
    }
    const sync = () => {
      const deltaX = window.scrollX - scrollX
      const deltaY = window.scrollY - scrollY
      scrollX = window.scrollX
      scrollY = window.scrollY
      // Hit-testing also excludes a fixed header covering a marked section.
      const target = input && document.elementFromPoint(input.clientX, input.clientY)
      const region = target?.closest('[data-line-cursor]') ?? null
      const inside = !!region && root.contains(region)
      if (!input || pressed || document.hidden || !fine.matches || reduced.matches) {
        if (trailRegion) stop()
        return
      }

      if (!inside) {
        line.handleScroll(deltaX, deltaY)
        release()
        return
      }

      if (activeRegion !== region) {
        // A direct scroll jump between sections starts a fresh local trail.
        if (trailRegion !== region) stop()
        else line.handleScroll(deltaX, deltaY)
        activeRegion = region
        trailRegion = region
        lineElement.dataset.cursorRegion = 'active'
        line.start()
        dot.start()
        // Scroll can move a section under a stationary mouse without pointermove.
        const current = { ...input, target }
        line.handlePointer(current)
        dot.handlePointer(current)
      } else {
        line.handleScroll(deltaX, deltaY)
        dot.refreshInteractionMode()
      }
      lastInside = { x: input.clientX + scrollX, y: input.clientY + scrollY }
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        input = null
        stop()
        return
      }
      input = { pointerType: event.pointerType, clientX: event.clientX, clientY: event.clientY, target: event.target }
      pressed = event.buttons !== 0
      sync()
    }
    const onLayout = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; sync() })
    }
    const onLeave = () => { input = null; stop() }
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget || (event.relatedTarget as Element).tagName === 'IFRAME') onLeave()
    }
    const onVisibility = () => { if (document.hidden) onLeave() }

    // Capture enables/disables the original effects before their mouse listeners run.
    const pointerEvents = ['pointermove', 'pointerdown', 'pointerup'] as const
    pointerEvents.forEach((name) => window.addEventListener(name, onPointer, { capture: true, passive: true }))
    window.addEventListener('pointerout', onOut)
    window.addEventListener('blur', onLeave)
    window.addEventListener('scroll', onLayout, { capture: true, passive: true })
    window.addEventListener('resize', onLayout)
    document.addEventListener('visibilitychange', onVisibility)
    fine.addEventListener('change', onLayout)
    reduced.addEventListener('change', onLayout)

    return () => {
      cancelAnimationFrame(frame)
      pointerEvents.forEach((name) => window.removeEventListener(name, onPointer, true))
      window.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('scroll', onLayout, true)
      window.removeEventListener('resize', onLayout)
      document.removeEventListener('visibilitychange', onVisibility)
      fine.removeEventListener('change', onLayout)
      reduced.removeEventListener('change', onLayout)
      stop()
      line.destroy()
      dot.destroy()
    }
  }, [scope, ready, phase])

  return (
    <>
      <canvas ref={canvas} className="section-cursor-line" data-cursor-region="inactive" aria-hidden="true" />
      <div ref={point} className="section-cursor-point" aria-hidden="true">
        <span className="section-cursor-shape" />
      </div>
    </>
  )
}
