import type { ChatState } from '../domain/chatReducer'
import type { Session } from '../domain/types'

const SESSION_KEY = 'green-chat:session'
const HISTORY_PREFIX = 'green-chat:history:v1'
const LAST_LOGIN_KEY = 'green-chat:last-login'

export type LastLogin = Pick<Session, 'messenger' | 'idInstance' | 'apiUrl'>

export function loadLastLogin(): LastLogin | null {
  return readJson<LastLogin>(localStorage, LAST_LOGIN_KEY)
}

export function saveLastLogin({ messenger, idInstance, apiUrl }: Session): void {
  writeJson(localStorage, LAST_LOGIN_KEY, { messenger, idInstance, apiUrl })
}

export function loadSession(): Session | null {
  return readJson<Session>(sessionStorage, SESSION_KEY)
}

export function saveSession(session: Session | null): void {
  if (session) writeJson(sessionStorage, SESSION_KEY, session)
  else safely(() => sessionStorage.removeItem(SESSION_KEY))
}

function historyKey({ messenger, idInstance }: Session): string {
  return `${HISTORY_PREFIX}:${messenger}:${idInstance}`
}

export function loadHistory(session: Session): ChatState {
  const stored = readJson<ChatState>(localStorage, historyKey(session))
  if (!stored?.chats) return { chats: {}, activeChatId: null }

  const chats = Object.fromEntries(
    Object.entries(stored.chats).map(([id, chat]) => [
      id,
      {
        ...chat,
        messages: chat.messages.map((m) =>
          m.status === 'pending'
            ? { ...m, status: 'failed' as const, error: 'Отправка прервана' }
            : m,
        ),
      },
    ]),
  )

  return { chats, activeChatId: null }
}

export function saveHistory(session: Session, state: ChatState): void {
  writeJson(localStorage, historyKey(session), { chats: state.chats })
}

function readJson<T>(storage: Storage, key: string): T | null {
  return safely(() => {
    const raw = storage.getItem(key)

    return raw ? (JSON.parse(raw) as T) : null
  })
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  safely(() => storage.setItem(key, JSON.stringify(value)))
}

function safely<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}
