import type { Credentials } from '../domain/types'
import type {
  CheckWhatsappResponse,
  DeleteNotificationResponse,
  Notification,
  SendMessageResponse,
  StateInstanceResponse,
  TelegramCheckAccountResponse,
} from './types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

interface RequestOptions {
  httpMethod?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  pathSuffix?: string
  query?: Record<string, string | number>
  signal?: AbortSignal
}

export interface GreenApi {
  getStateInstance(signal?: AbortSignal): Promise<StateInstanceResponse>
  sendMessage(chatId: string, message: string): Promise<SendMessageResponse>
  receiveNotification(receiveTimeoutSec: number, signal?: AbortSignal): Promise<Notification | null>
  deleteNotification(receiptId: number, signal?: AbortSignal): Promise<DeleteNotificationResponse>
  checkTelegramAccount(
    query: { phoneNumber: number } | { username: string },
  ): Promise<TelegramCheckAccountResponse>
  checkWhatsapp(phoneNumber: number): Promise<CheckWhatsappResponse>
}

export function defaultApiUrl(idInstance: string): string {
  const prefix = idInstance.slice(0, 4)

  return /^\d{4}$/.test(prefix)
    ? `https://${prefix}.api.green-api.com`
    : 'https://api.green-api.com'
}

export class GreenApiClient implements GreenApi {
  readonly #baseUrl: string
  readonly #idInstance: string
  readonly #token: string

  constructor({ apiUrl, idInstance, apiTokenInstance }: Credentials) {
    this.#baseUrl = apiUrl.replace(/\/+$/, '')
    this.#idInstance = idInstance
    this.#token = apiTokenInstance
  }

  getStateInstance(signal?: AbortSignal) {
    return this.#request<StateInstanceResponse>('getStateInstance', { signal })
  }

  sendMessage(chatId: string, message: string) {
    return this.#request<SendMessageResponse>('sendMessage', {
      httpMethod: 'POST',
      body: { chatId, message },
    })
  }

  receiveNotification(receiveTimeoutSec: number, signal?: AbortSignal) {
    return this.#request<Notification | null>('receiveNotification', {
      query: { receiveTimeout: receiveTimeoutSec },
      signal,
    })
  }

  deleteNotification(receiptId: number, signal?: AbortSignal) {
    return this.#request<DeleteNotificationResponse>('deleteNotification', {
      httpMethod: 'DELETE',
      pathSuffix: `/${receiptId}`,
      signal,
    })
  }

  checkTelegramAccount(query: { phoneNumber: number } | { username: string }) {
    return this.#request<TelegramCheckAccountResponse>('checkAccount', {
      httpMethod: 'POST',
      body: query,
    })
  }

  checkWhatsapp(phoneNumber: number) {
    return this.#request<CheckWhatsappResponse>('checkWhatsapp', {
      httpMethod: 'POST',
      body: { phoneNumber },
    })
  }

  async #request<T>(method: string, options: RequestOptions = {}): Promise<T> {
    const { httpMethod = 'GET', body, pathSuffix = '', query, signal } = options
    const url = new URL(
      `${this.#baseUrl}/waInstance${this.#idInstance}/${method}/${this.#token}${pathSuffix}`,
    )
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, String(value))
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: httpMethod,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })
    } catch (error) {
      if (signal?.aborted) throw error
      throw new GreenApiError(0, 'Не удалось связаться с сервером GREEN-API')
    }

    const text = await response.text()
    if (!response.ok) {
      throw new GreenApiError(response.status, extractErrorMessage(text) ?? response.statusText)
    }

    return (text.trim() === '' ? null : JSON.parse(text)) as T
  }
}

function extractErrorMessage(text: string): string | null {
  try {
    const data: unknown = JSON.parse(text)
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message
    }
  } catch {
    // тело ответа не JSON
  }

  return text.trim() || null
}
