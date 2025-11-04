// @ts-nocheck
import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  
  React.useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      navigate({ to: '/board' })
    } else {
      navigate({ to: '/login' })
    }
  }, [navigate])
  
  return null
}