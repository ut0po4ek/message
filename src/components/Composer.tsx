import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import styles from './Composer.module.css'
import { SendIcon } from './icons'

const MAX_LENGTH = 4000
const COUNTER_FROM = 3500

// На сенсорных экранах автофокус сразу открывает клавиатуру и закрывает переписку
const canAutoFocus = () => window.matchMedia?.('(pointer: fine)').matches ?? true

interface ComposerProps {
  onSend(text: string): void
}

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = text.trim().length > 0

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [text])

  function submit() {
    const message = text.trim()
    if (!message) return

    onSend(message)
    setText('')
    textareaRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Сообщение"
          aria-label="Текст сообщения"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={canAutoFocus()}
        />
        {text.length >= COUNTER_FROM && (
          <span className={styles.counter} aria-live="polite">
            {MAX_LENGTH - text.length}
          </span>
        )}
      </div>
      <button
        type="submit"
        className={styles.send}
        disabled={!canSend}
        aria-label="Отправить"
        title="Отправить (Enter)"
      >
        <SendIcon />
      </button>
    </form>
  )
}
