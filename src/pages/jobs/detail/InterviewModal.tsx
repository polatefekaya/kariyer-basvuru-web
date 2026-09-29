import { createMemo, createSignal, Show } from 'solid-js'
import {
  AppButton,
  AppInput,
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  AppSegmentedControl,
  AppSelect,
  AppTextArea,
  toast,
} from '@/components/ui'
import {
  INTERVIEW_TYPE_LABELS,
  useCreateInterview,
  useInterviewers,
  useUpdateInterview,
  type Interview,
  type InterviewType,
} from '@/features/hiring'
import { applicantName, type ApplicationRow } from '@/features/applications'
import { recruitingFieldErrors } from '@/lib/api'
import { track } from '@/lib/analytics'

/**
 * The zone the meeting is held in, not the one the recruiter happens to sit in — the candidate
 * reads the time in this one, so it is a field rather than an assumption.
 */
const BROWSER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'

const TIME_ZONES = [...new Set([BROWSER_ZONE, 'Europe/Istanbul', 'Europe/Berlin', 'Europe/London', 'UTC'])].map(
  (zone) => ({ value: zone, label: zone }),
)

/** Same limits the service enforces. */
const MAX_MESSAGE = 500
const MAX_PARTICIPANTS = 10

const DURATIONS = [
  { value: '15', label: '15 dakika' },
  { value: '30', label: '30 dakika' },
  { value: '45', label: '45 dakika' },
  { value: '60', label: '1 saat' },
  { value: '90', label: '1,5 saat' },
]
const TYPES: { value: InterviewType; label: string }[] = (['VIDEO', 'IN_PERSON', 'PHONE'] as InterviewType[]).map(
  (type) => ({ value: type, label: INTERVIEW_TYPE_LABELS[type] }),
)

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
const toLocalInput = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface InterviewModalProps {
  /** The application being scheduled; `null` closes the modal. */
  application: ApplicationRow | null
  /** Pass an existing interview to edit instead of creating one. */
  interview?: Interview | null
  jobUid: string
  onClose: () => void
  /** Fired after a new interview is scheduled, so the page can offer "Takvime ekle" straight away. */
  onCreated?: (interview: Interview) => void
}

/** Schedule (or reschedule) an interview and record who invited the candidate. */
export function InterviewModal(props: InterviewModalProps) {
  const people = useInterviewers()
  const create = useCreateInterview()
  const update = useUpdateInterview()

  const [when, setWhen] = createSignal('')
  const [duration, setDuration] = createSignal('45')
  const [type, setType] = createSignal<InterviewType>('VIDEO')
  const [location, setLocation] = createSignal('')
  const [interviewer, setInterviewer] = createSignal('')
  const [note, setNote] = createSignal('')
  const [message, setMessage] = createSignal('')
  const [participants, setParticipants] = createSignal('')
  const [timeZone, setTimeZone] = createSignal(BROWSER_ZONE)
  const [touched, setTouched] = createSignal(false)
  // Field errors the service reported, so a rejected save says which field and why.
  const [serverErrors, setServerErrors] = createSignal<Record<string, string[]>>({})
  const fieldError = (field: string) => serverErrors()[field]?.[0]

  // Re-seed the form whenever a different application / interview opens it.
  const seed = createMemo(() => {
    const i = props.interview
    setWhen(toLocalInput(i?.startsAt))
    setDuration(String(i?.durationMinutes ?? 45))
    setType(i?.type ?? 'VIDEO')
    setLocation(i?.location ?? '')
    setInterviewer(i?.interviewer.uid ?? people.data?.[0]?.uid ?? '')
    setNote(i?.note ?? '')
    setMessage(i?.candidateMessage ?? '')
    setParticipants((i?.participants ?? []).map((p) => p.email).join(', '))
    setTimeZone(i?.timeZone || BROWSER_ZONE)
    setTouched(false)
    return props.application?.id ?? null
  })

  const locationLabel = () =>
    type() === 'VIDEO' ? 'Toplantı bağlantısı' : type() === 'IN_PERSON' ? 'Adres' : 'Telefon numarası'
  const locationRequired = () => type() !== 'PHONE'

  // Mirrors the service's own rules (InterviewRules) so a mistake is caught before the round trip.
  const emails = createMemo(() =>
    participants()
      .split(/[,;\s]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  )
  const invalidEmails = createMemo(() => emails().filter((value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))
  const duplicateEmails = createMemo(() => {
    const seen = new Set<string>()
    return emails().filter((value) => !seen.add(value.toLocaleLowerCase('tr-TR')))
  })

  const participantsError = () => {
    if (invalidEmails().length > 0) return `Geçersiz e-posta: ${invalidEmails()[0]}`
    if (duplicateEmails().length > 0) return `Aynı e-posta iki kez: ${duplicateEmails()[0]}`
    if (emails().length > MAX_PARTICIPANTS) return `En fazla ${MAX_PARTICIPANTS} katılımcı eklenebilir`
    return undefined
  }
  const messageError = () =>
    message().length > MAX_MESSAGE ? `Mesaj en fazla ${MAX_MESSAGE} karakter olabilir` : undefined

  const valid = () =>
    !!when() &&
    !!interviewer() &&
    (!locationRequired() || !!location().trim()) &&
    !participantsError() &&
    !messageError()

  const submit = () => {
    setTouched(true)
    setServerErrors({})
    const app = props.application
    if (!app || !valid()) return
    const payload = {
      type: type(),
      startsAt: new Date(when()).toISOString(),
      durationMinutes: Number(duration()),
      timeZone: timeZone(),
      videoUrl: type() === 'VIDEO' ? location().trim() || null : null,
      location: type() === 'VIDEO' ? null : location().trim() || null,
      interviewerUid: interviewer(),
      // Goes to the candidate in the invitation e-mail; the note below never leaves the company.
      candidateMessage: message().trim() || null,
      participants: emails().map((email) => ({ email, role: 'INTERVIEWER' as const })),
      internalNote: note().trim() || null,
    }
    if (props.interview) {
      update.mutate(
        { uid: props.interview.uid, input: payload },
        {
          onSuccess: () => {
            toast.success('Mülakat güncellendi')
            props.onClose()
          },
          onError: (error) => {
            setServerErrors(recruitingFieldErrors(error))
            toast.error('Mülakat güncellenemedi')
          },
        },
      )
      return
    }
    create.mutate(
      { applicationUid: app.id, input: payload },
      {
        onSuccess: (interview) => {
          track('interview_invite_sent', {
            type: payload.type,
            duration: payload.durationMinutes,
            participantCount: payload.participants.length,
          })
          toast.success(`${applicantName(app)} mülakata davet edildi`)
          props.onCreated?.(interview)
          props.onClose()
        },
        onError: (error) => {
          setServerErrors(recruitingFieldErrors(error))
          toast.error('Mülakat oluşturulamadı')
        },
      },
    )
  }

  return (
    <AppModal open={props.application !== null} onOpenChange={(open) => !open && props.onClose()}>
      <AppModalContent size="md">
        <AppModalHeader>
          <AppModalTitle>{props.interview ? 'Mülakatı düzenle' : 'Mülakata davet et'}</AppModalTitle>
          <AppModalDescription>
            {props.application ? applicantName(props.application) : ''} · {props.application?.job.title ?? ''}
          </AppModalDescription>
        </AppModalHeader>

        <Show when={seed() !== null}>
          <div class="flex flex-col gap-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <AppInput
                type="datetime-local"
                label="Tarih ve saat"
                value={when()}
                onChange={setWhen}
                min={toLocalInput(new Date().toISOString())}
                error={(touched() && !when() ? 'Tarih seçin' : undefined) ?? fieldError('startsAt')}
                required
              />
              <AppSelect label="Süre" options={DURATIONS} value={duration()} onChange={setDuration} />

              <AppSelect
                label="Saat dilimi"
                options={TIME_ZONES}
                value={timeZone()}
                onChange={setTimeZone}
                class="sm:col-span-2"
              />
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-sm text-foreground">Görüşme şekli</span>
              <AppSegmentedControl<InterviewType>
                size="md"
                options={TYPES}
                value={type()}
                onChange={setType}
                aria-label="Görüşme şekli"
              />
            </div>

            <AppInput
              label={locationLabel()}
              value={location()}
              onChange={setLocation}
              required={locationRequired()}
              error={
                (touched() && locationRequired() && !location().trim()
                  ? type() === 'VIDEO'
                    ? 'Toplantı bağlantısı zorunludur'
                    : 'Adres zorunludur'
                  : undefined) ??
                (fieldError('videoUrl') || fieldError('location'))
              }
              placeholder={type() === 'VIDEO' ? 'https://meet.google.com/…' : undefined}
            />

            <AppSelect
              label="Görüşmeyi yapacak kişi"
              options={(people.data ?? []).map((u) => ({
                value: u.uid,
                label: u.position ? `${u.name} · ${u.position}` : u.name,
              }))}
              value={interviewer()}
              onChange={setInterviewer}
              placeholder="Seçin"
              error={(touched() && !interviewer() ? 'Bir kişi seçin' : undefined) ?? fieldError('interviewerUid')}
              required
            />

            <AppTextArea
              label="Adaya mesaj (isteğe bağlı)"
              value={message()}
              onChange={setMessage}
              rows={3}
              maxLength={MAX_MESSAGE}
              showCount
              placeholder="Davet e-postasında adaya iletilir: görüşmede neleri konuşacağınız, hazırlık isteyen bir şey…"
              error={messageError() ?? fieldError('candidateMessage')}
            />

            <AppInput
              label="Diğer görüşmeciler (isteğe bağlı)"
              value={participants()}
              onChange={setParticipants}
              placeholder="ayse@sirket.com, mehmet@sirket.com"
              hint="Virgülle ayırın; davet onlara da iletilir."
              error={participantsError() ?? fieldError('participants')}
            />

            <AppTextArea
              label="Ekip notu (isteğe bağlı)"
              value={note()}
              onChange={setNote}
              rows={2}
              placeholder="Yalnızca ekibiniz görür; adaya gönderilmez."
            />
          </div>
        </Show>

        <AppModalFooter>
          <AppButton variant="outline" onClick={props.onClose}>
            Vazgeç
          </AppButton>
          <AppButton loading={create.isPending || update.isPending} onClick={submit}>
            {props.interview ? 'Kaydet' : 'Daveti gönder'}
          </AppButton>
        </AppModalFooter>
      </AppModalContent>
    </AppModal>
  )
}
