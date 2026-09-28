import type { JobListItem, JobStatus } from '@/features/jobs'

/** Small deterministic PRNG so the dev page renders the same data every load. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32
}
const pick = <T>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)]!

const TITLES = [
  'Frontend Developer',
  'Backend Developer',
  'Muhasebe Uzmanı',
  'Satış Temsilcisi',
  'İK Uzmanı',
  'Depo Görevlisi',
  'Grafik Tasarımcı',
  'Ürün Yöneticisi',
  'Müşteri Temsilcisi',
  'Veri Analisti',
  'Şoför',
  'Garson',
  'Elektrik Teknisyeni',
  'Pazarlama Uzmanı',
]
const DEPTS = ['Yazılım', 'Finans', 'Satış', 'İnsan Kaynakları', 'Operasyon', 'Tasarım', 'Ürün', 'Pazarlama']
const CITIES: [string, string][] = [
  ['İstanbul', 'Kadıköy'],
  ['İstanbul', 'Şişli'],
  ['Ankara', 'Çankaya'],
  ['İzmir', 'Konak'],
  ['Bursa', 'Nilüfer'],
  ['Antalya', 'Muratpaşa'],
]
const TYPES = ['Tam Zamanlı', 'Yarı Zamanlı', 'Proje Bazlı', 'Stajyer']
const WT = [['İş Yerinde'], ['Uzaktan'], ['Hibrit'], ['İş Yerinde', 'Hibrit']]
const STATUSES: JobStatus[] = [
  'approved',
  'approved',
  'approved',
  'approved',
  'draft',
  'pending_approval',
  'closed',
  'expired',
  'rejected',
]

export function mockJob(i: number, overrides: Partial<JobListItem> = {}): JobListItem {
  const r = rng(i + 1)
  const [province, town] = pick(r, CITIES)
  const status = pick(r, STATUSES)
  const createdDaysAgo = Math.floor(r() * 60)
  const created = new Date(Date.now() - createdDaysAgo * 86400000)
  const end = new Date(created.getTime() + (30 + Math.floor(r() * 30)) * 86400000)
  const minS = r() > 0.35 ? 15000 + Math.floor(r() * 10) * 2500 : null
  const views = Math.floor(r() * 4000)
  const apps = Math.floor(views * (0.02 + r() * 0.08))
  const accepted = Math.floor(apps * r() * 0.2)
  const title = pick(r, TITLES)
  const uid = `${i.toString(16).padStart(8, '0')}-mock-job`
  return {
    uid,
    external_reference_id: null,
    company_uid: 'mock-company',
    title,
    type: pick(r, TYPES),
    description: '',
    department: pick(r, DEPTS),
    dep_size: '',
    position: r() > 0.5 ? title : '',
    pos_size: '',
    worker_count: `${1 + Math.floor(r() * 3)} kişi`,
    working_type: pick(r, WT),
    working_prefs: [],
    working_days: [],
    working_hours: '',
    country: 'Türkiye',
    province,
    town,
    neighbourhood: '',
    location_link: null,
    coordinates: [],
    job_start_date: null,
    job_end_date: end.toISOString(),
    min_salary: minS != null ? minS.toFixed(2) : null,
    max_salary: minS != null ? (minS * (1.2 + r() * 0.4)).toFixed(2) : null,
    currency: 'TL',
    benefits: [],
    company_desc: '',
    job_desc: '',
    provided_things: null,
    is_secret_name: r() > 0.85,
    additional_link: null,
    slug_url: `${title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')}-${uid.slice(0, 8)}`,
    experience_year: Math.floor(r() * 6),
    gender: '',
    education_status: [],
    education_department: [],
    military: [],
    driver_license: null,
    is_shift_work: false,
    shift_daily_hours: null,
    is_experience_required: r() > 0.5,
    status,
    plan: r() > 0.7 ? ['Vitrin İlan'] : [],
    modified_on: null,
    modified_by: null,
    created_on: created.toISOString(),
    created_by: 'mock-company',
    is_active: status === 'approved',
    is_deleted: false,
    is_hr: false,
    is_manually_edited: false,
    payload_hash: null,
    stats: {
      job_uid: uid,
      total_views: views,
      unique_views: Math.floor(views * 0.7),
      total_applications: apps,
      accepted_applications: accepted,
      rejected_applications: Math.floor((apps - accepted) * 0.3),
      applications_this_week: Math.floor(apps * 0.15),
      applications_this_month: Math.floor(apps * 0.5),
      last_applied_at: apps > 0 ? new Date(Date.now() - Math.floor(r() * 5 * 86400000)).toISOString() : undefined,
    },
    ...overrides,
  }
}

export const mockJobs = (n: number) => Array.from({ length: n }, (_, i) => mockJob(i))

// ---------------------------------------------------------------------------
// Applicants (CandidateSummary) for avatar groups
// ---------------------------------------------------------------------------
import type { CandidateSummary } from '@/features/candidates'

const FIRST = ['Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Deniz', 'Selin', 'Emre', 'Merve']
const LAST = ['Demir', 'Yılmaz', 'Kaya', 'Öz', 'Şahin', 'Çelik', 'Arslan', 'Aydın', 'Koç', 'Kurt']

export function mockApplicants(n: number, seed = 1): CandidateSummary[] {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const name = FIRST[Math.floor(r() * FIRST.length)]!
    const surname = LAST[Math.floor(r() * LAST.length)]!
    const hasPhoto = r() > 0.5
    return {
      uid: `${seed}-${i}-employee`,
      username: `${name.toLowerCase()}${i}`,
      name,
      surname,
      email: `${name.toLowerCase()}.${surname.toLowerCase()}@example.com`,
      phone: null,
      photo_url: hasPhoto ? `https://i.pravatar.cc/64?img=${(seed * 7 + i) % 70}` : null,
    }
  })
}

// ---------------------------------------------------------------------------
// One candidate (Aday detay sayfası): profile + CVs, derived from the uid so a
// given applicant always looks the same wherever they appear.
// ---------------------------------------------------------------------------
import type { CandidateProfile } from '@/features/candidates'
import type { ProfileReference, Resume, ResumeDetail } from '@/features/resumes'

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const HEADLINES = [
  'Frontend Developer',
  'Muhasebe Uzmanı',
  'Satış Temsilcisi',
  'İK Uzmanı',
  'Grafik Tasarımcı',
  'Veri Analisti',
]
const COMPANIES = ['Teknoloji A.Ş.', 'Yıldız Holding', 'Ege Lojistik', 'Mavi Yazılım', 'Anadolu Sigorta']
const SCHOOLS = ['İstanbul Teknik Üniversitesi', 'Ege Üniversitesi', 'Ankara Üniversitesi', 'Boğaziçi Üniversitesi']
const DEPARTMENTS = ['Bilgisayar Mühendisliği', 'İşletme', 'Grafik Tasarım', 'İstatistik', 'Endüstri Mühendisliği']
const SKILLS = ['İletişim', 'Takım çalışması', 'Problem çözme', 'Zaman yönetimi', 'Analitik düşünme', 'Liderlik']
const DIGITAL = ['Excel', 'Figma', 'SQL', 'React', 'SAP', 'Power BI']

export function mockCandidateProfile(uid: string): CandidateProfile {
  const r = rng(hash(uid))
  const person = mockApplicants(1, hash(uid) % 1000)[0]!
  const title = pick(r, HEADLINES)
  const [province, town] = pick(r, CITIES)
  const created = new Date(Date.now() - Math.floor(r() * 900) * 86400000)
  return {
    uid,
    username: person.username,
    external_id: null,
    photo_url: person.photo_url,
    background_url: null,
    is_account_completed: true,
    country: 'Türkiye',
    province,
    town,
    neighbourhood: null,
    email: person.email,
    name: person.name,
    surname: person.surname,
    phone: `+90 5${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 900 + 100)} ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)}`,
    race: null,
    national_id: null,
    birth_date: new Date(1985 + Math.floor(r() * 18), Math.floor(r() * 12), 1 + Math.floor(r() * 27)).toISOString(),
    gender: r() > 0.5 ? 'Kadın' : 'Erkek',
    adress: null,
    describe:
      `${title} olarak ${2 + Math.floor(r() * 9)} yıldır çalışıyorum. Ekip içi iş birliğine önem veren, ` +
      'süreçleri uçtan uca sahiplenen ve öğrenmeye açık biriyim. Yeni fırsatlara açığım.',
    title,
    working_type: pick(r, ['Tam Zamanlı', 'Yarı Zamanlı', 'Uzaktan']),
    looking_job: r() > 0.35 ? '1' : '0',
    onboarding_reminder_step: 0,
    selected_skills: SKILLS.slice(0, 3 + Math.floor(r() * 3)),
    following: [],
    followers: [],
    notifications: [],
    is_deleted: false,
    perma_deleted: false,
    is_rating: false,
    email_verified: true,
    phone_verified: r() > 0.4,
    created_date: created.toISOString(),
    email_update: null,
    phone_update: null,
    username_update: null,
    company_email: null,
    company_email_verified: false,
    deleted_date: null,
    deleted_by: null,
    deletion_requested_at: null,
    onesignal_player_id: null,
    kvkk_aydinlatma_accepted: true,
    kullanici_sozlesmesi_accepted: true,
    acik_riza_accepted: true,
    ticari_elektronik_ileti_accepted: false,
    cerez_politikasi_accepted: true,
    gizlilik_politikasi_accepted: true,
    dynamicPages: [],
    settings: null,
    active_resume_id: (hash(uid) % 900) + 100,
    requested_resume_id: null,
    followerCount: Math.floor(r() * 120),
    followingCount: Math.floor(r() * 80),
    totalFollowerCount: Math.floor(r() * 120),
    totalFollowingCount: Math.floor(r() * 80),
    page_is_active: null,
    resume_country: 'Türkiye',
    resume_province: province,
    resume_town: town,
    resume_neighbourhood: '',
    resume_adress: '',
    position: title,
    company: pick(r, COMPANIES),
    school_name: pick(r, SCHOOLS),
    department: pick(r, DEPARTMENTS),
    links: [
      { id: 1, resume_id: 1, link_name: 'LinkedIn', link_desc: 'https://linkedin.com/in/example', is_selected: true },
      { id: 2, resume_id: 1, link_name: 'GitHub', link_desc: 'https://github.com/example', is_selected: true },
    ],
    monthly_stats: { profile_views: Math.floor(r() * 90), cv_views: Math.floor(r() * 30) },
  }
}

/** 1–3 CVs per candidate; the first is the active one. */
export function mockResumes(employeeUid: string): Resume[] {
  const base = (hash(employeeUid) % 900) + 100
  const r = rng(hash(employeeUid) + 7)
  const count = 1 + Math.floor(r() * 3)
  const profile = mockCandidateProfile(employeeUid)
  const [province, town] = [profile.province ?? '', profile.town ?? '']
  return Array.from({ length: count }, (_, i) => ({
    id: base + i,
    employee_uid: employeeUid,
    state: 'active' as const,
    resume_name: i === 0 ? `${profile.title} CV` : i === 1 ? 'Genel CV' : 'İngilizce CV',
    summary: profile.describe,
    hobby: ['Yüzme', 'Kitap'],
    driver_license: r() > 0.5 ? ['B'] : [],
    refs: mockReferences(employeeUid).map((x) => String(x.id)),
    country: 'Türkiye',
    province,
    town,
    neighbourhood: '',
    adress: `${town} Mah. ${1 + Math.floor(r() * 90)}. Sok. No:${1 + Math.floor(r() * 40)}`,
    email: profile.email,
    phone: profile.phone,
    military: profile.gender === 'Erkek' ? pick(r, ['Yapıldı', 'Muaf', 'Tecilli']) : null,
    military_time: null,
    retirement: false,
    national_status: 'T.C.',
    is_active: i === 0,
    is_auto_date: false,
    is_everyone: 'ALL_COMPANIES' as const,
    is_disaster_affected: i === 0 ? r() > 0.9 : false,
    is_disabled: i === 0 ? r() > 0.85 : false,
    creation_method: (i === 2 ? 'llm' : 'user') as 'llm' | 'user',
    ai_review_status: null,
    customization: null,
    created_at: new Date(Date.now() - (200 - i * 30) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - (i * 14 + 2) * 86400000).toISOString(),
  }))
}

export function mockResumeDetail(id: number, employeeUid: string): ResumeDetail {
  const list = mockResumes(employeeUid)
  const base = list.find((x) => x.id === id) ?? list[0]!
  const r = rng(id)
  const profile = mockCandidateProfile(employeeUid)
  const years = 2 + Math.floor(r() * 8)
  const experiences = Array.from({ length: 1 + Math.floor(r() * 3) }, (_, i) => ({
    id: id * 10 + i,
    resume_id: base.id,
    position: i === 0 ? (profile.title ?? 'Uzman') : pick(r, HEADLINES),
    company: pick(r, COMPANIES),
    ex_start_date: new Date(2026 - years + i * 2, Math.floor(r() * 12), 1).toISOString(),
    ex_end_date: i === 0 ? null : new Date(2026 - years + i * 2 + 2, Math.floor(r() * 12), 1).toISOString(),
    responsibility:
      'Ekip hedeflerine katkı sağladım, süreçleri takip ettim ve raporlamaları hazırladım. Birimler arası iletişimi yürüttüm.',
    sector: 'Teknoloji',
    department: pick(r, DEPARTMENTS),
    ex_skill: '',
    ex_digital_skill: '',
    is_continue: i === 0,
    is_selected: true,
    is_voluntary: false,
  }))
  const educations = [
    {
      id: id * 20,
      resume_id: base.id,
      school_name: pick(r, SCHOOLS),
      department: pick(r, DEPARTMENTS),
      degree: 'Lisans',
      faculty: 'Mühendislik Fakültesi',
      edu_country: 'Türkiye',
      edu_start_date: new Date(2026 - years - 6, 8, 1).toISOString(),
      edu_end_date: new Date(2026 - years - 2, 5, 1).toISOString(),
      gpa: Math.round((2.2 + r() * 1.7) * 100) / 100,
      is_continue: false,
      is_selected: true,
    },
  ]
  return {
    ...base,
    experiences,
    educations,
    languages: [
      {
        id: id * 30,
        resume_id: base.id,
        lang_name: 'İngilizce',
        lang_level: String(2 + Math.floor(r() * 4)),
        is_selected: true,
      },
      ...(r() > 0.6
        ? [{ id: id * 30 + 1, resume_id: base.id, lang_name: 'Almanca', lang_level: '2', is_selected: true }]
        : []),
    ],
    skills: SKILLS.slice(0, 3 + Math.floor(r() * 3)).map((skill_name, i) => ({
      id: id * 40 + i,
      resume_id: base.id,
      skill_name,
      level: String(3 + (i % 3)),
      is_selected: true,
    })),
    digital_skills: DIGITAL.slice(0, 2 + Math.floor(r() * 3)).map((skill_name, i) => ({
      id: id * 50 + i,
      resume_id: base.id,
      skill_name,
      level: String(3 + (i % 3)),
      is_selected: true,
    })),
    certificates:
      r() > 0.4
        ? [
            {
              id: id * 60,
              resume_id: base.id,
              cer_name: 'Proje Yönetimi Sertifikası',
              cer_organization: 'İstanbul Ticaret Odası',
              cer_date: new Date(2024, 4, 12).toISOString(),
              cer_number: 'PY-2024-1182',
              cer_desc: '',
              is_selected: true,
            },
          ]
        : [],
    awards:
      r() > 0.7
        ? [
            {
              id: id * 65,
              resume_id: base.id,
              award_name: 'Yılın Ekip Oyuncusu',
              award_organization: pick(r, COMPANIES),
              award_date: new Date(2025, 11, 20).toISOString(),
              award_desc: 'Yıl boyunca ekip hedeflerine yaptığı katkı nedeniyle verildi.',
              is_selected: true,
            },
          ]
        : [],
    links: [
      {
        id: id * 70,
        resume_id: base.id,
        link_name: 'LinkedIn',
        link_desc: 'https://linkedin.com/in/example',
        username: null,
        is_selected: true,
      },
    ],
    custom_sections:
      r() > 0.75
        ? [
            {
              id: id * 80,
              resume_id: base.id,
              title: 'Gönüllü Çalışmalar',
              body: 'TEGV bünyesinde iki yıl boyunca hafta sonları çocuklara atölye desteği verdim.',
              sort_order: 0,
            },
          ]
        : [],
  }
}

export function mockReferences(employeeUid: string): ProfileReference[] {
  const r = rng(hash(employeeUid) + 13)
  return Array.from({ length: 1 + Math.floor(r() * 2) }, (_, i) => {
    const name = pick(r, FIRST)
    const surname = pick(r, LAST)
    return {
      id: (hash(employeeUid) % 500) + i,
      employee_uid: employeeUid,
      referee_uid: null,
      referee_name: `${name} ${surname}`,
      referee_position: pick(r, HEADLINES),
      referee_company: pick(r, COMPANIES),
      referee_contact_mail: `${name.toLocaleLowerCase('tr-TR')}@${pick(r, COMPANIES).split(' ')[0]!.toLocaleLowerCase('tr-TR')}.com`,
      referee_contact_phone: null,
      reference_type: 'manual',
      working_years: `${1 + Math.floor(r() * 5)}`,
      status: 'approved',
      reference_text:
        'Birlikte çalıştığımız dönemde sorumluluklarını eksiksiz yerine getirdi; ekip içi iletişimi güçlü ve çözüm odaklı bir arkadaşımızdı.',
      skills: null,
      is_visible: true,
      is_selected: true,
      display_order: i,
      created_at: new Date(Date.now() - (60 + i * 30) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - (60 + i * 30) * 86400000).toISOString(),
    }
  })
}
