import { useEffect, useRef } from 'react'
import { HoverText } from '../../motion/HoverText'
import { ArrowHover } from '../../motion/ArrowHover'
import { useTextMotion } from '../../motion/textMotion'
import { usePhotoReveal } from '../../motion/usePhotoReveal'
import { ProductInfo } from './ProductInfo'
import { ProductRecommendations } from './ProductRecommendations'
import { useProductStack } from './useProductStack'
import './product.css'

const assets = '/assets/product/'
const photos = [
  { file: 'front.png', alt: 'Бомбер «Барельеф» пыльно-розового цвета — вид спереди' },
  { file: 'back.png', alt: 'Бомбер «Барельеф» — вид со спины' },
  { file: 'lining.png', alt: 'Подкладка и внутренняя отделка бомбера «Барельеф»' },
  { file: 'full.png', alt: 'Расстёгнутый бомбер «Барельеф» — образ в полный рост' },
]

function Chevron({ down = false }: { down?: boolean }) {
  return (
    <ArrowHover
      className={`product-arrow${down ? ' product-arrow-down' : ''}`}
      src={`${assets}chevron-right.svg`}
    />
  )
}

export default function ProductPage() {
  const page = useRef<HTMLElement>(null)
  useTextMotion(page)
  usePhotoReveal(page)
  useProductStack(page)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Бомбер «Барельеф» — Летора'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <main className="product" ref={page} aria-labelledby="product-name">
      <nav className="product-crumbs" aria-label="Хлебные крошки" data-text-after="product-name" data-text-at="start">
        <ol>
          <li data-text-reveal="block"><a href="/"><HoverText>Главная</HoverText></a><Chevron /></li>
          <li data-text-reveal="block" data-text-delay="0.08"><span className="product-crumb-muted">Каталог</span><Chevron /></li>
          <li data-text-reveal="block" data-text-delay="0.16"><span>Верхняя одежда</span></li>
        </ol>
      </nav>

      <header className="product-heading">
        <h1 id="product-name" data-text-reveal="lines" data-text-after="product-photo-first" data-text-at="start" data-text-delay="0.8">Бомбер "<em>Барельеф</em>"</h1>
        <p className="product-meta" data-text-after="product-name" data-text-at="start">
          <span data-text-reveal="block" data-text-delay="0.16">Артикул: LT-0003</span>
          <span data-text-reveal="block" data-text-delay="0.24">Модель 03</span>
        </p>
      </header>

      <section className="product-gallery" aria-label="Фотографии и параметры товара">
        <aside className="product-side product-options" aria-label="Параметры товара">
          <div className="product-controls" data-text-after="product-name" data-text-at="start">
            <button type="button" aria-disabled="true" data-text-reveal="block" data-text-delay="0.24"><HoverText>Размер</HoverText><Chevron down /></button>
            <button type="button" aria-disabled="true" data-text-reveal="block" data-text-delay="0.32"><HoverText>Цвет</HoverText><Chevron down /></button>
          </div>
        </aside>

        <div className="product-photos">
          {photos.map((photo, index) => (
            <div className="product-photo" key={photo.file}>
              <div className="product-photo-frame">
                <img
                  id={index === 0 ? 'product-photo-first' : undefined}
                  data-photo-reveal={index === 0 ? '' : undefined}
                  src={`${assets}${photo.file}`}
                  alt={photo.alt}
                  width="880"
                  height="1080"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>

        <aside className="product-side product-purchase" aria-label="Цена и покупка">
          <div className="product-controls" data-text-after="product-name" data-text-at="start">
            <span className="product-price" data-text-reveal="block" data-text-delay="0.24">18 500 ₽</span>
            <button type="button" aria-disabled="true" data-text-reveal="block" data-text-delay="0.32"><HoverText>Купить</HoverText><Chevron /></button>
          </div>
        </aside>
      </section>
      <ProductInfo />
      <ProductRecommendations />
    </main>
  )
}
