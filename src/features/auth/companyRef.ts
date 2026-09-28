import { createSignal } from 'solid-js'

/**
 * The signed-in company's legacy uid, readable outside a component.
 *
 * Most code takes it from `useCurrentCompany()`. Two places cannot: the API adapters, which are
 * plain functions called from query functions, and the query keys that have to change once the
 * company is known — the Node endpoints are company-scoped by path (`/jobs/company/:uid`), not by
 * the token, so a list built before the uid arrives is empty and would otherwise stay cached that
 * way. A signal keeps both reactive.
 */
const [currentCompanyUid, setCurrentCompanyUid] = createSignal<string | null>(null)

export { currentCompanyUid, setCurrentCompanyUid }
