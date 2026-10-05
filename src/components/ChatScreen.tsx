import { useEffect } from 'react'
import { useChatSession, useChatState } from '../store/chatContext'
import styles from './ChatScreen.module.css'
import { ChatView } from './ChatView'
import { Sidebar } from './Sidebar'

export function ChatScreen() {
  const { messenger } = useChatSession()
  const { state } = useChatState()
  const unread = Object.values(state.chats).reduce((sum, chat) => sum + chat.unreadCount, 0)

  useEffect(() => {
    const initialTitle = document.title

    return () => {
      document.title = initialTitle
    }
  }, [])

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${messenger.name}` : messenger.name
  }, [unread, messenger])

  return (
    <div className={styles.layout} data-view={state.activeChatId ? 'chat' : 'list'}>
      <Sidebar />
      <ChatView />
    </div>
  )
}
