'use client'

import { useEffect } from 'react'

/** Abre el formulario de creación si la URL trae `?nuevo` (accesos rápidos del resumen). */
export function useOpenFromQuery(open: () => void) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('nuevo')) {
      open()
      url.searchParams.delete('nuevo')
      window.history.replaceState(null, '', url.pathname + url.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
