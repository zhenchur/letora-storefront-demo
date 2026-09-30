import { useRef, type RefObject } from 'react'
import arrow from '../assets/icons/chevron-right.svg'
import previous from '../assets/icons/chevron-previous.svg'
import actionArrow from '../assets/home-refresh/hero-action.svg'
import { heroCategories, heroMenuModels, heroSlides } from '../data/hero'
import { SiteHeader } from './SiteHeader'
import { HeroMenuLabel } from './HeroMenu/HeroMenuLabel'
import { useHeroMenu } from './HeroMenu/useHeroMenu'
import { useHeroIntro } from '../motion/useHeroIntro'
import { useHeroSlider } from '../motion/useHeroSlider'
import { HoverText } from '../motion/HoverText'
import { ArrowHover } from '../motion/ArrowHover'
import { useTextMotion } from '../motion/textMotion'
import './Hero.css'

export function Hero({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const mediaRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLElement>(null)
  const ready = useHeroIntro(mediaRef)
  const { activeIndex, transitioning, paused, autoplayEnabled, next, previous: goPrevious, togglePause } =
    useHeroSlider(sectionRef, ready, heroSlides.length)
  useTextMotion(categoriesRef)
  useHeroMenu(sectionRef, ready)

  return (
    <section
      className="hero"
      aria-roledescription="карусель"
      aria-labelledby={`collection-title-${heroSlides[activeIndex].id}`}
      ref={sectionRef}
      data-line-cursor
    >
      <div className="hero__media" aria-hidden="true" ref={mediaRef}>
        {heroSlides.map((slide, index) => (
          <img
            className="hero__photo"
            key={slide.id}
            id={index === 0 ? 'hero-photo-first' : undefined}
            data-photo-reveal={index === 0 ? '' : undefined}
            data-slide={slide.id}
            src={slide.photo}
            alt=""
            width={slide.width}
            height={slide.height}
            fetchPriority={index === 0 ? 'high' : 'low'}
          />
        ))}
      </div>

      <SiteHeader motion entranceAfter="hero-photo-first" />

      <nav className="hero__categories" aria-label="Категории одежды" ref={categoriesRef} data-text-after="hero-photo-first">
        {heroCategories.map(({ id, label }, index) => (
          <button
            className={`hero__category hero__category--${id}`}
            key={id}
            data-category={id}
            type="button"
            aria-disabled="true"
          >
            <span className="hero__category-label" data-text-reveal="block" data-text-delay={index * 0.08}>
              <HeroMenuLabel>{label}</HeroMenuLabel>
            </span>
          </button>
        ))}
      </nav>

      <div className="hero-menu-models" aria-hidden="true">
        {heroMenuModels.map(({ category, names }) => (
          <div className="hero-menu-models__group" data-menu-category={category} key={category}>
            {names.map((name, index) => (
              <span className={`hero-menu-models__name hero-menu-models__name--${index}`} key={name}>
                <span className="hero-menu-models__text">{name}</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="hero__slider" role="group" aria-label="Управление слайдером">
        <button className="hero__step hero__step--previous" type="button" disabled={!ready || transitioning} onClick={goPrevious} aria-label="Предыдущий слайд">
          <ArrowHover className="hero__previous" src={previous} />
        </button>
        <button
          className="hero__timer"
          type="button"
          disabled={!ready || transitioning || !autoplayEnabled}
          onClick={togglePause}
          aria-label={!autoplayEnabled ? 'Автоматическая смена слайдов отключена' :
            paused ? 'Продолжить смену слайдов' : 'Приостановить смену слайдов'}
          aria-pressed={paused}
        >
          <span className="hero__track" aria-hidden="true">
            <span className="hero__progress" />
          </span>
        </button>
        <button className="hero__step hero__step--next" type="button" disabled={!ready || transitioning} onClick={next} aria-label="Следующий слайд">
          <ArrowHover src={arrow} />
        </button>
      </div>

      <div className="hero__captions">
        {heroSlides.map((slide, index) => (
          <div
            className="hero__caption"
            key={slide.id}
            data-active={index === activeIndex}
            aria-hidden={index !== activeIndex}
            inert={index !== activeIndex}
          >
            <p className="hero__eyebrow" data-text-reveal="copy"><em>{slide.eyebrowEmphasis}</em>{slide.eyebrow.slice(slide.eyebrowEmphasis.length)}</p>
            <h1 className="hero__title" id={`collection-title-${slide.id}`} data-text-reveal="lines">
              {slide.title[0]}
              <br />
              {slide.title[1]}
            </h1>
            <button className="hero__action" type="button" aria-disabled="true" data-text-reveal="block">
              <HoverText>{slide.action}</HoverText>
              <ArrowHover src={actionArrow} width={6} height={10} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
