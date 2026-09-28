/** DECIMAL columns (e.g. `DECIMAL(12,2)`) are serialised by Sequelize/pg as strings: `"15000.00"`. */
export type DecimalString = string

/** Sequelize `DATE` over JSON — ISO 8601, e.g. `"2025-12-02T00:00:00.000Z"`. */
export type ISODateString = string

/** `[latitude, longitude]` as stored in `ARRAY(DOUBLE)` columns; `[]` when unset. */
export type LatLng = [number, number]

/** Account discriminator — from Supabase `user_metadata.account_type`; defaults to `employee`. */
export type AccountType = 'employee' | 'company'

/**
 * Profile-section visibility as stored in `employee_settings` / `company_settings`
 * (string columns): "0" hidden · "1" followers only · "12" public.
 */
export type PrivacyLevel = '0' | '1' | '12' | (string & {})

/** `dynamic_page` rows as included on profiles (`attributes: id, name, is_active`). */
export interface DynamicPageSummary {
  id: number
  name: string
  is_active: boolean
}

/** Shared identity fields of users and companies (kariyer-zamani-web `types/base.ts`). */
export interface BaseIdentity {
  /** Legacy PK: `${uuid}-employee` / `${uuid}-company`. */
  uid: string
  username: string | null
  photo_url?: string | null
  background_url?: string | null
  /** Supabase auth UUID. Endpoints accept either this or the legacy `uid`. */
  external_id?: string | null
  is_account_completed?: boolean
  country?: string | null
  province?: string | null
  town?: string | null
  neighbourhood?: string | null
}
