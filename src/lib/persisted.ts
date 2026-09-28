import { createEffect, createSignal, on, type Signal } from 'solid-js'

/**
 * A signal mirrored to localStorage (view preferences, dismissed hints…). Reads once on creation,
 * writes on every change; storage errors (private mode, quota) are swallowed so the signal still works.
 */
export function createPersistedSignal<T extends string>(key: string, initial: T, valid?: readonly T[]): Signal<T> {
  const read = (): T => {
    try {
      const v = localStorage.getItem(key)
      if (v !== null && (!valid || valid.includes(v as T))) return v as T
    } catch {
      /* storage unavailable */
    }
    return initial
  }
  const [value, setValue] = createSignal<T>(read())
  createEffect(
    on(
      value,
      (v) => {
        try {
          localStorage.setItem(key, v)
        } catch {
          /* storage unavailable */
        }
      },
      { defer: true },
    ),
  )
  return [value, setValue]
}
