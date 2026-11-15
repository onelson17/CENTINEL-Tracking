import { addDays, subDays } from 'date-fns'
import { iso } from './format'
import type { Agent, Releve } from './types'

// Agents fictifs pour la maquette.
export const AGENTS: Agent[] = [
  { id: 'a1', prenom: 'Camille', nom: 'Lefèvre' },
  { id: 'a2', prenom: 'Yanis', nom: 'Benali' },
  { id: 'a3', prenom: 'Sophie', nom: 'Marchand' },
  { id: 'a4', prenom: 'Thomas', nom: 'Girard' },
  { id: 'a5', prenom: 'Inès', nom: 'Da Silva' },
  { id: 'a6', prenom: 'Julien', nom: 'Roussel' },
  { id: 'a7', prenom: 'Aïcha', nom: 'Diallo' },
  { id: 'a8', prenom: 'Mathieu', nom: 'Perrin' },
  { id: 'a9', prenom: 'Léa', nom: 'Fontaine' },
]

export const nomComplet = (a: Agent) => `${a.prenom} ${a.nom}`
export const initiales = (a: Agent) => `${a.prenom[0]}${a.nom[0]}`

function alea(graine: number) {
  let t = graine
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** 90 jours de relevés quotidiens fictifs, stables d'un chargement à l'autre. */
export function relevesFictifs(aujourdhui = new Date()): Releve[] {
  const rnd = alea(2026)
  const debut = subDays(aujourdhui, 89)
  const out: Releve[] = []
  AGENTS.forEach((agent, i) => {
    const charge = 0.8 + rnd() * 0.45
    const soin = 0.05 + rnd() * 0.09 // part d'appels manqués
    const profilMail = 0.6 + rnd() * 0.9
    for (let j = 0; j < 90; j++) {
      if ((j + i * 2) % 7 >= 5) continue // deux jours de repos décalés par agent
      const date = iso(addDays(debut, j))
      const vague = 1 + 0.25 * Math.sin(j / 6 + i)
      const entrants = Math.round((26 + rnd() * 22) * charge * vague)
      out.push({
        agentId: agent.id,
        du: date,
        au: date,
        mails: Math.round((14 + rnd() * 16) * profilMail),
        entrants,
        sortants: Math.round((8 + rnd() * 12) * charge),
        manques: Math.min(entrants, Math.round(entrants * (soin + rnd() * 0.05))),
        dureeMoy: Math.round(170 + rnd() * 120 + i * 6),
        attenteMoy: Math.round(18 + rnd() * 40 * vague),
      })
    }
  })
  return out
}
