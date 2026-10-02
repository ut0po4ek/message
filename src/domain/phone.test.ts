import { describe, expect, it } from 'vitest'
import { describeChatId, formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['89991234567', '79991234567'],
    ['9991234567', '79991234567'],
    ['+44 20 7946 0958', '442079460958'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['12345', '+7 999 abc 45 67', '1234567890123456', ''])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})

describe('formatPhone', () => {
  it('formats russian numbers', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })

  it('falls back to plain international format', () => {
    expect(formatPhone('442079460958')).toBe('+442079460958')
  })
})

describe('describeChatId', () => {
  it('turns whatsapp chat ids into phones', () => {
    expect(describeChatId('79991234567@c.us')).toBe('+7 999 123-45-67')
  })

  it('strips suffixes from other ids', () => {
    expect(describeChatId('123456789012345@lid')).toBe('123456789012345')
    expect(describeChatId('10000000')).toBe('10000000')
  })
})
