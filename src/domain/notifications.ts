import type { MessageData, NotificationBody } from '../api/types'
import type { Message, MessageStatus } from './types'

export type ChatEvent =
  | { type: 'message'; chatId: string; chatName?: string; message: Message }
  | { type: 'status'; chatId: string; messageId: string; status: MessageStatus; error?: string }
  | { type: 'ignored' }

const IGNORED: ChatEvent = { type: 'ignored' }

const FAILURE_REASONS: Record<string, string> = {
  failed: 'Сообщение не доставлено',
  noAccount: 'У получателя нет аккаунта в мессенджере',
  notInGroup: 'Вы не состоите в этой группе',
  yellowCard: 'Отправка временно ограничена мессенджером',
}

export function parseNotification(body: NotificationBody): ChatEvent {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
      return parseMessage(body, 'incoming')
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived':
      return parseMessage(body, 'outgoing')
    case 'outgoingMessageStatus':
      return parseStatus(body)
    default:
      return IGNORED
  }
}

function parseMessage(body: NotificationBody, direction: Message['direction']): ChatEvent {
  const { idMessage, senderData, messageData } = body
  if (!idMessage || !senderData?.chatId || !messageData) return IGNORED

  const text = extractText(messageData)
  const chatName =
    direction === 'incoming'
      ? senderData.chatName || senderData.senderContactName || senderData.senderName
      : senderData.chatName

  return {
    type: 'message',
    chatId: senderData.chatId,
    chatName: chatName || undefined,
    message: {
      id: idMessage,
      direction,
      text: text ?? '',
      timestamp: toMillis(body.timestamp),
      ...(direction === 'outgoing' && { status: 'sent' as const }),
      ...(text === null && { unsupportedType: messageData.typeMessage }),
    },
  }
}

function parseStatus(body: NotificationBody): ChatEvent {
  const { idMessage, chatId, status } = body
  if (!idMessage || !chatId || !status) return IGNORED

  if (status === 'sent' || status === 'delivered' || status === 'read') {
    return { type: 'status', chatId, messageId: idMessage, status }
  }

  const reason = FAILURE_REASONS[status]
  if (!reason) return IGNORED

  return {
    type: 'status',
    chatId,
    messageId: idMessage,
    status: 'failed',
    error: body.description || reason,
  }
}

function extractText(data: MessageData): string | null {
  switch (data.typeMessage) {
    case 'textMessage':
      return data.textMessageData?.textMessage ?? null
    case 'extendedTextMessage':
    case 'quotedMessage':
      return data.extendedTextMessageData?.text ?? null
    default:
      return null
  }
}

function toMillis(timestampSec: number | undefined): number {
  return timestampSec ? timestampSec * 1000 : Date.now()
}
