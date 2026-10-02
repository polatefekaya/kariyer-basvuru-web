import { createSignal, For, Show } from 'solid-js'
import { ChevronDown, Mail, X } from 'lucide-solid'
import {
  AppButton,
  AppDropdown,
  AppDropdownContent,
  AppDropdownItem,
  AppDropdownTrigger,
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  toast,
} from '@/components/ui'
import {
  APPLICATION_STAGES,
  FINAL_STAGES,
  STAGE_ACTIONS,
  STAGE_LABELS,
  useBulkSetApplicationStage,
  type ApplicationRow,
  type ApplicationStage,
} from '@/features/applications'
import { track } from '@/lib/analytics'
import { formatNumber } from '@/lib/format'

// WITHDRAWN is the candidate's own act; a company never moves anyone there.
const TARGETS: ApplicationStage[] = APPLICATION_STAGES.filter((s) => s !== 'WITHDRAWN')

/**
 * What can be done to every selected row at once: move them to a stage (each is judged on its
 * own — the ones that cannot make the move are reported, the rest still move) or write to them.
 */
export function BulkActionBar(props: {
  selected: ApplicationRow[]
  onClear: () => void
  onMessage: () => void
}) {
  const move = useBulkSetApplicationStage()
  const [confirming, setConfirming] = createSignal<ApplicationStage | null>(null)

  const count = () => props.selected.length
  const movable = (stage: ApplicationStage) => props.selected.filter((r) => r.allowedActions.includes(stage))
  // Rejecting, or taking someone out of a final decision, asks first — as it does one at a time.
  const needsConfirmation = (stage: ApplicationStage) =>
    stage === 'REJECTED' || movable(stage).some((r) => FINAL_STAGES.includes(r.stage))

  const apply = (stage: ApplicationStage) => {
    const rows = props.selected
    track('applications_bulk_status_changed', { toStatus: stage, count: rows.length })

    move.mutate(
      { uids: rows.map((r) => r.id), stage },
      {
        onSuccess: (result) => {
          const moved = result.moved.length
          const skipped = result.skipped.length
          if (moved > 0) toast.success(`${formatNumber(moved)} aday · ${STAGE_LABELS[stage].toLocaleLowerCase('tr-TR')}`)
          if (skipped > 0)
            toast.info(`${formatNumber(skipped)} aday mevcut durumundan ${STAGE_LABELS[stage]} aşamasına geçemedi`)
        },
        onError: () => toast.error('Başvuru durumları güncellenemedi'),
      },
    )
    props.onClear()
  }

  const request = (stage: ApplicationStage) => (needsConfirmation(stage) ? setConfirming(stage) : apply(stage))

  return (
    <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5">
      <span class="text-sm text-foreground">{formatNumber(count())} aday seçildi</span>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <AppDropdown placement="bottom-end">
          <AppDropdownTrigger as={AppButton} size="sm" variant="outline" rightIcon={<ChevronDown />}>
            Durumu değiştir
          </AppDropdownTrigger>
          <AppDropdownContent>
            <For each={TARGETS}>
              {(stage) => (
                <AppDropdownItem
                  disabled={movable(stage).length === 0}
                  variant={stage === 'REJECTED' ? 'destructive' : undefined}
                  onSelect={() => request(stage)}
                >
                  <span class="flex w-full items-center justify-between gap-6">
                    {STAGE_ACTIONS[stage]}
                    <span class="text-muted-foreground">
                      {formatNumber(movable(stage).length)}/{formatNumber(count())}
                    </span>
                  </span>
                </AppDropdownItem>
              )}
            </For>
          </AppDropdownContent>
        </AppDropdown>

        <AppButton size="sm" variant="secondary" leftIcon={<Mail />} onClick={props.onMessage}>
          Mesaj gönder
        </AppButton>
        <AppButton size="sm" variant="ghost" leftIcon={<X />} onClick={props.onClear}>
          Seçimi kaldır
        </AppButton>
      </div>

      <AppModal open={confirming() !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AppModalContent size="sm">
          <Show when={confirming()}>
            {(stage) => (
              <>
                <AppModalHeader>
                  <AppModalTitle>
                    {stage() === 'REJECTED' ? 'Adayları reddet' : `${STAGE_LABELS[stage()]} aşamasına taşı`}
                  </AppModalTitle>
                  <AppModalDescription>
                    {formatNumber(movable(stage()).length)} aday {STAGE_LABELS[stage()].toLocaleLowerCase('tr-TR')}{' '}
                    aşamasına taşınacak
                    {movable(stage()).length < count()
                      ? `; ${formatNumber(count() - movable(stage()).length)} aday bu aşamaya geçemediği için olduğu yerde kalacak`
                      : ''}
                    . Yanlışlıkla yaparsanız tek tek düzeltebilirsiniz.
                  </AppModalDescription>
                </AppModalHeader>
                <AppModalFooter>
                  <AppButton variant="outline" onClick={() => setConfirming(null)}>
                    Vazgeç
                  </AppButton>
                  <AppButton
                    variant={stage() === 'REJECTED' ? 'danger' : 'primary'}
                    onClick={() => {
                      const target = stage()
                      setConfirming(null)
                      apply(target)
                    }}
                  >
                    {stage() === 'REJECTED' ? 'Reddet' : 'Taşı'}
                  </AppButton>
                </AppModalFooter>
              </>
            )}
          </Show>
        </AppModalContent>
      </AppModal>
    </div>
  )
}
