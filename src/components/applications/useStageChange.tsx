import { createSignal } from 'solid-js'
import {
  AppButton,
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalTitle,
  toast,
} from '@/components/ui'
import {
  isCorrection,
  STAGE_LABELS,
  stageActionLabel,
  useSetApplicationStage,
  type ApplicationRow,
  type ApplicationStage,
} from '@/features/applications'
import { recruitingErrorCode } from '@/lib/api'
import { track } from '@/lib/analytics'

interface PendingMove {
  from: ApplicationStage
  to: ApplicationStage
}

/** What the confirmation says for a move that ends or undoes a decision. */
function confirmCopy(move: PendingMove, who: string) {
  if (move.to === 'REJECTED') {
    return {
      title: 'Adayı reddet',
      description: `${who} bu ilan için reddedilecek. Yanlışlıkla yaptıysanız “Reddi geri al” ile düzeltebilirsiniz.`,
      action: 'Reddet',
      danger: true,
    }
  }

  if (move.from === 'REJECTED') {
    return {
      title: 'Reddi geri al',
      description: `${who} için başvuru yeniden açılıp “${STAGE_LABELS[move.to]}” aşamasına alınacak. Oradan istediğiniz aşamaya taşıyabilirsiniz.`,
      action: 'Geri al',
      danger: false,
    }
  }

  return {
    title: 'İşe alımı geri al',
    description: `${who} artık işe alındı olarak görünmeyecek; başvuru “${STAGE_LABELS[move.to]}” aşamasına dönecek.`,
    action: 'Geri al',
    danger: false,
  }
}

/**
 * Moves one application through the pipeline. Rejections and corrections out of a final stage
 * ask first; everything else applies optimistically on the spot. Render `<Confirm />` once,
 * anywhere in the row — it portals.
 */
export function useStageChange(props: {
  row: () => ApplicationRow
  /** Who or what the toast and the confirmation talk about — the candidate, or the posting. */
  subject: () => string
}) {
  const mutation = useSetApplicationStage()
  // Kept apart from `open` so the dialog's copy survives its own closing animation.
  const [pending, setPending] = createSignal<PendingMove | null>(null)
  const [open, setOpen] = createSignal(false)

  const apply = (from: ApplicationStage, to: ApplicationStage) => {
    // Read before mutating: the optimistic patch moves `row().stage` immediately.
    const label = stageActionLabel(from, to)

    mutation.mutate(
      { uid: props.row().id, stage: to },
      {
        onSuccess: () => {
          track('application_status_changed', { fromStatus: from, toStatus: to, actorRole: 'company' })
          toast.success(`${props.subject()} · ${label.toLocaleLowerCase('tr-TR')}`)
        },
        onError: (error) =>
          toast.error(
            recruitingErrorCode(error) === 'INVALID_STATUS_TRANSITION'
              ? 'Adayın mevcut durumu bu işleme uygun değil.'
              : 'Başvuru durumu güncellenemedi',
          ),
      },
    )
  }

  const request = (to: ApplicationStage) => {
    const from = props.row().stage
    if (to !== 'REJECTED' && !isCorrection(from, to)) return apply(from, to)

    setPending({ from, to })
    setOpen(true)
  }

  const Confirm = () => {
    const copy = () => confirmCopy(pending()!, props.subject())

    return (
      <AppModal open={open()} onOpenChange={setOpen}>
        <AppModalContent size="sm">
          {pending() && (
            <>
              <AppModalHeader>
                <AppModalTitle>{copy().title}</AppModalTitle>
                <AppModalDescription>{copy().description}</AppModalDescription>
              </AppModalHeader>
              <AppModalFooter>
                <AppButton variant="outline" onClick={() => setOpen(false)}>
                  Vazgeç
                </AppButton>
                <AppButton
                  variant={copy().danger ? 'danger' : 'primary'}
                  onClick={() => {
                    const move = pending()!
                    setOpen(false)
                    apply(move.from, move.to)
                  }}
                >
                  {copy().action}
                </AppButton>
              </AppModalFooter>
            </>
          )}
        </AppModalContent>
      </AppModal>
    )
  }

  return { request, Confirm, label: (to: ApplicationStage) => stageActionLabel(props.row().stage, to) }
}
