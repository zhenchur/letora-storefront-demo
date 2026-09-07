export type CursorInput = {
  pointerType: string
  clientX: number
  clientY: number
  target: EventTarget | null
}

export const FINE_POINTER_QUERY: string

export class CursorLineEffect {
  constructor(canvas: HTMLCanvasElement, options?: { strokeStyle?: string })
  start(): void
  stop(clearCanvas?: boolean): void
  handlePointer(input: CursorInput): void
  handleScroll(deltaX: number, deltaY: number): void
  releaseAt(x: number, y: number): void
  destroy(): void
}

export class CursorPointEffect {
  constructor(element: HTMLElement, options?: { pointerSelector?: string; dragSelector?: string })
  start(): void
  stop(): void
  handlePointer(input: CursorInput): void
  refreshInteractionMode(): string
  destroy(): void
}
