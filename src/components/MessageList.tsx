import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import type { Message } from '../domain/types'
import { formatDayLabel, isSameDay } from '../utils/format'
import { MessageBubble } from './MessageBubble'
import styles from './MessageList.module.css'
import { BackIcon } from './icons'

const GROUP_GAP_MS = 10 * 60 * 1000
const STICK_THRESHOLD_PX = 120

interface MessageListProps {
  messages: Message[]
  onRetry(message: Message): void
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const lastMessageId = useRef<string | undefined>(undefined)
  const [initialIds] = useState(() => new Set(messages.map((m) => m.id)))
  const [showJump, setShowJump] = useState(false)

  useLayoutEffect(() => {
    const element = scrollRef.current
    const last = messages.at(-1)
    if (!element || last?.id === lastMessageId.current) return

    const isFirstRender = lastMessageId.current === undefined
    lastMessageId.current = last?.id
    if (isFirstRender || stickToBottom.current || last?.direction === 'outgoing') {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: isFirstRender ? 'instant' : 'smooth',
      })
    }
  }, [messages])

  function handleScroll() {
    const element = scrollRef.current
    if (!element) return

    const distance = element.scrollHeight - element.scrollTop - element.clientHeight
    stickToBottom.current = distance < STICK_THRESHOLD_PX
    setShowJump(distance > STICK_THRESHOLD_PX * 3)
  }

  return (
    <div className={styles.wrapper}>
      <div
        ref={scrollRef}
        className={styles.scroller}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Сообщения"
      >
        <div className={styles.column}>
          {messages.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Сообщений пока нет</p>
              <p>Напишите первое сообщение — ответ появится здесь автоматически</p>
            </div>
          )}

          {messages.map((message, index) => {
            const prev = messages[index - 1]
            const next = messages[index + 1]
            const newDay = !prev || !isSameDay(prev.timestamp, message.timestamp)

            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className={styles.day}>
                    <span>{formatDayLabel(message.timestamp)}</span>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isGroupStart={newDay || !continues(prev, message)}
                  isGroupEnd={!continues(message, next)}
                  animate={!initialIds.has(message.id)}
                  onRetry={onRetry}
                />
              </Fragment>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        className={styles.jump}
        data-visible={showJump || undefined}
        tabIndex={showJump ? 0 : -1}
        onClick={() =>
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        }
        aria-label="К последним сообщениям"
      >
        <BackIcon style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  )
}

function continues(a: Message | undefined, b: Message | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.direction === b.direction &&
    b.timestamp - a.timestamp < GROUP_GAP_MS &&
    isSameDay(a.timestamp, b.timestamp)
  )
}
