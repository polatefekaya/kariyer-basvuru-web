import { createMemo, For } from 'solid-js'
import { toast } from '@/components/ui'
import { JobCard, JobCardSkeleton } from '@/components/jobs'
import { JOB_STATUS_LABELS, type JobStatus } from '@/features/jobs'
import { Block, Cell, createKnobs, DevSection, Playground, Preview, type DevSectionMeta } from '../knobs'
import { mockApplicants, mockJob, mockJobs } from '@/mocks/data'

export const meta: DevSectionMeta = { id: 'job-card', title: 'JobCard', group: 'Jobs' }
const statuses = Object.keys(JOB_STATUS_LABELS) as JobStatus[]

const handlers = {
  onOpen: (j: { title: string }) => toast.info(`Başvurular: ${j.title}`),
  onEdit: (j: { title: string }) => toast(`Düzenle: ${j.title}`),
  onSetStatus: (j: { title: string }, s: JobStatus) => toast.success(`${j.title} → ${JOB_STATUS_LABELS[s]}`),
  onDelete: (j: { title: string }) => toast.error(`Sil: ${j.title}`),
  onApplicantClick: (a: { name: string | null; surname: string | null }) => toast(`Aday: ${a.name} ${a.surname}`),
}

export function JobCardSection() {
  const knobs = createKnobs(
    {
      expandable: { type: 'boolean', label: 'expandable (chevron + body)' },
      bordered: { type: 'select', options: ['card', 'none'] },
      expanded: { type: 'boolean' },
      status: { type: 'select', options: statuses },
      applicants: { type: 'number', min: 0, max: 400, step: 1, label: 'applicants (total)' },
      preview: { type: 'number', min: 0, max: 8, step: 1, label: 'preview avatars' },
      pipeline: { type: 'boolean', label: 'pipeline breakdown' },
      vitrin: { type: 'boolean' },
      description: { type: 'boolean' },
      benefits: { type: 'boolean' },
    },
    {
      expandable: true,
      bordered: 'card',
      expanded: true,
      status: 'approved',
      applicants: 123,
      preview: 5,
      pipeline: true,
      vitrin: true,
      description: true,
      benefits: true,
    },
  )
  const job = createMemo(() =>
    mockJob(21, {
      status: knobs.values.status,
      is_active: knobs.values.status === 'approved',
      plan: knobs.values.vitrin ? ['Vitrin İlan'] : [],
      job_desc: knobs.values.description
        ? 'React ve TypeScript ile modern web uygulamaları geliştirecek, tasarım ekibiyle yakın çalışacak bir Frontend Developer arıyoruz.\nSorumluluklar: bileşen kütüphanesinin bakımı, performans iyileştirmeleri, kod incelemeleri.'
        : '',
      benefits: knobs.values.benefits
        ? ['Özel Sağlık Sigortası', 'Yemek Kartı', 'Uzaktan Çalışma', 'Eğitim Bütçesi']
        : [],
      education_status: ['Lisans', 'Yüksek Lisans'],
      military: ['Yapıldı', 'Muaf'],
      working_days: ['Pazartesi', 'Cuma'],
      working_hours: '09:00 - 18:00',
      stats: {
        ...mockJob(21).stats!,
        total_applications: knobs.values.applicants,
        applications_this_week: Math.min(9, knobs.values.applicants),
      },
    }),
  )
  const applicants = createMemo(() => mockApplicants(Math.min(knobs.values.preview, knobs.values.applicants), 21))
  const pipeline = createMemo(() => {
    const t = knobs.values.applicants
    return {
      NEW: Math.round(t * 0.45),
      REVIEWING: Math.round(t * 0.3),
      HIRED: Math.round(t * 0.1),
      REJECTED: Math.round(t * 0.12),
      WITHDRAWN: Math.round(t * 0.03),
    }
  })

  return (
    <DevSection
      meta={meta}
      description="İlan kartı: üstte başlık + rozetler + özet, altta Başvuranlar avatar grubu (+N gerçek toplamı gösterir) ve aksiyonlar. Chevron ile açılır: açıklama, gereksinimler, çalışma koşulları, ücret/yan haklar, konum/tarihler, istatistikler, başvuru dağılımı, ön eleme soruları."
      imports="import { JobCard, JobCardSkeleton } from '@/components/jobs'"
    >
      <Block title="Playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <JobCard
              job={job()}
              applicants={applicants()}
              applicantsTotal={v.applicants}
              pipeline={v.pipeline ? pipeline() : undefined}
              expandable={v.expandable}
              bordered={v.bordered}
              expanded={v.expanded}
              onExpandedChange={(e) => knobs.setValue('expanded', e)}
              class="max-w-3xl"
              {...handlers}
            />
          )}
          code={(v) =>
            `<JobCard\n  job={job}\n  applicants={recentApplicants}   // CandidateSummary[] preview\n  applicantsTotal={${v.applicants}}${v.pipeline ? '\n  pipeline={statusCounts(stats)}' : ''}${v.bordered === 'none' ? '\n  bordered="none"   // no outline, no surface: sits straight on the page' : ''}${v.expandable ? '\n  expanded={expanded()}\n  onExpandedChange={setExpanded}' : '\n  expandable={false}   // no chevron/body; the card itself calls onOpen'}\n  onOpen={openApplicants}\n  onApplicantClick={openCandidate}\n/>`
          }
        />
      </Block>

      <Block title="States" description="Kapalı / açık, başvurusuz, taslak, süresi dolan, iskelet.">
        <Preview align="stretch" class="grid grid-cols-1 gap-6 @lg:grid-cols-2">
          <Cell label="collapsed" class="[&>*]:w-full">
            <JobCard job={mockJob(31)} applicants={mockApplicants(5, 31)} {...handlers} />
          </Cell>
          <Cell label="defaultExpanded" class="[&>*]:w-full">
            <JobCard
              job={mockJob(32, { benefits: ['Yemek Kartı', 'Servis'] })}
              applicants={mockApplicants(3, 32)}
              defaultExpanded
              {...handlers}
            />
          </Cell>
          <Cell label="no applicants" class="[&>*]:w-full">
            <JobCard
              job={mockJob(33, { stats: { ...mockJob(33).stats!, total_applications: 0, applications_this_week: 0 } })}
              applicants={[]}
              {...handlers}
            />
          </Cell>
          <Cell label="draft, no stats" class="[&>*]:w-full">
            <JobCard job={mockJob(34, { status: 'draft', is_active: false, stats: undefined })} {...handlers} />
          </Cell>
          <Cell label="expired" class="[&>*]:w-full">
            <JobCard
              job={mockJob(35, {
                status: 'expired',
                is_active: false,
                job_end_date: new Date(Date.now() - 5 * 86400000).toISOString(),
              })}
              applicants={mockApplicants(7, 35)}
              {...handlers}
            />
          </Cell>
          <Cell label="skeleton" class="[&>*]:w-full">
            <JobCardSkeleton />
          </Cell>
        </Preview>
      </Block>

      <Block title="Grid" description="Kart ızgarası; her kart bağımsız açılır.">
        <div class="grid grid-cols-1 gap-6 @lg:grid-cols-2 @3xl:grid-cols-3">
          <For each={mockJobs(6)}>
            {(j, i) => <JobCard job={j} applicants={mockApplicants(4, i() + 40)} {...handlers} />}
          </For>
        </div>
      </Block>
    </DevSection>
  )
}
