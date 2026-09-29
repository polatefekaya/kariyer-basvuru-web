import { api, recruitingApi } from '@/lib/api'
import config from '@/config/config'
import { currentCompanyUid } from '@/features/auth'

/**
 * Copies the signed-in company's postings and applicants from the Node backend into
 * kariyer-recruiting-service's local stand-in tables, so the ATS screens (notlar, mülakatlar,
 * hareket geçmişi, dokuz aşamalı pipeline) can run against real data on a developer machine.
 *
 * The service authorises every read against `public.job_application` / `company_job` in its own
 * database. Deployed, that is the same database the monolith writes; locally it is a seeded
 * throwaway that has never heard of a real uid, which is why those screens are hidden until this
 * runs. Nothing is written to the backend — this only reads what the portal already reads, and
 * posts it to the local service.
 *
 * In the browser console:
 *
 *   await __kzSyncAts()
 *
 * Then set `VITE_RECRUITING_LIVE=true` and restart the dev server.
 */

interface NodeJob {
  uid: string
  title?: string | null
  department?: string | null
  position?: string | null
  province?: string | null
  town?: string | null
}

interface NodeApplication {
  uid: string
  job_uid: string
  applicant_uid: string
  resume_id?: number | null
  application_status?: string | null
  applied_at?: string | null
  applicant?: {
    uid: string
    username?: string | null
    name?: string | null
    surname?: string | null
    email?: string | null
    phone?: string | null
    photo_url?: string | null
  } | null
  resume?: { province?: string | null; town?: string | null } | null
}

async function syncAts() {
  const companyUid = currentCompanyUid()

  if (!companyUid) {
    throw new Error('Şirket henüz yüklenmedi — panelde oturum açıp tekrar deneyin.')
  }

  // `/company/:uid` spreads the record next to `success` rather than nesting it under `data`.
  const company = await api.get<{ external_id?: string | null; company_name?: string | null }>(`/company/${companyUid}`)

  const jobs = await api
    .get<{ data?: NodeJob[] }>(`/jobs/company/${companyUid}`, { params: { limit: 100 } })
    .then((res) => res.data ?? [])

  const applications: NodeApplication[] = []

  for (const job of jobs) {
    const page = await api
      .get<{ data?: NodeApplication[] }>(`/job_applications/${job.uid}/applications`, { params: { limit: 100 } })
      .then((res) => res.data ?? [])
      .catch(() => [])

    applications.push(...page)
  }

  const candidates = new Map<string, NodeApplication>()
  for (const row of applications) candidates.set(row.applicant_uid, row)

  const payload = {
    company: {
      uid: companyUid,
      externalId: company.external_id ?? null,
      name: company.company_name ?? null,
    },
    jobs: jobs.map((job) => ({
      uid: job.uid,
      title: job.title ?? '',
      department: job.department ?? '',
      position: job.position ?? '',
      province: job.province ?? '',
      town: job.town ?? '',
    })),
    candidates: [...candidates.values()].map((row) => ({
      uid: row.applicant_uid,
      username: row.applicant?.username ?? null,
      name: row.applicant?.name ?? null,
      surname: row.applicant?.surname ?? null,
      email: row.applicant?.email ?? null,
      phone: row.applicant?.phone ?? null,
      photoUrl: row.applicant?.photo_url ?? null,
      province: row.resume?.province ?? null,
      town: row.resume?.town ?? null,
    })),
    applications: applications.map((row) => ({
      uid: row.uid,
      jobUid: row.job_uid,
      candidateUid: row.applicant_uid,
      resumeId: row.resume_id ?? null,
      status: row.application_status ?? 'pending',
      appliedAt: row.applied_at ?? new Date().toISOString(),
    })),
  }

  const result = await recruitingApi.post<{ jobs: number; candidates: number; applications: number }>(
    '/dev/stand-ins',
    payload,
    { anonymous: true },
  )

  console.info(
    `[ats-bridge] ${result.jobs} ilan, ${result.candidates} aday, ${result.applications} başvuru ` +
      `${config.RECRUITING_API_URL} servisine kopyalandı.` +
      (config.RECRUITING_LIVE ? '' : ' VITE_RECRUITING_LIVE=true yapıp dev sunucusunu yeniden başlatın.'),
  )

  return result
}

declare global {
  interface Window {
    __kzSyncAts: typeof syncAts
  }
}

window.__kzSyncAts = syncAts
