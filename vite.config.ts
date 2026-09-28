import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // The backend's CORS allow-list is maintained at its gateway and only names the origins the
  // other apps use (localhost:3000 / :5173 in dev). A preflight from any other port comes back
  // without `Access-Control-Allow-Origin`, so every request fails and the portal looks signed out.
  // Proxying keeps dev requests same-origin, which sidesteps CORS entirely and lets this app run
  // on whatever port it likes. Set VITE_API_URL to a relative path (e.g. `/api`) to use it.
  const proxyTarget = env.VITE_API_PROXY_TARGET
  const apiPath = (env.VITE_API_URL ?? '').startsWith('/') ? env.VITE_API_URL : null

  return {
    plugins: [solid(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server:
      proxyTarget && apiPath
        ? {
            proxy: {
              [apiPath]: {
                target: proxyTarget,
                changeOrigin: true,
                // The upstream mounts the same prefix, so the path passes through unchanged.
              },
            },
          }
        : undefined,
  }
})
