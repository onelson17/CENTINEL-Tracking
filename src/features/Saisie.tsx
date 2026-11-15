import { FileDown, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AGENTS, nomComplet } from '@/lib/data'
import { lireFichier, telechargerModele, type ResultatImport } from '@/lib/excel'
import { dureeCourte, libellePeriode, lireDuree } from '@/lib/format'
import { useStore } from '@/lib/store'
import type { Periode, Releve } from '@/lib/types'
import { PeriodePicker } from './PeriodePicker'

const CHAMPS = [
  { cle: 'mails', nom: 'Mails traités' },
  { cle: 'entrants', nom: 'Appels entrants' },
  { cle: 'sortants', nom: 'Appels sortants' },
  { cle: 'manques', nom: 'Appels manqués' },
  { cle: 'dureeMoy', nom: 'Durée moy. (mm:ss)' },
  { cle: 'attenteMoy', nom: 'Attente moy. (mm:ss)' },
] as const
type Cle = (typeof CHAMPS)[number]['cle']
type Ligne = Record<Cle, string>
const estDuree = (c: Cle) => c === 'dureeMoy' || c === 'attenteMoy'
const ligneVide = (): Ligne => ({ mails: '', entrants: '', sortants: '', manques: '', dureeMoy: '', attenteMoy: '' })

export function Saisie({ periode, onPeriode }: { periode: Periode; onPeriode: (p: Periode) => void }) {
  const { releves, enregistrer, reinitialiser } = useStore()
  const [grille, setGrille] = useState<Record<string, Ligne>>({})
  const [erreurs, setErreurs] = useState<string[]>([])
  const [lecture, setLecture] = useState<(ResultatImport & { nom: string }) | null>(null)
  const [survol, setSurvol] = useState(false)
  const fichier = useRef<HTMLInputElement>(null)

  // Pré-remplit la grille avec les relevés déjà enregistrés pour exactement cette période.
  useEffect(() => {
    const suite: Record<string, Ligne> = {}
    for (const a of AGENTS) {
      const r = releves.find((x) => x.agentId === a.id && x.du === periode.du && x.au === periode.au)
      suite[a.id] = r
        ? {
            mails: String(r.mails), entrants: String(r.entrants), sortants: String(r.sortants),
            manques: String(r.manques), dureeMoy: dureeCourte(r.dureeMoy), attenteMoy: dureeCourte(r.attenteMoy),
          }
        : ligneVide()
    }
    setGrille(suite)
    setErreurs([])
  }, [releves, periode])

  const modifier = (id: string, cle: Cle, v: string) =>
    setGrille((g) => ({ ...g, [id]: { ...g[id], [cle]: v } }))

  const valider = () => {
    const pb: string[] = []
    const out: Releve[] = []
    for (const a of AGENTS) {
      const l = grille[a.id]
      if (!l || CHAMPS.every((c) => l[c.cle].trim() === '')) continue
      const v = {} as Record<Cle, number>
      let ok = true
      for (const c of CHAMPS) {
        const brut = l[c.cle].trim()
        const n = brut === '' ? 0 : estDuree(c.cle) ? lireDuree(brut) : /^\d+$/.test(brut) ? Number(brut) : null
        if (n == null) {
          pb.push(`${nomComplet(a)} : « ${c.nom} » doit être ${estDuree(c.cle) ? 'une durée, par exemple 3:45' : 'un nombre entier'}.`)
          ok = false
        } else v[c.cle] = n
      }
      if (ok && v.manques > v.entrants) {
        pb.push(`${nomComplet(a)} : les appels manqués dépassent les appels entrants.`)
        ok = false
      }
      if (ok) out.push({ agentId: a.id, du: periode.du, au: periode.au, ...v })
    }
    setErreurs(pb)
    if (pb.length) return
    if (!out.length) return void setErreurs(['Renseignez au moins un agent avant d’enregistrer.'])
    enregistrer(out)
    toast.success(`${out.length} relevé${out.length > 1 ? 's' : ''} enregistré${out.length > 1 ? 's' : ''} pour ${libellePeriode(periode.du, periode.au)}`)
  }

  const lire = async (f?: File) => {
    if (!f) return
    try {
      setLecture({ ...(await lireFichier(f)), nom: f.name })
    } catch {
      setLecture({ releves: [], erreurs: ['Ce fichier est illisible. Utilisez un fichier .xlsx, .xls ou .csv.'], nom: f.name })
    }
    if (fichier.current) fichier.current.value = ''
  }

  const importer = () => {
    if (!lecture) return
    enregistrer(lecture.releves)
    toast.success(`${lecture.releves.length} relevé${lecture.releves.length > 1 ? 's' : ''} importé${lecture.releves.length > 1 ? 's' : ''}`)
    setLecture(null)
  }

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-6 sm:px-6 lg:gap-5 lg:px-10 lg:py-9">
      <header>
        <h1 className="font-heading text-[2rem] leading-[1.05] font-semibold tracking-tight lg:text-[2.6rem]">Saisir des relevés</h1>
        <p className="mt-2 max-w-[62ch] text-muted-foreground">
          Remplissez la grille pour une journée ou une plage de dates, ou importez un fichier Excel.
          Un relevé déjà enregistré pour le même agent et la même période est remplacé.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12 xl:gap-5">
        <section className="min-w-0 rounded-2xl border bg-card xl:col-span-8">
          <div className="flex flex-col gap-3 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:p-6 lg:pb-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">Saisie manuelle</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Laissez vide la ligne d’un agent absent.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-sm text-muted-foreground">Période du relevé</span>
              <PeriodePicker value={periode} onChange={onPeriode} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/60 text-left text-muted-foreground">
                  <th className="sticky left-0 bg-muted py-2.5 pl-5 font-medium lg:pl-6">Agent</th>
                  {CHAMPS.map((c) => <th key={c.cle} className="px-1.5 py-2.5 font-medium whitespace-nowrap last:pr-6">{c.nom}</th>)}
                </tr>
              </thead>
              <tbody>
                {AGENTS.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <th scope="row" className="sticky left-0 bg-card py-2 pr-2 pl-5 text-left font-medium whitespace-nowrap lg:pl-6">{nomComplet(a)}</th>
                    {CHAMPS.map((c) => (
                      <td key={c.cle} className="px-1.5 py-2 last:pr-6">
                        <Input
                          aria-label={`${c.nom}, ${nomComplet(a)}`}
                          inputMode={estDuree(c.cle) ? 'text' : 'numeric'}
                          placeholder={estDuree(c.cle) ? '0:00' : '0'}
                          className="tnum h-9 min-w-20 text-right"
                          value={grille[a.id]?.[c.cle] ?? ''}
                          onChange={(e) => modifier(a.id, c.cle, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:p-6">
            <ul role="alert" className="space-y-1 text-sm text-destructive">
              {erreurs.map((e) => <li key={e}>{e}</li>)}
            </ul>
            <Button size="lg" className="shrink-0 px-4" onClick={valider}>Enregistrer les relevés</Button>
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border bg-card p-5 lg:p-6 xl:col-span-4">
          <h2 className="font-heading text-lg font-semibold">Importer un fichier Excel</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Une ligne par agent et par période, au format du modèle. Depuis Google Sheets : Fichier, Télécharger,
            Microsoft Excel (.xlsx).
          </p>
          <input ref={fichier} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => lire(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fichier.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setSurvol(true) }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => { e.preventDefault(); setSurvol(false); lire(e.dataTransfer.files[0]) }}
            className={`mt-5 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-9 text-center transition-colors outline-none focus-visible:border-ring ${survol ? 'border-eau bg-eau/5' : 'hover:bg-muted/60'}`}
          >
            <Upload className="size-6 text-eau" />
            <span className="font-medium">Déposez un fichier ici ou cliquez pour le choisir</span>
            <span className="text-sm text-muted-foreground">.xlsx, .xls ou .csv</span>
          </button>
          <Button variant="outline" className="mt-3 w-full" onClick={telechargerModele}>
            <FileDown /> Télécharger le modèle Excel
          </Button>

          {lecture && (
            <div className="mt-5 border-t pt-5 text-sm">
              <p className="font-medium break-all">{lecture.nom}</p>
              <p className="mt-1 text-muted-foreground">
                {lecture.releves.length} relevé{lecture.releves.length > 1 ? 's' : ''} prêt{lecture.releves.length > 1 ? 's' : ''} à importer
                {lecture.erreurs.length > 0 && `, ${lecture.erreurs.length} ligne${lecture.erreurs.length > 1 ? 's' : ''} à corriger`}
              </p>
              {lecture.erreurs.length > 0 && (
                <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-destructive">
                  {lecture.erreurs.map((e) => <li key={e}>{e}</li>)}
                </ul>
              )}
              <div className="mt-4 flex gap-2">
                <Button disabled={!lecture.releves.length} onClick={importer}>
                  Importer {lecture.releves.length || ''} relevé{lecture.releves.length > 1 ? 's' : ''}
                </Button>
                <Button variant="ghost" onClick={() => setLecture(null)}>Annuler</Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="text-sm text-muted-foreground">
        Maquette : les relevés sont enregistrés dans ce navigateur.{' '}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-foreground"
          onClick={() => { reinitialiser(); toast.success('Données de démonstration rétablies') }}
        >
          Rétablir les données de démonstration
        </button>
      </p>
    </div>
  )
}
