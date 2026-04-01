import { useEffect, useState } from 'react'

function useLocalStorageState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(() => {
    const stored = window.localStorage.getItem(key)

    if (!stored) {
      return fallback
    }

    try {
      return JSON.parse(stored) as T
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState] as const
}

export default useLocalStorageState
