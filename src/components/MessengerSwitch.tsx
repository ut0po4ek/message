import type { MessengerId } from '../domain/types'
import { MESSENGERS } from '../messengers'
import styles from './MessengerSwitch.module.css'
import { TelegramLogo, WhatsAppLogo } from './icons'

const LOGOS = { telegram: TelegramLogo, whatsapp: WhatsAppLogo }

interface MessengerSwitchProps {
  value: MessengerId
  onChange(value: MessengerId): void
  disabled?: boolean
}

export function MessengerSwitch({ value, onChange, disabled }: MessengerSwitchProps) {
  return (
    <fieldset className={styles.switch} disabled={disabled}>
      <legend className="visually-hidden">Мессенджер</legend>
      {Object.values(MESSENGERS).map(({ id, name }) => {
        const Logo = LOGOS[id]

        return (
          <label key={id} className={styles.option}>
            <input
              type="radio"
              name="messenger"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="visually-hidden"
            />
            <Logo size={20} />
            {name}
          </label>
        )
      })}
    </fieldset>
  )
}
