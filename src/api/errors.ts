import { GreenApiError } from './greenApi'

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}

export function isAuthError(error: unknown): boolean {
  return error instanceof GreenApiError && (error.status === 401 || error.status === 403)
}

export function describeError(error: unknown): string {
  if (error instanceof UserFacingError) return error.message
  if (!(error instanceof GreenApiError)) return 'Что-то пошло не так. Попробуйте ещё раз'

  switch (error.status) {
    case 0:
      return 'Нет связи с GREEN-API. Проверьте интернет и адрес API'
    case 400:
      return `Некорректный запрос: ${error.message}`
    case 401:
    case 403:
      return 'Неверный idInstance или apiTokenInstance'
    case 404:
      return 'Метод не найден. Проверьте API URL и выбранный мессенджер'
    case 429:
      return 'Слишком много запросов. Подождите немного'
    case 466:
      return 'Превышен лимит тарифа GREEN-API (на бесплатном тарифе — не более 3 чатов в месяц)'
    case 469:
      return 'Мессенджер временно ограничил проверку номеров. Попробуйте позже'
    default:
      return error.status >= 500
        ? 'Сервер GREEN-API временно недоступен'
        : `Ошибка GREEN-API (${error.status}): ${error.message}`
  }
}
