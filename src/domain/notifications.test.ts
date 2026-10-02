import { describe, expect, it } from 'vitest'
import type { NotificationBody } from '../api/types'
import { parseNotification } from './notifications'

const base = {
  timestamp: 1763115112,
  idMessage: 'MSG1',
  senderData: { chatId: '10000000', sender: '10000000', senderName: 'Василиса' },
}

describe('parseNotification', () => {
  it('parses incoming text message', () => {
    const body: NotificationBody = {
      ...base,
      typeWebhook: 'incomingMessageReceived',
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    }

    expect(parseNotification(body)).toEqual({
      type: 'message',
      chatId: '10000000',
      chatName: 'Василиса',
      message: {
        id: 'MSG1',
        direction: 'incoming',
        text: 'Привет',
        timestamp: 1763115112000,
      },
    })
  })

  it('parses extended text message', () => {
    const event = parseNotification({
      ...base,
      typeWebhook: 'incomingMessageReceived',
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'https://green-api.com' },
      },
    })

    expect(event).toMatchObject({ message: { text: 'https://green-api.com' } })
  })

  it('marks non-text messages as unsupported', () => {
    const event = parseNotification({
      ...base,
      typeWebhook: 'incomingMessageReceived',
      messageData: { typeMessage: 'imageMessage' },
    })

    expect(event).toMatchObject({ message: { text: '', unsupportedType: 'imageMessage' } })
  })

  it.each(['outgoingMessageReceived', 'outgoingAPIMessageReceived'])(
    'parses %s as sent outgoing message without sender name',
    (typeWebhook) => {
      const event = parseNotification({
        ...base,
        typeWebhook,
        senderData: { chatId: '10000000', senderName: 'Я сам' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Ок' } },
      })

      expect(event).toMatchObject({
        type: 'message',
        chatName: undefined,
        message: { direction: 'outgoing', status: 'sent' },
      })
    },
  )

  it('parses delivery statuses', () => {
    expect(
      parseNotification({
        typeWebhook: 'outgoingMessageStatus',
        chatId: '10000000',
        idMessage: 'MSG1',
        status: 'read',
      }),
    ).toEqual({ type: 'status', chatId: '10000000', messageId: 'MSG1', status: 'read' })
  })

  it('maps failure statuses to failed with a reason', () => {
    expect(
      parseNotification({
        typeWebhook: 'outgoingMessageStatus',
        chatId: '10000000',
        idMessage: 'MSG1',
        status: 'noAccount',
      }),
    ).toMatchObject({ status: 'failed', error: 'У получателя нет аккаунта в мессенджере' })
  })

  it('ignores service notifications and malformed payloads', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toEqual({ type: 'ignored' })
    expect(parseNotification({ typeWebhook: 'incomingMessageReceived' })).toEqual({
      type: 'ignored',
    })
  })
})
