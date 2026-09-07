import { useRef, type ReactNode } from 'react'
import { createArrivalHover } from '../../components/ArrivalSlider/arrivalHover'
import { gsap, useGSAP } from '../../motion/gsap'
import '../../components/ArrivalSlider/ArrivalSlider.css'
import './EditorsCard.css'

type EditorsCardProps = {
  image: string
  alt: string
  name: string
  price: string
  number: number
  children: ReactNode
}

export function EditorsCard({ image, alt, name, price, number, children }: EditorsCardProps) {
  const card = useRef<HTMLElement>(null)

  useGSAP(() => {
    const element = card.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add({
      animate: '(prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      const hover = createArrivalHover(element, [element], !!context.conditions?.reduce)
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') hover.move(event.clientX, event.clientY)
      }
      element.addEventListener('pointermove', move, { passive: true })
      element.addEventListener('pointerleave', hover.leave)
      return () => {
        element.removeEventListener('pointermove', move)
        element.removeEventListener('pointerleave', hover.leave)
        hover.destroy()
      }
    }, element)
    return () => media.revert()
  }, { scope: card })

  return (
    <article className="editors__card" ref={card} tabIndex={0} aria-label={`${name}, ${price}`} data-photo-group>
      <div className="arrival-card__mask">
        <div className="arrival-card__visual">
          <img data-photo-reveal src={image} width={3761} height={2507} alt={alt} loading="lazy" decoding="async" draggable={false} />
        </div>
        <div className="arrival-card__shade" />
        <div className="arrival-card__caption arrival-card__caption--hover" aria-hidden="true">
          <span className="arrival-card__number">(  {String(number).padStart(2, '0')}  )</span>
          <h3>{children}</h3>
          <p>{price}</p>
        </div>
      </div>
      <div className="product-caption arrival-card__caption arrival-card__caption--rest" data-photo-caption>
        <h3 data-text-reveal="block">{children}</h3>
        <p data-text-reveal="block" data-text-delay="0.08">{price}</p>
      </div>
    </article>
  )
}
