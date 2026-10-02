import type { Message } from '../domain/types'
import { formatTime } from '../utils/format'
import styles from './MessageBubble.module.css'
import { MessageStatusIcon } from './MessageStatusIcon'

interface MessageBubbleProps {
  message: Message
  isGroupStart: boolean
  isGroupEnd: boolean
  animate: boolean
  onRetry(message: Message): void
}

export function MessageBubble({
  message,
  isGroupStart,
  isGroupEnd,
  animate,
  onRetry,
}: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing'
  const failed = message.status === 'failed'

  return (
    <div
      className={styles.row}
      data-direction={message.direction}
      data-group-start={isGroupStart || undefined}
      data-animate={animate || undefined}
    >
      <div className={styles.bubble} data-tail={isGroupEnd || undefined}>
        {message.unsupportedType ? (
          <span className={styles.unsupported}>Сообщение этого типа не поддерживается</span>
        ) : (
          <span className={styles.text}>{message.text}</span>
        )}
        <span className={styles.spacer} data-outgoing={outgoing || undefined} aria-hidden="true" />
        <span className={styles.meta}>
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
          {outgoing && message.status && (
            <MessageStatusIcon status={message.status} className={styles.status} />
          )}
        </span>
        {isGroupEnd && (
          <svg className={styles.tail} width="9" height="18" viewBox="0 0 9 18" aria-hidden="true">
            <path d="M0 0c.5 7 3 12.5 8.2 16.2a1 1 0 0 1-.6 1.8H0Z" />
          </svg>
        )}
      </div>

      {failed && (
        <p className={styles.failure} role="alert">
          {message.error ?? 'Не удалось отправить'}
          {' · '}
          <button type="button" className={styles.retry} onClick={() => onRetry(message)}>
            Повторить
          </button>
        </p>
      )}
    </div>
  )
}
