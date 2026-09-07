import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ScrollTrigger } from '../motion/gsap'
import { routePath } from './paths'

type Position = { x: number; y: number }
type Entry = { key: string; scroll: Position }
export type PageTransition = 'idle' | 'exiting' | 'preparing' | 'entering'
type Location = {
  href: string
  pathname: string
  search: string
  hash: string
  key: string
  scroll: Position | null
  fallback: Position
}

const entryName = '__letoraNavigation'
export const BEFORE_NAVIGATE = 'letora:before-navigate'

function readEntry(): Entry | undefined {
  const entry = window.history.state?.[entryName]
  return typeof entry?.key === 'string' && Number.isFinite(entry.scroll?.x)
    && Number.isFinite(entry.scroll?.y) ? entry : undefined
}

function saveEntry(entry: Entry) {
  window.history.replaceState({ ...window.history.state, [entryName]: entry }, '')
}

function readLocation(key: string, scroll: Position | null, fallback: Position = { x: 0, y: 0 }): Location {
  const { href, pathname, search, hash } = window.location
  return { href, pathname, search, hash, key, scroll, fallback }
}

function currentPosition(): Position {
  return { x: window.scrollX, y: window.scrollY }
}

export function isHome(pathname: string) {
  return routePath(pathname) === '/'
}

function isRoute(pathname: string) {
  return isHome(pathname) || routePath(pathname) === '/product/barelyef'
}

function samePage(a: Pick<Location, 'pathname' | 'search'>, b: Pick<Location, 'pathname' | 'search'>) {
  return routePath(a.pathname) === routePath(b.pathname) && a.search === b.search
}

const Navigation = createContext<{
  location: Location
  pageReady: boolean
  phase: PageTransition
  finishNavigation: () => void
  swapPage: () => void
  releaseEntrance: () => void
  finishTransition: () => void
} | null>(null)

export function useNavigation() {
  const navigation = useContext(Navigation)
  if (!navigation) throw new Error('NavigationProvider is required')
  return navigation
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(() => {
    const entry = readEntry()
    return readLocation(entry?.key ?? crypto.randomUUID(), entry?.scroll ?? null, currentPosition())
  })
  const [pageReady, setPageReady] = useState(false)
  const [phase, setPhase] = useState<PageTransition>('idle')
  const phaseRef = useRef<PageTransition>('idle')
  const current = useRef(location)
  const pending = useRef<{ location: Location; push: boolean } | null>(null)
  const swap = useRef(() => {})
  const positions = useRef(new Map<string, Position>())
  const tracking = useRef(false)

  const changePhase = useCallback((next: PageTransition) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const finishNavigation = useCallback(() => {
    if (phaseRef.current === 'preparing') {
      changePhase('entering')
      return
    }
    if (phaseRef.current !== 'idle') return
    tracking.current = true
    positions.current.set(current.current.key, currentPosition())
    setPageReady(true)
  }, [changePhase])

  const swapPage = useCallback(() => swap.current(), [])
  const releaseEntrance = useCallback(() => {
    if (phaseRef.current === 'entering') setPageReady(true)
  }, [])
  const finishTransition = useCallback(() => {
    if (phaseRef.current !== 'entering') return
    tracking.current = true
    positions.current.set(current.current.key, currentPosition())
    setPageReady(true)
    changePhase('idle')
  }, [changePhase])

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    // ScrollTrigger also retains this setting internally and reapplies it during refresh.
    ScrollTrigger.clearScrollMemory('manual')
    saveEntry({ key: current.current.key, scroll: current.current.scroll ?? currentPosition() })
    let persistTimer: number | undefined

    const rememberScroll = () => {
      if (tracking.current) positions.current.set(current.current.key, currentPosition())
    }
    const persistScroll = () => {
      window.clearTimeout(persistTimer)
      rememberScroll()
      // During a pop transition the URL already belongs to the pending destination.
      if (readEntry()?.key !== current.current.key) return
      saveEntry({
        key: current.current.key,
        scroll: positions.current.get(current.current.key) ?? currentPosition(),
      })
    }
    const onScroll = () => {
      rememberScroll()
      if (!tracking.current) return
      window.clearTimeout(persistTimer)
      persistTimer = window.setTimeout(persistScroll, 250)
    }
    const commit = (next: Location, push: boolean) => {
      window.clearTimeout(persistTimer)
      tracking.current = false
      if (push && window.location.href !== next.href) {
        window.history.pushState({ [entryName]: { key: next.key, scroll: { x: 0, y: 0 } } }, '', next.href)
      }
      current.current = next
      setLocation(next)
    }
    swap.current = () => {
      const next = pending.current
      if (!next) return
      pending.current = null
      // The old DOM stays mounted and ready until its entire exit has finished.
      if (!samePage(current.current, next.location)) setPageReady(false)
      changePhase('preparing')
      commit(next.location, next.push)
    }
    const request = (next: Location, push: boolean) => {
      if (pending.current?.location.href === next.href && push) return
      window.clearTimeout(persistTimer)
      window.dispatchEvent(new Event(BEFORE_NAVIGATE))
      if (phaseRef.current === 'idle' && samePage(current.current, next)) {
        commit(next, push)
        return
      }
      tracking.current = false
      pending.current = { location: next, push }
      if (phaseRef.current === 'preparing') swap.current()
      else changePhase('exiting')
    }
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
        || event.shiftKey || event.altKey) return
      const link = event.composedPath().find((node): node is HTMLAnchorElement =>
        node instanceof HTMLAnchorElement)
      if (!link || !link.hasAttribute('href') || link.hasAttribute('download')
        || link.relList.contains('external')) return
      const target = link.getAttribute('target') ?? document.querySelector('base')?.target
      if (target && target.toLowerCase() !== '_self') return

      let url: URL
      try { url = new URL(link.href) } catch { return }
      if (url.origin !== window.location.origin || !isRoute(url.pathname)) return
      // Native fragments retain their normal URL/history behavior.
      if (samePage(window.location, url) && (url.hash || link.getAttribute('href')?.includes('#'))) {
        persistScroll()
        return
      }

      event.preventDefault()
      persistScroll()
      const key = url.href === current.current.href ? current.current.key : crypto.randomUUID()
      request({
        href: url.href, pathname: url.pathname, search: url.search, hash: url.hash,
        key, scroll: url.hash ? null : { x: 0, y: 0 }, fallback: { x: 0, y: 0 },
      }, true)
    }
    const onHistory = () => {
      if (phaseRef.current === 'idle' && window.location.href === current.current.href
        && readEntry()?.key === current.current.key) return
      // popstate already points at the destination: save the outgoing position only in memory.
      const entry = readEntry()
      const withinPage = samePage(current.current, window.location)
      const isNewFragment = withinPage && window.location.href !== current.current.href
        && (!entry || entry.key === current.current.key)
      if (!isNewFragment) rememberScroll()
      const key = !entry || isNewFragment ? crypto.randomUUID() : entry.key
      const scroll = positions.current.get(key) ?? (!isNewFragment ? entry?.scroll : null) ?? null
      if (!entry || isNewFragment) saveEntry({ key, scroll: scroll ?? { x: 0, y: 0 } })
      const fallback = withinPage ? positions.current.get(current.current.key) ?? currentPosition() : { x: 0, y: 0 }
      request(readLocation(key, scroll, fallback), false)
    }

    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onHistory)
    window.addEventListener('hashchange', onHistory)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('beforeunload', persistScroll)
    window.addEventListener('pagehide', persistScroll)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onHistory)
      window.removeEventListener('hashchange', onHistory)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('beforeunload', persistScroll)
      window.removeEventListener('pagehide', persistScroll)
      window.clearTimeout(persistTimer)
      swap.current = () => {}
      pending.current = null
      ScrollTrigger.clearScrollMemory(previousRestoration)
    }
  }, [])

  return (
    <Navigation.Provider value={{ location, pageReady, phase, finishNavigation, swapPage, releaseEntrance, finishTransition }}>
      {children}
    </Navigation.Provider>
  )
}
