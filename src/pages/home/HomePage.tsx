import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hero } from '../../components/Hero'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { HomeContent } from './HomeContent'
import { SectionCursor } from '../../motion/SectionCursor/SectionCursor'

export function HomePage() {
  const pageRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    setShowHeader(hero.getBoundingClientRect().bottom < 0)

    const observer = new IntersectionObserver(([entry]) => {
      setShowHeader(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0)
    })

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {showHeader && <SiteHeader tone="light" fixed motion />}
      <main ref={pageRef}>
        <Hero sectionRef={heroRef} />
        <HomeContent />
      </main>
      <SiteFooter motion variant="home" />
      {createPortal(<SectionCursor scope={pageRef} />, document.body)}
    </>
  )
}
