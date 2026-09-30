export function CategoryCharacters({ text, entrance = false, offset = 0 }: {
  text: string
  entrance?: boolean
  offset?: number
}) {
  return Array.from(text, (character, index) => {
    if (/\s/.test(character)) return character
    const content = (
      <span className="categories__hover-character" data-category-character-index={offset + index} key={index}>
        {character}
      </span>
    )
    return entrance ? (
      <span className="categories__entrance-character" data-category-character-index={offset + index} key={index}>
        {content}
      </span>
    ) : content
  })
}
