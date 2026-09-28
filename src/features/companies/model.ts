import type { BaseCompany, Company, CompanyProfile } from './types'

type AnyCompany = Company | CompanyProfile | BaseCompany

export function companyDisplayName(c: Pick<AnyCompany, 'company_name' | 'username'>): string {
  return c.company_name?.trim() || c.username || 'Şirket'
}

/**
 * Portal access rule (same as kariyer-zamani-web's `CompanyStrictGuard`):
 * the account must be completed AND admin-approved.
 */
export function isCompanyEligible(c: Pick<Company, 'is_account_completed' | 'status'>): boolean {
  return !!c.is_account_completed && c.status === 'approved'
}
