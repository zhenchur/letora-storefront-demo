import { useRef, type ReactNode } from 'react'
import { HoverText } from '../../motion/HoverText'
import { ArrowHover } from '../../motion/ArrowHover'
import { usePhotoReveal } from '../../motion/usePhotoReveal'
import { useTextMotion } from '../../motion/textMotion'
import { ArrivalSlider } from '../../components/ArrivalSlider/ArrivalSlider'
import { BrandSignature } from './BrandSignature'
import { EditorsCard } from './EditorsCard'
import { Categories } from './Categories/Categories'
import { SectionCursor } from '../../motion/SectionCursor/SectionCursor'
import arrow from '../../assets/home/arrow-indigo.svg'
import blouse from '../../assets/home/edit-blouse.jpg'
import sweater from '../../assets/home/edit-sweater.jpg'
import shirt from '../../assets/home/edit-shirt.jpg'
import './HomeContent.css'

type SectionHeaderProps = {
  id: string
  title: string
  tabs: string[]
  action: string
}

function SectionHeader({ id, title, tabs, action }: SectionHeaderProps) {
  return (
    <div className="collection-heading">
      <h2 id={id} data-text-reveal="block">{title}</h2>
      <div className="collection-heading__tabs" role="group" aria-label="Подборки">
        {tabs.map((tab, index) => (
          <button type="button" aria-disabled="true" key={tab} data-text-reveal="block" data-text-delay={(index + 1) * 0.08}>
            <HoverText>{tab}</HoverText>
          </button>
        ))}
      </div>
      <button className="collection-heading__all" type="button" aria-disabled="true" data-text-reveal="block" data-text-delay={(tabs.length + 1) * 0.08}>
        <HoverText>{action}</HoverText><ArrowHover src={arrow} />
      </button>
    </div>
  )
}

function ProductCaption({ children, price }: { children: ReactNode; price: string }) {
  return (
    <div className="product-caption" data-photo-caption>
      <h3 data-text-reveal="block"><HoverText>{children}</HoverText></h3>
      <p data-text-reveal="block" data-text-delay="0.08">{price}</p>
    </div>
  )
}

function BrandIntro() {
  return (
    <section className="brand-intro" aria-label="О бренде Летора" id="about-brand" data-line-cursor>
      <BrandSignature />
      <p className="brand-intro__statement" data-text-reveal="copy">
        Свобода и <em>красота</em> простых вещей <em>слишком</em> прекрасны, чтобы <em>от них отказываться.</em>
      </p>
    </section>
  )
}

function NewArrivals() {
  return (
    <section className="new-arrivals" aria-labelledby="new-arrivals-title">
      <SectionHeader id="new-arrivals-title" title="Новинки" tabs={['Распродажа', 'Скоро в продаже', 'Популярное']} action="Все товары" />
      <ArrivalSlider />
    </section>
  )
}

function EditorsSelection() {
  return (
    <section className="editors" aria-labelledby="editors-title">
      <SectionHeader id="editors-title" title="Выбор редакции" tabs={['Нежная осень', 'Предзаказ']} action="Все подборки" />
      <div className="editors__grid" data-photo-group>
        <img className="editors__feature" data-photo-reveal src={blouse} width={2507} height={3761} alt="Блуза «Майя» из полупрозрачного шёлка цвета экрю" loading="lazy" decoding="async" />
        <EditorsCard image={sweater} alt="Свитер «Зимний сон» молочного цвета" name="Свитер «Зимний сон»" price="48 000 ₽" number={1}>
          Свитер "<em>Зимний</em> сон"
        </EditorsCard>
        <EditorsCard image={shirt} alt="Светлая рубашка «Музыка»" name="Рубашка «Музыка»" price="48 000 ₽" number={2}>
          Рубашка "<em>Музыка</em>"
        </EditorsCard>
        <div className="editors__description" data-photo-caption>
          <ProductCaption price="48 000 ₽">Блуза "<em>Майя</em>"</ProductCaption>
          <p className="editors__text" data-text-reveal="copy">Выполнена из 100% шёлка и представлена в двух оттенках — экрю и шоколад. Полупрозрачная ткань, высокий ворот и рукава-«бананы» создают утончённый силуэт и позволяют играть со стилем</p>
        </div>
      </div>
    </section>
  )
}

export function HomeContent() {
  const content = useRef<HTMLDivElement>(null)
  usePhotoReveal(content)
  useTextMotion(content)

  return (
    <div className="home-content" ref={content}>
      <BrandIntro />
      <NewArrivals />
      <Categories />
      <EditorsSelection />
      <SectionCursor scope={content} />
    </div>
  )
}
