import { useEffect, useState } from 'react'
import api from '../utils/axios.js'

export default function useUnreadCount(intervalMs = 30000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function fetchCount() {
      try {
        const { data } = await api.get('/notifications')
        if (active) setCount(data.filter((n) => !n.isRead).length)
      } catch {
        // bottom bar badge just stays at its last known count
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, intervalMs)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [intervalMs])

  return count
}
