import { useEffect } from 'react'
import { useChat } from '../store/chatContext'
import styles from './ChatScreen.module.css'
import { ChatView } from './ChatView'
import { Sidebar } from './Sidebar'

export function ChatScreen() {
  const { state, messenger } = useChat()
  const unread = Object.values(state.chats).reduce((sum, chat) => sum + chat.unreadCount, 0)

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
