import { useState, useEffect } from "react"

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error("Failed to save sessionStorage:", err)
    }
  }, [key, value])

  return [value, setValue] as const
}
