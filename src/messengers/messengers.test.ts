import { describe, expect, it, vi } from 'vitest'
import type { GreenApi } from '../api/greenApi'
import { MESSENGERS } from '.'

function fakeApi(overrides: Partial<GreenApi>): GreenApi {
  return overrides as GreenApi
}

describe('telegram', () => {
  it('resolves phone number to Telegram chatId via checkAccount', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '10000000' })

    const draft = await MESSENGERS.telegram.resolveContact(
      fakeApi({ checkAccount }),
      '+7 999 123-45-67',
    )

    expect(checkAccount).toHaveBeenCalledWith({ phoneNumber: 79991234567 })
    expect(draft).toMatchObject({ id: '10000000', title: '+7 999 123-45-67' })
  })

  it('supports @username', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '777' })

    const draft = await MESSENGERS.telegram.resolveContact(fakeApi({ checkAccount }), '@green_api')

    expect(checkAccount).toHaveBeenCalledWith({ username: '@green_api' })
    expect(draft).toMatchObject({ id: '777', title: '@green_api' })
  })

  it('explains when the account is not found', async () => {
    const api = fakeApi({ checkAccount: vi.fn().mockResolvedValue({ exist: false }) })

    await expect(MESSENGERS.telegram.resolveContact(api, '79991234567')).rejects.toThrow(
      /не найден в Telegram/,
    )
  })

  it('validates input before calling the API', async () => {
    const checkAccount = vi.fn()

    await expect(
      MESSENGERS.telegram.resolveContact(fakeApi({ checkAccount }), '123'),
    ).rejects.toThrow(/международном формате/)
    expect(checkAccount).not.toHaveBeenCalled()
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

describe('max', () => {
  it('resolves phone number to numeric MAX chatId via checkAccount', async () => {
    const checkAccount = vi
      .fn()
      .mockResolvedValue({ exist: true, chatId: '10000000', fromCache: false })

    const draft = await MESSENGERS.max.resolveContact(fakeApi({ checkAccount }), '8 999 123-45-67')

    expect(checkAccount).toHaveBeenCalledWith({ phoneNumber: 79991234567 })
    expect(draft).toEqual({ id: '10000000', aliases: [], title: '+7 999 123-45-67' })
  })

  it('accepts Belarusian numbers', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '20000000' })

    await MESSENGERS.max.resolveContact(fakeApi({ checkAccount }), '+375 29 123-45-67')

    expect(checkAccount).toHaveBeenCalledWith({ phoneNumber: 375291234567 })
  })

  it('rejects numbers outside Russia and Belarus before calling the API', async () => {
    const checkAccount = vi.fn()

    await expect(
      MESSENGERS.max.resolveContact(fakeApi({ checkAccount }), '+49 151 2345 6789'),
    ).rejects.toThrow(/только номера России/)
    expect(checkAccount).not.toHaveBeenCalled()
  })

  it('rejects numbers without MAX account', async () => {
    const api = fakeApi({
      checkAccount: vi.fn().mockResolvedValue({ exist: false, chatId: '', fromCache: false }),
    })

    await expect(MESSENGERS.max.resolveContact(api, '79991234567')).rejects.toThrow(
      /не зарегистрирован в MAX/,
    )
  })
})
