import type { DecimalString, ISODateString, LatLng } from '@/features/common/types'
import type { BaseCompany } from '@/features/companies/types'

// ---------------------------------------------------------------------------
// Vocabularies. Values are the exact strings stored in the DB (Turkish), as written by the
// create-job form. `(string & {})` keeps the unions open for legacy/unknown rows without
// losing autocomplete.
// ---------------------------------------------------------------------------

/** `company_job.status` — Sequelize ENUM. */
export type JobStatus =
  'draft' | 'unclaimed' | 'pending_approval' | 'company_not_found' | 'approved' | 'rejected' | 'expired' | 'closed'

/** `type` — default "Tam Zamanlı". The model marks it as an enum-to-be. */
export type JobType = 'Tam Zamanlı' | 'Yarı Zamanlı' | 'Proje Bazlı' | 'Dönemsel' | 'Stajyer' | (string & {})

/** `working_type[]` — the form writes these three ("Ofiste" in the model comment is legacy). */
export type WorkingType = 'İş Yerinde' | 'Uzaktan' | 'Hibrit' | (string & {})

/** `working_prefs[]` — includes two legacy spellings that exist in stored rows; never write them. */
export type WorkingPref =
  | 'Tam Zamanlı'
  | 'Kısmi Zamanlı'
  | 'Stajyer (Zorunlu)'
  | 'Stajyer (Gönüllü)'
  | 'Proje Bazlı'
  | 'Freelance'
  | 'Dönemsel'
  | 'Staj (Zorunlu)'
  | 'Staj (Gönüllü)'
  | (string & {})

export type MilitaryStatus = 'Yapıldı' | 'Muaf' | 'Tecilli' | (string & {})

export type EducationLevel =
  'İlkokul' | 'Ortaokul' | 'Lise' | 'Ön Lisans' | 'Lisans' | 'Yüksek Lisans' | 'Doktora' | (string & {})

/** `gender` — empty string means "no preference". */
export type JobGender = 'Erkek' | 'Kadın' | '' | (string & {})

export type JobPlan = 'Vitrin İlan' | (string & {})

// ---------------------------------------------------------------------------
// CompanyJob — 1:1 with the Sequelize model (`company_job`, timestamps: false).
// ---------------------------------------------------------------------------
export interface CompanyJob {
  /** PK, `${uuidv4()}-job`. */
  uid: string
  /** Unique ID from the data broker (de-duplication); null for jobs created in-app. */
  external_reference_id: string | null
  company_uid: string | null

  title: string
  type: JobType
  description: string
  department: string
  dep_size: string
  position: string
  pos_size: string
  /** Stored as text, e.g. "1 kişi". */
  worker_count: string

  working_type: WorkingType[]
  working_prefs: WorkingPref[]
  working_days: string[]
  working_hours: string

  country: string
  province: string
  town: string
  neighbourhood: string
  location_link: string | null
  /** `[lat, lng]`, or `[]` when not set. */
  coordinates: LatLng | []

  job_start_date: ISODateString | null
  job_end_date: ISODateString | null

  /** DECIMAL(12,2) → string. `null` = not disclosed. See `parseMoney` / `formatSalary`. */
  min_salary: DecimalString | null
  max_salary: DecimalString | null
  /** Default "TL". */
  currency: string

  benefits: string[]
  company_desc: string
  job_desc: string
  provided_things: string | null
  /** Hide the company name on the public listing. */
  is_secret_name: boolean
  /** External application URL; when set, "apply" redirects instead of creating an application. */
  additional_link: string | null
  /** `${slugified title}-${first uid segment}`, generated server-side. */
  slug_url: string

  experience_year: number | null
  gender: JobGender | null
  education_status: EducationLevel[]
  education_department: string[]
  military: MilitaryStatus[]
  driver_license: string[] | null
  is_shift_work: boolean
  /** e.g. "8", "12", "8-12". */
  shift_daily_hours: string | null
  is_experience_required: boolean

  status: JobStatus
  /** Purchased plans, e.g. ["Vitrin İlan"]. */
  plan: JobPlan[] | null

  modified_on: ISODateString | null
  modified_by: string | null
  created_on: ISODateString
  created_by: string

  is_active: boolean
  is_deleted: boolean
  /** Posted by an HR / recruitment firm on behalf of a client. */
  is_hr: boolean
  /** Broker-imported row that was hand-edited; the sync must not overwrite it. */
  is_manually_edited: boolean
  payload_hash: string | null

  // --- Anonymous draft → account linking (only present on the owner's own drafts) ---
  draft_account_email?: string | null
  client_nonce?: string | null
  /** JSON blob `{ skills, languages, questions }` kept until the draft is claimed. */
  draft_payload?: string | null
}

// ---------------------------------------------------------------------------
// Associations (shapes as the API serialises them today; full models to follow).
// ---------------------------------------------------------------------------
export interface JobLanguage {
  id?: number
  job_uid?: string
  lang_name?: string
  /** "1"–"5". */
  lang_level?: string
  /** "Zorunlu" | "Tercihen". */
  requirement?: string
  createdAt?: ISODateString
  updatedAt?: ISODateString
}

export interface JobSkill {
  id?: number
  job_uid?: string
  skill_name?: string
  level?: string
  requirement?: string
  is_digital?: boolean
  createdAt?: ISODateString
  updatedAt?: ISODateString
}

export interface JobQuestion {
  id?: number
  job_uid?: string
  question_type?: string
  question?: string
  choice1?: string
  choice2?: string
  choice3?: string
  choice4?: string
  choice5?: string
  is_required?: boolean
  order_index?: number
  created_at?: ISODateString
  updated_at?: ISODateString
}

/** `JobStat` (hasOne, as `stats`). */
export interface JobStats {
  job_uid?: string
  total_views?: number
  unique_views?: number
  total_applications?: number
  accepted_applications?: number
  rejected_applications?: number
  average_score?: DecimalString
  conversion_rate?: DecimalString
  last_viewed_at?: ISODateString
  last_applied_at?: ISODateString
  applications_this_week?: number
  applications_this_month?: number
  most_common_device?: string
  created_at?: ISODateString
  updated_at?: ISODateString
}

/** `GET /jobs/:uid/stats` (company side). */
export interface JobStatisticsData {
  overall_stats: { total_applications: number; today_applications: number }
  education_stats: Record<string, number>
  experience_stats: { experienced: number; inexperienced: number; positions_stats: Record<string, number> }
  skills_stats: Record<string, { required_level: number; matching_count: number }>
  digital_skills_stats: Record<string, { required_level: number; matching_count: number }>
  languages_stats: Record<string, number>
  departments_stats: Record<string, number>
}

/** Candidate ↔ job matching, returned next to `data` in the detail envelope. */
export interface JobMatch {
  is_vetoed?: boolean
  veto_reason?: string
  overall_match_percentage?: number
  /** 0–100 evidence strength — low means the listing/CV said little, not a poor match. */
  confidence_score?: number | null
  /** Employer-side ordering score; never shown to candidates. */
  rank_score?: number
  missing_mandatory?: string[]
  details?: {
    location?: number
    experience?: number
    education?: number
    digital_skills?: number
    language?: number
    soft_skills?: number
  }
  matched_criteria?: string[]
  missing_criteria?: string[]
}

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

/** `GET /jobs/:uid` (+ `GET /jobs/:uid/stats`) merged — see `jobsApi.detail`. */
export interface JobDetail extends CompanyJob {
  company?: BaseCompany
  languages?: JobLanguage[]
  skills?: JobSkill[]
  questions?: JobQuestion[]
  /** `JobStat` row (views/applications counters). */
  stats?: JobStats
  /** Applicant analytics from `/jobs/:uid/stats`. */
  statistics?: JobStatisticsData
}

/**
 * `GET /jobs/company/:companyUid` rows: the full job row, with the `stats` counters included
 * when sorting by relevance. Cards need only a subset but the payload is the whole row.
 */
export type JobListItem = CompanyJob & { stats?: JobStats | null; company?: BaseCompany }

export type JobListSort =
  'created_on' | 'modified_on' | 'title' | 'type' | 'status' | 'is_active' | 'min_salary' | 'max_salary' | 'relevance'

/** `jobService.parseFilters` + `parsePagination` for the company job list. */
export interface JobListParams {
  status?: JobStatus
  is_active?: boolean
  title?: string
  type?: JobType
  department?: string
  position?: string
  province?: string
  town?: string
  working_type?: WorkingType[]
  working_prefs?: WorkingPref[]
  plan?: JobPlan[]
  created_on_after?: ISODateString
  created_on_before?: ISODateString
  search?: string
  page?: number
  limit?: number
  sortBy?: JobListSort
  sortOrder?: 'ASC' | 'DESC'
}

/** Fields a client may send when creating a job (server owns uid, slug, audit, status flags). */
export type JobCreateInput = Partial<
  Omit<
    CompanyJob,
    | 'uid'
    | 'external_reference_id'
    | 'slug_url'
    | 'status'
    | 'modified_on'
    | 'modified_by'
    | 'created_on'
    | 'created_by'
    | 'is_deleted'
    | 'is_manually_edited'
    | 'payload_hash'
    | 'draft_account_email'
    | 'client_nonce'
    | 'draft_payload'
  >
> & {
  title: string
  skills?: Pick<JobSkill, 'skill_name' | 'level' | 'requirement' | 'is_digital'>[]
  languages?: Pick<JobLanguage, 'lang_name' | 'lang_level' | 'requirement'>[]
  questions?: Pick<
    JobQuestion,
    | 'question_type'
    | 'question'
    | 'choice1'
    | 'choice2'
    | 'choice3'
    | 'choice4'
    | 'choice5'
    | 'is_required'
    | 'order_index'
  >[]
}

export type JobUpdateInput = Partial<JobCreateInput>
