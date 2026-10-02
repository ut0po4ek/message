const MIN_DIGITS = 10
const MAX_DIGITS = 15

/**
 * Приводит введённый номер к международному формату из одних цифр (79991234567).
 * Возвращает null, если строка не похожа на номер телефона.
 */
export function normalizePhone(input: string): string | null {
  if (/[^\d\s()+\-.]/.test(input)) return null

  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`

  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null

  return digits
}

export function formatPhone(digits: string): string {
  const ru = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (ru) return `+7 ${ru[1]} ${ru[2]}-${ru[3]}-${ru[4]}`

  return `+${digits}`
}

/** Человекочитаемое имя для chatId, если мессенджер не прислал имя собеседника */
export function describeChatId(chatId: string): string {
  const phone = /^(\d{10,15})@c\.us$/.exec(chatId)
  if (phone) return formatPhone(phone[1])

  return chatId.replace(/@.*$/, '')
}
