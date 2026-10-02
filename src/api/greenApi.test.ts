import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeError } from './errors'
import { GreenApiClient, GreenApiError, defaultApiUrl } from './greenApi'

const credentials = {
  apiUrl: 'https://4100.api.green-api.com/',
  idInstance: '4100000000',
  apiTokenInstance: 'secret-token',
}

function mockFetch(status: number, body: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }))
  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GreenApiClient', () => {
  it('builds sendMessage request according to the docs', async () => {
    const fetchMock = mockFetch(200, '{"idMessage":"ABC"}')

    await expect(
      new GreenApiClient(credentials).sendMessage('10000000', 'Привет'),
    ).resolves.toEqual({ idMessage: 'ABC' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://4100.api.green-api.com/waInstance4100000000/sendMessage/secret-token',
    )
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: '10000000', message: 'Привет' }),
    })
  })

  it('passes receiveTimeout and returns null for an empty queue', async () => {
    const fetchMock = mockFetch(200, 'null')

    await expect(new GreenApiClient(credentials).receiveNotification(20)).resolves.toBeNull()
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://4100.api.green-api.com/waInstance4100000000/receiveNotification/secret-token?receiveTimeout=20',
    )
  })

  it('deletes notifications by receiptId', async () => {
    const fetchMock = mockFetch(200, '{"result":true}')

    await new GreenApiClient(credentials).deleteNotification(42)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://4100.api.green-api.com/waInstance4100000000/deleteNotification/secret-token/42',
    )
    expect(init).toMatchObject({ method: 'DELETE' })
  })

  it('throws GreenApiError with HTTP status', async () => {
    mockFetch(401, 'Unauthorized')

    const error = await new GreenApiClient(credentials).getStateInstance().catch((e) => e)

    expect(error).toBeInstanceOf(GreenApiError)
    expect(error.status).toBe(401)
    expect(describeError(error)).toBe('Неверный idInstance или apiTokenInstance')
  })

  it('reports network failures as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await new GreenApiClient(credentials).getStateInstance().catch((e) => e)

    expect(error).toMatchObject({ status: 0 })
  })
})

describe('defaultApiUrl', () => {
  it('derives host from the first four digits of idInstance', () => {
    expect(defaultApiUrl('4100123456')).toBe('https://4100.api.green-api.com')
  })

  it('falls back to the shared host', () => {
    expect(defaultApiUrl('12')).toBe('https://api.green-api.com')
  })
})
