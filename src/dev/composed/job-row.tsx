import { createMemo, createSignal, For } from 'solid-js'
import { AppButton, AppSegmentedControl, AppVirtualList, toast } from '@/components/ui'
import { JobRow, JobRowSkeleton, JobStatusBadge, type JobRowVariant } from '@/components/jobs'
import { JOB_STATUS_LABELS, type JobStatus } from '@/features/jobs'
import { Block, Cell, createKnobs, DevSection, Playground, Preview, type DevSectionMeta } from '../knobs'
import { mockApplicants, mockJob, mockJobs } from '@/mocks/data'

export const meta: DevSectionMeta = { id: 'job-row', title: 'JobRow', group: 'Jobs' }

const variants = ['compact', 'default', 'detailed'] as const
const statuses = Object.keys(JOB_STATUS_LABELS) as JobStatus[]

export function JobRowSection() {
  const knobs = createKnobs(
    {
      variant: { type: 'select', options: variants },
      status: { type: 'select', options: statuses },
      bordered: { type: 'boolean' },
      selectable: { type: 'boolean' },
      vitrin: { type: 'boolean' },
      secret: { type: 'boolean', label: 'is_secret_name' },
      salary: { type: 'boolean' },
      daysLeft: { type: 'number', min: -5, max: 60, step: 1, label: 'days until end' },
      actions: { type: 'boolean', label: 'action handlers' },
      applicants: { type: 'boolean', label: 'applicants preview (bottom-right)' },
    },
    {
      variant: 'default',
      status: 'approved',
      bordered: true,
      selectable: true,
      vitrin: true,
      secret: false,
      salary: true,
      daysLeft: 12,
      actions: true,
      applicants: true,
    },
  )
  const [selected, setSelected] = createSignal(false)
  const playgroundJob = createMemo(() =>
    mockJob(3, {
      status: knobs.values.status,
      is_active: knobs.values.status === 'approved',
      plan: knobs.values.vitrin ? ['Vitrin İlan'] : [],
      is_secret_name: knobs.values.secret,
      min_salary: knobs.values.salary ? '25000.00' : null,
      max_salary: knobs.values.salary ? '32000.00' : null,
      job_end_date: new Date(Date.now() + knobs.values.daysLeft * 86400000).toISOString(),
    }),
  )
  const handlers = (on: boolean) =>
    on
      ? {
          onOpen: (j: { title: string }) => toast.info(`Başvurular: ${j.title}`),
          onEdit: (j: { title: string }) => toast(`Düzenle: ${j.title}`),
          onDuplicate: (j: { title: string }) => toast(`Kopyala: ${j.title}`),
          onSetStatus: (j: { title: string }, s: JobStatus) => toast.success(`${j.title} → ${JOB_STATUS_LABELS[s]}`),
          onDelete: (j: { title: string }) => toast.error(`Sil: ${j.title}`),
        }
      : {}

  // List demo
  const [listVariant, setListVariant] = createSignal<JobRowVariant>('default')
  const [bordered, setBordered] = createSignal<'card' | 'flat'>('card')
  const jobs = mockJobs(1000)
  const [picked, setPicked] = createSignal<Set<string>>(new Set())
  const toggle = (uid: string, v: boolean) =>
    setPicked((s) => {
      const n = new Set(s)
      v ? n.add(uid) : n.delete(uid)
      return n
    })

  return (
    <DevSection
      meta={meta}
      description="İlan satırı: başlık + durum/plan rozetleri, pozisyon · konum · tür · çalışma şekli, maaş, tarihler; sağda başvuru/görüntülenme ölçütleri, 'Başvurular' ve işlem menüsü. Seçim kutusu onSelectedChange verilince çıkar. detailed varyantı ölçüt şeridi ekler."
      imports="import { JobRow, JobRowSkeleton, JobStatusBadge } from '@/components/jobs'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <JobRow
              job={playgroundJob()}
              variant={v.variant}
              bordered={v.bordered}
              selected={v.selectable ? selected() : undefined}
              onSelectedChange={v.selectable ? setSelected : undefined}
              applicants={v.applicants ? mockApplicants(5, 3) : undefined}
              {...handlers(v.actions)}
            />
          )}
          code={(v) =>
            `<JobRow\n  job={job}${v.variant !== 'default' ? `\n  variant="${v.variant}"` : ''}${!v.bordered ? '\n  bordered={false}' : ''}${v.selectable ? '\n  selected={selected()}\n  onSelectedChange={setSelected}' : ''}${v.applicants ? '\n  applicants={recentApplicants}   // CandidateSummary[] → Başvuranlar avatars' : ''}${v.actions ? '\n  onOpen={openApplicants}\n  onEdit={edit}\n  onSetStatus={setStatus}\n  onDelete={remove}' : ''}\n/>`
          }
        />
      </Block>

      <Block title="Variants" description="Aynı ilan üç yoğunlukta.">
        <Preview align="stretch" class="flex-col">
          <For each={variants}>
            {(vr) => (
              <Cell label={vr} class="[&>*]:w-full">
                <JobRow job={mockJob(7)} variant={vr} {...handlers(true)} />
              </Cell>
            )}
          </For>
        </Preview>
      </Block>

      <Block
        title="Status × edge cases"
        description="Her durum rozeti; süresi dolan, maaşsız, gizli şirket, Vitrin, seçili, iskelet."
      >
        <Preview align="stretch" class="flex-col">
          <div class="flex flex-wrap gap-2">
            <For each={statuses}>{(s) => <JobStatusBadge status={s} size="md" />}</For>
          </div>
          <JobRow
            job={mockJob(11, {
              status: 'approved',
              is_active: true,
              job_end_date: new Date(Date.now() + 2 * 86400000).toISOString(),
            })}
            {...handlers(true)}
          />
          <JobRow
            job={mockJob(12, {
              status: 'expired',
              is_active: false,
              job_end_date: new Date(Date.now() - 9 * 86400000).toISOString(),
            })}
            {...handlers(true)}
          />
          <JobRow
            job={mockJob(13, { min_salary: null, max_salary: null, plan: [], is_secret_name: true })}
            {...handlers(true)}
          />
          <JobRow job={mockJob(14, { status: 'draft', is_active: false, stats: undefined })} {...handlers(true)} />
          <JobRow job={mockJob(15)} selected onSelectedChange={() => {}} {...handlers(true)} />
          <JobRowSkeleton />
          <JobRowSkeleton variant="compact" />
        </Preview>
      </Block>

      <Block
        title="In a list (1.000 jobs, virtualised)"
        description="JobRow + AppVirtualList; seçim çoklu işlem çubuğunu açar."
      >
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <AppSegmentedControl
              value={listVariant()}
              onChange={setListVariant}
              options={variants.map((v) => ({ value: v, label: v }))}
            />
            <AppSegmentedControl
              value={bordered()}
              onChange={setBordered}
              options={[
                { value: 'card', label: 'Kart' },
                { value: 'flat', label: 'Düz (divide)' },
              ]}
            />
            <span class="text-xs text-muted-foreground">{picked().size} seçili</span>
            <AppButton
              size="sm"
              variant="secondary"
              disabled={picked().size === 0}
              onClick={() => {
                toast.success(`${picked().size} ilan kapatıldı`)
                setPicked(new Set<string>())
              }}
            >
              Seçilenleri kapat
            </AppButton>
          </div>
          <AppVirtualList
            items={jobs}
            itemKey={(j) => j.uid}
            estimateSize={listVariant() === 'compact' ? 52 : listVariant() === 'detailed' ? 210 : 112}
            gap={bordered() === 'card' ? 12 : 0}
            height={520}
            class={bordered() === 'card' ? 'rounded-2xl border border-border p-2' : 'rounded-2xl border border-border'}
            renderItem={(job) => (
              <JobRow
                job={job}
                variant={listVariant()}
                bordered={bordered() === 'card'}
                selected={picked().has(job.uid)}
                onSelectedChange={(v) => toggle(job.uid, v)}
                {...handlers(true)}
              />
            )}
          />
        </div>
      </Block>
    </DevSection>
  )
}
