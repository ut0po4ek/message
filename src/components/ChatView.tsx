import { useChat } from '../store/chatContext'
import { Avatar } from './Avatar'
import styles from './ChatView.module.css'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import { BackIcon } from './icons'

export function ChatView() {
  const { state, messenger, selectChat, sendMessage, retryMessage } = useChat()
  const chat = state.activeChatId ? state.chats[state.activeChatId] : undefined

  if (!chat) {
    return (
      <section className={styles.view} aria-label="Переписка">
        <div className={styles.placeholder}>
          <span>Выберите чат или создайте новый по номеру телефона</span>
        </div>
      </section>
    )
  }

  const subtitle = chat.subtitle && chat.subtitle !== chat.title ? chat.subtitle : messenger.name

  return (
    <section className={styles.view} aria-label={`Переписка: ${chat.title}`}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => selectChat(null)}
          aria-label="Назад к списку чатов"
        >
          <BackIcon />
        </button>
        <Avatar id={chat.id} title={chat.title} size={42} />
        <div className={styles.info}>
          <h2 className={styles.title}>{chat.title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </header>

      <MessageList
        key={chat.id}
        messages={chat.messages}
        onRetry={(message) => retryMessage(chat.id, message)}
      />

      <Composer key={`composer-${chat.id}`} onSend={(text) => sendMessage(chat.id, text)} />
    </section>
  )
}
