import { initialChatState, type ChatState } from '../domain/chatReducer'
import type { Chat, MessengerId, Session } from '../domain/types'

const SESSION_KEY = 'green-chat:session'
const HISTORY_PREFIX = 'green-chat:history:v1'
const LAST_LOGIN_KEY = 'green-chat:last-login:v2'
/** Сколько последних сообщений чата хранить; второе значение — запасное, если не хватило места */
const STORED_MESSAGES_LIMITS = [500, 50]

export type SavedInstance = Pick<Session, 'idInstance' | 'apiUrl'>

interface LastLogin {
  messenger: MessengerId
  instances: Partial<Record<MessengerId, SavedInstance>>
}

function loadLastLogin(): LastLogin | null {
  return readJson<LastLogin>(localStorage, LAST_LOGIN_KEY)
}

export function loadLastMessenger(): MessengerId | null {
  return loadLastLogin()?.messenger ?? null
}

export function loadSavedInstance(messenger: MessengerId): SavedInstance | null {
  return loadLastLogin()?.instances?.[messenger] ?? null
}

export function saveLastLogin({ messenger, idInstance, apiUrl }: Session): void {
  writeJson(localStorage, LAST_LOGIN_KEY, {
    messenger,
    instances: { ...loadLastLogin()?.instances, [messenger]: { idInstance, apiUrl } },
  } satisfies LastLogin)
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
  if (!stored?.chats) return initialChatState

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

  return { ...initialChatState, chats }
}

export function saveHistory(session: Session, chats: Record<string, Chat>): void {
  for (const limit of STORED_MESSAGES_LIMITS) {
    if (writeJson(localStorage, historyKey(session), { chats: trimChats(chats, limit) })) return
  }
}

function trimChats(chats: Record<string, Chat>, limit: number): Record<string, Chat> {
  return Object.fromEntries(
    Object.entries(chats).map(([id, chat]) => [
      id,
      chat.messages.length > limit ? { ...chat, messages: chat.messages.slice(-limit) } : chat,
    ]),
  )
}

function readJson<T>(storage: Storage, key: string): T | null {
  return safely(() => {
    const raw = storage.getItem(key)

    return raw ? (JSON.parse(raw) as T) : null
  })
}

function writeJson(storage: Storage, key: string, value: unknown): boolean {
  return (
    safely(() => {
      storage.setItem(key, JSON.stringify(value))

      return true
    }) ?? false
  )
}

function safely<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}
