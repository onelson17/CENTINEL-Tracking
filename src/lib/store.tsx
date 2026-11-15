import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { relevesFictifs } from './data'
import type { Releve } from './types'

/**
 * Sauvegarde de la maquette : le navigateur (localStorage).
 * Pour une sauvegarde partagée, remplacer `charger` et `ecrire` par des appels à une base en ligne.
 */
const CLE = 'permanence-releves-v1'

function charger(): Releve[] {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut) return JSON.parse(brut) as Releve[]
  } catch {
    /* stockage indisponible : on repart des données fictives */
  }
  return relevesFictifs()
}

function ecrire(releves: Releve[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify(releves))
  } catch {
    /* ignoré : la maquette reste utilisable sans stockage */
  }
}

const cle = (r: Releve) => `${r.agentId}|${r.du}|${r.au}`

type Store = {
  releves: Releve[]
  /** Ajoute les relevés ; un relevé du même agent sur la même période est remplacé. */
  enregistrer: (nouveaux: Releve[]) => void
  reinitialiser: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [releves, setReleves] = useState<Releve[]>(charger)

  const enregistrer = useCallback((nouveaux: Releve[]) => {
    setReleves((avant) => {
      const map = new Map(avant.map((r) => [cle(r), r]))
      for (const r of nouveaux) map.set(cle(r), r)
      const suite = [...map.values()]
      ecrire(suite)
      return suite
    })
  }, [])

  const reinitialiser = useCallback(() => {
    const suite = relevesFictifs()
    ecrire(suite)
    setReleves(suite)
  }, [])

  const valeur = useMemo(() => ({ releves, enregistrer, reinitialiser }), [releves, enregistrer, reinitialiser])
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider manquant')
  return s
}
