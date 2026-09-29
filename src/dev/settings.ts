import { createStore } from 'solid-js/store'

export type Viewport = 'full' | 'desktop' | 'tablet' | 'mobile'
export type Surface = 'background' | 'card' | 'muted'

export const viewportWidths: Record<Viewport, string | undefined> = {
  full: undefined,
  desktop: '1024px',
  tablet: '768px',
  mobile: '400px',
}

export const surfaceClasses: Record<Surface, string> = {
  background: 'bg-background',
  card: 'bg-card',
  muted: 'bg-muted/60',
}

export const [devSettings, setDevSettings] = createStore({
  viewport: 'full' as Viewport,
  surface: 'background' as Surface,
  /** Draw a dashed outline around every preview so spacing is visible. */
  outlines: false,
})
