import { AddToCalendar } from '@/components/AddToCalendar'
import { buildIcs, googleCalendarUrl, outlookCalendarUrl, type CalendarEvent } from '@/lib/calendar'
import { Block, Cell, createKnobs, DevSection, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'calendar', title: 'AddToCalendar', group: 'Composed' }

const variants = ['outline', 'primary', 'secondary', 'primaryOutline', 'ghost'] as const
const sizes = ['sm', 'md', 'lg'] as const

const sampleEvent = (): CalendarEvent => {
  const start = new Date()
  start.setDate(start.getDate() + 3)
  start.setHours(14, 0, 0, 0)
  return {
    id: 'interview-demo-123',
    title: 'Mülakat — Acme Teknoloji A.Ş.',
    start,
    end: new Date(start.getTime() + 45 * 60 * 1000),
    description: 'Pozisyon: Frontend Developer\nGörüşmeci: İK ekibi; lütfen 5 dk erken katılın.',
    location: 'Maslak, Sarıyer / İstanbul',
    url: 'https://basvuru.kariyerzamani.com/basvurularim/123',
    reminderMinutes: 30,
  }
}

export function CalendarSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      size: { type: 'select', options: sizes },
      office365: { type: 'boolean', label: 'Microsoft 365' },
      ics: { type: 'boolean', label: '.ics indir' },
    },
    { variant: 'outline', size: 'md', office365: false, ics: false },
  )
  const ev = sampleEvent()
  const providers = (v: { office365: boolean; ics: boolean }) => [
    'google' as const,
    'outlook' as const,
    ...(v.office365 ? ['office365' as const] : []),
    'apple' as const,
    ...(v.ics ? ['ics' as const] : []),
  ]

  return (
    <DevSection
      meta={meta}
      description="Google / Outlook derin bağlantı + Apple Takvim için .ics indirme. Tamamen istemci tarafı; OAuth yok, backend yok. Öğe simgesi yeni sekme mi (↗) dosya mı (↓) olduğunu gösterir."
      imports="import { AddToCalendar } from '@/components/AddToCalendar'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          render={(v) => <AddToCalendar event={ev} variant={v.variant} size={v.size} providers={providers(v)} />}
          code={(v) =>
            `<AddToCalendar\n  event={{ id, title, start, end, description, location, url, reminderMinutes: 30 }}\n  variant="${v.variant}"\n  size="${v.size}"${v.office365 || v.ics ? `\n  providers={${JSON.stringify(providers(v))}}` : ''}\n/>`
          }
        />
      </Block>
      <Block title="Generated output" description="Aynı örnek etkinlik için üretilen bağlantılar ve .ics içeriği.">
        <Preview align="stretch" class="flex-col">
          <Cell label="google" class="min-w-0 w-full">
            <code class="block w-full truncate font-mono text-xs text-muted-foreground">{googleCalendarUrl(ev)}</code>
          </Cell>
          <Cell label="outlook" class="min-w-0 w-full">
            <code class="block w-full truncate font-mono text-xs text-muted-foreground">{outlookCalendarUrl(ev)}</code>
          </Cell>
          <Cell label="ics" class="min-w-0 w-full">
            <pre class="w-full overflow-x-auto rounded-2xl border border-border bg-background p-3 font-mono text-xs text-muted-foreground">
              {buildIcs(ev)}
            </pre>
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
