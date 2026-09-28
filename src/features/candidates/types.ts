import type { BaseIdentity, DynamicPageSummary, ISODateString, PrivacyLevel } from '@/features/common/types'

/** `looking_job` is a STRING column: "0" not looking · "1" looking. */
export type LookingJob = '0' | '1' | (string & {})

// ---------------------------------------------------------------------------
// Employee — the `employee` table (Sequelize `Employee`). In this portal an employee is
// always a CANDIDATE viewed by the signed-in company; they never log in here.
// Pre-Supabase auth columns on the model are dead and not typed.
// ---------------------------------------------------------------------------
export interface Employee extends BaseIdentity {
  email: string
  name: string | null
  surname: string | null
  phone: string | null
  race: string | null
  national_id: string | null
  birth_date: ISODateString | null
  gender: string | null
  /** Sequelize typo preserved — the column really is `adress`. */
  adress: string | null
  /** Bio. */
  describe: string | null
  /** Headline / job title. */
  title: string | null
  working_type: string | null
  looking_job: LookingJob
  onboarding_reminder_step: number

  selected_skills: string[]
  following: string[]
  followers: string[]
  notifications: string[]

  is_deleted: boolean
  perma_deleted: boolean
  is_rating: boolean

  email_verified: boolean
  phone_verified: boolean
  created_date: ISODateString
  email_update: ISODateString | null
  phone_update: ISODateString | null
  username_update: ISODateString | null

  company_email: string | null
  company_email_verified: boolean

  deleted_date: ISODateString | null
  deleted_by: string | null
  deletion_requested_at: ISODateString | null
  onesignal_player_id: string | null

  kvkk_aydinlatma_accepted: boolean
  kullanici_sozlesmesi_accepted: boolean
  acik_riza_accepted: boolean
  ticari_elektronik_ileti_accepted: boolean
  cerez_politikasi_accepted: boolean
  gizlilik_politikasi_accepted: boolean
}

/** `employee_settings` — which profile sections the candidate exposes. "0" hidden · "1" followers · "12" public. */
export interface EmployeeSettings {
  edu_info: PrivacyLevel
  ex_info: PrivacyLevel
  social_info: PrivacyLevel
  ref_info: PrivacyLevel
  award_info: PrivacyLevel
  skill_info: PrivacyLevel
  address_info: PrivacyLevel
  desc_info: PrivacyLevel
  created_at?: ISODateString
  updated_at?: ISODateString
}

export interface ResumeLink {
  id: number
  resume_id: number
  link_name: string
  link_desc: string
  username?: string | null
  is_selected: boolean
}

/**
 * `GET /employee/:uidOrSupabaseId[/:resume_id]` — the candidate profile as a company sees it.
 * Pass the `resume_id` from the application so the hoisted resume fields match what they applied with.
 * NOTE: this endpoint spreads the record at the top level next to `success` (no `data`).
 */
export interface CandidateProfile extends Employee {
  dynamicPages?: DynamicPageSummary[]
  settings: EmployeeSettings | null

  active_resume_id: number | null
  requested_resume_id: string | null

  followerCount: number
  followingCount: number
  totalFollowerCount: number
  totalFollowingCount: number
  page_is_active: boolean | null

  // Hoisted from the (requested or active) resume
  resume_country: string
  resume_province: string
  resume_town: string
  resume_neighbourhood: string
  resume_adress: string
  /** Latest experience. */
  position: string | null
  company: string | null
  /** Latest education. */
  school_name: string | null
  department: string | null
  links: ResumeLink[]

  monthly_stats: { profile_views: number; cv_views: number }
}

/** Applicant as embedded on a job application (`attributes: uid, username, name, surname, email, photo_url, phone`). */
export type CandidateSummary = Pick<Employee, 'uid' | 'username' | 'name' | 'surname' | 'email' | 'photo_url' | 'phone'>
