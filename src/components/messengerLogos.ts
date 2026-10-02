import type { ComponentType } from 'react'
import type { MessengerId } from '../domain/types'
import { MaxLogo, TelegramLogo, WhatsAppLogo, type IconProps } from './icons'

export const MESSENGER_LOGOS: Record<MessengerId, ComponentType<IconProps>> = {
  telegram: TelegramLogo,
  whatsapp: WhatsAppLogo,
  max: MaxLogo,
}
