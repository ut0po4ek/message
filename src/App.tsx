import { useCallback, useEffect, useMemo, useState } from 'react'
import { GreenApiClient, type GreenApi } from './api/greenApi'
import { ChatScreen } from './components/ChatScreen'
import { LoginScreen } from './components/LoginScreen'
import type { Credentials, MessengerId, Session } from './domain/types'
import { ChatProvider } from './store/ChatProvider'
import { loadLastLogin, loadSession, saveLastLogin, saveSession } from './store/persistence'

interface AppProps {
  createApi?: (credentials: Credentials) => GreenApi
}

const createGreenApi = (credentials: Credentials) => new GreenApiClient(credentials)

export function App({ createApi = createGreenApi }: AppProps) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [messenger, setMessenger] = useState<MessengerId>(
    () => session?.messenger ?? loadLastLogin()?.messenger ?? 'max',
  )
  const [notice, setNotice] = useState<string>()

  const api = useMemo(() => (session ? createApi(session) : null), [session, createApi])

  useEffect(() => {
    document.documentElement.dataset.messenger = messenger
  }, [messenger])

  const login = useCallback((next: Session) => {
    saveSession(next)
    saveLastLogin(next)
    setNotice(undefined)
    setSession(next)
  }, [])

  const logout = useCallback((reason?: string) => {
    saveSession(null)
    setNotice(reason)
    setSession(null)
  }, [])

  if (!session || !api) {
    return (
      <LoginScreen
        key={notice}
        messenger={messenger}
        onMessengerChange={setMessenger}
        createApi={createApi}
        onLogin={login}
        notice={notice}
      />
    )
  }

  return (
    <ChatProvider session={session} api={api} onLogout={logout}>
      <ChatScreen />
    </ChatProvider>
  )
}
