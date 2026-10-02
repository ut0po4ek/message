export type MessengerId = 'telegram' | 'whatsapp'

export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export interface Session extends Credentials {
  messenger: MessengerId
}

export type MessageDirection = 'incoming' | 'outgoing'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  /** idMessage из GREEN-API; пока сообщение не отправлено — локальный идентификатор */
  id: string
  direction: MessageDirection
  text: string
  /** Unix-время в миллисекундах */
  timestamp: number
  status?: MessageStatus
  error?: string
  /** Тип сообщения, который интерфейс не умеет отображать (фото, стикер и т.п.) */
  unsupportedType?: string
}

export interface Chat {
  /** chatId, на который отправляются сообщения */
  id: string
  /** Все chatId, под которыми мессенджер может присылать события этого диалога */
  aliases: string[]
  title: string
  /** true, если title взят из мессенджера, а не построен из номера */
  hasName: boolean
  subtitle?: string
  messages: Message[]
  unreadCount: number
  createdAt: number
}

export interface ChatDraft {
  id: string
  aliases: string[]
  title: string
  subtitle?: string
}
