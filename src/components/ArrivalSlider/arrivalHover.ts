import { gsap } from '../../motion/gsap'
import { PHOTO_REVEAL_COMPLETE } from '../../motion/photoReveal'

export function createArrivalHover(viewport: HTMLElement, cards: HTMLElement[], reducedMotion: boolean) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  const items = cards.flatMap((card) => {
    const mask = card.querySelector<HTMLElement>('.arrival-card__mask')
    const rest = card.querySelector<HTMLElement>('.arrival-card__caption--rest')
    const hover = card.querySelector<HTMLElement>('.arrival-card__caption--hover')
    const shade = card.querySelector<HTMLElement>('.arrival-card__shade')
    const image = mask?.querySelector<HTMLImageElement>('img')
    if (!mask || !rest || !hover || !shade || !image) return []
    return [{
      card, mask, rest, hover, shade, image,
      follow: gsap.quickTo(hover, 'y', { duration: reducedMotion ? 0 : 0.2, ease: 'power3.out' }),
      transition: null as gsap.core.Timeline | null,
    }]
  })
  type Item = (typeof items)[number]
  let active: Item | undefined
  let focused: Item | undefined
  let pointer: { x: number; y: number } | undefined
  let pointerIsTouch = false
  let destroyed = false

  for (const item of items) {
    gsap.set(item.hover, { autoAlpha: 0, filter: reducedMotion ? 'none' : 'blur(6px)' })
    gsap.set(item.shade, { opacity: 0 })
  }

  function transition(item: Item, shown: boolean) {
    item.transition?.kill()
    item.transition = gsap.timeline()
      .to(item.rest, {
        autoAlpha: shown ? 0 : 1,
        duration: reducedMotion ? 0 : shown ? 0.2 : 0.3,
        ease: 'quart.out',
      }, shown || reducedMotion ? 0 : 0.08)
      .to(item.shade, {
        opacity: shown ? 1 : 0,
        duration: reducedMotion ? 0 : shown ? 0.6 : 0.35,
        ease: 'quart.out',
      }, 0)
      .to(item.image, {
        scale: shown && !reducedMotion ? 1.08 : 1,
        duration: reducedMotion ? 0 : 0.6,
        ease: 'quart.out',
        transformOrigin: '50% 50%',
      }, 0)
      .to(item.hover, {
        autoAlpha: shown ? 1 : 0,
        filter: reducedMotion ? 'none' : `blur(${shown ? 0 : 6}px)`,
        duration: reducedMotion ? 0 : shown ? 0.6 : 0.25,
        ease: 'quart.out',
      }, shown && !reducedMotion ? 0.08 : 0)
  }

  function refresh() {
    if (destroyed) return
    const hit = pointer && finePointer.matches && !pointerIsTouch
      ? document.elementFromPoint(pointer.x, pointer.y) : null
    let next = focused ?? items.find(({ mask }) => hit && mask.contains(hit))
    if (next && ['pending', 'revealing'].includes(next.image.dataset.photoState ?? '')) next = undefined

    // Read geometry before changing opacity or transforms. Account for the drag mask's scaleY.
    let y = 0
    if (next) {
      const bounds = next.mask.getBoundingClientRect()
      const height = next.mask.offsetHeight
      const rowHeight = next.hover.offsetHeight
      const localY = next === focused || !pointer ? height / 2
        : (pointer.y - bounds.top) * height / Math.max(bounds.height, 1)
      const inset = Math.min(18, Math.max(0, (height - rowHeight) / 2))
      y = Math.max(inset, Math.min(height - rowHeight - inset, localY - rowHeight / 2))
    }

    if (next !== active) {
      if (active) {
        active.follow.tween.pause()
        transition(active, false)
      }
      active = next
      if (active) {
        if (reducedMotion) gsap.set(active.hover, { y })
        else active.follow(y, y).progress(1).pause()
        transition(active, true)
      }
    } else if (active) {
      if (reducedMotion) gsap.set(active.hover, { y })
      else active.follow(y)
    }
  }

  function leave() {
    pointer = undefined
    refresh()
  }

  function onPointerType(event: PointerEvent) {
    pointerIsTouch = event.pointerType === 'touch'
    if (pointerIsTouch) {
      focused = undefined
      leave()
    }
  }

  function onFocus(event: FocusEvent) {
    const target = event.type === 'focusin' ? event.target : event.relatedTarget
    focused = target instanceof Element && target.matches(':focus-visible')
      ? items.find(({ card }) => card.contains(target)) : undefined
    refresh()
  }

  viewport.addEventListener('pointerdown', onPointerType, true)
  viewport.addEventListener('pointermove', onPointerType, true)
  viewport.addEventListener('focusin', onFocus)
  viewport.addEventListener('focusout', onFocus)
  finePointer.addEventListener('change', leave)
  window.addEventListener('scroll', refresh, { passive: true, capture: true })
  window.addEventListener('resize', refresh)
  items.forEach(({ image }) => image.addEventListener(PHOTO_REVEAL_COMPLETE, refresh))

  return {
    move(x: number, y: number) {
      if (destroyed || pointerIsTouch || !finePointer.matches) return
      pointer = { x, y }
      focused = undefined
      refresh()
    },
    leave,
    refresh,
    destroy() {
      destroyed = true
      viewport.removeEventListener('pointerdown', onPointerType, true)
      viewport.removeEventListener('pointermove', onPointerType, true)
      viewport.removeEventListener('focusin', onFocus)
      viewport.removeEventListener('focusout', onFocus)
      finePointer.removeEventListener('change', leave)
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
      for (const item of items) {
        item.image.removeEventListener(PHOTO_REVEAL_COMPLETE, refresh)
        item.transition?.kill()
        item.follow.tween.kill()
        gsap.set(item.image, { clearProps: 'transform,transformOrigin' })
        gsap.set(item.rest, { clearProps: 'opacity,visibility' })
        gsap.set(item.shade, { clearProps: 'opacity' })
        gsap.set(item.hover, { clearProps: 'opacity,visibility,filter,transform' })
      }
    },
  }
}
