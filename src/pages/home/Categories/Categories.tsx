import { useRef } from 'react'
import dresses from '../../../assets/home/category-dresses.jpg'
import tops from '../../../assets/home/edit-blouse.jpg'
import blouses from '../../../assets/home/category-blouses.jpg'
import outerwear from '../../../assets/home/category-outerwear.jpg'
import skirts from '../../../assets/home/category-skirts.jpg'
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
  useCategoryHover(section)

  return (
    <section ref={section} className="categories" aria-labelledby="categories-title" data-line-cursor>
      <h2 id="categories-title" data-text-reveal="block">Категории</h2>
      <div className="categories__stage">
        <div className="categories__cover-motion" aria-hidden="true">
          <div className="categories__cover">
            {categories.map((category) => (
              <img key={category.name} src={category.image} alt="" decoding="async" />
            ))}
          </div>
        </div>
        <nav className="categories__list" aria-label="Категории каталога">
          {categories.map((category, index) => (
            <button
              className="categories__item"
              type="button"
              aria-disabled="true"
              key={category.name}
              data-category={index}
              data-text-reveal="block"
              data-text-delay={(index + 1) * 0.08}
            >
              <span className="categories__label">
                <span className="categories__label-rest">{category.name}</span>
                <span className="categories__label-active" aria-hidden="true">
                  <span className="categories__bracket">(</span>
                  {category.name}
                  <span className="categories__bracket">)</span>
                </span>
              </span>
              <span className="categories__number categories__number--left" aria-hidden="true">( {String(index + 1).padStart(2, '0')} )</span>
              <span className="categories__number categories__number--right" aria-hidden="true">( {String(index + 1).padStart(2, '0')} )</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
