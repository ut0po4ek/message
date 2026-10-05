import { useEffect, useEffectEvent, useState } from 'react'
import { isAuthError } from '../api/errors'
import type { GreenApi } from '../api/greenApi'
import type { NotificationBody } from '../api/types'

export type ConnectionStatus = 'connecting' | 'online' | 'unavailable' | 'reconnecting'

const POLL_TIMEOUT_SEC = 20
const MAX_BACKOFF_MS = 30_000
/** Как часто перепроверять состояние инстанса: телефон может отключиться посреди сессии */
const STATE_CHECK_MS = 60_000

interface Handlers {
  onNotification(body: NotificationBody): void
  onAuthError(): void
}

/**
 * Получает уведомления через HTTP API GREEN-API: ReceiveNotification (long polling)
 * и подтверждение через DeleteNotification. Обработка должна быть идемпотентной:
 * если удаление не удалось, то же уведомление придёт повторно.
 */
export function useNotificationPolling(api: GreenApi, handlers: Handlers): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const onNotification = useEffectEvent(handlers.onNotification)
  const onAuthError = useEffectEvent(handlers.onAuthError)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function loop() {
      let failures = 0
      let checkedAt = 0

      while (!signal.aborted) {
        try {
          if (Date.now() - checkedAt >= STATE_CHECK_MS) {
            const { stateInstance } = await api.getStateInstance(signal)
            checkedAt = Date.now()
            setStatus(stateInstance === 'authorized' ? 'online' : 'unavailable')
          }

          const notification = await api.receiveNotification(POLL_TIMEOUT_SEC, signal)
          failures = 0
          if (notification) {
            onNotification(notification.body)
            await api.deleteNotification(notification.receiptId, signal)
          }
        } catch (error) {
          if (signal.aborted) return
          if (isAuthError(error)) {
            onAuthError()
            return
          }

          checkedAt = 0
          failures += 1
          setStatus('reconnecting')
          await sleep(Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (failures - 1)), signal)
        }
      }
    }

    void loop()

    return () => controller.abort()
  }, [api])

  return status
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}
