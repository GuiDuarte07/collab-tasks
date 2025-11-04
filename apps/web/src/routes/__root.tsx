import { createRootRoute, Outlet } from '@tanstack/react-router'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Toaster as SonnerToaster } from 'sonner'

function WebSocketBinder() {
  // Inicializa listeners de WebSocket (se autenticado)
  useWebSocket()
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