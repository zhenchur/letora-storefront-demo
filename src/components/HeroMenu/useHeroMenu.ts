import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../motion/gsap'
import { createTextRevealVars, TEXT_REVEAL_CLEAR_PROPS } from '../../motion/textReveal'

const MENU_CLOSE_DELAY = 120

export function useHeroMenu(scope: RefObject<HTMLElement | null>, ready: boolean) {
  useGSAP((_context, contextSafe) => {
    const hero = scope.current
    const navigation = hero?.querySelector<HTMLElement>('.hero__categories')
    if (!hero || !navigation || !contextSafe) return

    const buttons = Array.from(navigation.querySelectorAll<HTMLButtonElement>('.hero__category'))
    const modelGroups = Array.from(hero.querySelectorAll<HTMLElement>('.hero-menu-models__group'))
    const modelTexts = Array.from(hero.querySelectorAll<HTMLElement>('.hero-menu-models__text'))
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let pointer: HTMLButtonElement | null = null
    let focus: HTMLButtonElement | null = null
    let activeButton: HTMLButtonElement | null = null
    let modelReveal: gsap.core.Tween | undefined
    let closeTimer = 0
    let disposed = false

    const cancelClose = () => {
      window.clearTimeout(closeTimer)
      closeTimer = 0
    }
    const closeBackdrop = () => {
      cancelClose()
      delete hero.dataset.menuOpen
    }
    const revealModels = contextSafe((group: HTMLElement) => {
      modelReveal?.kill()
      const texts = Array.from(group.querySelectorAll<HTMLElement>('.hero-menu-models__text'))
      if (reducedMotion.matches) {
        gsap.set(texts, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
        return
      }
      const { from, to } = createTextRevealVars()
      modelReveal = gsap.fromTo(texts, from, { ...to, overwrite: true })
    })

    const allowed = (button: HTMLButtonElement | null) => !!button && ready && !document.hidden
      && !button.disabled && !hero.closest('[inert]')
      && button.querySelector<HTMLElement>('[data-text-reveal]')?.dataset.textState === 'complete'

    const sync = contextSafe(() => {
      if (disposed) return
      const active = allowed(focus) ? focus : fine.matches && allowed(pointer) ? pointer : null
      if (active) {
        cancelClose()
        hero.dataset.menuOpen = ''
      }
      if (active === activeButton) return
      activeButton = active
      buttons.forEach((button) => button.toggleAttribute('data-menu-active', button === active))
      modelReveal?.kill()
      modelGroups.forEach((group) => group.removeAttribute('data-active'))
      gsap.set(modelTexts, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
      if (active) {
        hero.dataset.menuActive = active.dataset.category
        const group = modelGroups.find((item) => item.dataset.menuCategory === active.dataset.category)
        if (group) {
          group.setAttribute('data-active', '')
          revealModels(group)
        }
      } else {
        delete hero.dataset.menuActive
        // Bridge the gaps between labels without flashing the photo or promo copy.
        cancelClose()
        closeTimer = window.setTimeout(() => {
          if (!disposed && !activeButton) closeBackdrop()
        }, MENU_CLOSE_DELAY)
      }
    })

    const clear = () => {
      pointer = focus = null
      sync()
      closeBackdrop()
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !fine.matches) {
        clear()
        return
      }
      pointer = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.hero__category') : null
      sync()
    }
    const onLeave = () => { pointer = null; sync() }
    const onFocus = (event: FocusEvent) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.hero__category') : null
      focus = button?.matches(':focus-visible') ? button : null
      // Focusing the promo controls restores them even with a mouse over the menu.
      if (!button) clear()
      else sync()
    }
    const onBlur = (event: FocusEvent) => {
      const next = event.relatedTarget instanceof Element ? event.relatedTarget.closest<HTMLButtonElement>('.hero__category') : null
      if (!next || !navigation.contains(next)) focus = null
      sync()
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') clear() }
    const onVisibility = () => { if (document.hidden) clear() }
    const onMotionChange = contextSafe(() => {
      modelReveal?.kill()
      gsap.set(modelTexts, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
      if (!activeButton) closeBackdrop()
    })
    const onAvailability = () => { if (hero.closest('[inert]')) clear(); else sync() }
    const content = hero.closest('.site-content')
    const availability = new MutationObserver(onAvailability)
    if (content) availability.observe(content, { attributes: true, attributeFilter: ['inert'] })

    navigation.addEventListener('pointerover', onPointer)
    navigation.addEventListener('pointermove', onPointer)
    navigation.addEventListener('pointerleave', onLeave)
    navigation.addEventListener('text-reveal-complete', sync, true)
    hero.addEventListener('focusin', onFocus)
    hero.addEventListener('focusout', onBlur)
    hero.addEventListener('keydown', onKey)
    window.addEventListener('blur', clear)
    window.addEventListener('resize', clear)
    document.addEventListener('visibilitychange', onVisibility)
    fine.addEventListener('change', clear)
    reducedMotion.addEventListener('change', onMotionChange)

    return () => {
      disposed = true
      cancelClose()
      modelReveal?.kill()
      availability.disconnect()
      navigation.removeEventListener('pointerover', onPointer)
      navigation.removeEventListener('pointermove', onPointer)
      navigation.removeEventListener('pointerleave', onLeave)
      navigation.removeEventListener('text-reveal-complete', sync, true)
      hero.removeEventListener('focusin', onFocus)
      hero.removeEventListener('focusout', onBlur)
      hero.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', clear)
      window.removeEventListener('resize', clear)
      document.removeEventListener('visibilitychange', onVisibility)
      fine.removeEventListener('change', clear)
      reducedMotion.removeEventListener('change', onMotionChange)
      buttons.forEach((button) => button.removeAttribute('data-menu-active'))
      modelGroups.forEach((group) => group.removeAttribute('data-active'))
      delete hero.dataset.menuActive
      delete hero.dataset.menuOpen
      gsap.set(modelTexts, { clearProps: TEXT_REVEAL_CLEAR_PROPS })
    }
  }, { scope, dependencies: [ready], revertOnUpdate: true })
}
