import type { ChatEvent } from './notifications'
import { describeChatId } from './phone'
import type { Chat, ChatDraft, Message, MessageStatus } from './types'

interface EarlyStatus {
  status: MessageStatus
  error?: string
}

export interface ChatState {
  chats: Record<string, Chat>
  activeChatId: string | null
  /**
   * Статусы, пришедшие раньше ответа sendMessage: сообщение ещё хранится под локальным id.
   * Применяются, когда сообщение получает свой idMessage.
   */
  earlyStatuses: Record<string, EarlyStatus>
}

export type ChatAction =
  | { type: 'chatOpened'; draft: ChatDraft; now: number }
  | { type: 'chatSelected'; chatId: string | null }
  | { type: 'messageQueued'; chatId: string; message: Message }
  | { type: 'messageSent'; chatId: string; localId: string; messageId: string }
  | { type: 'messageFailed'; chatId: string; localId: string; error: string }
  | { type: 'messageRetried'; chatId: string; localId: string; now: number }
  | { type: 'eventReceived'; event: ChatEvent }

export const initialChatState: ChatState = { chats: {}, activeChatId: null, earlyStatuses: {} }

const MAX_EARLY_STATUSES = 100

const STATUS_RANK: Record<MessageStatus, number> = {
  failed: -1,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened':
      return openChat(state, action.draft, action.now)

    case 'chatSelected': {
      const chat = action.chatId ? state.chats[action.chatId] : undefined
      if (!chat) return { ...state, activeChatId: null }

      return {
        ...state,
        chats: chat.unreadCount ? putChat(state.chats, { ...chat, unreadCount: 0 }) : state.chats,
        activeChatId: chat.id,
      }
    }

    case 'messageQueued':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, action.message],
      }))

    case 'messageSent':
      return applyEarlyStatus(
        updateChat(state, action.chatId, (chat) =>
          confirmMessage(chat, action.localId, action.messageId),
        ),
        action.chatId,
        action.messageId,
      )

    case 'messageFailed':
      return updateMessage(state, action.chatId, action.localId, (message) => ({
        ...message,
        status: 'failed',
        error: action.error,
      }))

    case 'messageRetried':
      return updateMessage(state, action.chatId, action.localId, (message) => ({
        ...message,
        status: 'pending',
        error: undefined,
        timestamp: action.now,
      }))

    case 'eventReceived':
      return applyEvent(state, action.event)
  }
}

function findChatKey(state: ChatState, chatIds: string[]): string | undefined {
  const direct = chatIds.find((id) => id in state.chats)
  if (direct) return direct

  return Object.values(state.chats).find((chat) => chat.aliases.some((a) => chatIds.includes(a)))
    ?.id
}

export function lastActivity(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? chat.createdAt
}

export function sortChats(chats: Record<string, Chat>): Chat[] {
  return Object.values(chats).sort((a, b) => lastActivity(b) - lastActivity(a))
}

function openChat(state: ChatState, draft: ChatDraft, now: number): ChatState {
  const key = findChatKey(state, [draft.id, ...draft.aliases])
  const existing = key ? state.chats[key] : undefined

  const chat: Chat = existing
    ? {
        ...existing,
        aliases: unique([...existing.aliases, draft.id, ...draft.aliases]),
        subtitle: existing.subtitle ?? draft.subtitle,
        unreadCount: 0,
      }
    : {
        id: draft.id,
        aliases: unique([draft.id, ...draft.aliases]),
        title: draft.title,
        hasName: false,
        subtitle: draft.subtitle,
        messages: [],
        unreadCount: 0,
        createdAt: now,
      }

  return { ...state, chats: putChat(state.chats, chat), activeChatId: chat.id }
}

function applyEvent(state: ChatState, event: ChatEvent): ChatState {
  if (event.type === 'ignored') return state

  if (event.type === 'status') {
    const key =
      findChatKey(state, [event.chatId]) ??
      Object.values(state.chats).find((c) => c.messages.some((m) => m.id === event.messageId))?.id
    const known = key && state.chats[key].messages.some((m) => m.id === event.messageId)
    if (!known) return rememberEarlyStatus(state, event.messageId, event.status, event.error)

    return updateMessage(state, key, event.messageId, (message) =>
      nextStatus(message, event.status, event.error),
    )
  }

  const key = findChatKey(state, [event.chatId])
  const chat: Chat = key
    ? state.chats[key]
    : {
        id: event.chatId,
        aliases: [event.chatId],
        title: event.chatName ?? describeChatId(event.chatId),
        hasName: Boolean(event.chatName),
        messages: [],
        unreadCount: 0,
        createdAt: event.message.timestamp,
      }

  if (chat.messages.some((m) => m.id === event.message.id)) return state

  const isUnread = event.message.direction === 'incoming' && state.activeChatId !== chat.id
  const rename = !chat.hasName && event.chatName

  const next = {
    ...state,
    chats: putChat(state.chats, {
      ...chat,
      ...(rename && {
        title: event.chatName,
        hasName: true,
        subtitle: chat.subtitle ?? chat.title,
      }),
      messages: insertByTime(chat.messages, event.message),
      unreadCount: chat.unreadCount + (isUnread ? 1 : 0),
    }),
  }

  return applyEarlyStatus(next, chat.id, event.message.id)
}

function rememberEarlyStatus(
  state: ChatState,
  messageId: string,
  status: MessageStatus,
  error?: string,
): ChatState {
  const previous = state.earlyStatuses[messageId]
  if (
    previous &&
    previous.status !== 'failed' &&
    STATUS_RANK[previous.status] >= STATUS_RANK[status]
  ) {
    return state
  }

  const entries = Object.entries({ ...state.earlyStatuses, [messageId]: { status, error } })

  return { ...state, earlyStatuses: Object.fromEntries(entries.slice(-MAX_EARLY_STATUSES)) }
}

function applyEarlyStatus(state: ChatState, chatKey: string, messageId: string): ChatState {
  const early = state.earlyStatuses[messageId]
  if (!early) return state

  const { [messageId]: _, ...earlyStatuses } = state.earlyStatuses
  const next = updateMessage(state, chatKey, messageId, (message) =>
    nextStatus(message, early.status, early.error),
  )

  return { ...next, earlyStatuses }
}

function confirmMessage(chat: Chat, localId: string, messageId: string): Chat {
  const optimistic = chat.messages.find((m) => m.id === localId)
  if (!optimistic) return chat

  const delivered = chat.messages.find((m) => m.id === messageId)
  if (delivered) {
    // Уведомление о сообщении пришло раньше ответа sendMessage — оставляем одну копию
    return { ...chat, messages: chat.messages.filter((m) => m.id !== localId) }
  }

  return {
    ...chat,
    messages: chat.messages.map((m) =>
      m.id === localId ? { ...nextStatus(m, 'sent'), id: messageId } : m,
    ),
  }
}

function nextStatus(message: Message, status: MessageStatus, error?: string): Message {
  const current = message.status ?? 'pending'

  if (status === 'failed') {
    return STATUS_RANK[current] >= STATUS_RANK.delivered ? message : { ...message, status, error }
  }

  return STATUS_RANK[status] > STATUS_RANK[current]
    ? { ...message, status, error: undefined }
    : message
}

function insertByTime(messages: Message[], message: Message): Message[] {
  const last = messages.at(-1)
  if (!last || last.timestamp <= message.timestamp) return [...messages, message]

  return [...messages, message].sort((a, b) => a.timestamp - b.timestamp)
}

function updateChat(state: ChatState, chatId: string, update: (chat: Chat) => Chat): ChatState {
  const chat = state.chats[chatId]
  if (!chat) return state

  const next = update(chat)

  return next === chat ? state : { ...state, chats: putChat(state.chats, next) }
}

function updateMessage(
  state: ChatState,
  chatId: string,
  messageId: string,
  update: (message: Message) => Message,
): ChatState {
  return updateChat(state, chatId, (chat) => {
    let changed = false
    const messages = chat.messages.map((m) => {
      if (m.id !== messageId) return m
      const next = update(m)
      changed ||= next !== m

      return next
    })

    return changed ? { ...chat, messages } : chat
  })
}

function putChat(chats: Record<string, Chat>, chat: Chat): Record<string, Chat> {
  return { ...chats, [chat.id]: chat }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
