import { useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../../motion/gsap'
import { useSiteReady } from '../../../motion/SiteIntro'
import { CHARACTER_REVEAL_CLEAR_PROPS, createCharacterRevealVars } from '../../../motion/characterReveal'

export function useCategoryEntrance(scope: RefObject<HTMLElement | null>) {
  const ready = useSiteReady()
  const shown = useRef(new WeakSet<HTMLElement>())

  useGSAP(() => {
    const section = scope.current
    if (!section) return
    const groups = Array.from(section.querySelectorAll<HTMLElement>('[data-category-intro]'))
    const characters = (group: HTMLElement) => Array.from(group.querySelectorAll<HTMLElement>('.categories__entrance-character'))
    const { from, to } = createCharacterRevealVars()
    const complete = (group: HTMLElement) => {
      shown.current.add(group)
      group.dataset.categoryEntrance = 'complete'
      gsap.set(characters(group), { clearProps: CHARACTER_REVEAL_CLEAR_PROPS })
    }

    for (const group of groups) {
      if (shown.current.has(group)) complete(group)
      else {
        group.dataset.categoryEntrance = 'pending'
        gsap.set(characters(group), from)
      }
    }

    const media = gsap.matchMedia()
    if (ready) media.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      if (context.conditions?.reduce) {
        groups.forEach(complete)
        return
      }
      const finish = context.add('completeCategoryEntrance', complete)

      for (const group of groups) {
        const bounds = group.getBoundingClientRect()
        if (shown.current.has(group) || bounds.bottom <= 0) {
          complete(group)
          continue
        }
        const layers = Array.from(group.querySelectorAll<HTMLElement>('[data-category-character-layer]'))
        const timeline = gsap.timeline({
          delay: Number(group.dataset.categoryDelay) || 0,
          onStart: () => { group.dataset.categoryEntrance = 'revealing' },
          onComplete: () => finish(group),
          scrollTrigger: bounds.top < window.innerHeight * 0.88 ? undefined : {
            trigger: group,
            start: 'clamp(top 88%)',
            once: true,
          },
        })
        // Rest and italic layers enter together; hover only animates their inner spans.
        for (const layer of layers.length ? layers : [group]) {
          timeline.fromTo(characters(layer), from, {
            ...to,
            stagger: (index, character: HTMLElement) => Number(character.dataset.categoryCharacterIndex ?? index) * to.stagger,
          }, 0)
        }
      }

      const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
      return () => cancelAnimationFrame(frame)
    }, section)

    return () => {
      media.revert()
      groups.forEach((group) => { delete group.dataset.categoryEntrance })
    }
  }, { scope, dependencies: [ready], revertOnUpdate: true })
}
