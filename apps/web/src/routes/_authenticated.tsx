// @ts-nocheck
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Layout } from '@/components/layout/Layout.tsx'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
