import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Rapport } from './rapport'

// La police intégrée au PDF ne connaît pas certains caractères typographiques.
const net = (v: string | number) =>
  String(v).replace(/[  ]/g, ' ').replace(/[–—]/g, '-').replace(/’/g, "'").replace(/[«»]/g, '"')

export function exporterPdf(r: Rapport) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFillColor(226, 0, 26)
  doc.rect(40, 40, 6, 34, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(28, 37, 41)
  doc.text(net(r.titre), 56, 56)
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(90, 103, 108)
  doc.text(net(`Centinel-tracking - ${r.periode}`), 56, 72)

  autoTable(doc, {
    startY: 96,
    head: [r.synthese.map(([k]) => net(k))],
    body: [r.synthese.map(([, v]) => net(v))],
    theme: 'plain',
    styles: { fontSize: 9, textColor: [90, 103, 108], cellPadding: { top: 4, bottom: 2, left: 6, right: 6 } },
    bodyStyles: { fontSize: 14, fontStyle: 'bold', textColor: [28, 37, 41] },
  })

  autoTable(doc, {
    startY: 160,
    head: [r.entetes.map(net)],
    body: r.lignes.map((l) => l.map(net)),
    styles: { fontSize: 9, cellPadding: 6, textColor: [28, 37, 41] },
    headStyles: { fillColor: [11, 110, 122], textColor: 255 },
    alternateRowStyles: { fillColor: [243, 245, 245] },
    columnStyles: Object.fromEntries(r.entetes.slice(1).map((_, i) => [i + 1, { halign: 'right' as const }])),
  })
  doc.save(`${r.fichier}.pdf`)
}
