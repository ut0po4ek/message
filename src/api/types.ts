export type InstanceState =
  'notAuthorized' | 'authorized' | 'blocked' | 'starting' | 'suspended' | 'sleepMode' | 'yellowCard'

export interface StateInstanceResponse {
  stateInstance: InstanceState
}

export interface SendMessageResponse {
  idMessage: string
}

export interface TelegramCheckAccountResponse {
  exist: boolean
  chatId?: string
  username?: string
  phoneNumber?: number
}

export interface CheckWhatsappResponse {
  existsWhatsapp: boolean
  chatId?: string
  phoneNumber?: string
}

export interface SenderData {
  chatId: string
  sender?: string
  chatName?: string
  senderName?: string
  senderContactName?: string
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string }
}

export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  senderData?: SenderData
  messageData?: MessageData
  /** Поля уведомления outgoingMessageStatus */
  chatId?: string
  status?: string
  description?: string
}

export interface Notification {
  receiptId: number
  body: NotificationBody
}

export interface DeleteNotificationResponse {
  result: boolean
}
