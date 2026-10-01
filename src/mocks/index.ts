import type {
  ActivityEntry,
  ApplicationListParams,
  ApplicationListResponse,
  ApplicationNote,
  ApplicationRow,
  ApplicationStage,
  ApplicationStatsResponse,
  ChangeStageResponse,
  CompanyApplicationParams,
} from '@/features/applications/types'
import { APPLICATION_STAGES, STAGE_LABELS } from '@/features/applications/stages'
import type { CandidateProfile } from '@/features/candidates/types'
import type { ProfileReference, Resume, ResumeDetail } from '@/features/resumes/types'
import type {
  HiringUser,
  Interview,
  InterviewCreateInput,
  InterviewParticipant,
  InterviewStatus,
  InterviewType,
  InterviewUpdateInput,
  JobInterviewBoard,
} from '@/features/hiring/types'
import type { CompanyProfile } from '@/features/companies/types'
import type {
  JobCreateInput,
  JobDetail,
  JobListItem,
  JobListParams,
  JobStatus,
  JobUpdateInput,
} from '@/features/jobs/types'
import { mockApplicants, mockCandidateProfile, mockJobs, mockReferences, mockResumeDetail, mockResumes } from './data'

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))
const tr = (s: string) => s.toLocaleLowerCase('tr-TR')
const asDetail = (j: JobListItem): JobDetail => ({ ...j, stats: j.stats ?? undefined })

// One in-memory dataset per session so mutations persist across pages.
const jobs: JobListItem[] = mockJobs(87)

export const mockCompany: CompanyProfile = {
  uid: 'mock-company',
  username: 'psb-teknoloji',
  external_id: 'mock-supabase-uid',
  is_account_completed: true,
  initial_job_credit_used: true,
  email: 'polat.kaya@psb-tech.com',
  status: 'approved',
  company_name: 'PSB Teknoloji',
  authorized_name: 'Polat',
  authorized_surname: 'Kaya',
  phone: null,
  country: 'Türkiye',
  province: 'İstanbul',
  town: 'Şişli',
  neighbourhood: null,
  is_civilian: false,
  location: null,
  tax_office_province: null,
  tax_office: null,
  tax_id_number: null,
  tax_certificate_url: null,
  employment_office: false,
  mail_domain: 'psb-tech.com',
  founded_year: '2019',
  company_website: 'https://psb-tech.com',
  industry: 'Yazılım',
  company_desc: null,
  photo_url: 'https://i.pravatar.cc/128?img=68',
  background_url: null,
  employee_count: '51-200',
  onboarding_reminder_step: 0,
  followers: [],
  sub_companies: [],
  parent_companies: [],
  affiliated_companies: [],
  pending_sent_requests: [],
  pending_received_requests: [],
  employees: [],
  approved_employees: [],
  rejected_employees: [],
  deleted_employees: [],
  priority_score: 0,
  is_deleted: false,
  perma_deleted: false,
  email_verified: true,
  phone_verified: false,
  plan: [],
  tags: [],
  seen_cv: [],
  downloaded_cv: [],
  notifications: [],
  email_update: null,
  phone_update: null,
  username_update: null,
  approved: 'registered',
  created_date: new Date(Date.now() - 400 * 86400000).toISOString(),
  deleted_date: null,
  deleted_by: null,
  deletion_requested_at: null,
  onesignal_player_id: null,
  approved_by: 'admin',
  approved_at: new Date(Date.now() - 390 * 86400000).toISOString(),
  rejected_by: null,
  rejected_at: null,
  rejection_reason: null,
  kvkk_isveren_accepted: true,
  isveren_sozlesmesi_accepted: true,
  ticari_elektronik_ileti_accepted: false,
  oib_sozlesmesi_accepted: true,
  cerez_politikasi_accepted: true,
  gizlilik_politikasi_accepted: true,
  instagram: null,
  instagram_url: null,
  linkedin: null,
  linkedin_url: null,
  twitter: null,
  twitter_url: null,
  settings: { review_info: '1', interview_info: '1', benefits_info: '1' },
  ratingCount: 12,
  averageRating: 4.3,
  page_is_active: null,
}

export const mockCompaniesApi = {
  get: async () => {
    await delay(200)
    return mockCompany
  },
}

function applyFilters(list: JobListItem[], p: JobListParams) {
  let out = list.filter((j) => !j.is_deleted)
  if (p.status) out = out.filter((j) => j.status === p.status)
  if (p.is_active !== undefined) out = out.filter((j) => j.is_active === p.is_active)
  if (p.type) out = out.filter((j) => j.type === p.type)
  if (p.province) out = out.filter((j) => j.province === p.province)
  if (p.working_type?.length) out = out.filter((j) => p.working_type!.some((w) => j.working_type.includes(w)))
  if (p.plan?.length) out = out.filter((j) => p.plan!.some((w) => (j.plan ?? []).includes(w)))
  if (p.search?.trim()) {
    const q = tr(p.search.trim())
    out = out.filter((j) =>
      [j.title, j.position, j.department, j.province, j.town].some((f) => tr(f ?? '').includes(q)),
    )
  }
  const sortBy = p.sortBy ?? 'created_on'
  const dir = (p.sortOrder ?? 'DESC') === 'DESC' ? -1 : 1
  out = [...out].sort((a, b) => {
    if (sortBy === 'relevance') return ((b.stats?.total_applications ?? 0) - (a.stats?.total_applications ?? 0)) * -dir
    if (sortBy === 'title') return a.title.localeCompare(b.title, 'tr') * dir
    if (sortBy === 'min_salary' || sortBy === 'max_salary')
      return (Number(a[sortBy] ?? 0) - Number(b[sortBy] ?? 0)) * dir
    const av = a[sortBy as 'created_on' | 'modified_on'] ?? ''
    const bv = b[sortBy as 'created_on' | 'modified_on'] ?? ''
    return String(av).localeCompare(String(bv)) * dir
  })
  return out
}

export const mockJobsApi = {
  listMine: async (_companyUid: string, params: JobListParams = {}) => {
    await delay()
    const page = params.page ?? 1
    const limit = params.limit ?? 24
    const all = applyFilters(jobs, params)
    const totalPages = Math.max(1, Math.ceil(all.length / limit))
    return {
      data: all.slice((page - 1) * limit, page * limit),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: all.length,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }
  },
  countMine: async () => {
    await delay(150)
    return { count: jobs.filter((j) => !j.is_deleted && j.status === 'approved').length }
  },
  detail: async (uid: string): Promise<JobDetail> => {
    await delay()
    const j = jobs.find((x) => x.uid === uid)
    if (!j) throw new Error('Job not found')
    return {
      ...asDetail(j),
      description:
        j.description ||
        `${j.title} pozisyonu için ${j.department} ekibimize takım arkadaşı arıyoruz. ` +
          'Ekip içi iş birliğine açık, sorumluluk alabilen ve gelişime istekli adayların başvurularını bekliyoruz.\n\n' +
          'Görevler: ekip hedeflerine katkı, süreçlerin takibi ve raporlama.',
      skills: [
        { skill_name: 'İletişim', level: '4', requirement: 'Zorunlu' },
        { skill_name: 'Takım çalışması', level: '4', requirement: 'Zorunlu' },
        { skill_name: 'Problem çözme', level: '3', requirement: 'Tercihen' },
      ],
      languages: [{ lang_name: 'İngilizce', lang_level: '3', requirement: 'Tercihen' }],
    }
  },
  statistics: async () => {
    await delay()
    return {
      overall_stats: { total_applications: 0, today_applications: 0 },
      education_stats: {},
      experience_stats: { experienced: 0, inexperienced: 0, positions_stats: {} },
      skills_stats: {},
      digital_skills_stats: {},
      languages_stats: {},
      departments_stats: {},
    }
  },
  create: async (input: JobCreateInput): Promise<JobDetail> => {
    await delay()
    const j = {
      ...mockJobs(1)[0]!,
      ...input,
      uid: `${Date.now().toString(16)}-mock-job`,
      status: 'draft' as JobStatus,
      is_active: false,
    }
    jobs.unshift(j)
    return asDetail(j)
  },
  update: async (uid: string, input: JobUpdateInput): Promise<JobDetail> => {
    await delay()
    const i = jobs.findIndex((x) => x.uid === uid)
    if (i < 0) throw new Error('Job not found')
    jobs[i] = { ...jobs[i]!, ...input, modified_on: new Date().toISOString() } as JobListItem
    return asDetail(jobs[i]!)
  },
  setStatus: async (uid: string, status: JobStatus): Promise<JobDetail> => {
    await delay()
    const i = jobs.findIndex((x) => x.uid === uid)
    if (i < 0) throw new Error('Job not found')
    jobs[i] = { ...jobs[i]!, status, is_active: status === 'approved', modified_on: new Date().toISOString() }
    return asDetail(jobs[i]!)
  },
  bulkSetStatus: async (uids: string[], status: JobStatus) => {
    await delay()
    return Promise.all(uids.map((uid) => mockJobsApi.setStatus(uid, status).then(() => ({ uid, success: true }))))
  },
  remove: async (uid: string) => {
    await delay()
    const i = jobs.findIndex((x) => x.uid === uid)
    if (i >= 0) jobs[i] = { ...jobs[i]!, is_deleted: true }
    return { uid }
  },
  checkSlug: async (slug: string) => {
    await delay(150)
    return { available: !jobs.some((j) => j.slug_url === slug), slug }
  },
}

export const mockCandidatesApi = {
  get: async (uid: string): Promise<CandidateProfile> => {
    await delay(250)
    return mockCandidateProfile(uid)
  },
  byUsername: async (username: string): Promise<CandidateProfile> => {
    await delay(250)
    return mockCandidateProfile(`${username}-employee`)
  },
  trackProfileView: async () => undefined,
  trackCvView: async () => undefined,
}

export const mockResumesApi = {
  listByEmployee: async (employeeUid: string): Promise<Resume[]> => {
    await delay(250)
    const list = mockResumes(employeeUid)
    list.forEach((r) => resumeOwners.set(r.id, employeeUid))
    return list
  },
  references: async (employeeUid: string): Promise<ProfileReference[]> => {
    await delay(250)
    return mockReferences(employeeUid)
  },
  get: async (id: number): Promise<ResumeDetail> => {
    await delay(300)
    // Which candidate a CV id belongs to isn't derivable, so the mock keeps a note of it as
    // the page loads the list first; fall back to the id itself for a direct hit.
    return mockResumeDetail(id, resumeOwners.get(id) ?? `${id}-employee`)
  },
}

/** Populated by `listByEmployee` so a later `get(id)` can rebuild the same CV. */
const resumeOwners = new Map<number, string>()

// ---------------------------------------------------------------------------
// Recruiting service (kariyer-recruiting-service): pipeline, interviews, notes.
// Shapes match the service's responses exactly, so switching VITE_USE_MOCKS off
// changes the origin of the data and nothing else.
// ---------------------------------------------------------------------------
const hour = 3600_000

export const mockHiringUsers: HiringUser[] = [
  { uid: 'mock-user-1', name: 'Polat Kaya', position: 'İK Müdürü', photoUrl: 'https://i.pravatar.cc/64?img=68' },
  { uid: 'mock-user-2', name: 'Selin Aksoy', position: 'İK Uzmanı', photoUrl: 'https://i.pravatar.cc/64?img=45' },
  { uid: 'mock-user-3', name: 'Barış Ergün', position: 'Yazılım Takım Lideri', photoUrl: null },
]

const currentUser = mockHiringUsers[0]!
const candidatePool = mockApplicants(140, 99)
const OPENING_STAGES: ApplicationStage[] = ['NEW', 'REVIEWING', 'CONTACT', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']

const TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  NEW: ['REVIEWING', 'CONTACT', 'REJECTED', 'HOLD'],
  REVIEWING: ['CONTACT', 'INTERVIEW', 'REJECTED', 'HOLD'],
  CONTACT: ['INTERVIEW', 'REJECTED', 'HOLD'],
  INTERVIEW: ['OFFER', 'REJECTED', 'HOLD'],
  OFFER: ['HIRED', 'REJECTED', 'HOLD'],
  HIRED: ['OFFER', 'HOLD', 'REJECTED'],
  HOLD: ['NEW', 'REVIEWING', 'CONTACT', 'INTERVIEW', 'REJECTED'],
  REJECTED: ['HOLD'],
  WITHDRAWN: [],
}

const applications: ApplicationRow[] = jobs
  .flatMap((job, ji) => {
    const total = job.stats?.total_applications ?? 0
    if (!total) return []

    const seed = (parseInt(job.uid.slice(0, 8), 16) || ji + 1) >>> 0
    const count = Math.min(total, 3 + (seed % 16))

    return Array.from({ length: count }, (_, i): ApplicationRow => {
      const person = candidatePool[(seed + i * 7) % candidatePool.length]!
      const stage = OPENING_STAGES[(seed + i * 5) % OPENING_STAGES.length]!
      const appliedAt = new Date(Date.now() - ((seed % 40) + i * 3) * 86400000).toISOString()

      return {
        id: `${job.uid}-${i}-app`,
        job: { uid: job.uid, title: job.title },
        candidate: {
          id: person.uid,
          fullName: `${person.name ?? ''} ${person.surname ?? ''}`.trim(),
          email: person.email,
          phone: person.phone,
          location: 'Şişli, İstanbul',
          avatarUrl: person.photo_url ?? null,
        },
        stage,
        stageLabel: STAGE_LABELS[stage],
        score: 40 + ((seed + i * 11) % 60),
        resumeId: 100 + ((seed + i) % 900),
        appliedAt,
        lastActivityAt: appliedAt,
        hasNote: false,
        nextInterview: null,
        allowedActions: TRANSITIONS[stage],
      }
    })
  })
  .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))

const interviews: Interview[] = applications
  .filter((a) => a.stage === 'INTERVIEW' || a.stage === 'OFFER')
  .filter((_, i) => i % 2 === 0)
  .map((application, i) => {
    const seed = (parseInt(application.id.slice(0, 6), 16) || i + 1) >>> 0
    const offsets = [-0.2 * hour, 2 * hour, 26 * hour, 3 * 24 * hour, -2 * 24 * hour, -9 * 24 * hour]
    const at = Date.now() + offsets[(seed + i) % offsets.length]!
    const past = at < Date.now() - hour
    const status: InterviewStatus = past ? ((seed + i) % 5 === 0 ? 'NO_SHOW' : 'COMPLETED') : 'SCHEDULED'
    const type = (['VIDEO', 'IN_PERSON', 'PHONE'] as InterviewType[])[(seed + i) % 3]!

    return {
      uid: `${application.id}-interview`,
      applicationUid: application.id,
      jobUid: application.job.uid,
      candidateUid: application.candidate.id,
      type,
      startsAt: new Date(at).toISOString(),
      durationMinutes: [30, 45, 60][(seed + i) % 3]!,
      timeZone: 'Europe/Istanbul',
      location:
        type === 'VIDEO'
          ? 'https://meet.google.com/kz-mock-abc'
          : type === 'IN_PERSON'
            ? 'Merkez Ofis · Şişli, İstanbul'
            : '+90 212 000 00 00',
      status,
      confirmationStatus: status === 'SCHEDULED' ? 'PENDING' : 'ACCEPTED',
      candidateMessage: null,
      result: status === 'COMPLETED' ? (['POSITIVE', 'NEGATIVE', 'UNDECIDED'] as const)[(seed + i) % 3]! : null,
      note: status === 'COMPLETED' ? 'Teknik yetkinlik yeterli, ikinci görüşme önerilir.' : null,
      interviewer: mockHiringUsers[(seed + i) % mockHiringUsers.length]!,
      invitedBy: mockHiringUsers[(seed + i * 2) % mockHiringUsers.length]!,
      participants: [],
      createdAt: new Date(at - 3 * 24 * hour).toISOString(),
      updatedAt: new Date(at - 3 * 24 * hour).toISOString(),
    }
  })

const notes: ApplicationNote[] = applications
  .filter((_, i) => i % 5 === 0)
  .map((application, i) => ({
    applicationUid: application.id,
    candidateUid: application.candidate.id,
    body:
      i % 3 === 0
        ? 'Telefonda görüşüldü, pozisyona ilgili. Maaş beklentisi bant içinde.'
        : i % 3 === 1
          ? 'Deneyimi ilanla birebir örtüşmüyor ama portföyü güçlü.'
          : 'Referans kontrolü olumlu döndü.',
    author: mockHiringUsers[i % mockHiringUsers.length]!,
    createdAt: new Date(Date.now() - (i + 1) * 2 * 24 * hour).toISOString(),
    updatedAt: new Date(Date.now() - (i + 1) * 2 * 24 * hour).toISOString(),
  }))

const noteFor = (applicationUid: string) => notes.find((n) => n.applicationUid === applicationUid)

const nextInterviewFor = (applicationUid: string) => {
  const scheduled = interviews
    .filter((i) => i.applicationUid === applicationUid && i.status === 'SCHEDULED')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]

  return scheduled
    ? {
        id: scheduled.uid,
        startsAt: scheduled.startsAt,
        durationMinutes: scheduled.durationMinutes,
        type: scheduled.type,
        status: scheduled.status,
        confirmationStatus: scheduled.confirmationStatus,
      }
    : null
}

const hydrate = (row: ApplicationRow): ApplicationRow => ({
  ...row,
  hasNote: !!noteFor(row.id),
  nextInterview: nextInterviewFor(row.id),
  allowedActions: TRANSITIONS[row.stage],
})

function paginate(rows: ApplicationRow[], params: { page?: number; limit?: number }) {
  const limit = params.limit ?? 20
  const page = params.page ?? 1
  const totalPages = Math.max(1, Math.ceil(rows.length / limit))

  return {
    items: rows.slice((page - 1) * limit, page * limit).map(hydrate),
    pagination: { page, limit, total: rows.length, totalPages },
  }
}

function filterApplications(params: CompanyApplicationParams) {
  let rows = applications

  if (params.jobUid) rows = rows.filter((r) => r.job.uid === params.jobUid)
  if (params.candidateUid) rows = rows.filter((r) => r.candidate.id === params.candidateUid)
  if (params.status) rows = rows.filter((r) => r.stage === params.status)

  if (params.q?.trim()) {
    const q = tr(params.q.trim())
    rows = rows.filter((r) =>
      [r.candidate.fullName, r.candidate.email, r.job.title].some((v) => tr(v ?? '').includes(q)),
    )
  }

  if (params.sort === 'appliedAt:asc') rows = [...rows].reverse()
  if (params.sort === 'stage:asc') {
    rows = [...rows].sort((a, b) => APPLICATION_STAGES.indexOf(a.stage) - APPLICATION_STAGES.indexOf(b.stage))
  }

  return rows
}

function statsFor(jobUid: string): Record<string, number> {
  const rows = applications.filter((r) => r.job.uid === jobUid)
  const stats: Record<string, number> = { ALL: rows.length }

  for (const row of rows) stats[row.stage] = (stats[row.stage] ?? 0) + 1

  return stats
}

export const mockApplicationsApi = {
  listByJob: async (jobUid: string, params: ApplicationListParams = {}): Promise<ApplicationListResponse> => {
    await delay(300)
    const rows = filterApplications({ ...params, jobUid })
    return { ...paginate(rows, params), stats: statsFor(jobUid) }
  },

  listByCompany: async (params: CompanyApplicationParams = {}): Promise<ApplicationListResponse> => {
    await delay(300)
    return { ...paginate(filterApplications(params), params), stats: {} }
  },

  stats: async (jobUid: string): Promise<ApplicationStatsResponse> => {
    await delay(200)
    const rows = interviews.filter((i) => i.jobUid === jobUid)
    return {
      stages: statsFor(jobUid),
      interviews: { total: rows.length, scheduled: rows.filter((i) => i.status === 'SCHEDULED').length },
    }
  },

  setStage: async (applicationUid: string, status: ApplicationStage): Promise<ChangeStageResponse> => {
    await delay(250)
    const row = applications.find((a) => a.id === applicationUid)
    if (!row) throw new Error('Application not found')
    if (!TRANSITIONS[row.stage].includes(status)) {
      throw new Error(`Invalid stage transition: ${row.stage} -> ${status}`)
    }

    row.stage = status
    row.stageLabel = STAGE_LABELS[status]
    row.allowedActions = TRANSITIONS[status]
    row.lastActivityAt = new Date().toISOString()

    return {
      applicationUid,
      stage: status,
      stageLabel: STAGE_LABELS[status],
      allowedActions: TRANSITIONS[status],
    }
  },

  notesByJob: async (jobUid: string): Promise<ApplicationNote[]> => {
    await delay(200)
    const ids = new Set(applications.filter((a) => a.job.uid === jobUid).map((a) => a.id))
    return notes.filter((n) => ids.has(n.applicationUid))
  },

  note: async (applicationUid: string): Promise<ApplicationNote | null> => {
    await delay(200)
    return notes.find((n) => n.applicationUid === applicationUid) ?? null
  },

  saveNote: async (applicationUid: string, body: string): Promise<ApplicationNote | null> => {
    await delay(200)
    const trimmed = body.trim()
    const index = notes.findIndex((n) => n.applicationUid === applicationUid)

    if (!trimmed) {
      if (index >= 0) notes.splice(index, 1)
      return null
    }

    const now = new Date().toISOString()

    if (index >= 0) {
      notes[index] = { ...notes[index]!, body: trimmed, author: currentUser, updatedAt: now }
      return notes[index]!
    }

    const application = applications.find((a) => a.id === applicationUid)
    const note: ApplicationNote = {
      applicationUid,
      candidateUid: application?.candidate.id ?? '',
      body: trimmed,
      author: currentUser,
      createdAt: now,
      updatedAt: now,
    }

    notes.unshift(note)

    return note
  },

  activity: async (applicationUid: string): Promise<ActivityEntry[]> => {
    await delay(200)
    const row = applications.find((a) => a.id === applicationUid)
    if (!row) return []

    return [
      {
        id: 1,
        type: 'STAGE_CHANGED',
        actorUid: currentUser.uid,
        actorName: currentUser.name,
        metadata: { to: row.stage },
        createdAt: row.lastActivityAt ?? row.appliedAt,
      },
      {
        id: 2,
        type: 'APPLICATION_CREATED',
        actorUid: null,
        actorName: null,
        metadata: {},
        createdAt: row.appliedAt,
      },
    ]
  },
}

export const mockHiringApi = {
  boardByJob: async (jobUid: string): Promise<JobInterviewBoard> => {
    await delay(250)
    const rows = interviews.filter((i) => i.jobUid === jobUid)
    const now = Date.now()
    const ongoing = rows.filter(
      (i) =>
        i.status === 'SCHEDULED' &&
        new Date(i.startsAt).getTime() <= now &&
        now < new Date(i.startsAt).getTime() + i.durationMinutes * 60_000,
    )
    const upcoming = rows
      .filter((i) => i.status === 'SCHEDULED' && new Date(i.startsAt).getTime() > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

    return {
      ongoing,
      upcoming,
      past: rows
        .filter((i) => !ongoing.includes(i) && !upcoming.includes(i))
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    }
  },

  byCandidate: async (candidateUid: string): Promise<Interview[]> => {
    await delay(250)
    return interviews
      .filter((i) => i.candidateUid === candidateUid)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
  },

  create: async (applicationUid: string, input: InterviewCreateInput): Promise<Interview> => {
    await delay(300)
    const application = applications.find((a) => a.id === applicationUid)
    if (!application) throw new Error('Application not found')

    const now = new Date().toISOString()
    const interview: Interview = {
      uid: `${Date.now().toString(16)}-interview`,
      applicationUid,
      jobUid: application.job.uid,
      candidateUid: application.candidate.id,
      type: input.type,
      startsAt: input.startsAt,
      durationMinutes: input.durationMinutes,
      timeZone: input.timeZone ?? 'Europe/Istanbul',
      location: input.type === 'VIDEO' ? (input.videoUrl ?? null) : (input.location ?? null),
      candidateMessage: input.candidateMessage ?? null,
      status: 'SCHEDULED',
      confirmationStatus: 'PENDING',
      result: null,
      note: input.internalNote ?? null,
      interviewer: mockHiringUsers.find((u) => u.uid === input.interviewerUid) ?? currentUser,
      invitedBy: currentUser,
      participants: (input.participants ?? []).map((p): InterviewParticipant => ({
        email: p.email,
        name: p.name ?? null,
        role: p.role,
      })),
      createdAt: now,
      updatedAt: now,
    }

    interviews.unshift(interview)

    // The service moves the application into INTERVIEW in the same transaction, walking through
    // REVIEWING when the current stage cannot reach it directly (NEW).
    if (!TRANSITIONS[application.stage].includes('INTERVIEW') && TRANSITIONS[application.stage].includes('REVIEWING')) {
      application.stage = 'REVIEWING'
    }

    if (TRANSITIONS[application.stage].includes('INTERVIEW')) {
      application.stage = 'INTERVIEW'
      application.stageLabel = STAGE_LABELS.INTERVIEW
      application.allowedActions = TRANSITIONS.INTERVIEW
    }

    return interview
  },

  update: async (uid: string, input: InterviewUpdateInput): Promise<Interview> => {
    await delay(250)
    const index = interviews.findIndex((i) => i.uid === uid)
    if (index < 0) throw new Error('Interview not found')

    const current = interviews[index]!
    const type = input.type ?? current.type

    interviews[index] = {
      ...current,
      ...input,
      type,
      location: input.videoUrl ?? input.location ?? (type === current.type ? current.location : null),
      status: input.status ?? current.status,
      result: input.result ?? current.result,
      note: input.note ?? current.note,
      interviewer: mockHiringUsers.find((u) => u.uid === input.interviewerUid) ?? current.interviewer,
      updatedAt: new Date().toISOString(),
    }

    return interviews[index]!
  },

  cancel: async (uid: string): Promise<Interview> => {
    await delay(200)
    const index = interviews.findIndex((i) => i.uid === uid)
    if (index < 0) throw new Error('Interview not found')

    const cancelled: Interview = { ...interviews[index]!, status: 'CANCELLED', updatedAt: new Date().toISOString() }
    interviews.splice(index, 1)

    return cancelled
  },

  members: async (): Promise<HiringUser[]> => {
    await delay(150)
    return mockHiringUsers
  },
}
