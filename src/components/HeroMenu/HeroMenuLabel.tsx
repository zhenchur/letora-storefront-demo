import { HoverText } from '../../motion/HoverText'
import './HeroMenuLabel.css'

export function HeroMenuLabel({ children }: { children: string }) {
  return (
    <span className="hero-menu-label">
      <span className="hero-menu-label__bracket" aria-hidden="true">(</span>
      <HoverText settleOnLeave>{children}</HoverText>
      <span className="hero-menu-label__bracket" aria-hidden="true">)</span>
    </span>
  )
}
