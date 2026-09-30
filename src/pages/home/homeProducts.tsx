import type { ArrivalProduct } from '../../components/ArrivalSlider/ArrivalSlider'
import { siteUrl } from '../../navigation/paths'
import bomber from '../../assets/home-refresh/new-bomber.png'
import puffer from '../../assets/home-refresh/new-puffer.png'
import jacket from '../../assets/home-refresh/new-jacket.png'
import scarf from '../../assets/home/new-peek.jpg'

export const homeProducts: readonly ArrivalProduct[] = [
  { image: bomber, title: <>Бомбер "<em>Барельеф</em>"</>, price: '9 900 ₽', alt: 'Бомбер «Барельеф»', href: siteUrl('product/barelyef') },
  { image: puffer, title: <>Пуховик "Ох, и <em>личность</em> ты"</>, price: '48 000 ₽', alt: 'Модель из новой коллекции в коричневом жакете', href: siteUrl('product/barelyef-new') },
  { image: jacket, title: <>Жакет "<em>Форма</em>" из хлопка</>, price: '22 000 ₽', alt: 'Жакет «Форма» пыльно-розового цвета', href: siteUrl('product/barelyef-v3') },
  { image: scarf, title: <>Стёганый <em>шарф</em></>, price: '', alt: 'Объёмный стёганый шарф пыльно-розового цвета' },
]
