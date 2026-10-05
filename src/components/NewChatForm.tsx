import { useId, useState, type FormEvent } from 'react'
import { describeError } from '../api/errors'
import { useChatSession } from '../store/chatContext'
import styles from './NewChatForm.module.css'
import { PlusIcon } from './icons'

export function NewChatForm() {
  const { messenger, openChat } = useChatSession()
  const [contact, setContact] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contact.trim() || pending) return

    setPending(true)
    setError(null)
    try {
      await openChat(contact)
      setContact('')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Новый чат">
      <div className={styles.row}>
        <input
          className={styles.input}
          type={messenger.id === 'telegram' ? 'text' : 'tel'}
          autoComplete="off"
          placeholder={messenger.contactPlaceholder}
          aria-label={messenger.contactPlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={contact}
          onChange={(e) => {
            setContact(e.target.value)
            setError(null)
          }}
          disabled={pending}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={pending || !contact.trim()}
          title="Создать чат"
        >
          {pending ? <span className={styles.spinner} /> : <PlusIcon size={22} />}
          <span className="visually-hidden">Создать чат</span>
        </button>
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
