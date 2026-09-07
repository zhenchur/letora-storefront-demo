import { useRef } from 'react'
import type { RefObject } from 'react'
import markSvg from './assets/letora-preloader-mark.svg?raw'
import mobileMarkSvg from './assets/letora-preloader-mark-mobile.svg?raw'
import { usePreloader } from './usePreloader'
import './Preloader.css'

function extractMarkPaths(svg: string) {
  return {
    dot: svg.match(/<path id="Union" d="([^"]+)"/)?.[1] ?? '',
    primary: svg.match(/<path id="Vector 2" d="([^"]+)"/)?.[1] ?? '',
    secondary: svg.match(/<path id="Vector 443" d="([^"]+)"/)?.[1] ?? '',
  }
}

const desktopMark = extractMarkPaths(markSvg)
const mobileMark = extractMarkPaths(mobileMarkSvg)

type PreloaderMarkProps = {
  className: string
  mark: ReturnType<typeof extractMarkPaths>
  viewBox: string
}

function PreloaderMark({ className, mark, viewBox }: PreloaderMarkProps) {
  return (
    <svg
      className={`preloader__mark ${className}`}
      viewBox={viewBox}
      preserveAspectRatio="none"
      overflow="visible"
      fill="none"
    >
      <path
        className="preloader__mark-dot"
        d={mark.dot}
        fill="#915A46"
      />
      <path
        className="preloader__mark-line preloader__mark-line--primary"
        d={mark.primary}
        stroke="#915A46"
        strokeWidth="2"
      />
      <path
        className="preloader__mark-line preloader__mark-line--secondary"
        d={mark.secondary}
        stroke="#915A46"
        strokeWidth="2"
      />
    </svg>
  )
}

type PreloaderProps = {
  content: RefObject<HTMLDivElement | null>
  onComplete: () => void
}

export function Preloader({ content, onComplete }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null)
  usePreloader(root, content, onComplete)

  return (
    <div ref={root} className="preloader" role="status" aria-label="Загрузка">
      <div className="preloader__surface" aria-hidden="true" />

      <div className="preloader__mark-frame" aria-hidden="true">
        <PreloaderMark
          className="preloader__mark--desktop"
          mark={desktopMark}
          viewBox="0 0 219.209 94.5722"
        />
        <PreloaderMark
          className="preloader__mark--mobile"
          mark={mobileMark}
          viewBox="0 0 162 70.1904"
        />
      </div>
    </div>
  )
}
