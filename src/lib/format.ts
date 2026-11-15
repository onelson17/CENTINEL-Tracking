import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const nf = new Intl.NumberFormat('fr-FR')

export const entier = (n: number) => nf.format(Math.round(n))
export const pourcent = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')} %`

export function duree(sec: number) {
  const s = Math.round(sec)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`
}

export const dureeCourte = (sec: number) => {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Accepte « 3:42 », « 222 » ou un nombre ; renvoie des secondes, ou null si illisible. */
export function lireDuree(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? Math.round(v) : null
  const t = String(v ?? '').trim()
  if (!t) return null
  const m = t.match(/^(\d+)\s*[:m]\s*(\d{1,2})\s*s?$/i)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

export const iso = (d: Date) => format(d, 'yyyy-MM-dd')
export const jour = (d: string) => format(parseISO(d), 'd MMM yyyy', { locale: fr })
export const jourCourt = (d: string) => format(parseISO(d), 'd MMM', { locale: fr })

export function libellePeriode(du: string, au: string) {
  return du === au ? jour(du) : `${jourCourt(du)} – ${jour(au)}`
}
