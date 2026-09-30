import { useEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ProductQuestion } from './ProductQuestion'
import { EditorialArrivals } from './EditorialArrivals'
import { siteUrl } from '../../navigation/paths'
import { ArrowHover } from '../../motion/ArrowHover'
import { HoverText } from '../../motion/HoverText'
import { useHeroIntro } from '../../motion/useHeroIntro'
import { usePhotoReveal } from '../../motion/usePhotoReveal'
import { useTextMotion } from '../../motion/textMotion'
import { SectionCursor } from '../../motion/SectionCursor/SectionCursor'
import './product-info.css'
import './editorial-product.css'

const assets = siteUrl('assets/product-editorial/')
const description = 'Бомбер «Барельеф» — исследование формы и движения. Мягкие радиальные складки создают скульптурный объём, а высокий воротник и металлическая молния выстраивают строгую вертикаль. Свободный силуэт легко сочетается как с повседневными, так и с вечерними образами.'
const questions = [
  {
    title: 'Сухая чистка',
    answer: 'Мы заботимся о качестве и долговечности наших изделий, поэтому все наши вещи изготовлены из высококачественных натуральных тканей. Чтобы ваши любимые вещи служили долго и радовали вас своим безупречным видом, мы рекомендуем следовать простым рекомендациям по уходу. Все изделия нашего бренда предназначены исключительно для сухой чистки. Профессиональная химчистка поможет сохранить цвет, текстуру и форму ткани, а также предотвратить повреждение изделий.',
  },
  { title: 'Избегайте стирки в домашних условиях' },
  { title: 'Устранение пятен' },
  { title: 'Регулярный уход' },
]

function PurchasePanel({ backgroundRef }: { backgroundRef: RefObject<HTMLDivElement | null> }) {
  return (
    <aside className="editorial-product__purchase" aria-label="Параметры и покупка товара" data-text-after="editorial-product-name" data-text-at="start" data-text-in-view>
      <div className="editorial-product__purchase-background" ref={backgroundRef} aria-hidden="true" />
      <div className="editorial-product__purchase-content" data-lenis-prevent>
      <p className="editorial-product__price" data-text-reveal="block">18 500 ₽</p>
      <div className="editorial-product__options">
        <p data-text-reveal="block" data-text-delay="0.08">Выбрать параметры</p>
        <div className="editorial-product__selectors">
          {['Размер', 'Цвет'].map((label) => (
            <button type="button" aria-disabled="true" key={label} data-text-reveal="block" data-text-delay="0.16">
              <HoverText>{label}</HoverText><ArrowHover src={`${assets}option-arrow.svg`} />
            </button>
          ))}
        </div>
      </div>
      <section className="editorial-product__description" aria-label="Информация о товаре">
        <div className="editorial-product__tabs" role="group" aria-label="Сведения о товаре">
          <button type="button" aria-disabled="true" aria-pressed="true" data-text-reveal="block"><img src={`${assets}tab-dot.svg`} width="6" height="6" alt="" /><HoverText>Описание</HoverText></button>
          <button type="button" aria-disabled="true" data-text-reveal="block" data-text-delay="0.08"><HoverText>Состав</HoverText></button>
          <button type="button" aria-disabled="true" data-text-reveal="block" data-text-delay="0.16"><HoverText>Уход</HoverText></button>
        </div>
        <p data-text-reveal="copy">{description}</p>
      </section>
      <button type="button" className="editorial-product__add" aria-disabled="true" data-text-reveal="block"><HoverText>Добавить в корзину</HoverText></button>
      </div>
    </aside>
  )
}

export default function EditorialProductPage() {
  const page = useRef<HTMLElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const purchaseBackground = useRef<HTMLDivElement>(null)
  useHeroIntro(media, '.editorial-product__hero-image', purchaseBackground)
  usePhotoReveal(page, true, 'img[data-photo-reveal]:not([data-hero-photo])')
  useTextMotion(page)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Бомбер «Барельеф» — Летора'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <>
    <main ref={page} className="editorial-product" aria-labelledby="editorial-product-name">
      <div className="editorial-product__detail-region">
      <section className="editorial-product__hero">
        <div className="editorial-product__media" ref={media} data-line-cursor>
          <img id="editorial-product-photo" className="editorial-product__hero-image" data-hero-photo data-photo-reveal src={`${assets}hero.png`} width="1920" height="896" alt="Фактура и детали трикотажного комплекта" fetchPriority="high" />
        </div>
        <nav className="editorial-product__crumbs" aria-label="Хлебные крошки" data-text-reveal="block" data-text-after="editorial-product-name" data-text-at="start">
          <ol><li><a href={siteUrl()}><HoverText>Главная</HoverText></a></li><li aria-hidden="true">/</li><li><span>Каталог</span></li><li aria-hidden="true">/</li><li aria-current="page">Верхняя одежда</li></ol>
        </nav>
        <h1 id="editorial-product-name" data-text-reveal="lines" data-text-after="editorial-product-photo" data-text-at="start" data-text-delay="0.8" data-text-in-view>Бомбер "Барельеф"</h1>
      </section>
      <div className="editorial-product__purchase-track"><PurchasePanel backgroundRef={purchaseBackground} /></div>
      <section className="editorial-product__gallery" aria-label="Фотографии товара">
        {['large', 'small', 'small', 'large', 'small'].map((size, index) => (
          <img className={`editorial-product__photo editorial-product__photo--${index + 1}`} data-photo-reveal key={index} src={`${assets}gallery-${size}.png`} width={size === 'large' ? 920 : 452} height={size === 'large' ? 1128 : 555} alt={`Трикотажный комплект — фотография ${index + 1}`} loading="lazy" />
        ))}
      </section>
      <section className="editorial-product__faq" aria-labelledby="editorial-faq-title">
        <h2 id="editorial-faq-title" data-text-reveal="block">Частые вопросы</h2>
        <div className="product-questions">
          {questions.map(({ title, answer }, index) => <ProductQuestion key={title} title={title} answer={answer} last={index === questions.length - 1} defaultExpanded={index === 0} />)}
        </div>
      </section>
      </div>
      <EditorialArrivals />
    </main>
    {createPortal(<SectionCursor scope={page} />, document.body)}
    </>
  )
}
