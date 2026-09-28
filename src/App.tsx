import { lazy } from 'solid-js'
import { Navigate, Route, Router } from '@solidjs/router'
import { AppLayout } from './app/AppLayout'
import { NEW_JOB_PATH } from './lib/site'

const JobsPage = lazy(() => import('./pages/jobs/JobsPage').then((m) => ({ default: m.JobsPage })))
const JobDetailPage = lazy(() => import('./pages/jobs/detail').then((m) => ({ default: m.JobDetailPage })))
const CandidatesPage = lazy(() =>
  import('./pages/candidates/CandidatesPage').then((m) => ({ default: m.CandidatesPage })),
)
const CandidatePage = lazy(() =>
  import('./pages/candidates/CandidatePage').then((m) => ({ default: m.CandidatePage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/misc/ComingSoonPage').then((m) => ({ default: m.NotFoundPage })),
)
const SiteRedirectPage = lazy(() =>
  import('./pages/misc/SiteRedirectPage').then((m) => ({ default: m.SiteRedirectPage })),
)

export default function App() {
  return (
    <Router root={AppLayout}>
      <Route path={['/', '/ilanlar']} component={JobsPage} />
      {/* Posting and editing already exist on the main site; the portal links to them. */}
      <Route
        path="/ilanlar/yeni"
        component={() => (
          <SiteRedirectPage
            path={NEW_JOB_PATH}
            title="İlan ver sayfasına gidiliyor"
            description="Yeni ilan, Kariyer Zamanı üzerindeki ilan ver formuyla oluşturuluyor."
          />
        )}
      />
      <Route path="/ilanlar/:uid" component={JobDetailPage} />
      {/* No URL opens the site's job editor, so this lands on the posting, whose "İlanı düzenle"
          button opens the company's job list where the editor lives. */}
      <Route
        path="/ilanlar/:uid/duzenle"
        component={() => <Navigate href={`/ilanlar/${location.pathname.split('/')[2]}`} />}
      />
      <Route path="/ilanlar/:uid/*" component={JobDetailPage} />
      {/* Applications are part of the candidate list now; keep old links working. */}
      <Route path="/basvurular/*" component={() => <Navigate href="/adaylar" />} />
      <Route path="/adaylar" component={CandidatesPage} />
      <Route path="/adaylar/:uid" component={CandidatePage} />
      <Route path="*" component={NotFoundPage} />
    </Router>
  )
}
