import { useState } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
): [T, (arg0: T) => void] => {
  const isClient = typeof window !== 'undefined'
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }
  return [storedValue, setValue]
}
