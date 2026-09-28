import { For, Show, type JSX } from 'solid-js'
import { CalendarPlus, ChevronDown, Download, ExternalLink, FileDown } from 'lucide-solid'
import {
  AppButton,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownTrigger,
  type AppButtonSize,
  type AppButtonVariant,
} from '@/components/ui'
import { addToCalendar, calendarProviderLabels, type CalendarEvent, type CalendarProvider } from '@/lib/calendar'

const DEFAULT_PROVIDERS: CalendarProvider[] = ['google', 'outlook', 'apple']

/** Web providers open a pre-filled compose page in a new tab; the rest hand over an .ics file. */
const opensNewTab = (p: CalendarProvider) => p === 'google' || p === 'outlook' || p === 'office365'

/** Brand marks from `public/icons`; the generic .ics entry has no brand and falls back to a lucide icon. */
const providerIcons: Partial<Record<CalendarProvider, string>> = {
  google: '/icons/google-calendar-2026.svg',
  outlook: '/icons/outlook-calendar.svg',
  office365: '/icons/outlook-calendar.svg',
  apple: '/icons/ios-calendar.svg',
}

function ProviderIcon(props: { provider: CalendarProvider }) {
  const src = () => providerIcons[props.provider]
  return (
    <Show when={src()} fallback={<FileDown class="mr-1" aria-hidden="true" />}>
      {(s) => <img src={s()} alt="" aria-hidden="true" class="mr-1 size-6 shrink-0" />}
    </Show>
  )
}

export interface AddToCalendarProps {
  event: CalendarEvent
  /** Menu entries, in order. Default: Google · Outlook.com · Apple. `office365` and `ics` are opt-in. */
  providers?: CalendarProvider[]
  /** Trigger text. */
  label?: JSX.Element
  variant?: AppButtonVariant
  size?: AppButtonSize
  placement?: 'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end'
  class?: string
}

/**
 * "Takvime ekle" split button: Google / Outlook deep links + .ics download for Apple Calendar and
 * everything else. Pure client-side — nothing is sent to our backend.
 */
export function AddToCalendar(props: AddToCalendarProps) {
  const providers = () => props.providers ?? DEFAULT_PROVIDERS

  return (
    <AppDropdown placement={props.placement ?? 'bottom-start'}>
      <AppDropdownTrigger
        as={AppButton}
        variant={props.variant ?? 'outline'}
        size={props.size ?? 'md'}
        leftIcon={<CalendarPlus />}
        rightIcon={<ChevronDown />}
        class={props.class}
      >
        {props.label ?? 'Takvime ekle'}
      </AppDropdownTrigger>
      <AppDropdownContent class="w-60">
        <For each={providers()}>
          {(provider) => (
            <AppDropdownItem biggerText onSelect={() => addToCalendar(provider, props.event)}>
              <ProviderIcon provider={provider} />
              {calendarProviderLabels[provider]}
              {opensNewTab(provider) ? (
                <ExternalLink class="ml-auto text-muted-foreground" aria-hidden="true" />
              ) : (
                <Download class="ml-auto text-muted-foreground" aria-hidden="true" />
              )}
            </AppDropdownItem>
          )}
        </For>
      </AppDropdownContent>
    </AppDropdown>
  )
}
