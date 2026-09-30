import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../../motion/gsap'
import { CHARACTER_REVEAL_CLEAR_PROPS, createCharacterRevealVars } from '../../../motion/characterReveal'
import { setPhotoMask } from '../../../motion/photoReveal'

// Hover needs visible movement from the first frame, unlike a slow scroll entrance.
const PHOTO_HOVER_DURATION = 0.65
const PHOTO_HOVER_EASE = 'power3.out'

export function useCategoryHover(scope: RefObject<HTMLElement | null>) {
  useGSAP((context) => {
    const section = scope.current
    const covers = Array.from(section?.querySelectorAll<HTMLElement>('.categories__cover') ?? [])
    const list = section?.querySelector<HTMLElement>('.categories__list')
    const stage = section?.querySelector<HTMLElement>('.categories__stage')
    if (!section || !covers.length || !list || !stage) return

    const items = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-category]'))
    const labels = items.map((item) => item.querySelector<HTMLElement>('.categories__label')!)
    const imageGroups = covers.map((cover) => Array.from(cover.querySelectorAll<HTMLImageElement>('img')))
    const images = imageGroups.flat()
    const pairs = items.map((_, index) => imageGroups.map((group) => group[index]))
    const dimensions = covers.map((cover) => ({ width: cover.clientWidth, height: cover.clientHeight }))
    const restLabels = items.map((item) => item.querySelector<HTMLElement>('.categories__label-rest')!)
    const activeLabels = items.map((item) => item.querySelector<HTMLElement>('.categories__label-active')!)
    const labelCharacters = activeLabels.map((label) => Array.from(label.querySelectorAll<HTMLElement>('.categories__active-name .categories__hover-character')))
    const allCharacters = labelCharacters.flat()
    const { from, to } = createCharacterRevealVars()
    const revealVars = {
      ...to,
      stagger: (index: number, character: HTMLElement) => Number(character.dataset.categoryCharacterIndex ?? index) * to.stagger,
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const hover = window.matchMedia('(any-hover: hover)')
    let active = -1
    let visibleImage = -1
    let pointer: { x: number; y: number } | null = null
    let keyboardFocus = false
    let disposed = false
    let frame = 0
    let transition: gsap.core.Timeline | undefined
    let photoTween: gsap.core.Tween | undefined
    let photoRequest = 0
    const photosReady = pairs.map(() => false)
    // Decode each pair once ahead of hover; switching rows never restarts that work.
    const photoLoads = pairs.map((pair, index) => Promise.all(
      pair.map((image) => image.decode().catch(() => undefined)),
    ).then(() => {
      photosReady[index] = pair.every((image) => image.complete && image.naturalWidth > 0)
    }))
    const photo = { progress: 0 }

    // Link entrance owns the label wrapper; hover owns inner characters and layer visibility.
    gsap.set(activeLabels, { autoAlpha: 0 })
    const available = () => !document.hidden && !section.closest('[inert]')
    const alignCovers = () => {
      if (active < 0) return
      const item = items[active]
      const label = labels[active]
      // Use the label's layout center, independent of its temporary entrance transform.
      const center = item.getBoundingClientRect().top - stage.getBoundingClientRect().top
        + label.offsetTop + label.offsetHeight / 2
      stage.style.setProperty('--category-cover-y', `${center}px`)
    }
    const measurePhotos = () => {
      covers.forEach((cover, index) => {
        dimensions[index].width = cover.clientWidth
        dimensions[index].height = cover.clientHeight
      })
    }
    const renderPhoto = () => {
      if (visibleImage < 0) return
      pairs[visibleImage].forEach((image, index) => {
        setPhotoMask(image, dimensions[index].width, dimensions[index].height, photo.progress)
      })
    }
    const resize = new ResizeObserver(() => {
      alignCovers()
      measurePhotos()
      if (photo.progress < 1) renderPhoto()
    })
    covers.forEach((cover) => resize.observe(cover))
    resize.observe(stage)

    const revealPhoto = context.add('revealCategoryPhoto', (index: number, request: number) => {
      if (disposed || request !== photoRequest || index !== active || !photosReady[index] || !available()) return
      photoTween?.kill()
      const pair = pairs[index]
      visibleImage = index
      gsap.set(covers, { autoAlpha: 1 })
      gsap.set(pair, { autoAlpha: 1, zIndex: 1 })
      measurePhotos()
      photo.progress = reducedMotion.matches ? 1 : 0
      renderPhoto()
      const finish = () => {
        if (disposed || request !== photoRequest || index !== active) return
        gsap.set(pair, { clearProps: 'clipPath,willChange' })
      }
      if (reducedMotion.matches) {
        finish()
        return
      }
      gsap.set(pair, { willChange: 'clip-path' })
      photoTween = gsap.to(photo, {
        progress: 1,
        duration: PHOTO_HOVER_DURATION,
        ease: PHOTO_HOVER_EASE,
        lazy: false,
        onUpdate: renderPhoto,
        onComplete: finish,
      })
    })

    const select = context.add('selectCategory', (index: number) => {
      if (!available()) index = -1
      if (index === active) return
      const request = ++photoRequest
      active = index
      section.dataset.activeCategory = index < 0 ? '' : String(index)
      items.forEach((item, i) => item.toggleAttribute('data-active', i === index))

      // Drop the previous cover immediately, including interrupted reveals and exits.
      photoTween?.kill()
      photoTween = undefined
      transition?.kill()
      gsap.set(covers, { autoAlpha: 0 })
      gsap.set(images, { autoAlpha: 0, clearProps: 'clipPath,willChange,zIndex' })
      visibleImage = -1
      const selected = index >= 0
      if (selected) {
        alignCovers()
        // A fresh, identical reveal for every selection, including rapid A → B → A.
        if (photosReady[index]) revealPhoto(index, request)
        else void photoLoads[index].then(() => revealPhoto(index, request))
      }

      if (reducedMotion.matches) {
        gsap.set(allCharacters, { clearProps: CHARACTER_REVEAL_CLEAR_PROPS })
        items.forEach((_, i) => {
          gsap.set(restLabels[i], { autoAlpha: i === index ? 0 : 1 })
          gsap.set(activeLabels[i], { autoAlpha: i === index ? 1 : 0 })
        })
        return
      }

      const timeline = gsap.timeline({ defaults: { ease: 'quart.out' } })
      transition = timeline
      items.forEach((_, i) => {
        const current = i === index
        timeline.to(restLabels[i], { autoAlpha: current ? 0 : 1, duration: 0.2 }, 0)
        if (current) {
          timeline
            .set(activeLabels[i], { autoAlpha: 1 }, 0)
            .fromTo(labelCharacters[i], from, revealVars, 0)
        } else {
          timeline.to(activeLabels[i], { autoAlpha: 0, duration: 0.2 }, 0)
        }
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
        return
      }
      const index = pointer && hover.matches
        ? itemIndex(document.elementFromPoint(pointer.x, pointer.y)) : -1
      select(index >= 0 ? index : focusedIndex())
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') { onReset(); return }
      if (!hover.matches || !available()) return
      // Layout changes can emit pointerover without the user moving the mouse.
      if (keyboardFocus && (event.type === 'pointerover'
        || (pointer?.x === event.clientX && pointer?.y === event.clientY))) return
      keyboardFocus = false
      pointer = { x: event.clientX, y: event.clientY }
      select(itemIndex(event.target))
    }
    const onLeave = () => { pointer = null; select(focusedIndex()) }
    const onFocus = () => {
      const index = focusedIndex()
      if (index >= 0) {
        keyboardFocus = true
        select(index)
      }
    }
    const onBlur = (event: FocusEvent) => {
      if (list.contains(event.relatedTarget as Node | null)) return
      if (keyboardFocus) pointer = null
      keyboardFocus = false
      select(pointer && hover.matches
        ? itemIndex(document.elementFromPoint(pointer.x, pointer.y)) : -1)
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
    }
    const onMediaChange = () => {
      if (!hover.matches) pointer = null
      active = -2
      syncPointer()
    }
    const onVisibility = () => { if (document.hidden) onReset() }
    const availability = new MutationObserver(() => { if (!available()) onReset() })
    const content = section.closest('.site-content')
    if (content) availability.observe(content, { attributes: true, attributeFilter: ['inert'] })

    section.addEventListener('pointerover', onPointer)
    section.addEventListener('pointermove', onPointer)
    section.addEventListener('pointerleave', onLeave)
    section.addEventListener('pointercancel', onReset)
    list.addEventListener('focusin', onFocus)
    list.addEventListener('focusout', onBlur)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('blur', onReset)
    document.addEventListener('visibilitychange', onVisibility)
    reducedMotion.addEventListener('change', onMediaChange)
    hover.addEventListener('change', onMediaChange)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      availability.disconnect()
      resize.disconnect()
      photoTween?.kill()
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
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener('change', onMediaChange)
      hover.removeEventListener('change', onMediaChange)
      items.forEach((item) => item.removeAttribute('data-active'))
      delete section.dataset.activeCategory
      stage.style.removeProperty('--category-cover-y')
      gsap.set([...covers, ...images, ...restLabels, ...activeLabels], { clearProps: 'all' })
      gsap.set(allCharacters, { clearProps: CHARACTER_REVEAL_CLEAR_PROPS })
    }
  }, { scope })
}
