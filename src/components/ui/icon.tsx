import { Show, type Component, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

/**
 * An icon slot accepts either a component reference (`icon: Briefcase`) or a ready element
 * (`icon: <Briefcase />`). Prefer the component form for anything defined outside render
 * (module-level tab/option arrays): Solid JSX elements are real DOM nodes, so a shared
 * element can only live in one place and silently disappears from the others.
 */
export type IconSlot = Component<{ class?: string }> | JSX.Element

export function IconSlot(props: { icon: IconSlot | undefined; class?: string }) {
  return (
    <Show when={props.icon}>
      {(icon) => {
        const i = icon()
        return typeof i === 'function' ? (
          <Dynamic component={i as Component<{ class?: string }>} class={props.class} />
        ) : (
          (i as JSX.Element)
        )
      }}
    </Show>
  )
}
