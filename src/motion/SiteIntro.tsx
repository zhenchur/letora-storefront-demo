import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Preloader } from './Preloader'
import { useSmoothScroll } from './useSmoothScroll'
import { isHome, useNavigation } from '../navigation/Navigation'
import { usePageTransition } from './usePageTransition'

const SiteReady = createContext(false)

// Page entrances can wait for this without owning or replaying the site loader.
export function useSiteReady() {
  return useContext(SiteReady)
}

function needsPreloader() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (navigation?.type === 'back_forward') return false
  return navigation?.type === 'reload' || isHome(window.location.pathname)
}

export function SiteIntro({ children }: { children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [loaderReady, setLoaderReady] = useState(() => !needsPreloader())
  const { pageReady, phase } = useNavigation()
  const ready = loaderReady && pageReady
  const complete = useCallback(() => setLoaderReady(true), [])
  useSmoothScroll(loaderReady)
  usePageTransition(shell, content, backdrop)

  return (
    <SiteReady.Provider value={ready}>
      <div ref={shell} className="site-shell" data-page-transition={phase}>
        <div ref={backdrop} className="page-backdrop" aria-hidden="true" />
        <div ref={content} className="site-content" inert={!ready || phase !== 'idle'} aria-busy={!ready}>
          {children}
        </div>
        {!loaderReady && <Preloader content={content} onComplete={complete} />}
      </div>
    </SiteReady.Provider>
  )
}
