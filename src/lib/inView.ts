import { createSignal, onCleanup, type Accessor } from 'solid-js'

/**
 * Becomes true once the element enters the viewport (plus `rootMargin`) and stays true — for
 * "load this when it scrolls into view" work. Use as `<div ref={ref}>` + `inView()`.
 */
export function createInView(opts: { rootMargin?: string; root?: Element | null } = {}): {
  ref: (el: Element) => void
  inView: Accessor<boolean>
} {
  const [inView, setInView] = createSignal(false)
  const ref = (el: Element) => {
    if (typeof IntersectionObserver === 'undefined') return setInView(true)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { root: opts.root ?? null, rootMargin: opts.rootMargin ?? '200px 0px' },
    )
    io.observe(el)
    onCleanup(() => io.disconnect())
  }
  return { ref, inView }
}
