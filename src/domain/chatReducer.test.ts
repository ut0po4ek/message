import { describe, expect, it } from 'vitest'
import { chatReducer, initialChatState, sortChats, type ChatState } from './chatReducer'
import type { ChatEvent } from './notifications'
import type { Message } from './types'

const NOW = 1_700_000_000_000

function opened(state = initialChatState, id = '79991234567@c.us', aliases: string[] = []) {
  return chatReducer(state, {
    type: 'chatOpened',
    draft: { id, aliases, title: '+7 999 123-45-67' },
    now: NOW,
  })
}

function incoming(chatId: string, id: string, text = 'Привет', chatName?: string): ChatEvent {
  return {
    type: 'message',
    chatId,
    chatName,
    message: { id, direction: 'incoming', text, timestamp: NOW + 1000 },
  }
}

function queued(state: ChatState, chatId: string, localId = 'local-1'): ChatState {
  const message: Message = {
    id: localId,
    direction: 'outgoing',
    text: 'Здравствуйте',
    timestamp: NOW,
    status: 'pending',
  }

  return chatReducer(state, { type: 'messageQueued', chatId, message })
}

describe('chatReducer', () => {
  it('opens a chat and makes it active', () => {
    const state = opened()

    expect(state.activeChatId).toBe('79991234567@c.us')
    expect(state.chats['79991234567@c.us']).toMatchObject({ title: '+7 999 123-45-67' })
  })

  it('reuses an existing chat matched by alias instead of creating a duplicate', () => {
    let state = opened(initialChatState, '79991234567@c.us', ['123@lid'])
    state = chatReducer(state, { type: 'chatSelected', chatId: null })
    state = opened(state, '79991234567@c.us', ['79991234567@c.us'])

    expect(Object.keys(state.chats)).toEqual(['79991234567@c.us'])
    expect(state.activeChatId).toBe('79991234567@c.us')
  })

  it('routes incoming messages by alias (WhatsApp LID)', () => {
    let state = opened(initialChatState, '79991234567@c.us', ['123@lid'])
    state = chatReducer(state, { type: 'eventReceived', event: incoming('123@lid', 'A1') })

    expect(state.chats['79991234567@c.us'].messages).toHaveLength(1)
    expect(Object.keys(state.chats)).toHaveLength(1)
  })

  it('creates a chat for messages from unknown senders and counts unread', () => {
    const state = chatReducer(initialChatState, {
      type: 'eventReceived',
      event: incoming('10000000', 'A1', 'Привет', 'Василиса'),
    })

    expect(state.chats['10000000']).toMatchObject({ title: 'Василиса', unreadCount: 1 })
  })

  it('does not count unread messages in the active chat', () => {
    let state = opened(initialChatState, '10000000')
    state = chatReducer(state, { type: 'eventReceived', event: incoming('10000000', 'A1') })

    expect(state.chats['10000000'].unreadCount).toBe(0)
  })

  it('renames a chat once the messenger provides a name', () => {
    let state = opened(initialChatState, '10000000')
    state = chatReducer(state, {
      type: 'eventReceived',
      event: incoming('10000000', 'A1', 'Привет', 'Василиса'),
    })

    expect(state.chats['10000000']).toMatchObject({
      title: 'Василиса',
      subtitle: '+7 999 123-45-67',
    })
  })

  it('ignores duplicated notifications', () => {
    let state = opened(initialChatState, '10000000')
    const event = incoming('10000000', 'A1')
    state = chatReducer(state, { type: 'eventReceived', event })
    const again = chatReducer(state, { type: 'eventReceived', event })

    expect(again).toBe(state)
  })

  it('resets unread counter when a chat is selected', () => {
    let state = chatReducer(initialChatState, {
      type: 'eventReceived',
      event: incoming('10000000', 'A1'),
    })
    state = chatReducer(state, { type: 'chatSelected', chatId: '10000000' })

    expect(state.chats['10000000'].unreadCount).toBe(0)
    expect(state.activeChatId).toBe('10000000')
  })

  describe('outgoing messages', () => {
    it('replaces local id with idMessage after sending', () => {
      let state = queued(opened(initialChatState, '10000000'), '10000000')
      state = chatReducer(state, {
        type: 'messageSent',
        chatId: '10000000',
        localId: 'local-1',
        messageId: 'SRV1',
      })

      expect(state.chats['10000000'].messages).toEqual([
        expect.objectContaining({ id: 'SRV1', status: 'sent' }),
      ])
    })

    it('keeps a single copy when the API notification arrives before the send response', () => {
      let state = queued(opened(initialChatState, '10000000'), '10000000')
      state = chatReducer(state, {
        type: 'eventReceived',
        event: {
          type: 'message',
          chatId: '10000000',
          message: {
            id: 'SRV1',
            direction: 'outgoing',
            text: 'Здравствуйте',
            timestamp: NOW,
            status: 'sent',
          },
        },
      })
      state = chatReducer(state, {
        type: 'messageSent',
        chatId: '10000000',
        localId: 'local-1',
        messageId: 'SRV1',
      })

      expect(state.chats['10000000'].messages.map((m) => m.id)).toEqual(['SRV1'])
    })

    it('marks message as failed and allows retry', () => {
      let state = queued(opened(initialChatState, '10000000'), '10000000')
      state = chatReducer(state, {
        type: 'messageFailed',
        chatId: '10000000',
        localId: 'local-1',
        error: 'Нет связи',
      })
      expect(state.chats['10000000'].messages[0]).toMatchObject({
        status: 'failed',
        error: 'Нет связи',
      })

      state = chatReducer(state, {
        type: 'messageRetried',
        chatId: '10000000',
        localId: 'local-1',
        now: NOW + 5000,
      })
      expect(state.chats['10000000'].messages[0]).toMatchObject({
        status: 'pending',
        error: undefined,
        timestamp: NOW + 5000,
      })
    })

    it('only moves delivery status forward', () => {
      let state = queued(opened(initialChatState, '10000000'), '10000000')
      state = chatReducer(state, {
        type: 'messageSent',
        chatId: '10000000',
        localId: 'local-1',
        messageId: 'SRV1',
      })
      const status = (value: 'sent' | 'delivered' | 'read' | 'failed') =>
        ({
          type: 'eventReceived',
          event: { type: 'status', chatId: '10000000', messageId: 'SRV1', status: value },
        }) as const

      state = chatReducer(state, status('read'))
      state = chatReducer(state, status('delivered'))
      state = chatReducer(state, status('failed'))

      expect(state.chats['10000000'].messages[0].status).toBe('read')
    })
  })

  it('sorts chats by last activity', () => {
    let state = opened(initialChatState, 'older')
    state = opened(state, 'newer')
    state = chatReducer(state, { type: 'eventReceived', event: incoming('older', 'A1') })

    expect(sortChats(state.chats).map((c) => c.id)).toEqual(['older', 'newer'])
  })
})
