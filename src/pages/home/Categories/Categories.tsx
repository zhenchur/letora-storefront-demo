import { useRef } from 'react'
import dresses from '../../../assets/home/category-dresses.jpg'
import tops from '../../../assets/home/edit-blouse.jpg'
import blouses from '../../../assets/home-refresh/new-puffer.png'
import outerwear from '../../../assets/home/category-outerwear.jpg'
import skirts from '../../../assets/home/category-skirts.jpg'
import { CategoryCharacters } from './CategoryCharacters'
import { useCategoryEntrance } from './useCategoryEntrance'
import { useCategoryHover } from './useCategoryHover'
import './Categories.css'

const categories = [
  { name: 'Платья', image: dresses },
  { name: 'Топы', image: tops },
  { name: 'Блузы', image: blouses },
  { name: 'Брюки', image: outerwear },
  { name: 'Верхняя одежда', image: outerwear },
  { name: 'Юбки', image: skirts },
]

export function Categories() {
  const section = useRef<HTMLElement>(null)
  useCategoryEntrance(section)
  useCategoryHover(section)

  return (
    <section ref={section} className="categories" aria-labelledby="categories-title">
      <h2 id="categories-title" aria-label="Категории" data-category-intro>
        <CategoryCharacters text="Категории" entrance />
      </h2>
      <div className="categories__stage">
        {['left', 'right'].map((side) => (
          <div key={side} className={`categories__cover-motion categories__cover-motion--${side}`} aria-hidden="true">
            <div className="categories__cover">
              {categories.map((category) => (
                <img key={category.name} src={category.image} alt="" decoding="async" />
              ))}
            </div>
          </div>
        ))}
        <nav className="categories__list" aria-label="Категории каталога">
          {categories.map((category, index) => (
            <button
              className="categories__item"
              type="button"
              aria-disabled="true"
              aria-label={category.name}
              key={category.name}
              data-category={index}
            >
              <span className="categories__label" data-text-reveal="heading" data-text-delay={(index + 1) * 0.08}>
                <span className="categories__label-rest" data-category-character-layer>
                  <CategoryCharacters text={category.name} />
                </span>
                <span className="categories__label-active" aria-hidden="true">
                  <span className="categories__active-name" data-category-character-layer>
                    <CategoryCharacters text={category.name} />
                  </span>
                </span>
              </span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
