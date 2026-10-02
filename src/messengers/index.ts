import { UserFacingError } from '../api/errors'
import type { GreenApi } from '../api/greenApi'
import { formatPhone, normalizePhone } from '../domain/phone'
import type { ChatDraft, MessengerId } from '../domain/types'

export interface Messenger {
  id: MessengerId
  name: string
  contactPlaceholder: string
  resolveContact(api: GreenApi, input: string): Promise<ChatDraft>
}

const TELEGRAM_USERNAME = /^@[a-zA-Z][a-zA-Z0-9_]{3,31}$/

const telegram: Messenger = {
  id: 'telegram',
  name: 'Telegram',
  contactPlaceholder: 'Номер телефона или @username',

  async resolveContact(api, input) {
    const value = input.trim()

    if (value.startsWith('@')) {
      if (!TELEGRAM_USERNAME.test(value)) throw new UserFacingError('Некорректный @username')

      const account = await api.checkTelegramAccount({ username: value })
      if (!account.exist || !account.chatId) {
        throw new UserFacingError(`Пользователь ${value} не найден в Telegram`)
      }

      return { id: account.chatId, aliases: [], title: value, subtitle: value }
    }

    const phone = requirePhone(value)
    const account = await api.checkTelegramAccount({ phoneNumber: Number(phone) })
    if (!account.exist || !account.chatId) {
      throw new UserFacingError(
        'Пользователь не найден в Telegram или скрыл номер в настройках приватности. Попробуйте @username',
      )
    }

    return {
      id: account.chatId,
      aliases: [],
      title: formatPhone(phone),
      subtitle: account.username || undefined,
    }
  },
}

const whatsapp: Messenger = {
  id: 'whatsapp',
  name: 'WhatsApp',
  contactPlaceholder: 'Номер телефона',

  async resolveContact(api, input) {
    const phone = requirePhone(input)
    const account = await api.checkWhatsapp(Number(phone))
    if (!account.existsWhatsapp) {
      throw new UserFacingError('Этот номер не зарегистрирован в WhatsApp')
    }

    const chatId = `${phone}@c.us`

    return {
      id: chatId,
      aliases: [account.chatId, account.phoneNumber].filter((id): id is string => Boolean(id)),
      title: formatPhone(phone),
    }
  },
}

export const MESSENGERS: Record<MessengerId, Messenger> = { telegram, whatsapp }

function requirePhone(input: string): string {
  const phone = normalizePhone(input)
  if (!phone) {
    throw new UserFacingError('Введите номер в международном формате, например +7 999 123-45-67')
  }

  return phone
}
