import { useId, useState, type FormEvent } from 'react'
import { describeError } from '../api/errors'
import { defaultApiUrl, type GreenApi } from '../api/greenApi'
import type { InstanceState } from '../api/types'
import type { Credentials, MessengerId, Session } from '../domain/types'
import { MESSENGERS } from '../messengers'
import { loadSavedInstance } from '../store/persistence'
import styles from './LoginScreen.module.css'
import { MessengerSwitch } from './MessengerSwitch'
import { ThemeToggle } from './ThemeToggle'
import { AlertIcon, EyeIcon } from './icons'
import { MESSENGER_LOGOS } from './messengerLogos'

const STATE_ERRORS: Record<Exclude<InstanceState, 'authorized'>, string> = {
  notAuthorized: 'Инстанс не авторизован. Привяжите аккаунт в личном кабинете GREEN-API',
  starting: 'Инстанс запускается. Повторите попытку через пару минут',
  blocked: 'Аккаунт заблокирован мессенджером',
  suspended: 'Аккаунт временно ограничен мессенджером',
  sleepMode: 'Телефон, привязанный к инстансу, не в сети',
  yellowCard: 'Отправка сообщений временно ограничена мессенджером',
}

interface LoginScreenProps {
  messenger: MessengerId
  onMessengerChange(messenger: MessengerId): void
  createApi(credentials: Credentials): GreenApi
  onLogin(session: Session): void
  notice?: string
}

type FieldErrors = Partial<Record<keyof Credentials, string>>

export function LoginScreen({
  messenger,
  onMessengerChange,
  createApi,
  onLogin,
  notice,
}: LoginScreenProps) {
  const [saved] = useState(() => savedFields(messenger))
  const [idInstance, setIdInstance] = useState(saved.idInstance)
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [customApiUrl, setCustomApiUrl] = useState(saved.customApiUrl)
  const [showToken, setShowToken] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>(notice)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const formId = useId()

  const apiUrl = customApiUrl ?? (idInstance ? defaultApiUrl(idInstance) : '')
  const Logo = MESSENGER_LOGOS[messenger]

  function handleMessengerChange(next: MessengerId) {
    const fields = savedFields(next)
    setIdInstance(fields.idInstance)
    setCustomApiUrl(fields.customApiUrl)
    setApiTokenInstance('')
    setFieldErrors({})
    setError(undefined)
    onMessengerChange(next)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const credentials: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim(),
    }
    const errors = validate(credentials)
    setFieldErrors(errors)
    setError(undefined)
    if (Object.keys(errors).length > 0) return

    setPending(true)
    try {
      const { stateInstance } = await createApi(credentials).getStateInstance()
      if (stateInstance === 'authorized') {
        onLogin({ ...credentials, messenger })
        return
      }
      setError(STATE_ERRORS[stateInstance] ?? `Инстанс в состоянии «${stateInstance}»`)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setPending(false)
    }
  }

  const field = (name: keyof Credentials) => ({
    id: `${formId}-${name}`,
    'aria-invalid': fieldErrors[name] ? true : undefined,
    'aria-describedby': fieldErrors[name] ? `${formId}-${name}-error` : undefined,
  })

  const fieldError = (name: keyof Credentials) =>
    fieldErrors[name] && (
      <p id={`${formId}-${name}-error`} className={styles.fieldError}>
        {fieldErrors[name]}
      </p>
    )

  return (
    <main className={styles.screen}>
      <ThemeToggle className={styles.themeToggle} />
      <div className={styles.card}>
        <Logo size={120} className={styles.logo} />
        <h1 className={styles.title}>{MESSENGERS[messenger].name}</h1>
        <p className={styles.subtitle}>
          Войдите с данными инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <MessengerSwitch value={messenger} onChange={handleMessengerChange} disabled={pending} />

          <div className={styles.field}>
            <input
              {...field('idInstance')}
              className={styles.input}
              inputMode="numeric"
              autoComplete="username"
              placeholder=" "
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              disabled={pending}
            />
            <label htmlFor={`${formId}-idInstance`} className={styles.label}>
              idInstance
            </label>
            {fieldError('idInstance')}
          </div>

          <div className={styles.field}>
            <input
              {...field('apiTokenInstance')}
              className={`${styles.input} ${styles.withButton}`}
              type={showToken ? 'text' : 'password'}
              autoComplete="current-password"
              spellCheck={false}
              placeholder=" "
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              disabled={pending}
            />
            <label htmlFor={`${formId}-apiTokenInstance`} className={styles.label}>
              apiTokenInstance
            </label>
            <button
              type="button"
              className={styles.inputButton}
              onClick={() => setShowToken((v) => !v)}
              aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
              aria-pressed={showToken}
            >
              <EyeIcon size={22} crossed={showToken} />
            </button>
            {fieldError('apiTokenInstance')}
          </div>

          <div className={styles.field}>
            <input
              {...field('apiUrl')}
              className={styles.input}
              type="url"
              inputMode="url"
              spellCheck={false}
              placeholder=" "
              value={apiUrl}
              onChange={(e) => setCustomApiUrl(e.target.value)}
              disabled={pending}
            />
            <label htmlFor={`${formId}-apiUrl`} className={styles.label}>
              apiUrl
            </label>
            {fieldError('apiUrl') ?? (
              <p className={styles.hint}>Подставляется по idInstance, при необходимости измените</p>
            )}
          </div>

          {error && (
            <p className={styles.error} role="alert">
              <AlertIcon size={20} />
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={pending}>
            {pending ? <span className={styles.spinner} aria-label="Проверяем…" /> : 'Войти'}
          </button>
        </form>
      </div>
    </main>
  )
}

/** Данные последнего входа в этот мессенджер; apiUrl считается своим, только если он отличается от адреса по умолчанию */
function savedFields(messenger: MessengerId): { idInstance: string; customApiUrl: string | null } {
  const saved = loadSavedInstance(messenger)
  if (!saved) return { idInstance: '', customApiUrl: null }

  return {
    idInstance: saved.idInstance,
    customApiUrl: saved.apiUrl === defaultApiUrl(saved.idInstance) ? null : saved.apiUrl,
  }
}

function validate({ idInstance, apiTokenInstance, apiUrl }: Credentials): FieldErrors {
  const errors: FieldErrors = {}

  if (!idInstance) errors.idInstance = 'Укажите idInstance'
  else if (!/^\d+$/.test(idInstance)) errors.idInstance = 'idInstance состоит только из цифр'

  if (!apiTokenInstance) errors.apiTokenInstance = 'Укажите apiTokenInstance'
  else if (!/^[\w-]+$/.test(apiTokenInstance)) {
    errors.apiTokenInstance = 'Токен содержит недопустимые символы'
  }

  if (apiUrl ? !isHttpsUrl(apiUrl) : !errors.idInstance) {
    errors.apiUrl = 'Укажите адрес вида https://1101.api.green-api.com'
  }

  return errors
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
