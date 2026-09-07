import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../../motion/gsap'

export function useCategoryHover(scope: RefObject<HTMLElement | null>) {
  useGSAP((context) => {
    const section = scope.current
    const cover = section?.querySelector<HTMLElement>('.categories__cover')
    const motion = section?.querySelector<HTMLElement>('.categories__cover-motion')
    const stage = section?.querySelector<HTMLElement>('.categories__stage')
    const list = section?.querySelector<HTMLElement>('.categories__list')
    if (!section || !cover || !motion || !stage || !list) return

    const items = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-category]'))
    const images = Array.from(cover.querySelectorAll('img'))
    const restLabels = items.map((item) => item.querySelector<HTMLElement>('.categories__label-rest')!)
    const activeLabels = items.map((item) => item.querySelector<HTMLElement>('.categories__label-active')!)
    const numbers = items.map((item) => Array.from(item.querySelectorAll<HTMLElement>('.categories__number')))
    const allNumbers = numbers.flat()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const hover = window.matchMedia('(any-hover: hover)')
    let active = -1
    let pointer: { x: number; y: number } | null = null
    let keyboardFocus = false
    let frame = 0
    let transition: gsap.core.Timeline | undefined

    // Hover owns only the inner labels; the page reveal still owns each button.
    gsap.set(activeLabels, { opacity: 0, y: 8, filter: 'blur(5px)' })
    gsap.set(allNumbers, { opacity: 0, xPercent: -50, yPercent: -50, x: 0, y: 8 })

    // The position has its own tweens, so changing images never interrupts inertia.
    gsap.set(motion, { xPercent: -50, yPercent: -50, x: 0, y: 0 })
    const xTo = gsap.quickTo(motion, 'x', { duration: 0.65, ease: 'power3.out' })
    const yTo = gsap.quickTo(motion, 'y', { duration: 0.65, ease: 'power3.out' })
    const moveCover = () => {
      if (reducedMotion.matches) {
        xTo.tween.pause()
        yTo.tween.pause()
        gsap.set(motion, { x: 0, y: 0 })
        return
      }
      const bounds = stage.getBoundingClientRect()
      const point = active >= 0 && !keyboardFocus ? pointer : null
      xTo(point ? point.x - bounds.left - bounds.width / 2 : 0)
      yTo(point ? point.y - bounds.top - bounds.height / 2 : 0)
    }

    const select = context.add('select', (index: number) => {
      if (index === active) return
      const wasHidden = Number(gsap.getProperty(cover, 'opacity')) === 0
      active = index
      section.dataset.activeCategory = index < 0 ? '' : String(index)
      items.forEach((item, i) => item.toggleAttribute('data-active', i === index))

      // Retarget from the current values: no exit queue or stale completion callbacks.
      transition?.kill()
      const visible = index >= 0
      const coverTarget = { autoAlpha: visible ? 1 : 0, scale: visible ? 1 : 0.96 }
      if (reducedMotion.matches) {
        gsap.set(cover, coverTarget)
        images.forEach((image, i) => gsap.set(image, { opacity: i === index ? 1 : 0 }))
        items.forEach((_, i) => {
          gsap.set(restLabels[i], { opacity: i === index ? 0 : 1 })
          gsap.set(activeLabels[i], { opacity: i === index ? 1 : 0, y: 0, filter: 'none' })
          gsap.set(numbers[i], { opacity: i === index ? 1 : 0, y: 0 })
        })
        return
      }

      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      transition = timeline
      timeline.to(cover, { ...coverTarget, duration: visible ? 0.85 : 0.3 }, 0)
      if (index >= 0) {
        images.forEach((image, i) => {
          const opacity = i === index ? 1 : 0
          if (wasHidden) gsap.set(image, { opacity })
          else timeline.to(image, { opacity, duration: 0.55, ease: 'power2.inOut' }, 0)
        })
      }
      items.forEach((_, i) => {
        const selected = i === index
        timeline
          .to(restLabels[i], { opacity: selected ? 0 : 1, duration: 0.25 }, 0)
          .to(activeLabels[i], {
            opacity: selected ? 1 : 0,
            y: selected ? 0 : 8,
            filter: selected ? 'blur(0px)' : 'blur(5px)',
            duration: selected ? 0.7 : 0.2,
            ease: 'quart.out',
          }, 0)
          .to(numbers[i], {
            opacity: selected ? 1 : 0,
            y: selected ? 0 : 8,
            duration: selected ? 0.6 : 0.2,
            stagger: selected ? 0.04 : 0,
          }, selected ? 0.12 : 0)
      })
    })

    const itemIndex = (target: EventTarget | null) => {
      const item = target instanceof Element ? target.closest<HTMLButtonElement>('[data-category]') : null
      return item && list.contains(item) ? items.indexOf(item) : -1
    }
    const focusedIndex = () => list.contains(document.activeElement) && document.activeElement?.matches(':focus-visible')
      ? itemIndex(document.activeElement) : -1
    const syncPointer = () => {
      if (keyboardFocus) {
        select(focusedIndex())
        moveCover()
        return
      }
      const index = pointer && hover.matches
        ? itemIndex(document.elementFromPoint(pointer.x, pointer.y)) : -1
      select(index >= 0 ? index : focusedIndex())
      moveCover()
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !hover.matches) return
      // Layout changes can emit pointerover without the user moving the mouse.
      if (keyboardFocus && (event.type === 'pointerover'
        || (pointer?.x === event.clientX && pointer?.y === event.clientY))) return
      keyboardFocus = false
      pointer = { x: event.clientX, y: event.clientY }
      select(itemIndex(event.target))
      moveCover()
    }
    const onLeave = () => { pointer = null; select(focusedIndex()); moveCover() }
    const onFocus = () => {
      const index = focusedIndex()
      if (index >= 0) {
        keyboardFocus = true
        select(index)
        moveCover()
      }
    }
    const onBlur = (event: FocusEvent) => {
      if (list.contains(event.relatedTarget as Node | null)) return
      if (keyboardFocus) pointer = null
      keyboardFocus = false
      select(pointer && hover.matches
        ? itemIndex(document.elementFromPoint(pointer.x, pointer.y)) : -1)
      moveCover()
    }
    const onScroll = () => {
      if (pointer && !frame) frame = requestAnimationFrame(() => {
        frame = 0
        syncPointer()
      })
    }
    const onReset = () => {
      cancelAnimationFrame(frame)
      frame = 0
      pointer = null
      keyboardFocus = false
      select(-1)
      moveCover()
    }
    const onMediaChange = () => {
      if (!hover.matches) pointer = null
      active = -2
      syncPointer()
    }

    section.addEventListener('pointerover', onPointer)
    section.addEventListener('pointermove', onPointer)
    section.addEventListener('pointerleave', onLeave)
    section.addEventListener('pointercancel', onReset)
    list.addEventListener('focusin', onFocus)
    list.addEventListener('focusout', onBlur)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('blur', onReset)
    reducedMotion.addEventListener('change', onMediaChange)
    hover.addEventListener('change', onMediaChange)

    return () => {
      cancelAnimationFrame(frame)
      xTo.tween.kill()
      yTo.tween.kill()
      transition?.kill()
      section.removeEventListener('pointerover', onPointer)
      section.removeEventListener('pointermove', onPointer)
      section.removeEventListener('pointerleave', onLeave)
      section.removeEventListener('pointercancel', onReset)
      list.removeEventListener('focusin', onFocus)
      list.removeEventListener('focusout', onBlur)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('blur', onReset)
      reducedMotion.removeEventListener('change', onMediaChange)
      hover.removeEventListener('change', onMediaChange)
      items.forEach((item) => item.removeAttribute('data-active'))
      delete section.dataset.activeCategory
      gsap.set([motion, cover, ...images, ...restLabels, ...activeLabels, ...allNumbers], { clearProps: 'all' })
    }
  }, { scope })
}
