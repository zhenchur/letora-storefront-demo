import photo from '../assets/home-refresh/hero-collection.png'
import salePhoto from '../assets/images/hero-sale.png'

export const heroSlides = [
  {
    id: 'new-collection',
    photo,
    width: 2072,
    height: 2590,
    eyebrow: 'Новая коллекция',
    eyebrowEmphasis: 'Новая',
    title: ['Свобода и красота', 'простых вещей'],
    action: 'Смотреть',
  },
  {
    id: 'spring-sale',
    photo: salePhoto,
    width: 1444,
    height: 800,
    eyebrow: 'Скидки до 30%',
    eyebrowEmphasis: 'Скидки',
    title: ['Весенняя распродажа', 'последней коллекции'],
    action: 'Смотреть',
  },
] as const

export const heroCategories = [
  { id: 'dresses', label: 'Платья' },
  { id: 'skirts', label: 'Юбки' },
  { id: 'trousers', label: 'Брюки' },
  { id: 'outerwear', label: 'Верхняя одежда' },
  { id: 'tops', label: 'Топы' },
  { id: 'blouses', label: 'Блузы' },
] as const

export const heroMenuModels = [
  { category: 'dresses', names: ['Ностальгия', 'Арбис', 'Бутон', 'Зимняя прима', 'Стрекоза'] },
  { category: 'skirts', names: ['Акварель', 'Полутон', 'Ритм', 'Тихий вальс', 'Касание'] },
  { category: 'trousers', names: ['Горизонт', 'Контур', 'Маршрут', 'Широкий шаг', 'Дюна'] },
  { category: 'outerwear', names: ['Облако', 'Северный свет', 'Туман', 'Тёплый ветер', 'Сумерки'] },
  { category: 'tops', names: ['Лепесток', 'Сияние', 'Бриз', 'Лунный шёлк', 'Эхо'] },
  { category: 'blouses', names: ['Камелия', 'Соната', 'Белый ирис', 'Рассвет', 'Флёр'] },
] as const
