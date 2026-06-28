# Rapport PFE — Plateforme E-FORCE

Squelette LaTeX du rapport de Projet de Fin d'Études.

## Structure

```
rapport-pfe/
├── main.tex                  # Document principal (à compiler)
├── titlepage.tex              # Page de garde (à personnaliser)
├── biblio.bib                 # Bibliographie / netographie
├── frontmatter/
│   ├── dedicaces.tex
│   ├── remerciements.tex
│   └── abreviations.tex
├── chapters/
│   ├── introduction_generale.tex
│   ├── chap1_contexte_general.tex
│   ├── chap2_analyse_specification.tex
│   ├── chap3_conception.tex
│   ├── chap4_realisation.tex
│   └── conclusion_generale.tex
├── annexes/
│   └── annexe_a.tex
└── images/                    # Captures d'écran, diagrammes, logos
```

## Compilation

Sur Overleaf : importer le dossier `rapport-pfe/` comme projet (zip),
`main.tex` est le document racine. Sinon en local (distribution TeX
Live / MiKTeX) :

```bash
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

## À faire

- Remplacer toutes les sections `[À compléter]` par le contenu réel.
- Compléter `titlepage.tex` (logos, encadrants, année universitaire).
- Ajouter les diagrammes (cas d'utilisation, classes, séquence,
  architecture) et captures d'écran dans `images/`.
