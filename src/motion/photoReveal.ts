// Ordinary photo entrance from placeholder-react/LookbookPage (not its hover/drag).
export const PHOTO_REVEAL_DURATION = 1.8
export const PHOTO_REVEAL_EASE = 'power4.inOut'
export const PHOTO_REVEAL_START = 'photo-reveal-start'
export const PHOTO_REVEAL_COMPLETE = 'photo-reveal-complete'

export function setPhotoMask(image: HTMLElement, width: number, height: number, progress: number) {
  const minSide = Math.min(width, height)
  const maskWidth = progress * (minSide + (width - minSide) * progress)
  const maskHeight = progress * (minSide + (height - minSide) * progress)
  image.style.clipPath = `inset(${Math.max(0, (height - maskHeight) / 2)}px ${Math.max(0, (width - maskWidth) / 2)}px)`
}

// The source's mobile gate tolerates decode errors and fails open after four seconds.
export function waitForPhoto(image: HTMLImageElement, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      image.removeEventListener('load', decode)
      image.removeEventListener('error', finish)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const decode = () => { void image.decode().catch(() => undefined).then(finish) }
    const timeout = window.setTimeout(finish, 4000)
    image.addEventListener('load', decode)
    image.addEventListener('error', finish)
    signal.addEventListener('abort', finish, { once: true })
    if (signal.aborted) finish()
    else if (image.complete) {
      if (image.naturalWidth) decode()
      else finish()
    }
  })
}
