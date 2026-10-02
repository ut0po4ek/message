import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { describeError, isAuthError } from '../api/errors'
import type { GreenApi } from '../api/greenApi'
import { chatReducer } from '../domain/chatReducer'
import { parseNotification } from '../domain/notifications'
import type { Message, Session } from '../domain/types'
import { MESSENGERS } from '../messengers'
import { ChatContext, type ChatActions, type ChatContextValue } from './chatContext'
import { loadHistory, saveHistory } from './persistence'
import { useNotificationPolling } from './useNotificationPolling'

interface ChatProviderProps {
  session: Session
  api: GreenApi
  onLogout(reason?: string): void
  children: ReactNode
}

const SESSION_EXPIRED = 'Ключи доступа больше не действуют. Войдите заново'

export function ChatProvider({ session, api, onLogout, children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, session, loadHistory)
  const messenger = MESSENGERS[session.messenger]

  useEffect(() => saveHistory(session, state), [session, state])

  const connection = useNotificationPolling(api, {
    onNotification: (body) => dispatch({ type: 'eventReceived', event: parseNotification(body) }),
    onAuthError: () => onLogout(SESSION_EXPIRED),
  })

  const deliver = useCallback(
    async (chatId: string, localId: string, text: string) => {
      try {
        const { idMessage } = await api.sendMessage(chatId, text)
        dispatch({ type: 'messageSent', chatId, localId, messageId: idMessage })
      } catch (error) {
        if (isAuthError(error)) onLogout(SESSION_EXPIRED)
        dispatch({ type: 'messageFailed', chatId, localId, error: describeError(error) })
      }
    },
    [api, onLogout],
  )

  const actions = useMemo<ChatActions>(
    () => ({
      async openChat(contact) {
        const draft = await messenger.resolveContact(api, contact)
        dispatch({ type: 'chatOpened', draft, now: Date.now() })
      },

      selectChat(chatId) {
        dispatch({ type: 'chatSelected', chatId })
      },

      sendMessage(chatId, text) {
        const message: Message = {
          id: `local-${crypto.randomUUID()}`,
          direction: 'outgoing',
          text,
          timestamp: Date.now(),
          status: 'pending',
        }
        dispatch({ type: 'messageQueued', chatId, message })
        void deliver(chatId, message.id, text)
      },

      retryMessage(chatId, message) {
        dispatch({ type: 'messageRetried', chatId, localId: message.id, now: Date.now() })
        void deliver(chatId, message.id, message.text)
      },

      logout() {
        onLogout()
      },
    }),
    [api, messenger, deliver, onLogout],
  )

  const value = useMemo<ChatContextValue>(
    () => ({ ...actions, state, session, messenger, connection }),
    [actions, state, session, messenger, connection],
  )

  return <ChatContext value={value}>{children}</ChatContext>
}
