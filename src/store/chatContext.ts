import { createContext, useContext } from 'react'
import type { ChatState } from '../domain/chatReducer'
import type { Message, Session } from '../domain/types'
import type { Messenger } from '../messengers'
import type { ConnectionStatus } from './useNotificationPolling'

export interface ChatActions {
  openChat(contact: string): Promise<void>
  selectChat(chatId: string | null): void
  sendMessage(chatId: string, text: string): void
  retryMessage(chatId: string, message: Message): void
  logout(): void
}

export interface ChatContextValue extends ChatActions {
  state: ChatState
  session: Session
  messenger: Messenger
  connection: ConnectionStatus
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChat(): ChatContextValue {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat must be used inside <ChatProvider>')

  return value
}
