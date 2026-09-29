/* @refresh reload */
import { lazy, Suspense } from 'solid-js'
import { render } from 'solid-js/web'
import './index.css'
import { initTheme } from '@/lib/theme'
import { AppLoadingBlock, AppToaster } from '@/components/ui'
import { QueryProvider } from '@/lib/query'
import { initSession } from '@/features/auth'
import App from './App.tsx'

initTheme()
void initSession()

// Dev-only: `await __kzSyncAts()` copies this company's postings and applicants into the local
// recruiting service's stand-ins, so the ATS screens work against real data. See src/dev/atsBridge.
if (import.meta.env.DEV) void import('./dev/atsBridge')

// `/dev` (primitives) and `/dev/composed` → component workbenches. Dev-only and lazy, never in the production bundle.
const devPath = window.location.pathname.replace(/\/+$/, '')
const devCatalog = devPath === '/dev' ? 'primitives' : devPath === '/dev/composed' ? 'composed' : null
const isDevPage = import.meta.env.DEV && devCatalog !== null
// Guarding the import (not just the render) lets Rollup drop the whole chunk from production output.
const DevPage = import.meta.env.DEV ? lazy(() => import('./dev/DevPage')) : () => null

render(
  () => (
    <QueryProvider>
      {isDevPage ? (
        <Suspense fallback={<AppLoadingBlock label="Dev sayfası yükleniyor…" class="min-h-dvh" />}>
          <DevPage catalog={devCatalog!} />
        </Suspense>
      ) : (
        <App />
      )}
      <AppToaster />
    </QueryProvider>
  ),
  document.getElementById('root')!,
)
