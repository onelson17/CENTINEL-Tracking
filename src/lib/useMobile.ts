import { useSyncExternalStore } from 'react'

const requete = '(max-width: 639px)'

/** Vrai sur un écran de téléphone (moins de 640 px de large). */
export function useMobile() {
  return useSyncExternalStore(
    (rappel) => {
      const mq = window.matchMedia(requete)
      mq.addEventListener('change', rappel)
      return () => mq.removeEventListener('change', rappel)
    },
    () => window.matchMedia(requete).matches,
  )
}
