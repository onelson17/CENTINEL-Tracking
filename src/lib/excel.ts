import * as XLSX from 'xlsx'
import { AGENTS, nomComplet } from './data'
import { iso, lireDuree } from './format'
import type { Rapport } from './rapport'
import type { Releve } from './types'

const COLONNES = [
  'Date de début', 'Date de fin', 'Agent', 'Mails traités', 'Appels entrants',
  'Appels sortants', 'Appels manqués', 'Durée moyenne d’appel (mm:ss)', 'Temps d’attente moyen (mm:ss)',
]

const simple = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function telechargerModele() {
  const jourJ = new Date().toLocaleDateString('fr-FR')
  const lignes = AGENTS.map((a) => [jourJ, jourJ, nomComplet(a), '', '', '', '', '', ''])
  const ws = XLSX.utils.aoa_to_sheet([COLONNES, ...lignes])
  ws['!cols'] = COLONNES.map((c) => ({ wch: Math.max(14, c.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Relevés')
  XLSX.writeFile(wb, 'modele-releves-permanence.xlsx')
}

export function exporterExcel(r: Rapport) {
  const wb = XLSX.utils.book_new()
  const synthese = XLSX.utils.aoa_to_sheet([[r.titre], [r.periode], [], ['Indicateur', 'Valeur'], ...r.synthese])
  synthese['!cols'] = [{ wch: 28 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, synthese, 'Synthèse')
  const detail = XLSX.utils.aoa_to_sheet([r.entetes, ...r.lignes])
  detail['!cols'] = r.entetes.map((e, i) => ({ wch: i === 0 ? 24 : Math.max(12, e.length + 2) }))
  XLSX.utils.book_append_sheet(wb, detail, 'Détail')
  XLSX.writeFile(wb, `${r.fichier}.xlsx`)
}

function lireDate(v: unknown): string | null {
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    return d ? iso(new Date(d.y, d.m - 1, d.d)) : null
  }
  const t = String(v ?? '').trim()
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return iso(new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])))
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function lireEntier(v: unknown): number | null {
  if (v === '' || v == null) return 0
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

export type ResultatImport = { releves: Releve[]; erreurs: string[] }

/** Lit un .xlsx, .xls ou .csv (y compris un export Google Sheets) au format du modèle. */
export async function lireFichier(fichier: File): Promise<ResultatImport> {
  const wb = XLSX.read(await fichier.arrayBuffer())
  const ws = wb.Sheets[wb.SheetNames[0]]
  const lignes = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
  const entete = (lignes[0] ?? []).map(simple)
  const col = (...mots: string[]) => entete.findIndex((e) => mots.some((m) => e.includes(m)))
  const c = {
    du: col('debut', 'date'), au: col('fin'), agent: col('agent'), mails: col('mail'),
    entrants: col('entrant'), sortants: col('sortant'), manques: col('manqu'),
    duree: col('duree'), attente: col('attente'),
  }
  const manquantes = Object.entries(c).filter(([k, i]) => i < 0 && k !== 'au').map(([k]) => k)
  if (manquantes.length) {
    return { releves: [], erreurs: [`Colonnes introuvables : ${manquantes.join(', ')}. Repartez du modèle Excel.`] }
  }
  const releves: Releve[] = []
  const erreurs: string[] = []
  lignes.slice(1).forEach((l, i) => {
    const n = i + 2
    if (l.every((v) => String(v).trim() === '')) return
    const agent = AGENTS.find((a) => simple(nomComplet(a)) === simple(l[c.agent]))
    if (!agent) return void erreurs.push(`Ligne ${n} : agent « ${l[c.agent]} » inconnu.`)
    const du = lireDate(l[c.du])
    const au = c.au >= 0 && String(l[c.au]).trim() !== '' ? lireDate(l[c.au]) : du
    if (!du || !au || au < du) return void erreurs.push(`Ligne ${n} : dates illisibles (format attendu : jj/mm/aaaa).`)
    const [mails, entrants, sortants, manques] = [c.mails, c.entrants, c.sortants, c.manques].map((k) => lireEntier(l[k]))
    const dureeMoy = String(l[c.duree]).trim() === '' ? 0 : lireDuree(l[c.duree])
    const attenteMoy = String(l[c.attente]).trim() === '' ? 0 : lireDuree(l[c.attente])
    if ([mails, entrants, sortants, manques, dureeMoy, attenteMoy].some((v) => v == null)) {
      return void erreurs.push(`Ligne ${n} : une valeur n’est pas un nombre.`)
    }
    if (manques! > entrants!) return void erreurs.push(`Ligne ${n} : plus d’appels manqués que d’appels entrants.`)
    releves.push({
      agentId: agent.id, du, au, mails: mails!, entrants: entrants!, sortants: sortants!,
      manques: manques!, dureeMoy: dureeMoy!, attenteMoy: attenteMoy!,
    })
  })
  if (!releves.length && !erreurs.length) erreurs.push('Le fichier ne contient aucune ligne de relevé.')
  return { releves, erreurs }
}
