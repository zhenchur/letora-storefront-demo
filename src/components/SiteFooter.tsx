import { useRef } from 'react'
import arrow from '../assets/home/arrow-terracotta.svg'
import indigoArrow from '../assets/home/arrow-indigo.svg'
import productWordmark from '../assets/product-shell/footer-wordmark.svg'
import homeWordmark from '../assets/home-refresh/footer-wordmark.svg'
import { FooterWordmark } from './FooterWordmark'
import { HoverText } from '../motion/HoverText'
import { ArrowHover } from '../motion/ArrowHover'
import { useTextMotion } from '../motion/textMotion'
import './SiteFooter.css'

const groups = [
  { title: 'Компания', links: ['О бренде', 'Контакты'] },
  { title: 'Покупателям', links: ['Корзина', 'Поиск', 'Гарантия и возврат', 'Оплата и доставка'] },
  { title: 'Каталог', links: ['Брюки', 'Топы', 'Верхняя одежда', 'Юбки', 'Платья'] },
  { title: 'Соцсети', links: ['VK', 'Telegram'] },
]

export function SiteFooter({ motion = false, variant = 'default' }: { motion?: boolean; variant?: 'default' | 'product' | 'home' }) {
  const footer = useRef<HTMLElement>(null)
  useTextMotion(footer, motion)
  const footerArrow = variant === 'default' ? arrow : indigoArrow

  return (
    <footer ref={footer} className={`site-footer${variant === 'default' ? '' : ` site-footer--${variant}`}`}>
      <div className="site-footer__top">
        {groups.map(({ title, links }) => (
          <div className="site-footer__group" key={title}>
            <h2 data-text-reveal={motion ? 'block' : undefined}>{title}</h2>
            <nav aria-label={title}>
              {links.map((label, index) => (
                <button
                  type="button"
                  disabled={!motion}
                  aria-disabled={motion || undefined}
                  data-text-reveal={motion ? 'block' : undefined}
                  data-text-delay={motion ? index * 0.08 : undefined}
                  key={label}
                >
                  {motion ? <HoverText>{label}</HoverText> : <span>{label}</span>}
                  {variant === 'product' && !motion ? <img className="site-footer__arrow" src={footerArrow} width={16} height={16} alt="" /> : <ArrowHover src={footerArrow} />}
                </button>
              ))}
            </nav>
          </div>
        ))}
        <div className="site-footer__newsletter" role="group" aria-label="Подписка на новости">
          <div className="site-footer__email" data-arrow-trigger={motion || undefined} data-text-reveal={motion ? 'block' : undefined}>
            <input type="email" placeholder="Адрес электронной почты" aria-label="Адрес электронной почты" disabled />
            <button type="button" aria-label="Подписаться" disabled>
              {variant === 'product' && !motion ? <img className="site-footer__arrow" src={footerArrow} width={16} height={16} alt="" /> : <ArrowHover src={footerArrow} />}
            </button>
          </div>
          <label className="site-footer__consent" data-text-reveal={motion ? 'block' : undefined}>
            <input type="checkbox" disabled defaultChecked />
            <span>Даю согласие на обработку персональных данных</span>
          </label>
        </div>
      </div>
      <FooterWordmark
        motion={motion}
        src={variant === 'product' ? productWordmark : variant === 'home' ? homeWordmark : undefined}
        fill={variant === 'product' ? '#E3E3E3' : variant === 'home' ? '#DCBEAF' : undefined}
      />
      <div className="site-footer__legal">
        <button
          type="button"
          disabled={!motion}
          aria-disabled={motion || undefined}
          data-text-reveal={motion ? 'block' : undefined}
        >
          {motion ? <HoverText>Политика безопасности</HoverText> : 'Политика безопасности'}
        </button>
        <p data-text-reveal={motion ? 'block' : undefined}>© «Летора». Информация на сайте не является публичной офертой.</p>
        <button
          type="button"
          disabled={!motion}
          aria-disabled={motion || undefined}
          data-text-reveal={motion ? 'block' : undefined}
        >
          {motion ? <HoverText>Создание сайта</HoverText> : 'Создание сайта'}
        </button>
      </div>
    </footer>
  )
}
