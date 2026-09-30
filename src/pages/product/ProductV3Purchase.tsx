import type { RefObject } from 'react'
import { siteUrl } from '../../navigation/paths'
import { ArrowHover } from '../../motion/ArrowHover'
import { HoverText } from '../../motion/HoverText'
import './product-v3-purchase.css'

const assets = siteUrl('assets/product-editorial/')
const description = 'Бомбер «Барельеф» — исследование формы и движения. Мягкие радиальные складки создают скульптурный объём, а высокий воротник и металлическая молния выстраивают строгую вертикаль. Свободный силуэт легко сочетается как с повседневными, так и с вечерними образами.'

export function ProductV3Purchase({ backgroundRef }: { backgroundRef: RefObject<HTMLDivElement | null> }) {
  return (
    <aside
      className="product-v3__purchase"
      aria-label="Параметры и покупка товара"
      data-text-after="product-v3-name"
      data-text-at="start"
      data-text-in-view
    >
      <div className="product-v3__purchase-background" ref={backgroundRef} aria-hidden="true" />
      <div className="product-v3__purchase-content" data-lenis-prevent>
        <p className="product-v3__purchase-price" data-text-reveal="block">18 500 ₽</p>
        <div className="product-v3__purchase-options">
          <p data-text-reveal="block" data-text-delay="0.08">Выбрать параметры</p>
          <div className="product-v3__purchase-selectors">
            {['Размер', 'Цвет'].map((label) => (
              <button type="button" aria-disabled="true" key={label} data-text-reveal="block" data-text-delay="0.16">
                <HoverText>{label}</HoverText>
                <ArrowHover src={`${assets}option-arrow.svg`} />
              </button>
            ))}
          </div>
        </div>
        <section className="product-v3__purchase-description" aria-label="Информация о товаре">
          <div className="product-v3__purchase-tabs" role="group" aria-label="Сведения о товаре">
            {['Описание', 'Состав', 'Уход'].map((label, index) => (
              <button type="button" aria-disabled="true" aria-pressed={index === 0} key={label} data-text-reveal="block" data-text-delay={index * 0.08}>
                {index === 0 && <img src={`${assets}tab-dot.svg`} width="6" height="6" alt="" />}
                <HoverText>{label}</HoverText>
              </button>
            ))}
          </div>
          <p data-text-reveal="copy">{description}</p>
        </section>
        <button type="button" className="product-v3__purchase-add" aria-disabled="true" data-text-reveal="block">
          <HoverText>Добавить в корзину</HoverText>
        </button>
      </div>
    </aside>
  )
}
