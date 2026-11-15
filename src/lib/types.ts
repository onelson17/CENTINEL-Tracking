export type Agent = { id: string; prenom: string; nom: string }

/** Un relevé : les chiffres d'un agent sur une période (un jour ou plusieurs). Durées en secondes. */
export type Releve = {
  agentId: string
  du: string // yyyy-MM-dd
  au: string // yyyy-MM-dd
  mails: number
  entrants: number
  sortants: number
  manques: number
  dureeMoy: number
  attenteMoy: number
}

export type Periode = { du: string; au: string }

export type Totaux = {
  mails: number
  entrants: number
  sortants: number
  manques: number
  decroches: number
  tauxDecroche: number // 0..1
  dureeMoy: number
  attenteMoy: number
}
