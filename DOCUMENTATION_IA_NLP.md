# Documentation Technique — Module IA / NLP
## Plateforme E-FORCE · Gestion du Commerce International

> **Version :** 1.0  
> **Date :** Mai 2026  
> **Auteur :** Équipe technique E-FORCE  
> **Périmètre :** Conversion automatique de règles douanières en langage naturel vers le moteur Drools

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Contexte métier](#2-contexte-métier)
3. [Architecture globale du module IA](#3-architecture-globale-du-module-ia)
4. [Le pipeline NLP — étape par étape](#4-le-pipeline-nlp--étape-par-étape)
5. [Modèles de données](#5-modèles-de-données)
6. [Composants Angular du module](#6-composants-angular-du-module)
7. [Le code DRL généré](#7-le-code-drl-généré)
8. [Score de confiance et gestion des ambiguïtés](#8-score-de-confiance-et-gestion-des-ambiguïtés)
9. [Flux utilisateur complet](#9-flux-utilisateur-complet)
10. [Exemples concrets](#10-exemples-concrets)
11. [Intégration avec le moteur Drools](#11-intégration-avec-le-moteur-drools)
12. [Schéma d'architecture](#12-schéma-darchitecture)
13. [Points d'amélioration futurs](#13-points-damélioration-futurs)

---

## 1. Vue d'ensemble

Le module IA/NLP de la plateforme E-FORCE permet à un agent douanier ou à un gestionnaire de règles métier de **créer une règle métier complexe en écrivant une simple phrase en français**,  sans avoir besoin de coder ou de maîtriser la syntaxe technique Drools.

### Principe fondamental

```
Phrase humaine en français
        ↓
   Moteur NLP (backend)
        ↓
Règle structurée + Code DRL exécutable + Score de confiance
        ↓
   Moteur Drools (exécution)
```

### Exemple en une ligne

| Entrée (utilisateur) | Sortie (IA) |
|---|---|
| *"Si le score de risque est supérieur à 60, déclencher une inspection physique obligatoire"* | Règle DRL avec condition `scoreRisque > 60` et action `INSPECTION_PHYSIQUE` |

---

## 2. Contexte métier

### Domaine d'application

La plateforme E-FORCE gère le **commerce international et les procédures douanières**. Les règles métier contrôlent automatiquement :

- L'**orientation des marchandises** (circuit rouge, orange, vert)
- L'**application des taxes et droits de douane**
- Les **inspections physiques** obligatoires
- Les **certifications** et documents requis
- Les **quotas d'importation/exportation**
- Les **taux préférentiels** (zones UEMOA, accords bilatéraux)

### Problème résolu par l'IA

Avant ce module, créer une règle douanière nécessitait :
1. Connaître la syntaxe Drools Rule Language (DRL)
2. Maîtriser le modèle de données Java du backend
3. Écrire du code technique (conditions `when`, actions `then`)
4. Tester manuellement la règle dans le moteur

**Avec le module NLP**, un expert métier peut décrire la règle en langage courant et l'IA se charge de toute la traduction technique.

---

## 3. Architecture globale du module IA

### Vue en couches

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND ANGULAR                           │
│                                                                 │
│   NlpInputComponent          DrlPreviewComponent               │
│   ┌─────────────────┐        ┌──────────────────┐             │
│   │ 1. Saisie phrase│        │ Affichage DRL     │             │
│   │ 2. Aperçu résultat│      │ avec coloration   │             │
│   │ 3. Edition manuelle│     │ syntaxique        │             │
│   └────────┬────────┘        └──────────────────┘             │
│            │                                                    │
│   NlpRegleService                                              │
│   POST /api/nlp/convertir                                      │
└────────────┼────────────────────────────────────────────────────┘
             │ HTTP JSON
┌────────────▼────────────────────────────────────────────────────┐
│                     BACKEND JAVA (port 8081)                   │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │              MOTEUR NLP                                  │ │
│   │                                                          │ │
│   │  1. Tokenisation (découpage de la phrase en mots)        │ │
│   │  2. Reconnaissance d'entités (champs, valeurs, actions)  │ │
│   │  3. Analyse syntaxique (conditions SI...ALORS)           │ │
│   │  4. Classification de la catégorie douanière             │ │
│   │  5. Génération du code DRL                               │ │
│   │  6. Calcul du score de confiance                         │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│   ┌──────────────────┐    ┌───────────────────────────────────┐│
│   │   Base de données│    │   Moteur Drools                   ││
│   │   (règles, cats) │    │   (exécution des règles DRL)      ││
│   └──────────────────┘    └───────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Point d'entrée API

| Méthode | URL | Description |
|---|---|---|
| `POST` | `http://localhost:8081/api/nlp/convertir` | Convertir une phrase en règle DRL |

---

## 4. Le pipeline NLP — étape par étape

Le **Natural Language Processing (NLP)** est un domaine de l'intelligence artificielle qui permet à un ordinateur de comprendre, analyser et interpréter le langage humain écrit ou parlé.

### Étape 1 — Tokenisation

La phrase est découpée en unités (tokens) : mots, ponctuation, nombres.

```
Phrase : "Si le score de risque est supérieur à 60, déclencher une inspection physique"

Tokens : ["Si", "le", "score", "de", "risque", "est", "supérieur", "à", "60",
          ",", "déclencher", "une", "inspection", "physique"]
```

### Étape 2 — Reconnaissance d'entités nommées (NER)

Le moteur identifie les entités clés dans la phrase :

| Type d'entité | Exemple reconnu | Rôle |
|---|---|---|
| **Champ métier** | `score de risque`, `pays d'origine`, `valeur FOB` | Variable sur laquelle porte la condition |
| **Opérateur** | `supérieur à`, `inférieur à`, `est`, `dépasse` | Opérateur de comparaison |
| **Valeur** | `60`, `50 000 000`, `Sénégal`, `5%` | Valeur de référence |
| **Action** | `déclencher`, `appliquer`, `forcer`, `exiger` | Ce qui se passe si la condition est vraie |
| **Connecteur** | `Si`, `et`, `ou`, `alors` | Structure logique de la règle |

### Étape 3 — Analyse syntaxique (Parsing)

Le moteur construit la structure logique de la règle à partir des entités :

```
Structure SI ... ALORS :
  ┌─ SI ─────────────────────────────────────────────────────┐
  │  Champ     : scoreRisque                                  │
  │  Opérateur : >                                            │
  │  Valeur    : 60                                           │
  └───────────────────────────────────────────────────────────┘
  ┌─ ALORS ──────────────────────────────────────────────────┐
  │  Action    : INSPECTION_PHYSIQUE_OBLIGATOIRE              │
  └───────────────────────────────────────────────────────────┘
```

### Étape 4 — Classification de catégorie

Le moteur identifie la **catégorie douanière** à laquelle appartient la règle :

| Mots-clés détectés | Catégorie assignée |
|---|---|
| *inspection, circuit, risque, contrôle* | `CONTROLE` |
| *taxe, taux, droit, douane, XAF* | `TAXE` |
| *quota, limite, plafond* | `QUOTA` |
| *certificat, conformité, document* | `CERTIFICATION` |
| *vérification, validation* | `VERIFICATION` |
| *douane, dédouanement* | `DOUANE` |

### Étape 5 — Génération du code DRL

Le moteur traduit la structure extraite en **code Drools Rule Language** exécutable par le moteur de règles Java :

```drools
package com.eforce.regles;

import com.eforce.model.Declaration;

rule "INSPECTION_RISQUE_ELEVE"
  salience 100
when
  $d : Declaration(scoreRisque > 60)
then
  $d.setAction("INSPECTION_PHYSIQUE_OBLIGATOIRE");
  update($d);
end
```

### Étape 6 — Calcul du score de confiance

Le moteur calcule un pourcentage indiquant à quel point l'IA est certaine de son interprétation :

```
Confiance = f(clarté des entités détectées, ambiguïtés, correspondance vocabulaire)
```

| Score | Couleur | Signification |
|---|---|---|
| ≥ 85% | Vert | Haute confiance — création directe recommandée |
| 50–84% | Orange | Confiance moyenne — vérifiez les valeurs extraites |
| < 50% | Rouge | Confiance faible — révision manuelle obligatoire |

---

## 5. Modèles de données

### 5.1 Requête envoyée au serveur NLP

```typescript
// Fichier : src/app/models/nlp.model.ts

interface NlpConversionRequest {
  phrase: string;  // La phrase en français saisie par l'utilisateur
}
```

**Exemple JSON envoyé :**
```json
{
  "phrase": "Si le score de risque est supérieur à 60, déclencher une inspection physique obligatoire"
}
```

### 5.2 Réponse reçue du serveur NLP

```typescript
// Fichier : src/app/models/nlp.model.ts

interface NlpConversionResult {
  regle: NlpRegleDto;        // La règle métier structurée extraite
  drl: string;               // Le code DRL complet prêt à exécuter
  confidence: number;        // Score de confiance entre 0 et 1 (ex: 0.92 = 92%)
  ambiguites: string[];      // Liste des points ambigus détectés
  phraseOriginale: string;   // La phrase d'origine (pour traçabilité)
}
```

### 5.3 Structure de la règle générée

```typescript
// Fichier : src/app/models/nlp.model.ts

interface NlpRegleDto {
  code: string;           // Identifiant unique de la règle (ex: "RISK_INSP_001")
  nom: string;            // Nom lisible (ex: "Inspection si risque élevé")
  action: string;         // Action déclenchée (ex: "INSPECTION_PHYSIQUE")
  categorieType: string;  // Catégorie douanière (ex: "CONTROLE", "TAXE")
  conditions: Condition[]; // Liste des conditions SI
}
```

### 5.4 Structure d'une condition

```typescript
// Fichier : src/app/models/condition.model.ts

interface Condition {
  champ: string;      // Nom du champ (ex: "scoreRisque", "paysOrigine")
  operateur: string;  // Opérateur logique : ==, !=, >, <, >=, <=
  valeur: string;     // Valeur de comparaison (ex: "60", "SENEGAL", "50000000")
}
```

### 5.5 Règle métier finale sauvegardée

```typescript
// Fichier : src/app/models/regle.model.ts

interface RegleMetier {
  id?: number;
  code: string;
  nom: string;
  action: string;
  active: boolean;
  version?: number;
  categorie?: Categorie;   // Catégorie douanière en base
  conditions?: Condition[]; // Conditions validées
}
```

---

## 6. Composants Angular du module

### 6.1 NlpInputComponent

**Fichier :** `src/app/components/nlp-input/nlp-input.component.ts`  
**Sélecteur :** `<app-nlp-input>`

Ce composant est **le cœur de l'interface utilisateur IA**. Il orchestre le processus complet en 3 modes :

```
Mode 'input'   →  Mode 'preview'  →  Mode 'edit'
  (Saisie)         (Aperçu IA)       (Correction)
      ↑                                   ↓
      └───────────── Recommencer ─────────┘
```

#### Propriétés principales

| Propriété | Type | Rôle |
|---|---|---|
| `phrase` | `string` | Phrase saisie par l'utilisateur |
| `result` | `NlpConversionResult` | Résultat retourné par l'IA |
| `mode` | `'input' \| 'preview' \| 'edit'` | Mode d'affichage actuel |
| `loading` | `boolean` | Indique que l'IA traite la phrase |
| `saving` | `boolean` | Indique que la règle est en cours de sauvegarde |
| `confidence` | `number` | Score de confiance (0 à 1) |
| `editConditions` | `Condition[]` | Conditions modifiables par l'utilisateur |
| `categories` | `Categorie[]` | Catégories douanières disponibles en base |
| `exemplesPhrases` | `string[]` | Phrases d'exemple préchargées |

#### Méthodes clés

| Méthode | Description |
|---|---|
| `convertir()` | Envoie la phrase au service NLP et passe en mode `preview` |
| `valider()` | Sauvegarde la règle telle que générée par l'IA |
| `sauvegarderEdition()` | Sauvegarde la règle après modifications manuelles |
| `passEnEdition()` | Bascule vers le mode `edit` pour corriger l'IA |
| `ajouterCondition()` | Ajoute manuellement une condition |
| `supprimerCondition(i)` | Supprime une condition |
| `pourcentageConfiance()` | Convertit le score 0-1 en pourcentage lisible |
| `labelConfiance()` | Retourne le libellé selon le score |
| `appliquerExemple(phrase)` | Charge une phrase d'exemple dans le champ de saisie |

#### Événements émis

```typescript
@Output() regleCreee = new EventEmitter<RegleMetier>();
// Émis quand la règle est créée avec succès — permet au composant parent
// de rafraîchir la liste des règles
```

### 6.2 NlpRegleService

**Fichier :** `src/app/core/services/nlp-regle.service.ts`

Service Angular qui communique avec l'API NLP du backend.

```typescript
@Injectable({ providedIn: 'root' })
export class NlpRegleService {

  private base = 'http://localhost:8081/api/nlp';

  // Envoie la phrase → reçoit la règle + DRL + confiance
  convertir(phrase: string): Observable<NlpConversionResult> {
    const request: NlpConversionRequest = { phrase };
    return this.http.post<NlpConversionResult>(`${this.base}/convertir`, request);
  }
}
```

### 6.3 DrlPreviewComponent

**Fichier :** `src/app/components/drl-preview/drl-preview.component.ts`  
**Sélecteur :** `<app-drl-preview>`

Composant de visualisation du code DRL avec **coloration syntaxique** :

| Type de ligne | Couleur | Exemple |
|---|---|---|
| `import` | Bleu clair | `package com.eforce.regles;` |
| `rule` | Orange | `rule "INSPECTION_RISQUE_ELEVE"` |
| `keyword` | Violet | `when`, `then`, `end`, `salience` |
| `variable` | Vert | `$d : Declaration(...)` |
| `comment` | Gris | `// Règle générée par IA` |
| `type` | Cyan | `double`, `String`, `int` |

**Fonctionnalité copier-coller :** bouton "Copier" qui place le code DRL dans le presse-papier du système.

---

## 7. Le code DRL généré

### 7.1 Qu'est-ce que le DRL ?

Le **Drools Rule Language (DRL)** est un langage déclaratif utilisé par le moteur de règles **Red Hat Drools** (Java). C'est le format standard pour exprimer des règles métier exécutables dans les systèmes d'entreprise.

### 7.2 Structure d'un fichier DRL

```drools
package com.eforce.regles;             ← Espace de noms Java

import com.eforce.model.Declaration;   ← Classes métier utilisées

rule "NOM_UNIQUE_DE_LA_REGLE"         ← Identifiant de la règle
  salience 100                         ← Priorité (plus élevé = exécuté en premier)
when                                   ← SECTION CONDITIONS
  $d : Declaration(                    ← Variable $d liée à l'objet Declaration
    scoreRisque > 60                   ← Condition extraite par le NLP
  )
then                                   ← SECTION ACTIONS
  $d.setAction("INSPECTION_PHYSIQUE"); ← Action définie par le NLP
  update($d);                          ← Notifie le moteur de la modification
end                                    ← Fin de la règle
```

### 7.3 Champs métier reconnus par le NLP

| Terme naturel utilisé | Champ DRL généré |
|---|---|
| score de risque | `scoreRisque` |
| pays d'origine | `paysOrigine` |
| valeur FOB | `valeurFOB` |
| marchandise dangereuse | `marchandiseDangereuse` |
| paiement confirmé | `paiementConfirme` |
| marchandise conforme | `marchandiseConforme` |

### 7.4 Opérateurs reconnus

| Expression naturelle | Opérateur DRL |
|---|---|
| *est supérieur à*, *dépasse*, *excède* | `>` |
| *est inférieur à*, *en dessous de* | `<` |
| *est égal à*, *est*, *vaut* | `==` |
| *est différent de*, *n'est pas* | `!=` |
| *est au moins*, *supérieur ou égal* | `>=` |
| *est au plus*, *inférieur ou égal* | `<=` |

---

## 8. Score de confiance et gestion des ambiguïtés

### 8.1 Calcul du score de confiance

Le score de confiance (entre 0 et 1) mesure la certitude du modèle sur l'interprétation de la phrase. Il est calculé par le backend en fonction de :

- **Clarté des entités** : les champs, valeurs et opérateurs ont-ils été reconnus sans ambiguïté ?
- **Correspondance au vocabulaire** : les termes utilisés font-ils partie du dictionnaire métier douanier ?
- **Complexité syntaxique** : la phrase contient-elle plusieurs conditions (ET / OU) ?
- **Unicité de l'interprétation** : y a-t-il une seule lecture possible ou plusieurs ?

```typescript
// Affichage côté Angular
pourcentageConfiance(): number {
  return Math.round((this.result?.confidence ?? 0) * 100);
}

couleurConfiance(): string {
  const p = this.pourcentageConfiance();
  if (p >= 85) return '#16a34a';  // Vert
  if (p >= 50) return '#d97706';  // Orange
  return '#dc2626';                // Rouge
}
```

### 8.2 Gestion des ambiguïtés

Le moteur retourne une liste `ambiguites[]` contenant les points qu'il n'a pas pu résoudre seul.

**Exemples d'ambiguïtés typiques :**

| Ambiguïté détectée | Cause probable |
|---|---|
| *"L'unité de la valeur n'est pas précisée"* | `"valeur FOB dépasse 50 000"` — XAF ? EUR ? USD ? |
| *"Le champ 'marchandise dangereuse' est booléen ou catégoriel ?"* | Expression ambiguë |
| *"Plusieurs actions possibles identifiées"* | Phrase trop longue avec plusieurs verbes d'action |
| *"La catégorie ne correspond à aucune entrée connue"* | Vocabulaire hors dictionnaire |

**Comportement de l'interface :**
- Si des ambiguïtés sont présentes → un encart orange s'affiche avec la liste
- L'utilisateur est invité à passer en mode **Édition** pour corriger manuellement

### 8.3 Recommandations selon le score

| Score | Recommandation affichée | Action conseillée |
|---|---|---|
| ≥ 85% | "Haute confiance — création directe recommandée" | Cliquer **Valider et créer** directement |
| 50–84% | "Confiance moyenne — vérifiez les valeurs" | Vérifier les conditions dans l'aperçu |
| < 50% | "Confiance faible — révision manuelle obligatoire" | Aller en mode **Modifier** |

---

## 9. Flux utilisateur complet

### Étape 1 — Accès au module

L'utilisateur clique sur le bouton **"Créer avec l'IA"** (visible dans le module Règles Métier).

```
[🤖 Créer avec l'IA]  ←  Bouton déclenché par NlpInputComponent.ouvrir()
```

### Étape 2 — Saisie de la phrase (Mode INPUT)

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Créer une règle en langage naturel                      │
│  ①Saisie → ②Aperçu → ③Édition                            │
├─────────────────────────────────────────────────────────────┤
│  Votre phrase métier *                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Si le score de risque est supérieur à 60,           │   │
│  │ déclencher une inspection physique obligatoire      │   │
│  └─────────────────────────────────────────────────────┘   │
│  85 caractère(s)   Plus la phrase est précise, meilleure   │
│                    est la conversion.                        │
│                                                              │
│  📋 Exemples de phrases douanières :                       │
│  [Si le score de risque est supérieur à 60...]             │
│  [Si le pays d'origine est le Sénégal...]                  │
│  [Si la marchandise est dangereuse...]                      │
│                                                              │
│          [Annuler]   [🤖 Convertir avec l'IA]             │
└─────────────────────────────────────────────────────────────┘
```

### Étape 3 — Traitement IA (Overlay de chargement)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│           ⏳  L'IA analyse votre phrase...                  │
│    Extraction des entités · Normalisation · Génération DRL  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

L'appel HTTP est envoyé :
```
POST http://localhost:8081/api/nlp/convertir
Body: { "phrase": "Si le score de risque est supérieur à 60, déclencher une inspection physique obligatoire" }
```

### Étape 4 — Aperçu du résultat (Mode PREVIEW)

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Règle générée par l'IA                                  │
│  ✓Saisie → ②Aperçu → ③Édition                            │
├─────────────────────────────────────────────────────────────┤
│  💬 « Si le score de risque est supérieur à 60... »        │
│                                                              │
│  Confiance de l'IA                                 92%      │
│  ████████████████████████████████████░░░░  (vert)          │
│  Haute confiance — création directe recommandée             │
│                                                              │
│  ┌── Règle générée ────────────────────────────────────┐   │
│  │  Code    : RISK_INSP_001                             │   │
│  │  Nom     : Inspection si risque élevé               │   │
│  │  Action  : INSPECTION_PHYSIQUE_OBLIGATOIRE           │   │
│  │  Catégorie : ✅ Contrôle douanier                   │   │
│  │                                                      │   │
│  │  Conditions (1)                                      │   │
│  │  1  SI  scoreRisque  est supérieur à  60             │   │
│  │     ALORS → INSPECTION_PHYSIQUE_OBLIGATOIRE          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ▼ Afficher l'aperçu DRL (Drools Rule Language)            │
│                                                              │
│  [↩ Recommencer]  [✎ Modifier]  [✓ Valider et créer]     │
└─────────────────────────────────────────────────────────────┘
```

### Étape 5a — Validation directe (Score ≥ 85%)

L'utilisateur clique **"Valider et créer"** → la règle est sauvegardée en base via `RegleMetierService.create()`.

```
POST http://localhost:8081/api/regles
Body: {
  "code": "RISK_INSP_001",
  "nom": "Inspection si risque élevé",
  "action": "INSPECTION_PHYSIQUE_OBLIGATOIRE",
  "active": true,
  "version": 1,
  "categorie": { "id": 3 },
  "conditions": [{ "champ": "scoreRisque", "operateur": ">", "valeur": "60" }],
  "motifModification": "Générée par IA — phrase : Si le score de risque..."
}
```

### Étape 5b — Edition manuelle (Mode EDIT)

Si l'utilisateur clique **"Modifier"**, il accède au formulaire pré-rempli :

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Modifier avant création                                  │
│  ✓Saisie → ✓Aperçu → ③Édition                            │
├─────────────────────────────────────────────────────────────┤
│  💬 Phrase source : « Si le score de risque... »           │
│  ✎ Modifiez les champs pré-remplis par l'IA                │
│                                                              │
│  Code *      [RISK_INSP_001          ]                     │
│  Action *    [INSPECTION_PHYSIQUE    ]                     │
│  Nom *       [Inspection si risque élevé                  ]│
│  Catégorie * [Contrôle douanier ▼   ]                     │
│  Statut      [ ☑ Activer immédiatement]                   │
│                                                              │
│  Conditions                    [+ Ajouter une condition]   │
│  1  [scoreRisque  ] [> ▼] [60     ] [✕]                  │
│                                                              │
│        [← Aperçu]              [+ Créer la règle]         │
└─────────────────────────────────────────────────────────────┘
```

### Étape 6 — Confirmation de création

```
✅ Règle créée avec succès — RISK_INSP_001
```

La modal se ferme automatiquement après 1,8 secondes et la liste des règles se rafraîchit.

---

## 10. Exemples concrets

### Exemple 1 — Règle de taxation préférentielle

**Phrase saisie :**
> *"Si le pays d'origine est le Sénégal, appliquer un taux préférentiel UEMOA de 5%"*

**Résultat NLP :**
```json
{
  "regle": {
    "code": "UEMOA_SENEGAL_PREF",
    "nom": "Taux préférentiel UEMOA — Sénégal",
    "action": "TAUX_PREFERENTIEL_5",
    "categorieType": "TAXE",
    "conditions": [
      { "champ": "paysOrigine", "operateur": "==", "valeur": "SENEGAL" }
    ]
  },
  "confidence": 0.88,
  "ambiguites": [],
  "drl": "rule \"UEMOA_SENEGAL_PREF\"\nwhen\n  $d : Declaration(paysOrigine == \"SENEGAL\")\nthen\n  $d.setAction(\"TAUX_PREFERENTIEL_5\");\n  update($d);\nend"
}
```

---

### Exemple 2 — Règle d'inspection pour marchandise dangereuse

**Phrase saisie :**
> *"Si la marchandise est dangereuse, forcer automatiquement le circuit rouge"*

**Résultat NLP :**
```json
{
  "regle": {
    "code": "DANGER_CIRCUIT_ROUGE",
    "nom": "Circuit rouge automatique — marchandise dangereuse",
    "action": "CIRCUIT_ROUGE",
    "categorieType": "CONTROLE",
    "conditions": [
      { "champ": "marchandiseDangereuse", "operateur": "==", "valeur": "true" }
    ]
  },
  "confidence": 0.91,
  "ambiguites": []
}
```

---

### Exemple 3 — Règle avec ambiguïté (confiance faible)

**Phrase saisie :**
> *"Si la valeur FOB dépasse 50 000 000 XAF, exiger une validation hiérarchique"*

**Résultat NLP :**
```json
{
  "regle": {
    "code": "VAL_HIER_FOB_ELEVE",
    "nom": "Validation hiérarchique — valeur FOB élevée",
    "action": "VALIDATION_HIERARCHIQUE",
    "categorieType": "VERIFICATION",
    "conditions": [
      { "champ": "valeurFOB", "operateur": ">", "valeur": "50000000" }
    ]
  },
  "confidence": 0.76,
  "ambiguites": [
    "La devise XAF est supposée mais non confirmée dans le champ valeurFOB",
    "Le type de validation hiérarchique n'est pas précisé (N+1, N+2 ?)"
  ]
}
```

→ L'interface affiche l'encart orange d'ambiguïtés et invite à passer en mode édition.

---

## 11. Intégration avec le moteur Drools

### Rôle du moteur Drools

**Drools** est un moteur de règles métier Java (développé par Red Hat / JBoss). Une fois la règle créée et son code DRL sauvegardé en base, le backend l'injecte dans le moteur Drools qui l'applique à chaque déclaration douanière traitée.

### Cycle de vie d'une règle IA → Drools

```
1. Utilisateur saisit une phrase
        ↓
2. NLP génère le code DRL
        ↓
3. Utilisateur valide → POST /api/regles
        ↓
4. Backend sauvegarde la règle en base (PostgreSQL / MySQL)
        ↓
5. Backend charge le DRL dans le KieContainer Drools
        ↓
6. Lors de chaque traitement de déclaration douanière :
   - Drools évalue toutes les règles actives
   - Si une condition est vraie → l'action est exécutée
   - Résultat : orientation automatique de la marchandise
```

### Propriété `motifModification`

Chaque règle créée par l'IA inclut un motif de traçabilité :

```json
"motifModification": "Générée par IA — phrase : Si le score de risque est supérieur à 60..."
```

Cela permet aux auditeurs de savoir qu'une règle a été créée automatiquement et quelle phrase en est à l'origine.

---

## 12. Schéma d'architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        UTILISATEUR (Agent douanier)                      │
│                                                                           │
│        "Si le score de risque est supérieur à 60,                        │
│         déclencher une inspection physique obligatoire"                   │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ Saisie
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND ANGULAR (NlpInputComponent)                  │
│                                                                           │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────────────┐  │
│  │  Mode SAISIE │ → │  Mode APERÇU     │ → │  Mode ÉDITION           │  │
│  │  textarea    │   │  confiance %     │   │  formulaire pré-rempli  │  │
│  │  exemples    │   │  conditions      │   │  conditions éditables   │  │
│  │              │   │  DRL preview     │   │                         │  │
│  └──────────────┘   └──────────────────┘   └─────────────────────────┘  │
│                                                                           │
│  NlpRegleService → POST /api/nlp/convertir                               │
│  RegleMetierService → POST /api/regles                                   │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ HTTP JSON
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKEND JAVA (Spring Boot — port 8081)                │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      NLP ENGINE                                    │  │
│  │                                                                    │  │
│  │  Tokenisation → NER → Parsing → Classification → Génération DRL  │  │
│  │                                                    → Confiance    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                        ↓                    ↓                            │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐   │
│  │  Base de données     │    │  Moteur Drools (KieSession)          │   │
│  │  Règles + DRL        │    │  Application automatique des règles  │   │
│  │  Catégories          │    │  sur les déclarations douanières     │   │
│  └──────────────────────┘    └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Points d'amélioration futurs

### Améliorations du modèle NLP

| Amélioration | Description | Priorité |
|---|---|---|
| **Gestion du ET / OU** | Phrases avec plusieurs conditions liées par "et" ou "ou" | Haute |
| **Synonymes douaniers** | Enrichissement du dictionnaire métier (terminologie UEMOA, CEMAC) | Haute |
| **Phrases négatives** | *"Si la marchandise n'est PAS dangereuse..."* | Moyenne |
| **Règles temporelles** | *"Si la date de dépôt est antérieure au 01/01/2025..."* | Moyenne |
| **Apprentissage continu** | Réentraîner le modèle sur les règles corrigées par les utilisateurs | Haute |

### Améliorations de l'interface

| Amélioration | Description |
|---|---|
| **Historique des conversions** | Conserver les 10 dernières phrases converties par l'utilisateur |
| **Évaluation de la règle** | Tester la règle sur un jeu de données avant de la valider |
| **Mode vocal** | Dicter la phrase au lieu de la taper |
| **Traduction multilingue** | Support de l'anglais et d'autres langues de la CEDEAO |

---

## Glossaire

| Terme | Définition |
|---|---|
| **NLP** | Natural Language Processing — traitement automatique du langage naturel |
| **NER** | Named Entity Recognition — reconnaissance d'entités nommées dans le texte |
| **DRL** | Drools Rule Language — langage de règles exécutable par le moteur Drools |
| **Drools** | Moteur de règles métier Java open source (Red Hat) |
| **KieSession** | Session d'exécution du moteur Drools contenant les règles chargées |
| **Confidence** | Score de 0 à 1 indiquant la certitude du modèle sur son interprétation |
| **Ambiguïté** | Point de la phrase que l'IA ne peut pas résoudre seul (nécessite confirmation) |
| **Token** | Unité minimale extraite d'une phrase (mot, signe de ponctuation, nombre) |
| **Entité** | Élément sémantique identifié dans la phrase (champ, valeur, action, opérateur) |
| **UEMOA** | Union Économique et Monétaire Ouest-Africaine |
| **CEMAC** | Communauté Économique et Monétaire de l'Afrique Centrale |
| **FOB** | Free On Board — valeur de la marchandise hors frais de transport et assurance |
| **Circuit rouge** | Inspection physique complète en douane |
| **Circuit vert** | Dédouanement automatique sans inspection |
| **Salience** | Priorité d'une règle Drools (plus la valeur est haute, plus la règle est prioritaire) |

---

*Document généré le 26 mai 2026 — E-FORCE Platform — Tous droits réservés*
