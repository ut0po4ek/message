import { describe, expect, it, vi } from 'vitest'
import type { GreenApi } from '../api/greenApi'
import { MESSENGERS } from '.'

function fakeApi(overrides: Partial<GreenApi>): GreenApi {
  return overrides as GreenApi
}

describe('telegram', () => {
  it('resolves phone number to Telegram chatId via checkAccount', async () => {
    const checkTelegramAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '10000000' })

    const draft = await MESSENGERS.telegram.resolveContact(
      fakeApi({ checkTelegramAccount }),
      '+7 999 123-45-67',
    )

    expect(checkTelegramAccount).toHaveBeenCalledWith({ phoneNumber: 79991234567 })
    expect(draft).toMatchObject({ id: '10000000', title: '+7 999 123-45-67' })
  })

  it('supports @username', async () => {
    const checkTelegramAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '777' })

    const draft = await MESSENGERS.telegram.resolveContact(
      fakeApi({ checkTelegramAccount }),
      '@green_api',
    )

    expect(checkTelegramAccount).toHaveBeenCalledWith({ username: '@green_api' })
    expect(draft).toMatchObject({ id: '777', title: '@green_api' })
  })

  it('explains when the account is not found', async () => {
    const api = fakeApi({ checkTelegramAccount: vi.fn().mockResolvedValue({ exist: false }) })

    await expect(MESSENGERS.telegram.resolveContact(api, '79991234567')).rejects.toThrow(
      /не найден в Telegram/,
    )
  })

  it('validates input before calling the API', async () => {
    const checkTelegramAccount = vi.fn()

    await expect(
      MESSENGERS.telegram.resolveContact(fakeApi({ checkTelegramAccount }), '123'),
    ).rejects.toThrow(/международном формате/)
    expect(checkTelegramAccount).not.toHaveBeenCalled()
  })
})

describe('whatsapp', () => {
  it('uses phone@c.us as chatId and remembers LID alias', async () => {
    const checkWhatsapp = vi.fn().mockResolvedValue({
      existsWhatsapp: true,
      chatId: '123456789012345@lid',
      phoneNumber: '79991234567@c.us',
    })

    const draft = await MESSENGERS.whatsapp.resolveContact(
      fakeApi({ checkWhatsapp }),
      '89991234567',
    )

    expect(checkWhatsapp).toHaveBeenCalledWith(79991234567)
    expect(draft).toEqual({
      id: '79991234567@c.us',
      aliases: ['123456789012345@lid', '79991234567@c.us'],
      title: '+7 999 123-45-67',
    })
  })

  it('rejects numbers without WhatsApp', async () => {
    const api = fakeApi({ checkWhatsapp: vi.fn().mockResolvedValue({ existsWhatsapp: false }) })

    await expect(MESSENGERS.whatsapp.resolveContact(api, '79991234567')).rejects.toThrow(
      /не зарегистрирован в WhatsApp/,
    )
  })
})
