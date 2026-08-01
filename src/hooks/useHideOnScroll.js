import { useEffect, useRef, useState } from 'react'

// Hides once the user scrolls down past `threshold`, reappears on scroll up.
export default function useHideOnScroll(threshold = 10) {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    function handleScroll() {
      const y = window.scrollY
      const diff = y - lastY.current
      if (Math.abs(diff) < threshold) return
      setVisible(diff < 0 || y < threshold)
      lastY.current = y
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return visible
}
