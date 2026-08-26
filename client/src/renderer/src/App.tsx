import React from 'react'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './components/auth/AuthPage'

function App(): React.JSX.Element {
  const user = useAuthStore((s) => s.user)
  return user ? <AppShell /> : <AuthPage />
}

export default App
