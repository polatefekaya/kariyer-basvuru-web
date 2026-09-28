import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js'
import { AppTextArea } from '@/components/ui'
import { useSaveNote, type ApplicationNote, type ApplicationRow } from '@/features/applications'
import { formatDateTime } from '@/lib/format'
import { track } from '@/lib/analytics'

export interface ApplicantNotesProps {
  application: ApplicationRow
  note: ApplicationNote | undefined
  jobUid: string
}

const AUTOSAVE_MS = 900

/** Matches the service's NoteRules. */
const MAX_NOTE = 2000

/**
 * The team's notepad about one applicant: a single field edited in place. Not a comment thread —
 * typing and stopping saves it.
 */
export function ApplicantNotes(props: ApplicantNotesProps) {
  const save = useSaveNote(() => props.jobUid)
  const [body, setBody] = createSignal(props.note?.body ?? '')
  const [dirty, setDirty] = createSignal(false)

  createEffect(
    on(
      () => props.note?.body ?? '',
      (stored) => {
        if (!dirty()) setBody(stored)
      },
    ),
  )

  let timer: ReturnType<typeof setTimeout> | undefined
  const flush = () => {
    clearTimeout(timer)
    if (!dirty()) return
    setDirty(false)
    track('application_note_created', { applicationId: props.application.id, noteLength: body().trim().length })
    save.mutate({ uid: props.application.id, body: body() })
  }
  const edit = (v: string) => {
    setBody(v)
    setDirty(true)
    clearTimeout(timer)
    timer = setTimeout(flush, AUTOSAVE_MS)
  }
  onCleanup(flush)

  const status = () => {
    if (save.isPending) return 'Kaydediliyor…'
    if (dirty()) return 'Kaydedilmemiş değişiklik'
    if (save.isError) return 'Kaydedilemedi'
    if (props.note) {
      const who = props.note.author?.name
      return `${who ? `Son güncelleme: ${who} · ` : 'Kaydedildi · '}${formatDateTime(props.note.updatedAt)}`
    }
    return 'Yazdıkça otomatik kaydedilir'
  }

  return (
    <section class="flex max-w-4xl flex-col gap-2">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 class="text-sm text-muted-foreground">Not · yalnızca ekibiniz görür</h4>
        <span class="text-sm text-muted-foreground">{status()}</span>
      </div>
      <AppTextArea
        value={body()}
        onChange={edit}
        onBlur={flush}
        rows={4}
        autoResize
        placeholder="Bu aday hakkında bilmeniz gerekenler: görüşme izlenimi, maaş beklentisi, sonraki adım…"
        aria-label="Aday notu"
        maxLength={MAX_NOTE}
      />
      {/* KVKK: notes are free text about a real person, and the team writing them is the only
          control there is. Technical document §11. */}
      <span class="text-sm text-muted-foreground">
        Değerlendirme notlarında adayın hassas kişisel verilerini paylaşmayın.
      </span>
      <Show when={save.isError}>
        <span class="text-sm text-destructive">Not kaydedilemedi, tekrar deneyin.</span>
      </Show>
    </section>
  )
}
