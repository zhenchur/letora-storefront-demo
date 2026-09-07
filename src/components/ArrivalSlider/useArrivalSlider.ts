import { useCallback, useRef, type RefObject } from 'react'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { gsap, useGSAP } from '../../motion/gsap'
import { PHOTO_REVEAL_COMPLETE } from '../../motion/photoReveal'
import { createArrivalHover } from './arrivalHover'

gsap.registerPlugin(Draggable, InertiaPlugin)

// The placeholder lookbook's gestures, with drift reduced from about 38 px/s.
const AUTO_SPEED = 18
const LERP = 0.085
const VELOCITY_LIMIT = 3200

export function useArrivalSlider(root: RefObject<HTMLDivElement | null>) {
  const move = useRef<(direction: number) => void>(() => {})
  useGSAP(() => {
    const viewport = root.current
    if (!viewport) return
    const track = viewport.querySelector<HTMLElement>('.arrivals-slider__track')!
    const cards = Array.from(track.querySelectorAll<HTMLElement>('.arrival-card'))
    const masks = cards.map((card) => card.querySelector<HTMLElement>('.arrival-card__mask')!)
    const visuals = cards.map((card) => card.querySelector<HTMLElement>('.arrival-card__visual')!)
    const photos = Array.from(track.querySelectorAll<HTMLImageElement>('img[data-photo-reveal]'))
    const content = viewport.closest<HTMLElement>('.site-content')
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = preference.matches
    let hover = createArrivalHover(viewport, cards, reduced)
    const proxy = document.createElement('div')
    const setX = cards.map((card) => gsap.quickSetter(card, 'x', 'px'))
    const skew = gsap.quickSetter(masks, 'skewX', 'deg')
    const scaleY = gsap.quickSetter(masks, 'scaleY')
    const zoom = gsap.quickSetter(visuals, 'scale')
    let step = 0
    let width = 0
    let distance = 0
    let phase = 0
    let rendered = 0
    let target = 0
    let startX = 0
    let velocity = 0
    let lastX = 0
    let lastAt = 0
    let pressed = false
    let ticking = false
    let visible = false
    let focusPaused = false
    let deforming = false
    let throwTween: gsap.core.Tween | null = null
    let suppressClickUntil = 0

    const wrap = (value: number) => distance ? ((value % distance) + distance) % distance : 0
    const render = () => {
      cards.forEach((_card, index) => {
        const offset = index * step
        setX[index](wrap(offset - phase - rendered + width) - width - offset)
      })
      hover.refresh()
    }
    const deform = (lag: number) => {
      if (!deforming) {
        deforming = true
        gsap.set([...masks, ...visuals], { willChange: 'transform' })
      }
      const ratio = lag / viewport.clientWidth
      const intensity = Math.min(Math.abs(ratio), 1)
      skew(gsap.utils.clamp(-7.5, 7.5, ratio * 7.5))
      scaleY(1 - intensity * 0.25)
      zoom(1 + intensity * 0.16)
    }
    const resetDeformation = () => {
      if (!deforming) return
      deforming = false
      gsap.set([...masks, ...visuals], { clearProps: 'transform,willChange' })
    }
    const stop = () => {
      gsap.ticker.remove(tick)
      ticking = false
      cards.forEach((card) => card.style.removeProperty('will-change'))
      resetDeformation()
    }
    const commit = () => {
      phase = wrap(phase + rendered)
      rendered = target = 0
    }
    const canRun = () => !reduced && visible && !document.hidden && !viewport.closest('[inert]')
    const canAutoScroll = () => canRun() && !focusPaused && !pressed
      && !throwTween?.isActive() && photos.every((photo) => photo.dataset.photoState === 'complete')
    const tick = (_time: number, delta: number) => {
      if (document.hidden || !visible || viewport.closest('[inert]')) {
        stop()
        return
      }
      if (pressed || throwTween?.isActive() || target || rendered) {
        rendered += (target - rendered) * (1 - Math.pow(1 - LERP, Math.min(delta, 64) * 0.06))
        deform(target - rendered)
      }
      if (!pressed && !throwTween?.isActive() && Math.abs(target - rendered) < 0.1) {
        rendered = target
        commit()
        resetDeformation()
        if (canAutoScroll()) phase = wrap(phase + AUTO_SPEED * Math.min(delta, 64) / 1000)
        else stop()
      }
      render()
    }
    const start = () => {
      if (reduced) {
        rendered = target
        render()
      } else if (!ticking) {
        ticking = true
        cards.forEach((card) => { card.style.willChange = 'transform' })
        gsap.ticker.add(tick)
      }
    }
    const syncAutoScroll = () => {
      if (canRun() && (canAutoScroll() || pressed || throwTween?.isActive() || target || rendered)) start()
      else if (!pressed && !throwTween?.isActive() && !target && !rendered) stop()
    }
    const cancelThrow = () => {
      throwTween?.kill()
      throwTween = null
      commit()
    }
    const measure = () => {
      const previousStep = step
      cancelThrow()
      width = cards[0].getBoundingClientRect().width
      step = width + (parseFloat(getComputedStyle(track).gap) || 0)
      distance = step * cards.length
      phase = previousStep ? wrap(phase * step / previousStep) : 0
      if (pressed) startX = draggable.pointerX
      stop()
      render()
      syncAutoScroll()
    }

    // A proxy allows smoothing the rendered cards independently of pointer motion.
    const draggable = Draggable.create(proxy, {
      trigger: viewport,
      type: 'x',
      cursor: 'pointer',
      activeCursor: 'pointer',
      minimumMovement: 6,
      dragClickables: true,
      suppressClickOnDrag: true,
      allowNativeTouchScrolling: true,
      allowContextMenu: true,
      zIndexBoost: false,
      onPress() {
        cancelThrow()
        focusPaused = false
        pressed = true
        startX = lastX = this.pointerX
        lastAt = performance.now()
        velocity = 0
      },
      onDragStart() {
        viewport.dataset.dragging = ''
      },
      onDrag() {
        const now = performance.now()
        const speed = -(this.pointerX - lastX) / Math.max(now - lastAt, 8) * 1000
        velocity = gsap.utils.clamp(-VELOCITY_LIMIT, VELOCITY_LIMIT, velocity * 0.35 + speed * 0.65)
        lastX = this.pointerX
        lastAt = now
        target = startX - this.pointerX
        start()
      },
      onRelease() {
        pressed = false
        const dragged = viewport.hasAttribute('data-dragging')
        delete viewport.dataset.dragging
        if (!dragged) {
          syncAutoScroll()
          return
        }
        suppressClickUntil = performance.now() + 350
        if (reduced) {
          rendered = target
          commit()
          render()
        } else {
          // A paused hand releases without an old throw velocity.
          if (performance.now() - lastAt > 100) velocity = 0
          if (Math.abs(velocity) > 1) {
            const state = { phase: target }
            throwTween = gsap.to(state, {
              inertia: { phase: { velocity }, resistance: 2600, duration: { min: 0.3, max: 1.4 } },
              onUpdate: () => { target = state.phase },
              onComplete: () => { throwTween = null },
            })
          }
          start()
        }
      },
    })[0]

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') hover.move(event.clientX, event.clientY)
    }
    const onLeave = () => hover.leave()
    const onClick = (event: MouseEvent) => {
      if (event.detail && performance.now() < suppressClickUntil) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    move.current = (direction) => {
      cancelThrow()
      target = direction * step
      velocity = 0
      start()
    }
    const onKey = (event: KeyboardEvent) => {
      focusPaused = true
      syncAutoScroll()
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      move.current(event.key === 'ArrowRight' ? 1 : -1)
    }
    const onFocus = (event: FocusEvent) => {
      focusPaused = event.target instanceof Element && event.target.matches(':focus-visible')
      syncAutoScroll()
      const card = (event.target as HTMLElement).closest<HTMLElement>('.arrival-card')
      if (!card || !card.matches(':focus-visible')) return
      const bounds = card.getBoundingClientRect()
      const frame = viewport.getBoundingClientRect()
      if (bounds.left < frame.left + 24 || bounds.right > frame.right) {
        cancelThrow()
        phase = cards.indexOf(card) * step
        render()
      }
      hover.refresh()
    }
    const onBlur = (event: FocusEvent) => {
      focusPaused = event.relatedTarget instanceof Element && viewport.contains(event.relatedTarget)
        && event.relatedTarget.matches(':focus-visible')
      syncAutoScroll()
    }
    const onVisibility = () => {
      if (document.hidden) {
        cancelThrow()
        stop()
      } else syncAutoScroll()
    }
    const onPreference = () => {
      cancelThrow()
      if (pressed) startX = draggable.pointerX
      stop()
      reduced = preference.matches
      hover.destroy()
      hover = createArrivalHover(viewport, cards, reduced)
      render()
      syncAutoScroll()
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(track)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRect.height > 0
      syncAutoScroll()
    })
    visibility.observe(viewport)
    const availability = new MutationObserver(syncAutoScroll)
    if (content) availability.observe(content, { attributes: true, attributeFilter: ['inert'] })
    photos.forEach((photo) => photo.addEventListener(PHOTO_REVEAL_COMPLETE, syncAutoScroll))
    viewport.addEventListener('pointermove', onMove, { passive: true })
    viewport.addEventListener('pointerleave', onLeave)
    viewport.addEventListener('click', onClick, true)
    viewport.addEventListener('keydown', onKey)
    viewport.addEventListener('focusin', onFocus)
    viewport.addEventListener('focusout', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    preference.addEventListener('change', onPreference)

    return () => {
      move.current = () => {}
      resize.disconnect()
      visibility.disconnect()
      availability.disconnect()
      photos.forEach((photo) => photo.removeEventListener(PHOTO_REVEAL_COMPLETE, syncAutoScroll))
      draggable.kill()
      throwTween?.kill()
      stop()
      hover.destroy()
      viewport.removeEventListener('pointermove', onMove)
      viewport.removeEventListener('pointerleave', onLeave)
      viewport.removeEventListener('click', onClick, true)
      viewport.removeEventListener('keydown', onKey)
      viewport.removeEventListener('focusin', onFocus)
      viewport.removeEventListener('focusout', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      preference.removeEventListener('change', onPreference)
      delete viewport.dataset.dragging
      gsap.set(cards, { clearProps: 'transform,willChange' })
    }
  }, { scope: root })

  const previous = useCallback(() => move.current(-1), [])
  const next = useCallback(() => move.current(1), [])
  return { previous, next }
}
