import { lastActivity } from '../domain/chatReducer'
import type { Chat } from '../domain/types'
import { formatListTime } from '../utils/format'
import { Avatar } from './Avatar'
import styles from './ChatListItem.module.css'
import { MessageStatusIcon } from './MessageStatusIcon'

interface ChatListItemProps {
  chat: Chat
  selected: boolean
  onSelect(): void
}

export function ChatListItem({ chat, selected, onSelect }: ChatListItemProps) {
  const last = chat.messages.at(-1)
  const preview = last
    ? last.unsupportedType
      ? 'Вложение'
      : last.text
    : chat.subtitle && chat.subtitle !== chat.title
      ? chat.subtitle
      : 'Нет сообщений'

  return (
    <button
      type="button"
      className={styles.item}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
    >
      <Avatar id={chat.id} title={chat.title} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.title}>{chat.title}</span>
          {last?.direction === 'outgoing' && last.status && (
            <MessageStatusIcon status={last.status} className={styles.status} />
          )}
          <time className={styles.time} dateTime={new Date(lastActivity(chat)).toISOString()}>
            {formatListTime(lastActivity(chat))}
          </time>
        </span>
        <span className={styles.bottom}>
          <span className={styles.preview} data-empty={!last || undefined}>
            {preview}
          </span>
          {chat.unreadCount > 0 && (
            <span className={styles.badge} aria-label={`Непрочитанных: ${chat.unreadCount}`}>
              {chat.unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
