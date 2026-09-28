export const companyKeys = {
  all: ['companies'] as const,
  profile: (id: string) => [...companyKeys.all, 'profile', id] as const,
}
