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

/** Не меняется за время сессии, поэтому его потребители не перерисовываются от уведомлений */
export interface ChatSessionValue extends ChatActions {
  session: Session
  messenger: Messenger
}

export interface ChatStateValue {
  state: ChatState
  connection: ConnectionStatus
}

export const ChatSessionContext = createContext<ChatSessionValue | null>(null)
export const ChatStateContext = createContext<ChatStateValue | null>(null)

export function useChatSession(): ChatSessionValue {
  const value = useContext(ChatSessionContext)
  if (!value) throw new Error('useChatSession must be used inside <ChatProvider>')

  return value
}

export function useChatState(): ChatStateValue {
  const value = useContext(ChatStateContext)
  if (!value) throw new Error('useChatState must be used inside <ChatProvider>')

  return value
}
