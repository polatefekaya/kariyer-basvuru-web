import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js'
import { Send, TriangleAlert } from 'lucide-solid'
import {
  AppAlert,
  AppAvatar,
  AppBadge,
  AppButton,
  AppCheckbox,
  AppInput,
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  AppSkeleton,
  AppTextArea,
  AppTooltip,
  focusRingClass,
  toast,
} from '@/components/ui'
import {
  APPLICATION_STAGES,
  STAGE_LABELS,
  stageVariant,
  useMessageAudience,
  useSendCandidateMessage,
  type ApplicationStage,
  type MessageRecipient,
} from '@/features/applications'
import { formatDateTime, formatNumber, formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import { track } from '@/lib/analytics'

/** Same limits the recruiting service enforces (MessageRules). */
const MAX_SUBJECT = 150
const MAX_BODY = 2000
const MAX_RECIPIENTS = 500

// A candidate's own withdrawal is not a group a company writes to.
const STAGES: ApplicationStage[] = APPLICATION_STAGES.filter((s) => s !== 'WITHDRAWN')

export interface CandidateMessageModalProps {
  open: boolean
  jobUid: string
  jobTitle: string
  /** Applications per stage, for the counts on the stage chips. */
  stageCounts: Record<string, number>
  /**
   * Opened from a selection: message exactly these applications instead of choosing by stage.
   * Null or empty opens the stage picker.
   */
  applicationUids?: string[] | null
  onClose: () => void
}

/**
 * "Adaylarla iletişime geç": write once, send to a group of this posting's applicants — chosen by
 * stage, or the rows selected in the list. Anyone who already received a message is flagged, and
 * one click leaves them all out; any single person can be left out by hand.
 */
export function CandidateMessageModal(props: CandidateMessageModalProps) {
  const [stages, setStages] = createSignal<ApplicationStage[]>([])
  const [excluded, setExcluded] = createSignal<ReadonlySet<string>>(new Set())
  const [subject, setSubject] = createSignal('')
  const [body, setBody] = createSignal('')
  const [touched, setTouched] = createSignal(false)

  const preset = () => (props.applicationUids?.length ? new Set(props.applicationUids) : null)

  // A fresh form each time the modal opens.
  createEffect(
    on(
      () => props.open,
      (open) => {
        if (!open) return
        setStages([])
        setExcluded(new Set<string>())
        setSubject('')
        setBody('')
        setTouched(false)
      },
    ),
  )

  // A selection asks for the whole posting and keeps the selected rows; the picker asks by stage.
  const audience = useMessageAudience(
    () => props.jobUid,
    () => (preset() ? [] : stages()),
    () => props.open && (!!preset() || stages().length > 0),
  )
  const send = useSendCandidateMessage(() => props.jobUid)

  const recipients = createMemo<MessageRecipient[]>(() => {
    const all = audience.data ?? []
    const only = preset()
    return only ? all.filter((r) => only.has(r.applicationUid)) : all
  })
  const reachable = (r: MessageRecipient) => !!r.email
  const included = createMemo(() => recipients().filter((r) => reachable(r) && !excluded().has(r.applicationUid)))
  const messagedBefore = createMemo(() => recipients().filter((r) => reachable(r) && r.lastMessagedAt))
  const allMessagedOut = () =>
    messagedBefore().length > 0 && messagedBefore().every((r) => excluded().has(r.applicationUid))

  const toggleStage = (stage: ApplicationStage) =>
    setStages((prev) => (prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]))

  const setIncluded = (uid: string, include: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (include) next.delete(uid)
      else next.add(uid)
      return next
    })

  const toggleMessagedBefore = () =>
    setExcluded((prev) => {
      const next = new Set(prev)
      const out = !allMessagedOut()
      for (const r of messagedBefore()) {
        if (out) next.add(r.applicationUid)
        else next.delete(r.applicationUid)
      }
      return next
    })

  const bodyError = () =>
    touched() && !body().trim()
      ? 'Mesaj yazın'
      : body().length > MAX_BODY
        ? `Mesaj en fazla ${MAX_BODY} karakter olabilir`
        : undefined
  const tooMany = () => included().length > MAX_RECIPIENTS

  const submit = () => {
    setTouched(true)
    const to = included()
    if (to.length === 0 || tooMany() || !body().trim() || body().length > MAX_BODY) return

    track('candidates_messaged', {
      recipientCount: to.length,
      mode: preset() ? 'selection' : 'stages',
      excludedPreviouslyMessaged: messagedBefore().filter((r) => excluded().has(r.applicationUid)).length,
    })

    send.mutate(
      { applicationUids: to.map((r) => r.applicationUid), subject: subject().trim() || null, body: body().trim() },
      {
        onSuccess: (response) => {
          if (response.skipped.length > 0) {
            toast.info(`${formatNumber(response.skipped.length)} adaya gönderilemedi (e-posta adresi yok)`)
          }
        },
        onError: () => toast.error('Mesaj gönderilemedi'),
      },
    )
    toast.success(`Mesaj ${formatNumber(to.length)} adaya gönderiliyor`)
    props.onClose()
  }

  return (
    <AppModal open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <AppModalContent size="lg">
        <AppModalHeader>
          <AppModalTitle>Adaylarla iletişime geç</AppModalTitle>
          <AppModalDescription>
            {props.jobTitle} · Her adaya kendi adıyla ayrı bir e-posta gider; adaylar birbirini görmez.
          </AppModalDescription>
        </AppModalHeader>

        <div class="flex flex-col gap-5">
          <Show
            when={preset()}
            fallback={
              <div class="flex flex-col gap-2">
                <span class="text-sm text-foreground">Hangi adaylara?</span>
                <div class="flex flex-wrap gap-2" role="group" aria-label="Başvuru durumları">
                  <For each={STAGES}>
                    {(stage) => (
                      <button
                        type="button"
                        aria-pressed={stages().includes(stage)}
                        disabled={!props.stageCounts[stage]}
                        onClick={() => toggleStage(stage)}
                        class={cn(
                          'inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-sm transition-colors select-none',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          stages().includes(stage)
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
                          focusRingClass,
                        )}
                      >
                        {STAGE_LABELS[stage]}
                        <span class="text-muted-foreground">{formatNumber(props.stageCounts[stage] ?? 0)}</span>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            }
          >
            <span class="text-sm text-muted-foreground">
              Listede seçtiğiniz {formatNumber(preset()!.size)} başvuru.
            </span>
          </Show>

          <Show when={preset() || stages().length > 0}>
            <section class="flex flex-col gap-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm text-foreground">
                  Alıcılar · {formatNumber(included().length)} / {formatNumber(recipients().filter(reachable).length)}
                </span>
                <Show when={messagedBefore().length > 0}>
                  <AppButton size="xs" variant="ghost" leftIcon={<TriangleAlert />} onClick={toggleMessagedBefore}>
                    {allMessagedOut()
                      ? `Daha önce mesaj alanları geri ekle (${formatNumber(messagedBefore().length)})`
                      : `Daha önce mesaj alanları çıkar (${formatNumber(messagedBefore().length)})`}
                  </AppButton>
                </Show>
              </div>

              <div class="max-h-72 overflow-y-auto rounded-2xl border border-border">
                <Show
                  when={!audience.isPending || audience.data}
                  fallback={
                    <div class="flex flex-col gap-3 p-4">
                      <For each={[0, 1, 2]}>{() => <AppSkeleton variant="text" width="60%" />}</For>
                    </div>
                  }
                >
                  <Show
                    when={recipients().length > 0}
                    fallback={<p class="p-4 text-sm text-muted-foreground">Bu durumlarda başvuru yok.</p>}
                  >
                    <ul class="flex flex-col divide-y divide-border">
                      <For each={recipients()}>
                        {(r) => (
                          <li class="flex items-center gap-3 px-4 py-2.5">
                            <AppCheckbox
                              checked={reachable(r) && !excluded().has(r.applicationUid)}
                              disabled={!reachable(r)}
                              onChange={(checked) => setIncluded(r.applicationUid, checked)}
                              aria-label={`${r.fullName} alıcılara dahil`}
                            />
                            <AppAvatar src={r.avatarUrl} name={r.fullName} size="sm" />
                            <div class="flex min-w-0 flex-1 flex-col">
                              <span class="flex min-w-0 items-center gap-2">
                                <span class="truncate text-sm text-foreground">{r.fullName}</span>
                                <AppBadge variant={stageVariant[r.stage]} size="sm">
                                  {r.stageLabel}
                                </AppBadge>
                              </span>
                              <span class="truncate text-sm text-muted-foreground">
                                {r.email ?? 'E-posta adresi yok · mesaj gönderilemez'}
                              </span>
                            </div>
                            <Show when={reachable(r) && r.lastMessagedAt}>
                              <AppTooltip
                                content={`Bu aday daha önce e-posta aldı · ${formatDateTime(r.lastMessagedAt!)}${
                                  r.messageCount > 1 ? ` · toplam ${r.messageCount} mesaj` : ''
                                }`}
                              >
                                <span class="flex shrink-0 items-center gap-1.5 text-sm text-warning dark:text-warning-foreground">
                                  <TriangleAlert class="size-4" aria-hidden="true" />
                                  <span class="hidden sm:inline">{formatRelative(r.lastMessagedAt!)} mesaj aldı</span>
                                  <span class="sr-only">Bu aday daha önce e-posta aldı</span>
                                </span>
                              </AppTooltip>
                            </Show>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </Show>
              </div>

              <Show when={tooMany()}>
                <AppAlert
                  variant="warning"
                  description={`Tek seferde en fazla ${MAX_RECIPIENTS} adaya gönderilebilir; listeyi daraltın.`}
                />
              </Show>
            </section>
          </Show>

          <AppInput
            label="Konu (isteğe bağlı)"
            value={subject()}
            onChange={setSubject}
            maxLength={MAX_SUBJECT}
            placeholder={`${props.jobTitle} başvurunuz hakkında`}
          />
          <AppTextArea
            label="Mesaj"
            value={body()}
            onChange={setBody}
            rows={6}
            maxLength={MAX_BODY}
            showCount
            required
            placeholder="Merhaba, başvurunuz için teşekkür ederiz…"
            hint="Her e-postada adayın adı, şirketiniz ve ilan başlığı yer alır."
            error={bodyError()}
          />
        </div>

        <AppModalFooter>
          <AppButton variant="outline" onClick={props.onClose}>
            Vazgeç
          </AppButton>
          <AppButton leftIcon={<Send />} disabled={included().length === 0 || tooMany()} onClick={submit}>
            {included().length > 0 ? `${formatNumber(included().length)} adaya gönder` : 'Gönder'}
          </AppButton>
        </AppModalFooter>
      </AppModalContent>
    </AppModal>
  )
}
