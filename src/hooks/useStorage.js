import { useState, useEffect, useMemo, useCallback } from 'react'

const localStorage = typeof window !== 'undefined' ? window.localStorage : null
const sessionStorage =
  typeof window !== 'undefined' ? window.sessionStorage : null

let evtTarget

try {
  evtTarget = new EventTarget()
} catch {
  evtTarget =
    typeof document !== 'undefined' ? document.createElement('phony') : null
}

const useStorage = (storage) => (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    const raw = storage?.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  })

  const updater = useCallback(
    (updatedValue, remove = false) => {
      setValue(updatedValue)
      storage &&
        storage[remove ? 'removeItem' : 'setItem'](
          key,
          JSON.stringify(updatedValue)
        )
      evtTarget?.dispatchEvent(
        new CustomEvent('storage_change', { detail: { key } })
      )
    },
    [storage, evtTarget, key]
  )

  const exportSetValue = useCallback((updatedValue) => updater(updatedValue), [
    updater,
  ])

  const removeItem = useCallback(() => updater(null, true), [updater])

  useEffect(() => {
    const raw = storage?.getItem(key)
    defaultValue != null && !raw && updater(defaultValue)

    const listener = ({ detail }) => {
      if (detail.key === key) {
        const lraw = storage?.getItem(key)

        lraw !== raw && setValue(JSON.parse(lraw))
      }
    }

    evtTarget?.addEventListener('storage_change', listener)
    return () => evtTarget?.removeEventListener('storage_change', listener)
  }, [])

  return [value, exportSetValue, removeItem]
}

export const useLocalStorage = useStorage(localStorage)
export const useSessionStorage = useStorage(sessionStorage)
