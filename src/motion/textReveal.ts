export const TEXT_REVEAL_CLEAR_PROPS =
  'filter,opacity,transform,transformOrigin,visibility,willChange'

export const TEXT_EXIT_MOTION = {
  duration: 0.4,
  ease: 'power2.out',
  stagger: 0.08,
} as const

// Display text and controls share a small lift; running copy keeps its line motion.
export function createTextRevealVars({ bodyCopy = false }: { bodyCopy?: boolean } = {}) {
  return {
    from: {
      autoAlpha: 0,
      filter: 'blur(6px)',
      y: bodyCopy ? 0 : 22,
      yPercent: bodyCopy ? 125 : 0,
      rotation: bodyCopy ? 3 : 0,
      transformOrigin: '0% 100%',
      willChange: 'transform, opacity, filter',
    },
    to: {
      autoAlpha: 1,
      filter: 'blur(0px)',
      y: 0,
      yPercent: 0,
      rotation: 0,
      duration: 0.8,
      ease: 'power2.out',
      stagger: { each: 0.08, from: 'start' as const },
      clearProps: TEXT_REVEAL_CLEAR_PROPS,
    },
  }
}
