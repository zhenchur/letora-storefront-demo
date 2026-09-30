export const CHARACTER_REVEAL_CLEAR_PROPS = 'filter,opacity,visibility,willChange'

// Shared by link hover and character-by-character appearances.
export function createCharacterRevealVars() {
  return {
    from: {
      autoAlpha: 0,
      filter: 'blur(6px)',
      willChange: 'opacity, filter',
    },
    to: {
      autoAlpha: 1,
      filter: 'blur(0px)',
      duration: 0.6,
      ease: 'quart.out',
      stagger: 0.028,
      clearProps: CHARACTER_REVEAL_CLEAR_PROPS,
    },
  }
}
