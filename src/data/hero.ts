import photo from '../assets/images/hero-collection.png'
import salePhoto from '../assets/images/hero-sale.png'

export const heroSlides = [
  {
    id: 'new-collection',
    photo,
    width: 1299,
    height: 1624,
    eyebrow: 'Новая коллекция',
    title: ['Свобода и красота', 'простых вещей'],
    action: 'Смотреть',
  },
  {
    id: 'spring-sale',
    photo: salePhoto,
    width: 1444,
    height: 800,
    eyebrow: 'Скидки до 30%',
    title: ['Весенняя распродажа', 'последней коллекции'],
    action: 'Смотреть',
  },
] as const

export const heroCategories = [
  { id: 'dresses', label: 'Платья' },
  { id: 'skirts', label: 'Юбки' },
  { id: 'blouses', label: 'Блузы' },
  { id: 'outerwear', label: 'Верхняя одежда' },
  { id: 'tops', label: 'Топы' },
  { id: 'trousers', label: 'Брюки' },
] as const
