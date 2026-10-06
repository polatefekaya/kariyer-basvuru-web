import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Run the actual API and query modules with browser/network dependencies supplied by the test.
function loadModule(path, imports, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  })
  const exports = {}
  vm.runInNewContext(
    outputText,
    {
      exports,
      require: (name) => {
        assert.ok(name in imports, `Unexpected dependency: ${name}`)
        return imports[name]
      },
      URLSearchParams,
      AbortController,
      DOMException,
      FormData,
      setTimeout,
      clearTimeout,
      ...globals,
    },
    { filename: path },
  )
  return exports
}

function setup(fetch) {
  const config = { API_BASE_URL: 'https://api.example.test', API_TIMEOUT_MS: 1000, USE_MOCKS: false }
  const client = loadModule(
    'src/lib/api/client.ts',
    {
      '@/config/config': { __esModule: true, default: config },
      '@/lib/supabase': {
        supabase: {
          auth: {
            getSession: async () => ({
              data: {
                session: {
                  access_token: 'test-token',
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                },
              },
            }),
          },
        },
      },
    },
    { fetch },
  )
  const { resumesApi } = loadModule('src/features/resumes/api.ts', {
    '@/lib/api': client,
    '@/config/config': { __esModule: true, default: config },
    '@/mocks': {},
  })
  return { resumesApi, ApiError: client.ApiError }
}

test('a locked CV is revealed after an authenticated, paid unlock request', async () => {
  let unlocked = false
  const { resumesApi } = setup(async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    if (options.method === 'POST') {
      assert.equal(url, 'https://api.example.test/employee/42/track-cv-view')
      assert.deepEqual(JSON.parse(options.body), { consume_right: true, view_source: 'applications' })
      unlocked = true
      return Response.json({ success: true, data: { right_consumed: true, rights_consumed_count: 1 } })
    }
    assert.equal(url, 'https://api.example.test/resume/42')
    return Response.json({ id: 42, is_redacted: !unlocked, phone: unlocked ? '5551234567' : null })
  })
  assert.equal((await resumesApi.get(42)).is_redacted, true)
  await resumesApi.unlock(42)
  const cv = await resumesApi.get(42)
  assert.equal(cv.is_redacted, false)
  assert.equal(cv.phone, '5551234567')
})

for (const status of [402, 403, 500]) {
  test(`unlock rejects HTTP ${status} instead of reporting success`, async () => {
    const { resumesApi, ApiError } = setup(async () =>
      Response.json({ success: false, message: 'Unlock denied' }, { status }),
    )
    await assert.rejects(
      resumesApi.unlock(42),
      (error) => error instanceof ApiError && error.status === status && error.message === 'Unlock denied',
    )
  })
}

test('unlock rejects a failure envelope even when HTTP status is 200', async () => {
  const { resumesApi, ApiError } = setup(async () => Response.json({ success: false, message: 'Denied' }))
  await assert.rejects(resumesApi.unlock(42), (error) => error instanceof ApiError && error.message === 'Denied')
})

test('an already unlocked CV succeeds without requiring a new charge', async () => {
  const { resumesApi } = setup(async () =>
    Response.json({
      success: true,
      data: { already_viewed: true, rights_consumed_count: 0 },
    }),
  )
  await resumesApi.unlock(42)
})

test('a network failure reaches the unlock error handler', async () => {
  const { resumesApi, ApiError } = setup(async () => {
    throw new Error('Offline')
  })
  await assert.rejects(resumesApi.unlock(42), (error) => error instanceof ApiError && error.status === 0)
})

test('unlock mutation waits for CV and candidate caches to refresh after success', async () => {
  const refreshed = []
  const resolvers = []
  const unlocked = []
  const { useUnlockResume } = loadModule('src/features/resumes/queries.ts', {
    '@tanstack/solid-query': { useMutation: (options) => options() },
    '@/lib/query': {
      queryClient: {
        invalidateQueries: ({ queryKey }) => {
          refreshed.push(Array.from(queryKey))
          return new Promise((resolve) => resolvers.push(resolve))
        },
      },
    },
    './api': {
      resumesApi: {
        unlock: async (id) => {
          unlocked.push(id)
        },
      },
    },
  })
  const mutation = useUnlockResume(() => 'candidate-uid')
  await mutation.mutationFn(42)
  assert.deepEqual(unlocked, [42])
  assert.deepEqual(refreshed, [])
  // Failed requests do not run a success refresh or masquerade as a successful unlock.
  assert.equal(mutation.onSettled, undefined)
  let finished = false
  const refresh = mutation.onSuccess().then(() => {
    finished = true
  })
  assert.deepEqual(refreshed, [['resumes'], ['candidates']])
  await Promise.resolve()
  assert.equal(finished, false)
  resolvers.forEach((resolve) => resolve())
  await refresh
  assert.equal(finished, true)
})
