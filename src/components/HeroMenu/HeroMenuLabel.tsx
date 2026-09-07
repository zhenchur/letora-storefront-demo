import { useRef } from 'react'
import { gsap, useGSAP } from '../../motion/gsap'
import './HeroMenuLabel.css'

// Figma 645:2285; motion from placeholder-react/CustomCursor/CursorTextEffect.
const WORDS = ['наполнять', 'каждый', 'день', 'собственным', 'смыслом']
const INTERVAL = 170
const LIFETIME = 1400

type WordSlot = {
  element: HTMLSpanElement
  animation?: Animation
  active: boolean
  token: number
  x: number
  y: number
  width: number
  height: number
}

export function HeroMenuLabel({ children }: { children: string }) {
  const root = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const label = root.current
    const button = label?.closest('button')
    const layer = label?.querySelector<HTMLElement>('.hero-menu-label__words')
    if (!label || !button || !layer) return
    void document.fonts.load('400 14px "Wix Madefor Text"').catch(() => {})

    const media = gsap.matchMedia()
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const slots: WordSlot[] = Array.from(layer.querySelectorAll<HTMLSpanElement>('span'), element => ({
        element, active: false, token: 0, x: 0, y: 0, width: 0, height: 0,
      }))
      let timer: number | undefined
      let next = 0

      const stop = (clear = false) => {
        window.clearInterval(timer)
        timer = undefined
        delete label.dataset.active
        if (!clear) return
        slots.forEach(slot => {
          slot.token++
          slot.animation?.cancel()
          slot.animation = undefined
          slot.active = false
          slot.element.hidden = true
          slot.element.removeAttribute('style')
        })
      }

      const allowed = () => {
        const entrance = label.closest<HTMLElement>('[data-text-reveal]')
        return !document.hidden && !button.disabled && !label.closest('[inert]')
          && (!entrance || entrance.dataset.textState === 'complete')
      }

      const spawn = () => {
        if (!allowed()) { stop(true); return }
        const slot = slots[next]
        if (slot.active) return
        const element = slot.element
        element.hidden = false
        const bounds = layer.getBoundingClientRect()
        const base = label.getBoundingClientRect()
        const width = element.offsetWidth
        const height = element.offsetHeight
        const minX = Math.max(0, 16 - bounds.left)
        const maxX = Math.min(bounds.width - width, window.innerWidth - 16 - bounds.left - width)
        const minY = Math.max(0, 16 - bounds.top)
        const maxY = Math.min(bounds.height - height, window.innerHeight - 16 - bounds.top - height)
        let point: { x: number; y: number } | undefined

        // Keep the phrase near its own item, clear of the label and other words.
        for (let attempt = 0; attempt < 8 && maxX >= minX && maxY >= minY; attempt++) {
          const x = minX + Math.random() * (maxX - minX)
          const y = minY + Math.random() * (maxY - minY)
          const overLabel = x + width > base.left - bounds.left - 14
            && x < base.right - bounds.left + 14
            && y + height > base.top - bounds.top - 12
            && y < base.bottom - bounds.top + 12
          const overWord = slots.some(other => other.active
            && x + width + 8 > other.x && x < other.x + other.width + 8
            && y + height + 6 > other.y && y < other.y + other.height + 6)
          if (!overLabel && !overWord) { point = { x, y }; break }
        }
        if (!point) { element.hidden = true; return }

        Object.assign(slot, point, { width, height, active: true })
        element.style.left = `${point.x}px`
        element.style.top = `${point.y}px`
        const token = ++slot.token
        slot.animation = element.animate([
          { opacity: 0, transform: 'scale(.65)', offset: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
          { opacity: 1, transform: 'scale(1)', offset: .2 },
          { opacity: 1, transform: 'scale(1)', offset: .62, easing: 'cubic-bezier(.4,0,1,1)' },
          { opacity: 0, transform: 'scale(.65)', offset: 1 },
        ], { duration: LIFETIME, fill: 'both' })
        void slot.animation.finished.then(() => {
          if (slot.token !== token) return
          slot.active = false
          element.hidden = true
          slot.animation?.cancel()
          slot.animation = undefined
        }, () => {})
        next = (next + 1) % slots.length
      }

      const enter = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || timer !== undefined || !allowed()) return
        label.dataset.active = ''
        spawn()
        timer = window.setInterval(spawn, INTERVAL)
      }
      const leave = () => stop()
      const clear = () => stop(true)
      const visibility = () => { if (document.hidden) clear() }
      button.addEventListener('pointerenter', enter)
      button.addEventListener('pointermove', enter)
      button.addEventListener('pointerleave', leave)
      window.addEventListener('blur', clear)
      window.addEventListener('resize', clear)
      document.fonts.addEventListener('loadingdone', clear)
      document.addEventListener('visibilitychange', visibility)

      return () => {
        stop(true)
        button.removeEventListener('pointerenter', enter)
        button.removeEventListener('pointermove', enter)
        button.removeEventListener('pointerleave', leave)
        window.removeEventListener('blur', clear)
        window.removeEventListener('resize', clear)
        document.fonts.removeEventListener('loadingdone', clear)
        document.removeEventListener('visibilitychange', visibility)
      }
    }, label)
    return () => media.revert()
  }, { scope: root })

  return (
    <span className="hero-menu-label" ref={root}>
      {children}
      <span className="hero-menu-label__bracket hero-menu-label__bracket--left" aria-hidden="true">(</span>
      <span className="hero-menu-label__bracket hero-menu-label__bracket--right" aria-hidden="true">)</span>
      <span className="hero-menu-label__words" aria-hidden="true">
        {WORDS.map(word => <span key={word} hidden>{word}</span>)}
      </span>
    </span>
  )
}
