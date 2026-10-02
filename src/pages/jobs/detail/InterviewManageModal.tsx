import { createEffect, createSignal, For, Match, on, Show, Switch, type JSX } from 'solid-js'
import { CalendarClock, CalendarPlus, CircleCheck, CircleSlash, UserX } from 'lucide-solid'
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  AppRadioGroup,
  AppTextArea,
  toast,
} from '@/components/ui'
import {
  awaitsOutcome,
  formatUserName,
  INTERVIEW_CONFIRMATION_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  interviewActions,
  interviewConfirmationVariant,
  interviewStatusVariant,
  isOngoing,
  useCancelInterview,
  useUpdateInterview,
  type Interview,
  type InterviewResult,
} from '@/features/hiring'
import { applicantName, type ApplicationRow } from '@/features/applications'
import { AddToCalendar } from '@/components/AddToCalendar'
import { formatDateTime, formatRelative } from '@/lib/format'
import { interviewEvent } from './interviewEvent'

/** Same limit the service enforces on the message a cancellation e-mail quotes. */
const MAX_MESSAGE = 500

export type InterviewManageView = 'overview' | 'complete' | 'noShow' | 'cancel'

const RESULTS: { value: InterviewResult; label: string; description: string }[] = [
  { value: 'POSITIVE', label: 'Olumlu', description: 'Süreçte ilerlemeye değer' },
  { value: 'UNDECIDED', label: 'Kararsız', description: 'Bir görüşme daha ya da ekip kararı gerekiyor' },
  { value: 'NEGATIVE', label: 'Olumsuz', description: 'Bu pozisyon için uygun değil' },
]

const resultVariant = (result: InterviewResult) =>
  result === 'POSITIVE' ? 'successSubtle' : result === 'NEGATIVE' ? 'destructiveSubtle' : 'muted'

function Fact(props: { label: string; children: JSX.Element }) {
  return (
    <div class="flex flex-col gap-1">
      <dt class="text-sm text-muted-foreground">{props.label}</dt>
      <dd class="text-sm text-foreground">{props.children}</dd>
    </div>
  )
}

export interface InterviewManageModalProps {
  /** `null` closes the modal. */
  interview: Interview | null
  application: ApplicationRow | undefined
  /** Which step to open on — the board's shortcuts open straight on "complete" or "cancel". */
  initialView?: InterviewManageView
  onClose: () => void
  /** Opens the scheduling form on this interview. */
  onReschedule: (interview: Interview) => void
  /** Opens the scheduling form for a new interview with the same applicant. */
  onReinvite: (interview: Interview) => void
}

/**
 * One interview from invitation to outcome: what was planned, what the candidate answered, and
 * the moves the service allows from here — reschedule, record how it went, mark a no-show, cancel
 * with a note to the candidate, or plan the next round. Every move applies optimistically.
 */
export function InterviewManageModal(props: InterviewManageModalProps) {
  const update = useUpdateInterview()
  const cancel = useCancelInterview()

  const [view, setView] = createSignal<InterviewManageView>('overview')
  const [result, setResult] = createSignal<InterviewResult | undefined>()
  const [note, setNote] = createSignal('')
  const [message, setMessage] = createSignal('')
  const [touched, setTouched] = createSignal(false)

  // Follows the live interview (refetches, optimistic patches) but is kept while the modal animates
  // closed, so it never renders an empty frame.
  const [shown, setShown] = createSignal<Interview | null>(null)
  createEffect(() => {
    if (props.interview) setShown(props.interview)
  })

  // The form resets only when a DIFFERENT interview opens — a background refetch of the same one
  // must not wipe an evaluation half written.
  createEffect(
    on(
      () => props.interview?.uid,
      (uid) => {
        const interview = props.interview
        if (!uid || !interview) return
        setView(props.initialView ?? 'overview')
        setResult(interview.result ?? undefined)
        setNote(interview.note ?? '')
        setMessage('')
        setTouched(false)
      },
    ),
  )

  const i = () => shown()!
  const name = () => (props.application ? applicantName(props.application) : 'Aday')
  const actions = () => interviewActions(i())
  const can = (action: ReturnType<typeof interviewActions>[number]) => actions().includes(action)

  const done = (text: string) => {
    toast.success(text)
    props.onClose()
  }

  const complete = () => {
    setTouched(true)
    const chosen = result()
    if (!chosen) return

    update.mutate(
      { uid: i().uid, input: { status: 'COMPLETED', result: chosen, note: note().trim() || null } },
      { onError: () => toast.error('Mülakat sonucu kaydedilemedi') },
    )
    done(`${name()} · mülakat sonucu: ${INTERVIEW_RESULT_LABELS[chosen].toLocaleLowerCase('tr-TR')}`)
  }

  const markNoShow = () => {
    update.mutate(
      { uid: i().uid, input: { status: 'NO_SHOW' } },
      { onError: () => toast.error('Mülakat güncellenemedi') },
    )
    done(`${name()} · katılmadı olarak işaretlendi`)
  }

  const cancelInterview = () => {
    if (message().length > MAX_MESSAGE) return

    cancel.mutate(
      { uid: i().uid, candidateMessage: message().trim() || null },
      { onError: () => toast.error('Mülakat iptal edilemedi') },
    )
    done(`${name()} ile mülakat iptal edildi`)
  }

  const title = () =>
    ({
      overview: 'Mülakat',
      complete: i().status === 'COMPLETED' ? 'Sonucu düzenle' : 'Mülakatı sonuçlandır',
      noShow: 'Katılmadı olarak işaretle',
      cancel: 'Mülakatı iptal et',
    })[view()]

  return (
    <AppModal open={props.interview !== null} onOpenChange={(open) => !open && props.onClose()}>
      <AppModalContent size="md">
        <Show when={shown()}>
          <AppModalHeader>
            <AppModalTitle>{title()}</AppModalTitle>
            <AppModalDescription>
              {name()} · {formatDateTime(i().startsAt)}
            </AppModalDescription>
          </AppModalHeader>

          <Switch>
            <Match when={view() === 'overview'}>
              <div class="flex flex-col gap-5">
                <div class="flex flex-wrap items-center gap-2">
                  <AppBadge variant={isOngoing(i()) ? 'primarySubtle' : interviewStatusVariant[i().status]} size="sm">
                    {isOngoing(i()) ? 'Şu an görüşmede' : INTERVIEW_STATUS_LABELS[i().status]}
                  </AppBadge>
                  <Show when={i().status === 'SCHEDULED'}>
                    <AppBadge variant={interviewConfirmationVariant[i().confirmationStatus]} size="sm">
                      {INTERVIEW_CONFIRMATION_LABELS[i().confirmationStatus]}
                    </AppBadge>
                  </Show>
                  <Show when={i().result}>
                    <AppBadge variant={resultVariant(i().result!)} size="sm">
                      Sonuç: {INTERVIEW_RESULT_LABELS[i().result!]}
                    </AppBadge>
                  </Show>
                </div>

                <Show when={awaitsOutcome(i())}>
                  <AppAlert
                    variant="info"
                    title="Görüşme saati geçti"
                    description="Nasıl geçtiğini kaydedin ya da aday gelmediyse katılmadı olarak işaretleyin."
                  />
                </Show>
                <Show when={i().status === 'SCHEDULED' && i().confirmationStatus === 'DECLINED'}>
                  <AppAlert
                    variant="warning"
                    title="Aday daveti reddetti"
                    description="Yeni bir saat önermek için mülakatı yeniden planlayabilir ya da iptal edebilirsiniz."
                  />
                </Show>

                <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Fact label="Tarih">
                    {formatDateTime(i().startsAt)} · {formatRelative(i().startsAt)}
                  </Fact>
                  <Fact label="Süre ve şekil">
                    {i().durationMinutes} dk · {INTERVIEW_TYPE_LABELS[i().type]}
                  </Fact>
                  <Fact label="Görüşmeyi yapan">{formatUserName(i().interviewer.name)}</Fact>
                  <Fact label="Davet eden">{formatUserName(i().invitedBy.name)}</Fact>
                  <Show when={i().location}>
                    <Fact label={i().type === 'VIDEO' ? 'Toplantı bağlantısı' : i().type === 'PHONE' ? 'Telefon' : 'Adres'}>
                      <Show when={i().type === 'VIDEO'} fallback={i().location}>
                        <a
                          href={i().location!}
                          target="_blank"
                          rel="noreferrer noopener"
                          class="break-all text-primary underline-offset-4 hover:text-primary-hover hover:underline"
                        >
                          {i().location}
                        </a>
                      </Show>
                    </Fact>
                  </Show>
                  <Show when={i().participants.length > 0}>
                    <Fact label="Diğer görüşmeciler">
                      <For each={i().participants}>{(p) => <span class="block">{p.name || p.email}</span>}</For>
                    </Fact>
                  </Show>
                  <Show when={i().candidateMessage}>
                    <div class="sm:col-span-2">
                      <Fact label="Adaya mesaj">
                        <span class="whitespace-pre-line">{i().candidateMessage}</span>
                      </Fact>
                    </div>
                  </Show>
                  <Show when={i().note}>
                    <div class="sm:col-span-2">
                      <Fact label="Ekip notu · değerlendirme">
                        <span class="whitespace-pre-line">{i().note}</span>
                      </Fact>
                    </div>
                  </Show>
                </dl>
              </div>
            </Match>

            <Match when={view() === 'complete'}>
              <div class="flex flex-col gap-5">
                <AppRadioGroup<InterviewResult>
                  label="Görüşme nasıl geçti?"
                  variant="card"
                  options={RESULTS}
                  value={result()}
                  onChange={setResult}
                  error={touched() && !result() ? 'Bir sonuç seçin' : undefined}
                  required
                />
                <AppTextArea
                  label="Değerlendirme (isteğe bağlı)"
                  value={note()}
                  onChange={setNote}
                  rows={4}
                  placeholder="Güçlü yanlar, çekinceler, sonraki adım…"
                  hint="Yalnızca ekibiniz görür; sonuç adaya iletilmez."
                />
              </div>
            </Match>

            <Match when={view() === 'noShow'}>
              <p class="text-sm text-foreground">
                {name()} bu görüşmeye katılmadı olarak işaretlenecek. Adaya e-posta gönderilmez; isterseniz ardından yeni bir
                mülakat planlayabilirsiniz.
              </p>
            </Match>

            <Match when={view() === 'cancel'}>
              <div class="flex flex-col gap-4">
                <p class="text-sm text-foreground">
                  Mülakat iptal edilecek ve {name()} e-postayla bilgilendirilecek. Başvurusu açık kalır; dilerseniz daha sonra
                  yeni bir mülakat planlayabilirsiniz.
                </p>
                <AppTextArea
                  label="Adaya mesaj (isteğe bağlı)"
                  value={message()}
                  onChange={setMessage}
                  rows={3}
                  maxLength={MAX_MESSAGE}
                  showCount
                  placeholder="İptal e-postasında yer alır: nedeni, yeni bir tarih için ne zaman döneceğiniz…"
                />
              </div>
            </Match>
          </Switch>

          <AppModalFooter>
            <Switch>
              <Match when={view() === 'overview'}>
                <div class="flex w-full flex-wrap items-center justify-end gap-2">
                  <Show when={i().status === 'SCHEDULED'}>
                    <AddToCalendar
                      size="sm"
                      variant="ghost"
                      label="Takvime ekle"
                      placement="top-start"
                      event={interviewEvent(i(), props.application)}
                    />
                  </Show>
                  <Show when={can('cancel')}>
                    <AppButton size="sm" variant="ghost" leftIcon={<CircleSlash />} onClick={() => setView('cancel')}>
                      İptal et
                    </AppButton>
                  </Show>
                  <Show when={can('noShow')}>
                    <AppButton size="sm" variant="ghost" leftIcon={<UserX />} onClick={() => setView('noShow')}>
                      Katılmadı
                    </AppButton>
                  </Show>
                  <Show when={can('reschedule')}>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      leftIcon={<CalendarClock />}
                      onClick={() => props.onReschedule(i())}
                    >
                      Yeniden planla
                    </AppButton>
                  </Show>
                  <Show when={can('reinvite')}>
                    <AppButton
                      size="sm"
                      variant={can('complete') ? 'secondary' : 'primary'}
                      leftIcon={<CalendarPlus />}
                      onClick={() => props.onReinvite(i())}
                    >
                      Yeni mülakat planla
                    </AppButton>
                  </Show>
                  <Show when={can('complete')}>
                    <AppButton size="sm" leftIcon={<CircleCheck />} onClick={() => setView('complete')}>
                      {i().status === 'COMPLETED' ? 'Sonucu düzenle' : 'Sonuçlandır'}
                    </AppButton>
                  </Show>
                </div>
              </Match>

              <Match when={view() !== 'overview'}>
                <AppButton variant="outline" onClick={() => setView('overview')}>
                  Geri
                </AppButton>
                <Switch>
                  <Match when={view() === 'complete'}>
                    <AppButton onClick={complete}>Kaydet</AppButton>
                  </Match>
                  <Match when={view() === 'noShow'}>
                    <AppButton variant="danger" onClick={markNoShow}>
                      Katılmadı olarak işaretle
                    </AppButton>
                  </Match>
                  <Match when={view() === 'cancel'}>
                    <AppButton variant="danger" onClick={cancelInterview}>
                      Mülakatı iptal et
                    </AppButton>
                  </Match>
                </Switch>
              </Match>
            </Switch>
          </AppModalFooter>
        </Show>
      </AppModalContent>
    </AppModal>
  )
}
