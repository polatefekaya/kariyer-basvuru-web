import { createMemo, createSignal, For, Show, type JSX } from 'solid-js'
import { Lock } from 'lucide-solid'
import { AppAlert, AppBadge, AppButton, AppEmptyState, AppSegmentedControl, AppSkeleton, toast } from '@/components/ui'
import {
  dateRange,
  durationLabel,
  isResumeLocked,
  levelValue,
  referenceName,
  resumeDisplayName,
  resumeFlags,
  resumeReferences,
  sortEducations,
  sortExperiences,
  useEmployeeResumes,
  useProfileReferences,
  useResume,
  useUnlockResume,
  type Resume,
} from '@/features/resumes'
import { formatDate, formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/api'

/** Untitled-rule section, no icons — the CV's own headings carry the meaning. */
function Section(props: { title: string; children: JSX.Element }) {
  return (
    <section class="flex flex-col gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h4 class="text-sm text-muted-foreground">{props.title}</h4>
      {props.children}
    </section>
  )
}

/** title · meta on one line, subtitle under it, free text below — the CV item shape. */
function Item(props: { title: string; meta?: string; hint?: string; subtitle?: string; body?: string | null }) {
  return (
    <div class="flex flex-col gap-1">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4">
        <span class="text-foreground">{props.title}</span>
        <Show when={props.meta}>
          <span class="text-sm text-muted-foreground">
            {props.meta}
            <Show when={props.hint}>
              <span class="ml-2">· {props.hint}</span>
            </Show>
          </span>
        </Show>
      </div>
      <Show when={props.subtitle}>
        <span class="text-sm text-muted-foreground">{props.subtitle}</span>
      </Show>
      <Show when={props.body}>
        <p class="mt-1 text-sm whitespace-pre-line text-foreground">{props.body}</p>
      </Show>
    </div>
  )
}

/** "1"–"5" as five dots, like the CV builder's level display (no star icons). */
function Level(props: { value: number }) {
  return (
    <span class="flex items-center gap-1" aria-label={`${props.value}/5`}>
      <For each={[1, 2, 3, 4, 5]}>
        {(i) => <span class={cn('size-1.5 rounded-full', i <= props.value ? 'bg-primary' : 'bg-border')} />}
      </For>
    </span>
  )
}

const LevelRow = (props: { label: string; level: string | null | undefined }) => (
  <div class="flex items-center justify-between gap-4">
    <span class="min-w-0 truncate text-sm text-foreground">{props.label}</span>
    <Level value={levelValue(props.level)} />
  </div>
)

const Chips = (props: { items: string[] }) => (
  <div class="flex flex-wrap gap-2">
    <For each={props.items}>{(s) => <AppBadge variant="secondary">{s}</AppBadge>}</For>
  </div>
)

function Fact(props: { label: string; value: JSX.Element | null }) {
  return (
    <Show when={props.value}>
      <div class="flex flex-col gap-0.5">
        <span class="text-sm text-muted-foreground">{props.label}</span>
        <span class="text-sm text-foreground">{props.value}</span>
      </div>
    </Show>
  )
}

/** One CV in full, laid out like the CV viewer: facts strip, then two columns. */
function ResumeDetailView(props: { id: number; candidateUid: string }) {
  const query = useResume(() => props.id)
  const references = useProfileReferences(() => props.candidateUid)
  const unlock = useUnlockResume(() => props.candidateUid)
  const cv = () => query.data
  const experiences = createMemo(() => sortExperiences(cv()?.experiences))
  const educations = createMemo(() => sortEducations(cv()?.educations))
  const skills = createMemo(() => (cv()?.skills ?? []).map((s) => s.skill_name).filter(Boolean))
  const refs = createMemo(() => resumeReferences(cv(), references.data ?? []))
  const address = () =>
    [cv()?.adress, cv()?.neighbourhood, cv()?.town, cv()?.province, cv()?.country].filter(Boolean).join(', ')

  return (
    <Show
      when={!query.isPending}
      fallback={
        <div class="flex flex-col gap-4">
          <AppSkeleton height={96} class="rounded-2xl" />
          <AppSkeleton height={220} class="rounded-2xl" />
        </div>
      }
    >
      <Show
        when={cv()}
        fallback={
          <AppAlert
            variant="warning"
            title="Bu özgeçmiş görüntülenemiyor"
            description="Aday özgeçmişini gizlemiş ya da kaldırmış olabilir."
          />
        }
      >
        <div class="flex flex-col gap-8">
          <Show when={isResumeLocked(cv())}>
            <AppAlert
              variant="warning"
              icon={<Lock />}
              title="Kilitli özgeçmiş"
              description="Ad, fotoğraf, iletişim bilgileri ve bağlantılar gizli. Görüntüleme hakkı harcayarak tamamını açabilirsiniz."
              actions={
                <AppButton
                  size="sm"
                  loading={unlock.isPending}
                  onClick={() =>
                    unlock.mutate(props.id, {
                      onSuccess: () => toast.success('Özgeçmiş açıldı'),
                      onError: (error) =>
                        toast.error(
                          error instanceof ApiError && error.status === 402
                            ? 'CV görüntüleme hakkınız yetersiz. Yeni bir paket satın alarak devam edebilirsiniz.'
                            : 'Özgeçmiş açılamadı. Lütfen tekrar deneyin.',
                        ),
                    })
                  }
                >
                  Özgeçmişi aç
                </AppButton>
              }
            />
          </Show>

          {/* ---------------- Kişisel bilgiler ---------------- */}
          <div class="grid gap-x-8 gap-y-5 sm:grid-cols-2 @3xl:grid-cols-4">
            <Fact label="Telefon" value={cv()!.phone || null} />
            <Fact label="E-posta" value={cv()!.email || null} />
            <Fact label="Adres" value={address() || null} />
            <Fact label="Uyruk" value={cv()!.national_status || null} />
            <Fact label="Askerlik durumu" value={cv()!.military || null} />
            <Fact
              label="Sürücü belgesi"
              value={(cv()!.driver_license ?? []).length ? cv()!.driver_license.join(', ') : null}
            />
            <Fact label="Güncellenme" value={formatDate(cv()!.updated_at)} />
            <Show when={resumeFlags(cv()!).length}>
              <Fact label="Durum" value={<Chips items={resumeFlags(cv()!)} />} />
            </Show>
          </div>

          <Show when={cv()!.summary?.trim()}>
            <section class="border-t border-border pt-6">
              <p class="text-sm whitespace-pre-line text-foreground">{cv()!.summary}</p>
            </section>
          </Show>

          {/* ---------------- İki kolon ---------------- */}
          <div class="grid items-start gap-x-12 gap-y-8 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div class="flex flex-col gap-8">
              <Show when={experiences().length}>
                <Section title="İş deneyimleri">
                  <div class="flex flex-col gap-6">
                    <For each={experiences()}>
                      {(x) => (
                        <Item
                          title={[x.position, x.department].filter(Boolean).join(' · ')}
                          subtitle={[x.company, x.sector, x.is_voluntary ? 'Gönüllü' : ''].filter(Boolean).join(' · ')}
                          meta={dateRange(x.ex_start_date, x.ex_end_date, x.is_continue)}
                          hint={durationLabel(x.ex_start_date, x.ex_end_date, x.is_continue)}
                          body={x.responsibility}
                        />
                      )}
                    </For>
                  </div>
                </Section>
              </Show>

              <Show when={(cv()!.certificates ?? []).length}>
                <Section title="Sertifika ve seminerler">
                  <div class="flex flex-col gap-6">
                    <For each={cv()!.certificates}>
                      {(c) => (
                        <Item
                          title={c.cer_name ?? 'Sertifika'}
                          subtitle={[c.cer_organization, c.cer_number].filter(Boolean).join(' · ')}
                          meta={c.cer_date ? formatDate(c.cer_date) : undefined}
                          body={c.cer_desc || null}
                        />
                      )}
                    </For>
                  </div>
                </Section>
              </Show>

              <Show when={(cv()!.awards ?? []).length}>
                <Section title="Ödüller">
                  <div class="flex flex-col gap-6">
                    <For each={cv()!.awards}>
                      {(a) => (
                        <Item
                          title={a.award_name}
                          subtitle={a.award_organization}
                          meta={a.award_date ? formatDate(a.award_date) : undefined}
                          body={a.award_desc || null}
                        />
                      )}
                    </For>
                  </div>
                </Section>
              </Show>

              <For each={cv()!.custom_sections ?? []}>
                {(sec) => (
                  <Section title={sec.title || 'Diğer'}>
                    <p class="text-sm whitespace-pre-line text-foreground">{sec.body}</p>
                  </Section>
                )}
              </For>

              <Show when={refs().length}>
                <Section title="Referanslar">
                  <div class="flex flex-col gap-6">
                    <For each={refs()}>
                      {(r) => (
                        <Item
                          title={referenceName(r)}
                          subtitle={[
                            r.referee_position,
                            r.referee_company,
                            r.working_years ? `${r.working_years} yıl birlikte` : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          meta={r.created_at ? formatDate(r.created_at) : undefined}
                          body={r.reference_text}
                        />
                      )}
                    </For>
                  </div>
                </Section>
              </Show>
            </div>

            <div class="flex flex-col gap-8">
              <Show when={educations().length}>
                <Section title="Eğitim bilgileri">
                  <div class="flex flex-col gap-6">
                    <For each={educations()}>
                      {(e) => (
                        <Item
                          title={e.school_name}
                          subtitle={[e.faculty, e.department, e.degree, e.gpa ? `Ort. ${e.gpa}` : '']
                            .filter(Boolean)
                            .join(' · ')}
                          meta={dateRange(e.edu_start_date, e.edu_end_date, e.is_continue)}
                        />
                      )}
                    </For>
                  </div>
                </Section>
              </Show>

              <Show when={(cv()!.languages ?? []).length}>
                <Section title="Yabancı diller">
                  <div class="flex flex-col gap-3">
                    <For each={cv()!.languages}>{(l) => <LevelRow label={l.lang_name} level={l.lang_level} />}</For>
                  </div>
                </Section>
              </Show>

              <Show when={(cv()!.digital_skills ?? []).length}>
                <Section title="Dijital yetkinlikler">
                  <div class="flex flex-col gap-3">
                    <For each={cv()!.digital_skills}>{(s) => <LevelRow label={s.skill_name} level={s.level} />}</For>
                  </div>
                </Section>
              </Show>

              <Show when={skills().length}>
                <Section title="Kişisel yetkinlikler">
                  <Chips items={skills()} />
                </Section>
              </Show>

              <Show when={(cv()!.links ?? []).length}>
                <Section title="Bağlantılar">
                  <div class="flex flex-col gap-2">
                    <For each={cv()!.links}>
                      {(l) => (
                        <a
                          href={l.link_desc}
                          target="_blank"
                          rel="noreferrer noopener"
                          class="truncate text-sm text-primary underline-offset-4 hover:text-primary-hover hover:underline"
                        >
                          {l.username || l.link_name}
                        </a>
                      )}
                    </For>
                  </div>
                </Section>
              </Show>

              <Show when={(cv()!.hobby ?? []).length}>
                <Section title="Hobiler / ilgi alanları">
                  <Chips items={cv()!.hobby} />
                </Section>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </Show>
  )
}

/** CV switcher (only when there is more than one) above the selected CV. */
export function CandidateResumes(props: { candidateUid: string; activeResumeId?: number | null }) {
  const query = useEmployeeResumes(() => props.candidateUid)
  const list = createMemo<Resume[]>(() => query.data ?? [])
  const [picked, setPicked] = createSignal<number | null>(null)
  const selected = createMemo(
    () => picked() ?? props.activeResumeId ?? list().find((r) => r.is_active)?.id ?? list()[0]?.id ?? null,
  )
  const current = () => list().find((r) => r.id === selected())

  return (
    <Show
      when={!query.isPending}
      fallback={
        <div class="flex flex-col gap-4">
          <AppSkeleton height={40} width={320} class="rounded-full" />
          <AppSkeleton height={320} class="rounded-2xl" />
        </div>
      }
    >
      <Show
        when={list().length > 0}
        fallback={
          <AppEmptyState
            variant="plain"
            title="Özgeçmiş yok"
            description="Bu adayın görüntülenebilir bir özgeçmişi bulunmuyor."
          />
        }
      >
        <div class="flex flex-col gap-8">
          <div class="flex flex-wrap items-center gap-4">
            <Show when={list().length > 1}>
              <AppSegmentedControl
                size="md"
                aria-label="Özgeçmiş"
                options={list().map((r) => ({ value: String(r.id), label: resumeDisplayName(r) }))}
                value={String(selected())}
                onChange={(v) => setPicked(Number(v))}
              />
            </Show>
            <Show when={current()}>
              <span class="flex items-center gap-3 text-sm text-muted-foreground">
                <Show when={current()!.is_active}>
                  <AppBadge variant="successSubtle">Aktif</AppBadge>
                </Show>
                {formatRelative(current()!.updated_at)} güncellendi
              </span>
            </Show>
          </div>
          <Show when={selected()}>
            <ResumeDetailView id={selected()!} candidateUid={props.candidateUid} />
          </Show>
        </div>
      </Show>
    </Show>
  )
}
