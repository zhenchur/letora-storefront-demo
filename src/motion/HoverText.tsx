import { Children, cloneElement, isValidElement, useRef, type ReactElement, type ReactNode } from 'react'
import { gsap, useGSAP } from './gsap'
import { createCharacterRevealVars } from './characterReveal'
import './HoverText.css'

type InlineElement = ReactElement<{ children?: ReactNode }>

function splitLabel(children: ReactNode) {
  const visual: ReactNode[] = []
  let word: ReactNode[] = []
  let text = ''
  let characterIndex = 0

  const finishWord = () => {
    if (!word.length) return
    visual.push(<span className="hover-text-word" key={`word-${visual.length}`}>{word}</span>)
    word = []
  }

  const visit = (nodes: ReactNode, parents: InlineElement[] = []) => {
    Children.forEach(nodes, (node) => {
      if (typeof node === 'string' || typeof node === 'number') {
        const value = String(node)
        text += value

        for (const part of value.split(/(\s+)/)) {
          if (!part) continue
          if (/^\s+$/.test(part)) {
            finishWord()
            visual.push(part)
            characterIndex += Array.from(part).length
            continue
          }

          let content: ReactNode = Array.from(part, (character) => {
            const index = characterIndex++
            return <span className="hover-text-char" data-hover-index={index} key={`char-${index}`}>{character}</span>
          })

          for (let index = parents.length - 1; index >= 0; index--) {
            content = cloneElement(parents[index], { key: `part-${characterIndex}-${index}` }, content)
          }
          word.push(content)
        }
      } else if (isValidElement<{ children?: ReactNode }>(node)) {
        visit(node.props.children, [...parents, node])
      }
    })
  }

  visit(children)
  finishWord()
  return { visual, text }
}

export function HoverText({ children, settleOnLeave = false }: { children: ReactNode; settleOnLeave?: boolean }) {
  const label = useRef<HTMLSpanElement>(null)
  const { visual, text } = splitLabel(children)

  useGSAP(() => {
    const element = label.current
    if (!element) return

    const trigger = element.closest<HTMLElement>('button, a, [data-hover-trigger]') ?? element
    const characters = Array.from(element.querySelectorAll<HTMLElement>('.hover-text-char'))
    const media = gsap.matchMedia()

    media.add('(prefers-reduced-motion: no-preference)', (context) => {
      let revealTween: gsap.core.Tween | undefined
      const playReveal = context.add('playReveal', () => {
        revealTween?.kill()
        gsap.killTweensOf(characters)
        const { from, to } = createCharacterRevealVars()
        revealTween = gsap.fromTo(characters, from, {
          ...to,
          stagger: (index, character: HTMLElement) => Number(character.dataset.hoverIndex ?? index) * to.stagger,
          overwrite: true,
          lazy: !settleOnLeave,
        })
      })

      const onPointerEnter = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') playReveal()
      }
      const onFocus = () => {
        if (trigger.matches(':focus-visible')) playReveal()
      }
      const settle = () => {
        revealTween?.kill()
        revealTween = undefined
        gsap.killTweensOf(characters)
        characters.forEach((character) => {
          for (const property of ['filter', 'opacity', 'visibility', 'will-change']) {
            character.style.removeProperty(property)
          }
        })
      }

      trigger.addEventListener('pointerenter', onPointerEnter)
      trigger.addEventListener('focus', onFocus)
      if (settleOnLeave) {
        trigger.addEventListener('pointerleave', settle)
        trigger.addEventListener('blur', settle)
      }

      return () => {
        trigger.removeEventListener('pointerenter', onPointerEnter)
        trigger.removeEventListener('focus', onFocus)
        if (settleOnLeave) {
          trigger.removeEventListener('pointerleave', settle)
          trigger.removeEventListener('blur', settle)
        }
        settle()
      }
    }, element)

    return () => media.revert()
  }, { scope: label, dependencies: [children, settleOnLeave], revertOnUpdate: true })

  return (
    <span className="hover-text" ref={label}>
      <span className="hover-text-accessible">{text}</span>
      <span className="hover-text-visual" aria-hidden="true">{visual}</span>
    </span>
  )
}
