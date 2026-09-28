import { api } from '@/lib/api'
import config from '@/config/config'
import { mockCompaniesApi } from '@/mocks'
import type { CompanyProfile } from './types'

const realCompaniesApi = {
  /** `GET /company/:id` — `id` may be the legacy uid or the Supabase auth UUID. Used only for the signed-in company. */
  get: (id: string) => api.data.get<CompanyProfile>(`/company/${id}`),
}

/** Swapped for the in-memory mock when `config.USE_MOCKS`. */
export const companiesApi: typeof realCompaniesApi = config.USE_MOCKS ? mockCompaniesApi : realCompaniesApi
