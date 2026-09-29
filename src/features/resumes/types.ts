import type { ISODateString } from '@/features/common/types'
import type { CandidateSummary } from '@/features/candidates/types'

/** `is_everyone` — who may see the CV. Hidden values make `GET /resume/:id` answer 404. */
export type ResumeVisibility = 'ALL_COMPANIES' | 'NOBODY' | 'ONLY_APPLIED' | (string & {})

/** `state` — `active` is a real employee CV; `unclaimed` is an anonymous CV-builder draft. */
export type ResumeState = 'active' | 'unclaimed' | (string & {})

/** `resume` table. Dates are ISO strings; the arrays are Postgres `TEXT[]`. */
export interface Resume {
  id: number
  employee_uid: string | null
  state: ResumeState
  resume_name: string
  /** Professional profile paragraph at the top of the CV. */
  summary: string | null
  hobby: string[]
  driver_license: string[]
  refs: string[]

  country: string
  province: string
  town: string
  neighbourhood: string
  adress: string
  email: string | null
  phone: string | null

  military: string | null
  military_time: ISODateString | null
  retirement: boolean
  national_status: string
  is_active: boolean
  is_auto_date: boolean
  is_everyone: ResumeVisibility
  is_disaster_affected: boolean
  is_disabled: boolean

  /** Provenance: `user` (built in the builder) or `llm` (extracted from an uploaded PDF). */
  creation_method: 'user' | 'llm' | (string & {})
  ai_review_status: 'pending' | 'accepted' | null
  /** CV design config as a JSON string. */
  customization: string | null

  created_at: ISODateString
  updated_at: ISODateString

  employee?: CandidateSummary & { gender?: string | null; birth_date?: ISODateString | null; looking_job?: string }
  /**
   * Set by the server when the viewer has not unlocked this CV: name/photo/contact/links/refs
   * are stripped, everything needed to judge the candidate is kept.
   */
  is_redacted?: boolean
}

export interface ResumeExperience {
  id: number
  resume_id: number
  position: string
  company: string
  ex_start_date: ISODateString | null
  ex_end_date: ISODateString | null
  responsibility: string | null
  sector: string
  department: string
  ex_skill: string
  ex_digital_skill: string
  is_continue: boolean
  is_selected: boolean
  is_voluntary: boolean
}

export interface ResumeEducation {
  id: number
  resume_id: number
  school_name: string
  department: string
  degree: string
  faculty: string
  edu_country: string | null
  edu_start_date: ISODateString | null
  edu_end_date: ISODateString | null
  gpa: number
  is_continue: boolean
  is_selected: boolean
}

export interface ResumeLanguage {
  id: number
  resume_id: number
  lang_name: string
  /** "1"–"5". */
  lang_level: string
  is_selected: boolean
}

export interface ResumeSkill {
  id: number
  resume_id: number
  skill_name: string
  level: string
  is_selected: boolean
}

export interface ResumeCertificate {
  id: number
  resume_id: number
  cer_name: string | null
  cer_organization: string
  cer_date: ISODateString | null
  cer_number: string
  cer_desc: string
  is_selected: boolean
}

export interface ResumeAward {
  id: number
  resume_id: number
  award_name: string
  award_organization: string
  award_date: ISODateString | null
  award_desc: string
  is_selected: boolean
}

export interface ResumeCustomSection {
  id: number
  resume_id: number
  title: string
  body: string
  sort_order: number
}

export interface ResumeLinkRow {
  id: number
  resume_id: number
  link_name: string
  link_desc: string
  username: string | null
  is_selected: boolean
}

/** `GET /resume/:id` — the CV with every has-many section (aliases as defined on the model). */
export interface ResumeDetail extends Resume {
  experiences?: ResumeExperience[]
  educations?: ResumeEducation[]
  languages?: ResumeLanguage[]
  skills?: ResumeSkill[]
  digital_skills?: ResumeSkill[]
  certificates?: ResumeCertificate[]
  awards?: ResumeAward[]
  links?: ResumeLinkRow[]
  custom_sections?: ResumeCustomSection[]
}

/**
 * `profile_reference` — people who vouched for the candidate. A CV points at them by id through
 * `refs`; the rows themselves come from `GET /profile_reference/:employee_uid`.
 */
export interface ProfileReference {
  id: number
  employee_uid: string
  referee_uid: string | null
  referee_name: string | null
  referee_position: string | null
  referee_company: string | null
  referee_contact_mail: string | null
  referee_contact_phone: string | null
  reference_type: string | null
  working_years: string | null
  status: string | null
  reference_text: string | null
  skills: string[] | null
  is_visible: boolean
  is_selected: boolean
  display_order: number
  created_at: ISODateString
  updated_at: ISODateString
  /** Present when the referee is a Kariyer Zamanı user. */
  referee?: {
    uid: string
    name: string | null
    surname: string | null
    position?: string | null
    company?: string | null
  }
}
