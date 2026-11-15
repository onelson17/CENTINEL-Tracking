import { AGENTS, nomComplet } from './data'
import { duree, dureeCourte, entier, libellePeriode, pourcent } from './format'
import { dansPeriode, totaux } from './stats'
import type { Periode, Releve } from './types'

export type Rapport = {
  titre: string
  periode: string
  synthese: [string, string][]
  entetes: string[]
  lignes: (string | number)[][]
  fichier: string
}

const ENTETES_CHIFFRES = [
  'Mails traités', 'Appels entrants', 'Appels sortants', 'Appels manqués',
  'Taux de décroché', 'Durée moy. d’appel', 'Attente moy.',
]

function chiffres(rs: Releve[]): (string | number)[] {
  const t = totaux(rs)
  return [t.mails, t.entrants, t.sortants, t.manques, pourcent(t.tauxDecroche), dureeCourte(t.dureeMoy), dureeCourte(t.attenteMoy)]
}

/** Contenu commun aux exports Excel et PDF : l'équipe (agentId absent) ou un agent. */
export function construireRapport(releves: Releve[], p: Periode, agentId?: string): Rapport {
  const rs = dansPeriode(releves, p, agentId)
  const t = totaux(rs)
  const agent = AGENTS.find((a) => a.id === agentId)
  const synthese: [string, string][] = [
    ['Mails traités', entier(t.mails)],
    ['Appels entrants', entier(t.entrants)],
    ['Appels sortants', entier(t.sortants)],
    ['Appels manqués', entier(t.manques)],
    ['Taux de décroché', pourcent(t.tauxDecroche)],
    ['Durée moyenne d’appel', duree(t.dureeMoy)],
    ['Temps d’attente moyen', duree(t.attenteMoy)],
  ]
  const lignes = agent
    ? [...rs]
        .sort((a, b) => a.du.localeCompare(b.du))
        .map((r) => [libellePeriode(r.du, r.au), ...chiffres([r])])
    : AGENTS.map((a) => [nomComplet(a), ...chiffres(rs.filter((r) => r.agentId === a.id))])
  const sujet = agent ? `${agent.prenom}-${agent.nom}`.toLowerCase().replace(/\s+/g, '-') : 'equipe'
  return {
    titre: agent ? `Statistiques de ${nomComplet(agent)}` : 'Statistiques de l’équipe',
    periode: libellePeriode(p.du, p.au),
    synthese,
    entetes: [agent ? 'Période' : 'Agent', ...ENTETES_CHIFFRES],
    lignes,
    fichier: `stats-${sujet}_${p.du}_${p.au}`,
  }
}
