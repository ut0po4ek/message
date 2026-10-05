import { sortChats } from '../domain/chatReducer'
import { useChatSession, useChatState } from '../store/chatContext'
import type { ConnectionStatus } from '../store/useNotificationPolling'
import { ChatListItem } from './ChatListItem'
import { NewChatForm } from './NewChatForm'
import styles from './Sidebar.module.css'
import { ThemeToggle } from './ThemeToggle'
import { LogoutIcon } from './icons'
import { MESSENGER_LOGOS } from './messengerLogos'

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  unavailable: 'Инстанс недоступен',
  reconnecting: 'Переподключение…',
}

export function Sidebar() {
  const { session, messenger, selectChat, logout } = useChatSession()
  const { state, connection } = useChatState()
  const chats = sortChats(state.chats)
  const Logo = MESSENGER_LOGOS[session.messenger]

  return (
    <aside className={styles.sidebar} aria-label="Чаты">
      <header className={styles.header}>
        <Logo size={40} />
        <div className={styles.account}>
          <span className={styles.name}>{messenger.name}</span>
          <span className={styles.status} data-status={connection}>
            {CONNECTION_LABELS[connection]} · {session.idInstance}
          </span>
        </div>
        <ThemeToggle className={styles.iconButton} />
        <button type="button" className={styles.iconButton} onClick={logout} title="Выйти">
          <LogoutIcon size={22} />
          <span className="visually-hidden">Выйти</span>
        </button>
      </header>

      <NewChatForm />

      {chats.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Пока нет чатов</p>
          <p>Введите номер телефона получателя выше, чтобы начать переписку</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {chats.map((chat) => (
            <li key={chat.id}>
              <ChatListItem
                chat={chat}
                selected={chat.id === state.activeChatId}
                onSelect={() => selectChat(chat.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
