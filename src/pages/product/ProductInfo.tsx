import { HoverText } from '../../motion/HoverText'
import { ProductQuestion } from './ProductQuestion'
import './product-info.css'

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

export function ProductInfo() {
  return (
    <>
      <section className="product-info" aria-label="Информация о товаре">
        <div className="product-tabs" role="group" aria-label="Сведения о товаре">
          {['Описание', 'Состав', 'Уход'].map((label, index) => (
            <button type="button" aria-disabled="true" aria-pressed={index === 0} key={label} data-text-reveal="block" data-text-delay={index * 0.08}>
              {index === 0 && <img src="/assets/product/tab-dot.svg" width="6" height="6" alt="" />}
              <HoverText>{label}</HoverText>
            </button>
          ))}
        </div>
        <p data-text-reveal="copy">{description}</p>
      </section>

      <section className="product-faq" aria-labelledby="product-faq-title">
        <h2 id="product-faq-title" data-text-reveal="block">Частые вопросы</h2>
        <div className="product-questions">
          {questions.map(({ title, answer }, index) => (
            <ProductQuestion key={title} title={title} answer={answer} last={index === questions.length - 1} />
          ))}
        </div>
      </section>
    </>
  )
}
