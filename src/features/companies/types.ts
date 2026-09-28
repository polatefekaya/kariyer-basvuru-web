import type { BaseIdentity, DynamicPageSummary, ISODateString, PrivacyLevel } from '@/features/common/types'

/** `status` — admin approval workflow (`companyApprovalController`). */
export type CompanyStatus = 'pending_approval' | 'approved' | 'rejected' | (string & {})

/** `approved` — Sequelize ENUM describing how the row was created, NOT approval. `registered`: self-registered · `inserted`: imported. */
export type CompanyApproval = 'registered' | 'inserted' | 'none'

export interface CompanySocial {
  instagram: string | null
  instagram_url: string | null
  linkedin: string | null
  linkedin_url: string | null
  twitter: string | null
  twitter_url: string | null
  company_website: string | null
}

// ---------------------------------------------------------------------------
// Company — `company` (Sequelize `Company`, timestamps: false).
// Auth lives in Supabase + the identity gateway; the model's pre-Supabase auth columns
// (password, jwt, *_hash, verification_code, reset counters) are dead and not typed here.
// ---------------------------------------------------------------------------
export interface Company extends BaseIdentity, CompanySocial {
  /** One-time free job posting credit, consumed when claiming the first anonymous draft. */
  initial_job_credit_used: boolean
  email: string
  /** Admin approval workflow. Only `approved` (+ `is_account_completed`) may use this portal. */
  status: CompanyStatus | null

  company_name: string | null
  authorized_name: string | null
  authorized_surname: string | null
  phone: string | null
  /** NGO / civil society organisation (STK). */
  is_civilian: boolean
  /** Free-text address. */
  location: string | null

  tax_office_province: string | null
  tax_office: string | null
  tax_id_number: string | null
  tax_certificate_url: string | null
  /** İŞKUR-style employment office account. */
  employment_office: boolean
  mail_domain: string | null
  founded_year: string | null
  industry: string | null
  company_desc: string | null
  /** Stored as text, e.g. "51-200". */
  employee_count: string | null
  onboarding_reminder_step: number

  // Legacy uid arrays. Prefer the relationship / follow-stats endpoints for counts.
  followers: string[]
  sub_companies: string[]
  parent_companies: string[]
  affiliated_companies: string[]
  pending_sent_requests: string[]
  pending_received_requests: string[]
  employees: string[]
  approved_employees: string[]
  rejected_employees: string[]
  deleted_employees: string[]

  priority_score: number
  is_deleted: boolean
  perma_deleted: boolean
  email_verified: boolean
  phone_verified: boolean
  plan: string[]
  tags: string[]
  /** Resume ids. */
  seen_cv: number[]
  downloaded_cv: number[]
  notifications: string[]

  email_update: ISODateString | null
  phone_update: ISODateString | null
  username_update: ISODateString | null

  approved: CompanyApproval
  created_date: ISODateString
  deleted_date: ISODateString | null
  deleted_by: string | null
  deletion_requested_at: ISODateString | null
  onesignal_player_id: string | null
  approved_by: string | null
  approved_at: ISODateString | null
  rejected_by: string | null
  rejected_at: ISODateString | null
  rejection_reason: string | null

  // Legal consents
  kvkk_isveren_accepted: boolean
  isveren_sozlesmesi_accepted: boolean
  ticari_elektronik_ileti_accepted: boolean
  oib_sozlesmesi_accepted: boolean
  cerez_politikasi_accepted: boolean
  gizlilik_politikasi_accepted: boolean
}

/** `company_settings` (hasOne, as `settings`) — which public tabs are enabled. Defaults "1". */
export interface CompanySettings {
  review_info: PrivacyLevel
  interview_info: PrivacyLevel
  benefits_info: PrivacyLevel
}

/**
 * `GET /company/:uidOrSupabaseId` and `GET /company/username/:username` → `{ success, data }`.
 * Row + aggregates computed in the repository.
 */
export interface CompanyProfile extends Company {
  dynamicPages?: DynamicPageSummary[]
  settings: CompanySettings | null
  ratingCount: number
  /** Mean `rating_score`, 2 dp; 0 when unrated. */
  averageRating: number
  page_is_active: boolean | null
}

/** As embedded in job responses (`CompanyJob.company`) — the React app's `BaseCompany`. */
export type BaseCompany = Pick<
  Company,
  | 'uid'
  | 'username'
  | 'photo_url'
  | 'background_url'
  | 'external_id'
  | 'is_account_completed'
  | 'country'
  | 'province'
  | 'town'
  | 'neighbourhood'
> & {
  company_name: string
  company_desc?: string | null
  slug?: string
  employee_count?: string | null
  is_hidden?: boolean
  industry?: string | null
}
