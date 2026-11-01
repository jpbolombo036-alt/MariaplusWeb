// Run with Node >= 22.15: node --test tests/session-pagination.test.mjs
// All HTTP calls use in-memory adapters, including Axios' refresh client.
import './support/register-typescript.mjs'
import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import axios, { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'

const { http, clearTokens, setTokens } = await import('../src/api/http.ts')
const { listAllEvents, listEvents } = await import('../src/api/events.ts')
const { listGuests, listGuestsPage } = await import('../src/api/guests.ts')
const { useAuthStore } = await import('../src/stores/auth.ts')
const { useWeddingStore } = await import('../src/stores/wedding.ts')
const { usePlatformStore } = await import('../src/stores/platform.ts')

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function response(config, data) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

function unauthorized(config) {
  return new AxiosError('Simulated expired access token', 'ERR_BAD_REQUEST', config, undefined, {
    ...response(config, { error: 'Unauthorized' }), status: 401, statusText: 'Unauthorized',
  })
}

function mockHttp(handler) {
  http.defaults.adapter = async (config) => response(config, await handler(config))
}

function event(id) {
  return { id, organizationId: 1, name: `Event ${id}`, type: 'WEDDING', status: 'DRAFT', guestCount: 0 }
}

function user(id) {
  return {
    id, organizationId: id, firstName: `User ${id}`, lastName: 'Test',
    email: `user${id}@example.invalid`, active: true, roles: [], permissions: [],
  }
}

function loginResponse(id) {
  return { accessToken: `test-token-${id}`, expiresIn: 900, user: user(id) }
}

function seedAccount() {
  const auth = useAuthStore()
  const wedding = useWeddingStore()
  const platform = usePlatformStore()
  auth.user = user(1)
  auth.restored = true
  wedding.weddings = [event(101)]
  wedding.loaded = true
  wedding.setActive(101)
  platform.$patch({ eventCreationEnabled: false, whatsappSendingEnabled: false, loaded: true })
  setTokens({ accessToken: 'test-token-1', refreshToken: '', expiresIn: 900 })
  return { auth, wedding, platform }
}

function assertEmptyAccount(wedding, platform) {
  assert.deepEqual(wedding.weddings, [])
  assert.equal(wedding.activeId, null)
  assert.equal(wedding.active, null)
  assert.equal(wedding.loaded, false)
  assert.equal(wedding.loading, false)
  assert.equal(sessionStorage.getItem('mp_active_event'), null)
  assert.equal(platform.eventCreationEnabled, null)
  assert.equal(platform.whatsappSendingEnabled, null)
  assert.equal(platform.loaded, false)
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearTokens()
  globalThis.window = new EventTarget()
  const values = new Map()
  globalThis.sessionStorage = {
    getItem: (key) => values.get(String(key)) ?? null,
    setItem: (key, value) => values.set(String(key), String(value)),
    removeItem: (key) => values.delete(String(key)),
    clear: () => values.clear(),
  }
  const denyNetwork = async (config) => {
    throw new Error(`No HTTP request allowed without a test adapter: ${config.url}`)
  }
  axios.defaults.adapter = denyNetwork
  http.defaults.adapter = denyNetwork
})

describe('Complete collections and explicit pages', () => {
  test('collects more than 25 events when the server caps its page size', async () => {
    const records = Array.from({ length: 63 }, (_, index) => event(index + 1))
    const requestedPages = []
    mockHttp((config) => {
      assert.equal(config.url, '/api/events')
      assert.equal(config.params.type, 'WEDDING')
      const page = config.params.page
      requestedPages.push(page)
      assert.ok(page < 3, 'must stop at the advertised final page')
      return {
        content: records.slice(page * 25, (page + 1) * 25),
        currentPage: page, pageSize: 25, totalPages: 3, totalElements: 63,
      }
    })
    const result = await listAllEvents('WEDDING')
    assert.deepEqual(result.map((record) => record.id), records.map((record) => record.id))
    assert.deepEqual(requestedPages, [0, 1, 2])
  })

  test('collects more than 200 guests using totalElements and the effective server size', async () => {
    const records = Array.from({ length: 437 }, (_, index) => ({
      id: index + 1, eventId: 7, firstName: `Guest ${index + 1}`, lastName: 'Test',
    }))
    const requestedPages = []
    mockHttp((config) => {
      assert.equal(config.url, '/api/events/7/guests')
      const page = config.params.page
      requestedPages.push(page)
      assert.ok(page < 6, 'totalElements must terminate the collection')
      return {
        content: records.slice(page * 73, (page + 1) * 73),
        number: page, size: 73, totalElements: records.length,
      }
    })
    const result = await listGuests(7)
    assert.deepEqual(result.map((record) => record.id), records.map((record) => record.id))
    assert.deepEqual(requestedPages, [0, 1, 2, 3, 4, 5])
  })

  test('continues to an empty page when the server omits pagination metadata', async () => {
    const requestedPages = []
    mockHttp((config) => {
      const page = config.params.page
      requestedPages.push(page)
      assert.ok(page < 3)
      return { content: page < 2 ? [event(page + 1)] : [] }
    })
    assert.deepEqual((await listAllEvents()).map((record) => record.id), [1, 2])
    assert.deepEqual(requestedPages, [0, 1, 2])
  })

  test('rejects a repeated server page instead of returning a truncated collection', async () => {
    let calls = 0
    mockHttp(() => {
      assert.ok(++calls <= 2, 'must detect the repeated page without an unbounded loop')
      return { content: [event(1)] }
    })
    await assert.rejects(listAllEvents())
    assert.equal(calls, 2)
  })

  test('keeps explicitly paginated APIs to one request with their requested filters', async () => {
    const calls = []
    mockHttp((config) => {
      calls.push(config.params)
      return { content: [], currentPage: 2, pageSize: 10, totalElements: 100, totalPages: 10 }
    })
    await listEvents('BAPTISM', 2, 10)
    const guests = await listGuestsPage(7, { page: 2, size: 10, search: '  Test  ' })
    assert.deepEqual(calls, [
      { type: 'BAPTISM', page: 2, size: 10 },
      { page: 2, size: 10, search: 'Test' },
    ])
    assert.equal(guests.totalElements, 100)
    assert.equal(guests.currentPage, 2)
  })
})

describe('Account boundaries', () => {
  test('clears account data immediately during a pending logout and still clears it on failure', async () => {
    const { auth, wedding, platform } = seedAccount()
    const started = deferred()
    const logout = deferred()
    mockHttp(async (config) => {
      assert.equal(config.url, '/auth/logout')
      assert.equal(config.headers.Authorization, 'Bearer test-token-1')
      started.resolve()
      await logout.promise
      throw new Error('Simulated offline logout')
    })
    const pending = auth.logout()
    assert.equal(auth.user, null)
    assertEmptyAccount(wedding, platform)
    await started.promise
    logout.resolve()
    await pending
    mockHttp((config) => {
      assert.equal(config.headers.Authorization, undefined)
      return {}
    })
    await http.get('/test/probe')
    assertEmptyAccount(wedding, platform)
  })

  test('expiration clears tokens, event selection, events and platform settings', async () => {
    const { auth, wedding, platform } = seedAccount()
    auth.expireSession()
    assert.equal(auth.isAuthenticated, false)
    assert.equal(auth.restored, true)
    assertEmptyAccount(wedding, platform)
    mockHttp((config) => {
      assert.equal(config.headers.Authorization, undefined)
      return {}
    })
    await http.get('/test/probe')
  })

  test('switching accounts clears the previous account even without a prior logout', async () => {
    const { auth, wedding, platform } = seedAccount()
    mockHttp((config) => {
      assert.equal(config.url, '/auth/login')
      return loginResponse(2)
    })
    await auth.login('user2@example.invalid', 'test-only-password')
    assert.equal(auth.user.id, 2)
    assertEmptyAccount(wedding, platform)
  })

  test('a failed restoration clears an existing account and its cached data', async () => {
    const { auth, wedding, platform } = seedAccount()
    mockHttp((config) => {
      assert.equal(config.url, '/auth/refresh')
      throw new Error('Simulated expired refresh cookie')
    })
    await auth.restore()
    assert.equal(auth.user, null)
    assert.equal(auth.restored, true)
    assertEmptyAccount(wedding, platform)
  })

  test('a late login response cannot authenticate again after session expiration', async () => {
    const { auth, wedding, platform } = seedAccount()
    const started = deferred()
    const login = deferred()
    mockHttp(async (config) => {
      if (config.url === '/test/probe') {
        assert.equal(config.headers.Authorization, undefined)
        return {}
      }
      assert.equal(config.url, '/auth/login')
      started.resolve()
      return login.promise
    })
    const pending = auth.login('user2@example.invalid', 'test-only-password')
    await started.promise
    auth.expireSession()
    login.resolve(loginResponse(2))
    await pending
    assert.equal(auth.user, null)
    assertEmptyAccount(wedding, platform)
    await http.get('/test/probe')
  })

  test('a late logout does not clear a newly authenticated account or its token', async () => {
    const { auth, wedding } = seedAccount()
    const started = deferred()
    const logout = deferred()
    mockHttp(async (config) => {
      if (config.url === '/auth/logout') {
        started.resolve()
        return logout.promise
      }
      if (config.url === '/auth/login') return loginResponse(2)
      assert.equal(config.url, '/test/probe')
      assert.equal(config.headers.Authorization, 'Bearer test-token-2')
      return {}
    })
    const pending = auth.logout()
    await started.promise
    await auth.login('user2@example.invalid', 'test-only-password')
    wedding.weddings = [event(202)]
    wedding.setActive(202)
    logout.resolve({})
    await pending
    assert.equal(auth.user.id, 2)
    assert.equal(wedding.activeId, 202)
    await http.get('/test/probe')
  })

  test('a late restored profile cannot authenticate again after expiration', async () => {
    const { auth, wedding, platform } = seedAccount()
    const started = deferred()
    const profile = deferred()
    mockHttp((config) => {
      if (config.url === '/auth/refresh') return { accessToken: 'restored-test-token', expiresIn: 900 }
      if (config.url === '/auth/me') {
        started.resolve()
        return profile.promise
      }
      assert.equal(config.url, '/test/probe')
      assert.equal(config.headers.Authorization, undefined)
      return {}
    })
    const restoring = auth.restore()
    await started.promise
    auth.expireSession()
    profile.resolve(user(1))
    await restoring
    assert.equal(auth.user, null)
    assertEmptyAccount(wedding, platform)
    await http.get('/test/probe')
  })

  test('a failed intervening login cannot prevent logout from clearing the previous token', async () => {
    const { auth, wedding, platform } = seedAccount()
    const started = deferred()
    const logout = deferred()
    mockHttp((config) => {
      if (config.url === '/auth/logout') {
        started.resolve()
        return logout.promise
      }
      if (config.url === '/auth/login') throw new Error('Simulated rejected credentials')
      assert.equal(config.url, '/test/probe')
      assert.equal(config.headers.Authorization, undefined)
      return {}
    })
    const loggingOut = auth.logout()
    await started.promise
    await assert.rejects(auth.login('user2@example.invalid', 'test-only-password'))
    logout.resolve({})
    await loggingOut
    assert.equal(auth.user, null)
    assertEmptyAccount(wedding, platform)
    await http.get('/test/probe')
  })
})

describe('Refresh requests across account boundaries', () => {
  for (const transition of ['logout', 'login']) {
    for (const outcome of ['success', 'failure']) {
      test(`an old refresh ${outcome} after ${transition} cannot replay or expire the current session`, async () => {
        const { auth, wedding } = seedAccount()
        const refreshStarted = deferred()
        const refresh = deferred()
        let refreshCalls = 0
        let protectedCalls = 0
        let expirations = 0
        window.addEventListener('mp:session-expired', () => {
          expirations++
          auth.expireSession()
        })
        axios.defaults.adapter = async (config) => {
          assert.ok(config.url.endsWith('/auth/refresh'))
          assert.equal(config.withCredentials, true)
          refreshCalls++
          refreshStarted.resolve()
          await refresh.promise
          if (outcome === 'failure') throw new Error('Simulated old refresh failure')
          return response(config, { accessToken: 'old-account-refreshed-token', expiresIn: 900 })
        }
        mockHttp((config) => {
          if (config.url === '/test/protected') {
            protectedCalls++
            assert.equal(config.headers.Authorization, 'Bearer test-token-1')
            throw unauthorized(config)
          }
          if (config.url === '/auth/login') return loginResponse(2)
          if (config.url === '/auth/logout') return {}
          assert.equal(config.url, '/test/probe')
          assert.equal(config.headers.Authorization, transition === 'login' ? 'Bearer test-token-2' : undefined)
          return {}
        })
        const rejectedRequest = assert.rejects(http.get('/test/protected'))
        await refreshStarted.promise
        if (transition === 'login') {
          await auth.login('user2@example.invalid', 'test-only-password')
          wedding.weddings = [event(202)]
          wedding.setActive(202)
        } else {
          await auth.logout()
        }
        refresh.resolve()
        await rejectedRequest
        assert.equal(refreshCalls, 1)
        assert.equal(protectedCalls, 1, 'old requests must not be replayed under another account')
        assert.equal(expirations, 0, 'an obsolete refresh must not expire the current account')
        assert.equal(auth.user?.id ?? null, transition === 'login' ? 2 : null)
        assert.equal(wedding.activeId, transition === 'login' ? 202 : null)
        await http.get('/test/probe')
      })
    }
  }

  test('a delayed 401 from the previous account cannot refresh or replay under a newly logged in account', async () => {
    const { auth } = seedAccount()
    const requestStarted = deferred()
    const request = deferred()
    let refreshCalls = 0
    let protectedCalls = 0
    let expirations = 0
    window.addEventListener('mp:session-expired', () => {
      expirations++
      auth.expireSession()
    })
    axios.defaults.adapter = async (config) => {
      refreshCalls++
      return response(config, { accessToken: 'unexpected-refresh-token' })
    }
    mockHttp(async (config) => {
      if (config.url === '/test/protected') {
        protectedCalls++
        assert.equal(config.headers.Authorization, 'Bearer test-token-1')
        requestStarted.resolve()
        await request.promise
        throw unauthorized(config)
      }
      if (config.url === '/auth/login') return loginResponse(2)
      assert.equal(config.url, '/test/probe')
      assert.equal(config.headers.Authorization, 'Bearer test-token-2')
      return {}
    })
    const rejectedRequest = assert.rejects(http.get('/test/protected'))
    await requestStarted.promise
    await auth.login('user2@example.invalid', 'test-only-password')
    request.resolve()
    await rejectedRequest
    assert.equal(refreshCalls, 0)
    assert.equal(protectedCalls, 1)
    assert.equal(expirations, 0)
    assert.equal(auth.user.id, 2)
    await http.get('/test/probe')
  })

  test('simultaneous 401 responses share a refresh and each retry with the renewed token', async () => {
    seedAccount()
    const refreshStarted = deferred()
    const refresh = deferred()
    const attempts = []
    let refreshCalls = 0
    let expirations = 0
    window.addEventListener('mp:session-expired', () => { expirations++ })
    axios.defaults.adapter = async (config) => {
      assert.ok(config.url.endsWith('/auth/refresh'))
      refreshCalls++
      refreshStarted.resolve()
      await refresh.promise
      return response(config, { accessToken: 'renewed-test-token', expiresIn: 900 })
    }
    mockHttp((config) => {
      attempts.push({ url: config.url, authorization: config.headers.Authorization })
      if (config.headers.Authorization === 'Bearer test-token-1') throw unauthorized(config)
      assert.equal(config.headers.Authorization, 'Bearer renewed-test-token')
      return { resource: config.url }
    })
    const requests = Promise.all([http.get('/test/one'), http.get('/test/two')])
    await refreshStarted.promise
    // Give both response interceptors time to join the pending refresh.
    await new Promise((resolve) => setImmediate(resolve))
    refresh.resolve()
    const results = await requests
    assert.equal(refreshCalls, 1)
    assert.equal(expirations, 0)
    assert.deepEqual(results.map((result) => result.data.resource), ['/test/one', '/test/two'])
    assert.deepEqual(attempts, [
      { url: '/test/one', authorization: 'Bearer test-token-1' },
      { url: '/test/two', authorization: 'Bearer test-token-1' },
      { url: '/test/one', authorization: 'Bearer renewed-test-token' },
      { url: '/test/two', authorization: 'Bearer renewed-test-token' },
    ])
  })
})

describe('Concurrent cached requests', () => {
  test('reset alone prevents pending event and platform requests from repopulating cleared stores', async () => {
    const wedding = useWeddingStore()
    const platform = usePlatformStore()
    const started = deferred()
    const events = deferred()
    const settings = deferred()
    let calls = 0
    mockHttp((config) => {
      if (++calls === 3) started.resolve()
      if (config.url === '/api/events') return events.promise
      assert.ok(config.url.startsWith('/api/platform/'))
      return settings.promise
    })
    const eventLoad = wedding.load()
    const platformLoad = platform.load()
    await started.promise
    wedding.reset()
    platform.reset()
    events.resolve({ content: [event(101)], totalPages: 1, totalElements: 1 })
    settings.resolve({ enabled: false })
    await Promise.all([eventLoad, platformLoad])
    assertEmptyAccount(wedding, platform)
  })

  test('simultaneous event loads in the same store share one request', async () => {
    const wedding = useWeddingStore()
    const started = deferred()
    const events = deferred()
    let calls = 0
    mockHttp(() => {
      calls++
      started.resolve()
      return events.promise
    })
    const first = wedding.load()
    const second = wedding.load()
    await started.promise
    events.resolve({ content: [event(101)], totalPages: 1, totalElements: 1 })
    await Promise.all([first, second])
    assert.equal(calls, 1)
    assert.equal(wedding.activeId, 101)
  })

  for (const mode of ['reset', 'force']) {
    test(`a late event response cannot replace a newer load after ${mode}`, async () => {
      const wedding = useWeddingStore()
      const firstStarted = deferred()
      const secondStarted = deferred()
      const first = deferred()
      const second = deferred()
      let calls = 0
      mockHttp(async (config) => {
        assert.equal(config.url, '/api/events')
        if (++calls === 1) {
          firstStarted.resolve()
          return first.promise
        }
        assert.equal(calls, 2)
        secondStarted.resolve()
        return second.promise
      })
      const oldLoad = wedding.load()
      await firstStarted.promise
      if (mode === 'reset') wedding.reset()
      const newLoad = wedding.load(mode === 'force')
      await secondStarted.promise
      second.resolve({ content: [event(202)], currentPage: 0, totalPages: 1, totalElements: 1 })
      await newLoad
      first.resolve({ content: [event(101)], currentPage: 0, totalPages: 1, totalElements: 1 })
      await oldLoad
      assert.deepEqual(wedding.weddings.map((record) => record.id), [202])
      assert.equal(wedding.activeId, 202)
      assert.equal(sessionStorage.getItem('mp_active_event'), '202')
      assert.equal(wedding.loaded, true)
      assert.equal(wedding.loading, false)
    })

    test(`late platform responses cannot replace newer account settings after ${mode}`, async () => {
      const platform = usePlatformStore()
      const firstStarted = deferred()
      const secondStarted = deferred()
      const first = deferred()
      const second = deferred()
      let calls = 0
      mockHttp(async (config) => {
        assert.ok(config.url.startsWith('/api/platform/'))
        const call = ++calls
        if (call <= 2) {
          if (call === 2) firstStarted.resolve()
          return first.promise
        }
        assert.ok(call <= 4)
        if (call === 4) secondStarted.resolve()
        return second.promise
      })
      const oldLoad = platform.load()
      await firstStarted.promise
      if (mode === 'reset') platform.reset()
      const newLoad = platform.load(mode === 'force')
      await secondStarted.promise
      second.resolve({ enabled: true })
      await newLoad
      first.resolve({ enabled: false })
      await oldLoad
      assert.equal(platform.eventCreationEnabled, true)
      assert.equal(platform.whatsappSendingEnabled, true)
      assert.equal(platform.loaded, true)
    })
  }

  test('event load promises belong to each Pinia instance', async () => {
    const firstStore = useWeddingStore()
    const started = deferred()
    const first = deferred()
    let calls = 0
    mockHttp(async () => {
      if (++calls === 1) {
        started.resolve()
        return first.promise
      }
      return { content: [event(202)], totalPages: 1, totalElements: 1 }
    })
    const oldLoad = firstStore.load()
    await started.promise
    setActivePinia(createPinia())
    const secondStore = useWeddingStore()
    await secondStore.load()
    first.resolve({ content: [event(101)], totalPages: 1, totalElements: 1 })
    await oldLoad
    assert.deepEqual(firstStore.weddings.map((record) => record.id), [101])
    assert.deepEqual(secondStore.weddings.map((record) => record.id), [202])
    assert.equal(calls, 2)
  })
})
