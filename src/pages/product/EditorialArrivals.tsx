import { ArrivalSlider, type ArrivalProduct } from '../../components/ArrivalSlider/ArrivalSlider'
import bomber from '../../assets/home/new-bomber.jpg'
import scarf from '../../assets/home/new-peek.jpg'
import { siteUrl } from '../../navigation/paths'
import './editorial-arrivals.css'

const assets = siteUrl('assets/product-editorial/')
const products: readonly ArrivalProduct[] = [
  {
    image: bomber,
    title: <>Бомбер "<em>Барельеф</em>"</>,
    price: '9 900 ₽',
    alt: 'Бомбер «Барельеф»',
    href: siteUrl('product/barelyef'),
  },
  {
    image: `${assets}new-knit.png`,
    title: <>Пуховик "Ох, и <em>личность</em> ты"</>,
    price: '48 000 ₽',
    alt: 'Трикотажный комплект оливкового цвета',
  },
  {
    image: `${assets}new-jacket.png`,
    title: <>Жакет "<em>Форма</em>" из хлопка</>,
    price: '22 000 ₽',
    alt: 'Жакет «Форма»',
  },
  {
    image: scarf,
    title: <>Стёганый <em>шарф</em></>,
    price: '',
    alt: 'Объёмный стёганый шарф пыльно-розового цвета',
  },
]

export function EditorialArrivals() {
  return (
    <section className="editorial-product__arrivals" aria-labelledby="editorial-arrivals-title">
      <h2 id="editorial-arrivals-title" data-text-reveal="block">Новинки</h2>
      <ArrivalSlider products={products} />
    </section>
  )
}
