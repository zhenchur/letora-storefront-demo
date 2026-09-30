import { useRef } from 'react'
import logo from '../assets/icons/letora-white.svg'
import search from '../assets/icons/search.svg'
import bag from '../assets/icons/bag.svg'
import account from '../assets/icons/account.svg'
import { AssetIcon } from './AssetIcon'
import { HoverText } from '../motion/HoverText'
import { useTextMotion } from '../motion/textMotion'
import { siteUrl } from '../navigation/paths'
import './SiteHeader.css'

type SiteHeaderProps = {
  variant?: 'default' | 'product'
  tone?: 'overlay' | 'light'
  fixed?: boolean
  motion?: boolean
  entranceAfter?: string
  entranceAt?: 'start' | 'complete'
  accountIcon?: string
}

const actions = [
  { label: 'Поиск', icon: search },
  { label: 'Корзина', icon: bag },
  { label: 'Войти', icon: account },
]

const categories = ['Платья', 'Юбки', 'Брюки', 'Верхняя одежда', 'Топы', 'Блузы']

export function SiteHeader({ variant = 'default', tone = 'overlay', fixed = false, motion = false, entranceAfter, entranceAt, accountIcon = account }: SiteHeaderProps) {
  const header = useRef<HTMLElement>(null)
  useTextMotion(header, motion)

  return (
    <header ref={header} data-text-after={entranceAfter} data-text-at={entranceAt} className={`site-header site-header--${tone}${fixed ? ' site-header--fixed' : ''}${variant === 'product' ? ' site-header--product' : ''}`}>
      <a className="site-header__brand" href={siteUrl()} aria-label="Летора — главная" data-text-reveal={motion && entranceAfter ? 'block' : undefined}>
        <AssetIcon src={logo} className="site-header__logo" />
      </a>
      {(tone === 'light' || variant === 'product') && (
        <nav className="site-header__categories" aria-label="Категории одежды">
          {categories.map((label, index) => (
            <button
              className="site-header__action"
              type="button"
              disabled={!motion}
              aria-disabled={motion || undefined}
              data-text-reveal={motion ? 'block' : undefined}
              data-text-delay={motion ? index * 0.08 : undefined}
              key={label}
            >
              {motion ? <HoverText>{label}</HoverText> : label}
            </button>
          ))}
        </nav>
      )}
      <nav className="site-header__actions" aria-label="Сервисы магазина">
        {actions.map(({ label, icon }, index) => (
          <button
            className="site-header__action"
            type="button"
            disabled={!motion}
            aria-disabled={motion || undefined}
            data-text-reveal={motion ? 'block' : undefined}
            data-text-delay={motion ? index * 0.08 : undefined}
            key={label}
          >
            <AssetIcon src={icon === account ? accountIcon : icon} />
            {motion ? <HoverText>{label}</HoverText> : <span>{label}</span>}
          </button>
        ))}
      </nav>
    </header>
  )
}
