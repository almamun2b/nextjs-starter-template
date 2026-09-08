import { useEffect, useRef, useState } from 'react'

const DEFAULT_SECONDS = 120

/**
 * Counts down from `seconds` on mount, exposing the remaining time and a
 * `restart` to call after a successful resend. Shared by every "resend
 * email/code" control so the cooldown behavior can't drift between them.
 */
function useResendCooldown(seconds: number = DEFAULT_SECONDS) {
  const [cooldown, setCooldown] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const runTimer = () => {
    clearTimer()
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    runTimer()
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restart = () => {
    setCooldown(seconds)
    runTimer()
  }

  return { cooldown, restart }
}

export { useResendCooldown }
