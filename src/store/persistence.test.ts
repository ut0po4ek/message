import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Chat, Message, Session } from '../domain/types'
import { loadHistory, saveHistory } from './persistence'

const session: Session = {
  messenger: 'max',
  idInstance: '3100000000',
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
}

function chatWith(count: number): Chat {
  const messages: Message[] = Array.from({ length: count }, (_, i) => ({
    id: `M${i}`,
    direction: 'incoming',
    text: `Сообщение ${i}`,
    timestamp: i,
  }))

  return {
    id: '1',
    aliases: ['1'],
    title: 'Анна',
    hasName: true,
    messages,
    unreadCount: 0,
    createdAt: 0,
  }
}

afterEach(() => vi.restoreAllMocks())

describe('history persistence', () => {
  it('keeps only the latest messages of each chat', () => {
    saveHistory(session, { '1': chatWith(600) })

    const messages = loadHistory(session).chats['1'].messages
    expect(messages).toHaveLength(500)
    expect(messages.at(-1)?.id).toBe('M599')
  })

  it('retries with a smaller history when storage is full', () => {
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })
      .mockImplementation(function (this: Storage, key, value) {
        setItem.call(this, key, value)
      })

    saveHistory(session, { '1': chatWith(600) })

    expect(loadHistory(session).chats['1'].messages).toHaveLength(50)
  })
})
