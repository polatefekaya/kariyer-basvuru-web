import { Navigate, Route, Router } from '@solidjs/router'
import { AppLayout } from './app/AppLayout'
import { JobDetailPage, JobsPage } from './pages/jobs'
import { CandidatePage, CandidatesPage } from './pages/candidates'
import { NotFoundPage } from './pages/misc/ComingSoonPage'
import { SiteRedirectPage } from './pages/misc/SiteRedirectPage'
import { NEW_JOB_PATH } from './lib/site'

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
