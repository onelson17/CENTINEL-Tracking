import { eachDayOfInterval, parseISO } from 'date-fns'
import { iso } from './format'
import type { Periode, Releve, Totaux } from './types'

export function dansPeriode(releves: Releve[], p: Periode, agentId?: string) {
  return releves.filter(
    (r) => r.du >= p.du && r.au <= p.au && (!agentId || r.agentId === agentId),
  )
}

/**
 * Taux de décroché = (entrants − manqués) / entrants.
 * Durée moyenne pondérée par les appels aboutis, attente pondérée par les appels entrants.
 */
export function totaux(releves: Releve[]): Totaux {
  let mails = 0, entrants = 0, sortants = 0, manques = 0, dureePond = 0, poidsDuree = 0, attentePond = 0
  for (const r of releves) {
    mails += r.mails
    entrants += r.entrants
    sortants += r.sortants
    manques += r.manques
    const aboutis = Math.max(r.entrants - r.manques, 0) + r.sortants
    dureePond += r.dureeMoy * aboutis
    poidsDuree += aboutis
    attentePond += r.attenteMoy * r.entrants
  }
  const decroches = Math.max(entrants - manques, 0)
  return {
    mails, entrants, sortants, manques, decroches,
    tauxDecroche: entrants ? decroches / entrants : 0,
    dureeMoy: poidsDuree ? dureePond / poidsDuree : 0,
    attenteMoy: entrants ? attentePond / entrants : 0,
  }
}

export type PointJour = { date: string; mails: number; entrants: number; manques: number }

/** Série chronologique ; un relevé de plusieurs jours est rattaché à son premier jour. */
export function serie(releves: Releve[], p: Periode): PointJour[] {
  const parDate = new Map<string, PointJour>()
  for (const d of eachDayOfInterval({ start: parseISO(p.du), end: parseISO(p.au) })) {
    const date = iso(d)
    parDate.set(date, { date, mails: 0, entrants: 0, manques: 0 })
  }
  for (const r of releves) {
    const pt = parDate.get(r.du)
    if (!pt) continue
    pt.mails += r.mails
    pt.entrants += r.entrants
    pt.manques += r.manques
  }
  return [...parDate.values()]
}
