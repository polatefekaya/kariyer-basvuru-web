import { createMemo, For, onMount, Show, type JSX } from 'solid-js'
import { useNavigate, useParams, useSearchParams } from '@solidjs/router'
import { ArrowLeft, FileText, Mail } from 'lucide-solid'
import {
  AppAlert,
  AppAvatar,
  AppBadge,
  AppButton,
  AppImage,
  AppSkeleton,
  AppTabs,
  AppTabsContent,
} from '@/components/ui'
import {
  candidateAge,
  candidateFullName,
  candidateHeadline,
  candidateLocation,
  candidatesApi,
  isLookingForJob,
  useCandidate,
  type CandidateProfile,
} from '@/features/candidates'
import { formatDate, formatNumber } from '@/lib/format'
import { track } from '@/lib/analytics'
import { CandidateApplications } from './CandidateApplications'
import { CandidateResumes } from './CandidateResumes'

type CandidateTab = 'genel' | 'basvurular' | 'ozgecmis'
const TABS: { value: CandidateTab; label: string }[] = [
  { value: 'genel', label: 'Genel bakış' },
  { value: 'basvurular', label: 'Başvurular' },
  { value: 'ozgecmis', label: 'Özgeçmişler' },
]

function Info(props: { label: string; value: JSX.Element | null }) {
  return (
    <Show when={props.value}>
      <div class="flex flex-col gap-0.5">
        <span class="text-sm text-muted-foreground">{props.label}</span>
        <span class="text-sm text-foreground">{props.value}</span>
      </div>
    </Show>
  )
}

function Overview(props: { candidate: CandidateProfile }) {
  const c = () => props.candidate
  const age = () => candidateAge(c())
  return (
    <div class="flex flex-col gap-8">
      <Show when={c().describe?.trim()}>
        <p class="max-w-5xl text-sm whitespace-pre-line text-foreground">{c().describe}</p>
      </Show>

      <div class="grid gap-x-8 gap-y-5 sm:grid-cols-2 @3xl:grid-cols-4">
        <Info label="E-posta" value={c().email || null} />
        <Info label="Telefon" value={c().phone || null} />
        <Info label="Konum" value={candidateLocation(c()) || null} />
        <Info
          label="Doğum tarihi"
          value={c().birth_date ? `${formatDate(c().birth_date)}${age() ? ` · ${age()} yaş` : ''}` : null}
        />
        <Info label="Cinsiyet" value={c().gender || null} />
        <Info label="Uyruk" value={c().race || null} />
        <Info label="Çalışma tercihi" value={c().working_type || null} />
        <Info label="İş arama durumu" value={isLookingForJob(c()) ? 'Aktif olarak arıyor' : 'Aramıyor'} />
        <Info label="Son pozisyon" value={[c().position, c().company].filter(Boolean).join(' · ') || null} />
        <Info label="Eğitim" value={[c().school_name, c().department].filter(Boolean).join(' · ') || null} />
        <Info label="Adres" value={c().adress || null} />
        <Info label="Üyelik" value={c().created_date ? `${formatDate(c().created_date)}'den beri` : null} />
      </div>

      <Show when={c().selected_skills?.length}>
        <section class="flex flex-col gap-3 border-t border-border pt-6">
          <h3 class="text-sm text-muted-foreground">Öne çıkan yetenekler</h3>
          <div class="flex flex-wrap gap-2">
            <For each={c().selected_skills}>{(s) => <AppBadge variant="secondary">{s}</AppBadge>}</For>
          </div>
        </section>
      </Show>

      <Show when={c().links?.length}>
        <section class="flex flex-col gap-3 border-t border-border pt-6">
          <h3 class="text-sm text-muted-foreground">Bağlantılar</h3>
          <div class="flex flex-wrap gap-4">
            <For each={c().links}>
              {(l) => (
                <a
                  href={l.link_desc}
                  target="_blank"
                  rel="noreferrer noopener"
                  class="text-sm text-primary underline-offset-4 hover:text-primary-hover hover:underline"
                >
                  {l.link_name}
                </a>
              )}
            </For>
          </div>
        </section>
      </Show>

      <Show when={c().monthly_stats}>
        <section class="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>Bu ay {formatNumber(c().monthly_stats.profile_views)} profil görüntülenmesi</span>
          <span>{formatNumber(c().monthly_stats.cv_views)} özgeçmiş görüntülenmesi</span>
        </section>
      </Show>
    </div>
  )
}

function HeaderSkeleton() {
  return (
    <div class="flex items-center gap-5">
      <AppSkeleton variant="circle" width={96} height={96} />
      <div class="flex flex-1 flex-col gap-3">
        <AppSkeleton variant="text" width="32%" class="h-5" />
        <AppSkeleton variant="text" width="48%" />
        <AppSkeleton variant="text" width="24%" class="h-2.5" />
      </div>
    </div>
  )
}

/** Aday (singular) — one applicant: who they are, their applications and their CVs. */
export function CandidatePage() {
  const params = useParams<{ uid: string }>()
  const [search, setSearch] = useSearchParams()
  const navigate = useNavigate()
  const candidate = useCandidate(() => params.uid)

  // Viewing a profile counts toward the candidate's monthly stats, like the React app does.
  onMount(() => {
    void candidatesApi.trackProfileView(params.uid)
    track('candidate_detail_opened', { source: 'link' })
  })

  const tab = createMemo<CandidateTab>(() => {
    const v = (Array.isArray(search.sekme) ? search.sekme[0] : search.sekme) as CandidateTab
    return TABS.some((t) => t.value === v) ? v : 'genel'
  })
  const setTab = (v: CandidateTab) => setSearch({ sekme: v === 'genel' ? undefined : v }, { replace: true })

  const c = () => candidate.data
  const cover = () => c()?.background_url

  return (
    <div class="@container flex w-full flex-col gap-8 sm:px-2 lg:px-6">
      <AppButton variant="ghost" size="sm" leftIcon={<ArrowLeft />} class="self-start" onClick={() => navigate(-1)}>
        Geri
      </AppButton>

      <Show when={!candidate.isPending} fallback={<HeaderSkeleton />}>
        <Show
          when={c()}
          fallback={
            <AppAlert
              variant="destructive"
              title="Aday bulunamadı"
              description="Bu aday kaldırılmış ya da profili görüntülemeye kapalı olabilir."
              actions={
                <AppButton variant="outline" size="sm" onClick={() => navigate('/adaylar')}>
                  Adaylara dön
                </AppButton>
              }
            />
          }
        >
          {/* ---------------- Header ---------------- */}
          <header class="flex flex-col gap-5">
            <Show when={cover()}>
              <AppImage
                src={cover()!}
                imgWidth={1280}
                aspectRatio="6/1"
                rounded="2xl"
                objectFit="cover"
                alt=""
                class="w-full"
              />
            </Show>
            <div class="flex flex-col gap-5 @2xl:flex-row @2xl:items-start @2xl:justify-between">
              <div class="flex min-w-0 items-center gap-5">
                <AppAvatar
                  src={c()!.photo_url}
                  name={c()!.name ?? undefined}
                  surname={c()!.surname ?? undefined}
                  size="2xl"
                />
                <div class="flex min-w-0 flex-col gap-1.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <h1 class="min-w-0 truncate text-xl font-medium text-foreground">{candidateFullName(c()!)}</h1>
                    <Show when={isLookingForJob(c()!)}>
                      <AppBadge variant="successSubtle">İş arıyor</AppBadge>
                    </Show>
                  </div>
                  <Show when={candidateHeadline(c()!)}>
                    <p class="truncate text-muted-foreground">{candidateHeadline(c()!)}</p>
                  </Show>
                  <p class="text-sm text-muted-foreground">
                    {[candidateLocation(c()!), c()!.email, c()!.phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 flex-wrap items-center gap-2">
                <Show when={c()!.email}>
                  <AppButton variant="outline" leftIcon={<Mail />} as="a" href={`mailto:${c()!.email}`}>
                    E-posta gönder
                  </AppButton>
                </Show>
                <AppButton leftIcon={<FileText />} onClick={() => setTab('ozgecmis')}>
                  Özgeçmişi gör
                </AppButton>
              </div>
            </div>
          </header>

          {/* ---------------- Tabs ---------------- */}
          <AppTabs<CandidateTab>
            tabs={TABS}
            value={tab()}
            onChange={setTab}
            variant="underline"
            listClass="bg-transparent"
          >
            <AppTabsContent value="genel">
              <Overview candidate={c()!} />
            </AppTabsContent>
            <AppTabsContent value="basvurular">
              <CandidateApplications candidateUid={params.uid} />
            </AppTabsContent>
            <AppTabsContent value="ozgecmis">
              <CandidateResumes candidateUid={params.uid} activeResumeId={c()!.active_resume_id} />
            </AppTabsContent>
          </AppTabs>
        </Show>
      </Show>
    </div>
  )
}
