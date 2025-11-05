import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Toaster as SonnerToaster } from 'sonner'

function WebSocketBinder() {
  const { location } = useRouterState()
  const path = location.pathname
  const isAuthRoute = path === '/login' || path === '/register'

  // Só inicializa listeners fora das rotas de autenticação
  useWebSocket({ enabled: !isAuthRoute })
  return null
}

function RootProviders() {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SonnerToaster richColors position="top-right" />
      <WebSocketBinder />
      <Outlet />
    </QueryClientProvider>
  )
}

export const Route = createRootRoute({
  component: RootProviders,
})