import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ProductV3Purchase } from './ProductV3Purchase'
import { ProductQuestion } from './ProductQuestion'
import { useProductV3GalleryMotion } from './useProductV3GalleryMotion'
import { ArrivalSlider, type ArrivalProduct } from '../../components/ArrivalSlider/ArrivalSlider'
import { HoverText } from '../../motion/HoverText'
import { useHeroIntro } from '../../motion/useHeroIntro'
import { usePhotoReveal } from '../../motion/usePhotoReveal'
import { useTextMotion } from '../../motion/textMotion'
import { SectionCursor } from '../../motion/SectionCursor/SectionCursor'
import { siteUrl } from '../../navigation/paths'
import knitFront from '../../assets/home-refresh/new-puffer.png'
import bomber from '../../assets/home-refresh/new-bomber.png'
import jacket from '../../assets/home-refresh/new-jacket.png'
import scarf from '../../assets/home/new-peek.jpg'
import './product-info.css'
import './product-v3.css'

const assets = siteUrl('assets/product-v3/')
const recommendations: readonly ArrivalProduct[] = [
  { image: bomber, title: <>Бомбер "<em>Барельеф</em>"</>, price: '9 900 ₽', alt: 'Бомбер «Барельеф»', href: siteUrl('product/barelyef') },
  { image: knitFront, title: <>Пуховик "Ох, и <em>личность</em> ты"</>, price: '48 000 ₽', alt: 'Трикотажный комплект оливкового цвета', href: siteUrl('product/barelyef-new') },
  { image: jacket, title: <>Жакет "<em>Форма</em>" из хлопка</>, price: '22 000 ₽', alt: 'Жакет «Форма»' },
  { image: scarf, title: <>Стёганый <em>шарф</em></>, price: '', alt: 'Объёмный стёганый шарф пыльно-розового цвета' },
]
const questions = [
  {
    title: 'Сухая чистка',
    answer: 'Мы заботимся о качестве и долговечности наших изделий, поэтому все наши вещи изготовлены из высококачественных натуральных тканей. Чтобы ваши любимые вещи служили долго и радовали вас своим безупречным видом, мы рекомендуем следовать простым рекомендациям по уходу. Все изделия нашего бренда предназначены исключительно для сухой чистки. Профессиональная химчистка поможет сохранить цвет, текстуру и форму ткани, а также предотвратить повреждение изделий.',
  },
  { title: 'Избегайте стирки в домашних условиях' },
  { title: 'Устранение пятен' },
  { title: 'Регулярный уход' },
]

export default function ProductV3Page() {
  const page = useRef<HTMLElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const purchaseBackground = useRef<HTMLDivElement>(null)
  useHeroIntro(media, '.product-v3__hero-image', purchaseBackground)
  usePhotoReveal(page, true, 'img[data-photo-reveal]:not([data-hero-photo])')
  useProductV3GalleryMotion(page)
  useTextMotion(page)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Бомбер «Барельеф» — Летора'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <>
      <main ref={page} className="product-v3" aria-labelledby="product-v3-name">
        <div className="product-v3__detail-region">
          <section className="product-v3__hero">
            <div className="product-v3__media" ref={media} data-line-cursor>
              <div className="product-v3__hero-crop">
                <img id="product-v3-photo" className="product-v3__hero-image" data-hero-photo data-photo-reveal src={knitFront} width="2507" height="3761" alt="Детали и фактура трикотажного комплекта" fetchPriority="high" />
              </div>
              <div className="product-v3__hero-shade" aria-hidden="true" />
            </div>
            <nav className="product-v3__crumbs" aria-label="Хлебные крошки" data-text-reveal="block" data-text-after="product-v3-name" data-text-at="start">
              <ol>
                <li><a href={siteUrl()}><HoverText>Главная</HoverText></a></li>
                <li aria-hidden="true">/</li>
                <li><span>Каталог</span></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">Верхняя одежда</li>
              </ol>
            </nav>
            <h1 id="product-v3-name" data-text-reveal="lines" data-text-after="product-v3-photo" data-text-at="start" data-text-delay="0.8" data-text-in-view>Бомбер "Барельеф"</h1>
          </section>
          <div className="product-v3__purchase-track">
            <ProductV3Purchase backgroundRef={purchaseBackground} />
          </div>
          <section className="product-v3__gallery" aria-label="Фотографии товара">
            <figure className="product-v3__photo product-v3__photo--side" data-product-v3-photo>
              <div className="product-v3__photo-mask">
                <div className="product-v3__photo-parallax">
                  <img src={`${assets}knit-side.png`} width="3587" height="3761" alt="Трикотажный комплект — вид сбоку" loading="lazy" decoding="async" />
                </div>
              </div>
            </figure>
            <figure className="product-v3__photo" data-product-v3-photo>
              <div className="product-v3__photo-mask">
                <div className="product-v3__photo-parallax">
                  <img src={knitFront} width="2507" height="3761" alt="Трикотажный комплект — вид спереди" loading="lazy" decoding="async" />
                </div>
              </div>
            </figure>
            <figure className="product-v3__photo" data-product-v3-photo>
              <div className="product-v3__photo-mask">
                <div className="product-v3__photo-parallax">
                  <img src={`${assets}knit-back.jpg`} width="2507" height="3761" alt="Трикотажный комплект — вид сзади" loading="lazy" decoding="async" />
                </div>
              </div>
            </figure>
          </section>
          <section className="product-v3__faq" aria-labelledby="product-v3-faq-title">
            <h2 id="product-v3-faq-title" data-text-reveal="block">Частые вопросы</h2>
            <div className="product-questions">
              {questions.map(({ title, answer }, index) => <ProductQuestion key={title} title={title} answer={answer} last={index === questions.length - 1} />)}
            </div>
          </section>
        </div>
        <section className="product-v3__arrivals" aria-labelledby="product-v3-arrivals-title">
          <h2 id="product-v3-arrivals-title" data-text-reveal="block">Новинки</h2>
          <ArrivalSlider products={recommendations} />
        </section>
      </main>
      {createPortal(<SectionCursor scope={page} />, document.body)}
    </>
  )
}
