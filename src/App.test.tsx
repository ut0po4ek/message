import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { GreenApiError, type GreenApi } from './api/greenApi'
import type { Notification } from './api/types'

function createFakeApi() {
  const queue: Notification[] = []
  let wake: (() => void) | undefined
  let receiptId = 0

  const api = {
    getStateInstance: vi.fn().mockResolvedValue({ stateInstance: 'authorized' }),
    checkTelegramAccount: vi.fn().mockResolvedValue({ exist: true, chatId: '10000000' }),
    checkWhatsapp: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue({ idMessage: 'OUT-1' }),
    deleteNotification: vi.fn().mockResolvedValue({ result: true }),
    receiveNotification: vi.fn(async (_timeout: number, signal?: AbortSignal) => {
      if (queue.length === 0) {
        await new Promise<void>((resolve) => {
          wake = resolve
          signal?.addEventListener('abort', () => resolve(), { once: true })
        })
      }

      return queue.shift() ?? null
    }),
  } satisfies GreenApi

  function push(body: Notification['body']) {
    queue.push({ receiptId: ++receiptId, body })
    wake?.()
  }

  return { api, push }
}

describe('App', () => {
  it('walks through the scenario from the assignment', async () => {
    const user = userEvent.setup()
    const { api, push } = createFakeApi()
    render(<App createApi={() => api} />)

    await user.type(screen.getByLabelText('idInstance'), '4100000000')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token123')
    expect(screen.getByLabelText('apiUrl')).toHaveValue('https://4100.api.green-api.com')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await user.type(await screen.findByPlaceholderText(/Номер телефона/), '+7 999 123-45-67')
    await user.click(screen.getByRole('button', { name: 'Создать чат' }))
    expect(api.checkTelegramAccount).toHaveBeenCalledWith({ phoneNumber: 79991234567 })

    const composer = await screen.findByLabelText('Текст сообщения')
    await user.type(composer, 'Здравствуйте!{Enter}')

    expect(api.sendMessage).toHaveBeenCalledWith('10000000', 'Здравствуйте!')
    const log = screen.getByRole('log')
    expect(within(log).getByText('Здравствуйте!')).toBeInTheDocument()
    await waitFor(() => expect(within(log).getByLabelText('Отправлено')).toBeInTheDocument())

    push({
      typeWebhook: 'outgoingMessageStatus',
      chatId: '10000000',
      idMessage: 'OUT-1',
      status: 'read',
    })
    push({
      typeWebhook: 'incomingMessageReceived',
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: 'IN-1',
      senderData: { chatId: '10000000', sender: '10000000', senderName: 'Василиса' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Добрый день!' } },
    })

    expect(await within(log).findByText('Добрый день!')).toBeInTheDocument()
    expect(within(log).getByLabelText('Прочитано')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Василиса' })).toBeInTheDocument()
    await waitFor(() => expect(api.deleteNotification).toHaveBeenCalledTimes(2))
  })

  it('shows a readable error for an unauthorized instance', async () => {
    const user = userEvent.setup()
    const { api } = createFakeApi()
    api.getStateInstance.mockResolvedValue({ stateInstance: 'notAuthorized' })
    render(<App createApi={() => api} />)

    await user.type(screen.getByLabelText('idInstance'), '4100000000')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Инстанс не авторизован')
  })

  it('validates credentials before calling the API', async () => {
    const user = userEvent.setup()
    const { api } = createFakeApi()
    render(<App createApi={() => api} />)

    await user.type(screen.getByLabelText('idInstance'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(screen.getByText('idInstance состоит только из цифр')).toBeInTheDocument()
    expect(screen.getByText('Укажите apiTokenInstance')).toBeInTheDocument()
    expect(api.getStateInstance).not.toHaveBeenCalled()
  })

  it('switches the theme and contact lookup to WhatsApp', async () => {
    const user = userEvent.setup()
    const { api } = createFakeApi()
    api.checkWhatsapp.mockResolvedValue({ existsWhatsapp: true })
    render(<App createApi={() => api} />)

    await user.click(screen.getByLabelText('WhatsApp'))
    expect(document.documentElement.dataset.messenger).toBe('whatsapp')
    expect(screen.getByRole('heading', { name: 'WhatsApp' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('idInstance'), '1103000000')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))
    await user.type(await screen.findByPlaceholderText('Номер телефона'), '79991234567{Enter}')

    expect(api.checkWhatsapp).toHaveBeenCalledWith(79991234567)
    expect(await screen.findByRole('heading', { name: '+7 999 123-45-67' })).toBeInTheDocument()
  })

  describe('with an active session', () => {
    const session = {
      messenger: 'telegram',
      idInstance: '4100000000',
      apiTokenInstance: 'token123',
      apiUrl: 'https://4100.api.green-api.com',
    }

    it('returns to the login screen when keys are revoked', async () => {
      sessionStorage.setItem('green-chat:session', JSON.stringify(session))
      const { api } = createFakeApi()
      api.receiveNotification.mockRejectedValue(new GreenApiError(401, 'Unauthorized'))
      render(<App createApi={() => api} />)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ключи доступа больше не действуют',
      )
      expect(sessionStorage.getItem('green-chat:session')).toBeNull()
    })

    it('reconnects after a network failure', async () => {
      sessionStorage.setItem('green-chat:session', JSON.stringify(session))
      const { api } = createFakeApi()
      api.getStateInstance.mockRejectedValueOnce(new GreenApiError(0, 'offline'))
      render(<App createApi={() => api} />)

      expect(await screen.findByText(/Переподключение/)).toBeInTheDocument()
      expect(await screen.findByText(/В сети/, {}, { timeout: 3000 })).toBeInTheDocument()
    })
  })
})
