import { useEffect, useRef, useState } from 'react'
import { Hero } from '../../components/Hero'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { HomeContent } from './HomeContent'

export function HomePage() {
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
      <main>
        <Hero sectionRef={heroRef} />
        <HomeContent />
      </main>
      <SiteFooter motion />
    </>
  )
}
