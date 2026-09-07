import { useRef } from 'react'
import arrow from '../../assets/home/arrow-indigo.svg'
import { ArrivalSlider, type ArrivalSliderHandle } from '../../components/ArrivalSlider/ArrivalSlider'
import { ArrowHover } from '../../motion/ArrowHover'
import './product-recommendations.css'

export function ProductRecommendations() {
  const sliderRef = useRef<ArrivalSliderHandle>(null)

  return (
    <section className="product-rec" aria-labelledby="product-rec-title">
      <div className="product-rec-heading">
        <h2 id="product-rec-title" data-text-reveal="block">Рекомендуем</h2>
        <div className="product-rec-navigation" role="group" aria-label="Навигация по рекомендациям">
          <button type="button" aria-label="Предыдущие товары" onClick={() => sliderRef.current?.previous()}>
            <ArrowHover className="product-rec-previous" src={arrow} />
          </button>
          <img src="/assets/product/slider-line.svg" width={84} height={1} alt="" />
          <button type="button" aria-label="Следующие товары" onClick={() => sliderRef.current?.next()}>
            <ArrowHover src={arrow} />
          </button>
        </div>
      </div>

      <ArrivalSlider ref={sliderRef} label="Рекомендуем" />
    </section>
  )
}
