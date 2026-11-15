# Centinel Tracking

Maquette d'un tableau de bord de statistiques pour une permanence d'urgence en assainissement :
mails traités, appels entrants, sortants et manqués, taux de décroché, durées moyennes.

- Vue de l'équipe et vue agent par agent
- Période libre au calendrier
- Saisie manuelle ou import d'un fichier Excel
- Export Excel et PDF

Les données affichées sont fictives. Les relevés saisis sont enregistrés dans le navigateur du poste.

## Lancer en local

```bash
npm install
npm run dev
```

## Publication

Chaque envoi sur la branche `main` publie le site sur GitHub Pages (`.github/workflows/deploy.yml`).

Construit avec React, Vite, Tailwind, shadcn/ui, Nivo et Motion.
