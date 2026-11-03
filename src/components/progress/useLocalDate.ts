import { useEffect, useState } from 'react'
import { localDate } from './localDate'

/** Keep the caller's local calendar date fresh, including an idle overnight tab. */
export function useLocalDate() {
  const [today, setToday] = useState(localDate)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function refresh() {
      clearTimeout(timer)
      setToday(localDate())
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(refresh, Math.max(10, midnight.getTime() - now.getTime() + 10))
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return today
}
