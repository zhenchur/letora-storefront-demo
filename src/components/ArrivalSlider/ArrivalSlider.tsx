import { useImperativeHandle, useRef, type ReactNode, type Ref } from 'react'
import { useArrivalSlider } from './useArrivalSlider'
import bomber from '../../assets/home/new-bomber.jpg'
import puffer from '../../assets/home/new-puffer.jpg'
import jacket from '../../assets/home/new-jacket.jpg'
import scarf from '../../assets/home/new-peek.jpg'
import './ArrivalSlider.css'

const products = [
  { image: bomber, title: <>Бомбер "<em>Барельеф</em>"</>, price: '9 900 ₽', alt: 'Бомбер «Барельеф» пыльно-розового цвета', href: '/product/barelyef' },
  { image: puffer, title: <>Пуховик "Ох, и <em>личность</em> ты"</>, price: '48 000 ₽', alt: 'Детали пуховика «Ох, и личность ты»' },
  { image: jacket, title: <>Жакет "<em>Форма</em>" из хлопка</>, price: '22 000 ₽', alt: 'Хлопковый жакет «Форма»' },
  // The reference only supplies a photograph for the fourth item, without a price.
  { image: scarf, title: <>Стёганый <em>шарф</em></>, price: '', alt: 'Объёмный стёганый шарф пыльно-розового цвета' },
]

function Caption({ index, title, price, hover = false, copy = false }: {
  index: number; title: ReactNode; price: string; hover?: boolean; copy?: boolean
}) {
  return (
    <div className={`arrival-card__caption arrival-card__caption--${hover ? 'hover' : 'rest'}`} aria-hidden={hover || undefined} data-photo-caption={!hover || undefined}>
      {hover && <span className="arrival-card__number" aria-hidden="true">(  {String(index + 1).padStart(2, '0')}  )</span>}
      <h3 data-text-reveal={!hover && !copy ? 'block' : undefined}>{title}</h3>
      <p data-text-reveal={!hover && !copy ? 'block' : undefined} data-text-delay="0.08">{price}</p>
    </div>
  )
}

export type ArrivalSliderHandle = { previous: () => void; next: () => void }

export function ArrivalSlider({ label = 'Новинки', ref }: { label?: string; ref?: Ref<ArrivalSliderHandle> }) {
  const viewport = useRef<HTMLDivElement>(null)
  const { previous, next } = useArrivalSlider(viewport)
  useImperativeHandle(ref, () => ({ previous, next }), [previous, next])

  return (
    <div className="arrivals-slider" ref={viewport} role="region" aria-roledescription="карусель" aria-label={`${label}. Перетащите карточки или используйте стрелки влево и вправо`} tabIndex={0}>
      <div className="arrivals-slider__track">
        {[0, 1].flatMap((copy) => products.map((product, index) => {
          const Tag = product.href ? 'a' : 'article'
          return (
            <Tag className="arrival-card" key={`${copy}-${index}`} href={product.href} draggable={false} tabIndex={copy ? -1 : 0} aria-hidden={copy ? true : undefined} data-photo-group>
              <div className="arrival-card__mask">
                <div className="arrival-card__visual">
                  <img src={product.image} width={1333} height={2000} alt={copy ? '' : product.alt} draggable={false} data-photo-reveal={copy ? undefined : true} loading="lazy" decoding="async" />
                </div>
                <div className="arrival-card__shade" />
                <Caption {...product} index={index} hover />
              </div>
              <Caption {...product} index={index} copy={!!copy} />
            </Tag>
          )
        }))}
      </div>
    </div>
  )
}
