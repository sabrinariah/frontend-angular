# Documentation du Projet Frontend Angular
> Plateforme de gestion des processus métier, règles et dossiers import/export

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Technologies utilisées](#2-technologies-utilisées)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Authentification & Sécurité](#4-authentification--sécurité)
5. [Routing & Navigation](#5-routing--navigation)
6. [Modèles de données](#6-modèles-de-données)
7. [Services](#7-services)
8. [Composants](#8-composants)
9. [Fonctionnalités clés](#9-fonctionnalités-clés)
10. [Configuration Backend](#10-configuration-backend)
11. [Rôles & Permissions](#11-rôles--permissions)

---

## 1. Vue d'ensemble

Ce projet est une **application Angular 21 standalone** dédiée à la gestion des processus métier dans un contexte de commerce international (import/export). Elle intègre :

- Un moteur de **règles métier** avec génération DRL (Drools Rule Language)
- Un **gestionnaire de processus BPMN** avec visualisation et génération automatique de diagrammes
- Un module de **gestion des dossiers** d'importation et d'exportation
- Un système de **gestion des utilisateurs** basé sur Keycloak
- Un module **NLP** (traitement du langage naturel) pour convertir des phrases en règles métier
- L'**export PDF/Excel** des données

---

## 2. Technologies utilisées

| Technologie | Version | Rôle |
|---|---|---|
| Angular | 21.2 | Framework frontend |
| TypeScript | — | Langage principal |
| Keycloak JS | 26.2.3 | Authentification SSO |
| bpmn-js | 18.16.1 | Visualisation BPMN |
| jsPDF | — | Génération PDF |
| jspdf-autotable | — | Tableaux dans PDF |
| xlsx (SheetJS) | — | Export Excel |
| RxJS | 7.8 | Programmation réactive |

---

## 3. Architecture du projet

```
src/
├── main.ts                          ← Bootstrap + routes + intercepteurs
├── index.html
├── styles.css                       ← Styles globaux
└── app/
    ├── app.ts / app.html / app.css  ← Composant racine
    ├── models/                      ← Interfaces & types TypeScript
    ├── core/
    │   ├── services/                ← Services HTTP et logique métier
    │   ├── guards/                  ← Protection des routes
    │   └── interceptors/            ← Intercepteur token Bearer
    ├── components/                  ← Composants partagés
    │   ├── regle/                   ← Moteur de règles métier
    │   ├── bpmn-viewer/             ← Visionneuse BPMN
    │   ├── nlp-input/               ← Saisie NLP
    │   └── drl-preview/             ← Aperçu DRL
    ├── features/                    ← Modules fonctionnels
    │   ├── dashboard/               ← Tableau de bord
    │   ├── processus/               ← Gestion processus + tâches
    │   │   └── tache-form/          ← Formulaire tâche paramétrable
    │   ├── users/                   ← Gestion utilisateurs
    │   │   ├── create-user/
    │   │   ├── user-detail/
    │   │   └── edit-user/
    │   └── taches/                  ← Liste des tâches
    ├── login/                       ← Page de connexion
    ├── register/                    ← Page d'inscription
    └── pages/
        ├── import/                  ← Module import de dossiers
        ├── export.component.ts      ← Module export de dossiers
        └── import-export.component  ← Vue combinée
```

---

## 4. Authentification & Sécurité

### Keycloak
- **URL Keycloak :** `http://localhost:8080`
- **Realm :** `projet`
- **Client ID :** `app-angular`
- **Mode d'init :** `check-sso` (pas de redirection forcée)

### Flux d'authentification
1. Au démarrage, `keycloak.init()` est appelé dans `main.ts`
2. Le `TokenInterceptor` injecte automatiquement le token Bearer dans chaque requête HTTP
3. Le `AuthGuardService` vérifie le rôle de l'utilisateur avant d'activer chaque route

### Service : `KeycloakService`
Fichier : `src/app/core/services/keycloak.service.ts`

| Méthode | Description |
|---|---|
| `init()` | Initialise la session Keycloak |
| `loginWithCredentials(username, password)` | Connexion directe via OpenID Connect |
| `registerUser(data)` | Inscription → `POST http://localhost:8081/auth/register` |
| `forgotPassword(email)` | Mot de passe oublié → `POST http://localhost:8081/auth/forgot-password` |
| `getToken()` | Retourne le token JWT courant |
| `getUserRoles()` | Décode le token et retourne les rôles realm |
| `isUserInRole(role)` | Vérifie si l'utilisateur a un rôle donné |
| `getAllUsersWithRoles()` | Liste tous les utilisateurs (admin) |
| `updateUser(username, data)` | Mise à jour d'un utilisateur |
| `updateUserRoles(username, roles)` | Modification des rôles |
| `toggleUserStatus(username, enabled)` | Activer/désactiver un compte |
| `deleteUser(username)` | Supprimer un utilisateur |

---

## 5. Routing & Navigation

Toutes les routes sont définies dans `src/main.ts`.

| URL | Composant | Garde | Rôles autorisés |
|---|---|---|---|
| `/` | → redirect `/login` | Non | Public |
| `/login` | `LoginComponent` | Non | Public |
| `/register` | `RegisterComponent` | Non | Public |
| `/dashboard` | `DashboardComponent` | Oui | Tous authentifiés |
| `/regles` | `RegleMetierComponent` | Oui | Gestionnaire règles, Gestionnaire processus, SuperAdmin |
| `/bpmn-viewer/:id` | `BpmnViewerComponent` | Oui | Gestionnaire processus, SuperAdmin |
| `/import` | `ImportComponent` | Oui | Tous les 3 rôles |
| `/export` | `ExportComponent` | Oui | Tous les 3 rôles |
| `/import-export` | `ImportExportComponent` | Oui | Tous les 3 rôles |
| `/users` | `UsersComponent` | Oui | SuperAdmin uniquement |
| `/users/:username` | `UserDetailComponent` | Oui | SuperAdmin uniquement |
| `/create-user` | `CreateUserComponent` | Oui | SuperAdmin uniquement |
| `/users/edit/:username` | `EditUserComponent` | Oui | SuperAdmin uniquement |
| `/processus` | `ProcessusListComponent` | Oui | Gestionnaire processus, SuperAdmin |
| `/processus/new` | `ProcessusFormComponent` | Oui | Gestionnaire processus, SuperAdmin |
| `/processus/:id/edit` | `ProcessusModifierComponent` | Oui | Gestionnaire processus, SuperAdmin |
| `**` | → redirect `/dashboard` | — | — |

---

## 6. Modèles de données

Tous les modèles sont dans `src/app/models/`.

### DossierImport
```typescript
interface DossierImport {
  id?:               string;
  numeroDossier?:    string;
  importateur:       string;   // obligatoire
  paysOrigine:       string;   // obligatoire
  typeProduit:       string;   // obligatoire
  quantite?:         number;
  valeur?:           string;
  codeSH?:           string;
  fournisseur?:      string;
  dateDepot?:        string;   // format YYYY-MM-DD
  statut?:           StatutDossier;
  commentaire?:      string;
  dateModification?: string;
}
type StatutDossier = 'EN_ATTENTE' | 'EN_COURS' | 'VALIDE' | 'REFUSE';
```

### DossierExport
```typescript
interface DossierExport {
  id?:               string;
  numeroDossier?:    string;
  exportateur:       string;   // obligatoire
  paysDestination:   string;   // obligatoire
  typeProduit:       string;   // obligatoire
  quantite?:         number;
  valeurFOB?:        number;
  codeSH?:           string;
  destinationFinale?: string;
  deviseFacture?:    string;   // ex: "USD"
  dateDepot?:        string;
  statut?:           StatutDossier;
  commentaire?:      string;
  dateModification?: string;
}
```

### Processus & Tache
```typescript
interface Processus {
  id?:         number;
  nom:         string;
  description: string;
  statut?:     string;
  actif?:      boolean;
}

interface Tache {
  id?:          number;
  nom:          string;
  description?: string;
  ordre?:       number;
  statut?:      string;
  processusId:  number;
  formData?:    Record<string, any>;
}
```

### RegleMetier
```typescript
interface RegleMetier {
  id?:          number;
  nom:          string;
  description?: string;
  categorie?:   Categorie;
  conditions:   Condition[];
  actif:        boolean;
  version?:     number;
}

interface Condition {
  champ:     string;
  operateur: '==' | '!=' | '>' | '<' | '>=' | '<=';
  valeur:    string;
}
```

### NLP
```typescript
interface NlpConversionRequest  { phrase: string; }
interface NlpConversionResult   {
  regle?:   RegleMetier;
  drl?:     string;
  message?: string;
}
```

---

## 7. Services

### 7.1 ImportService
Fichier : `src/app/core/services/import.service.ts`
Base URL : `http://localhost:8081/api/import`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `creerDossier(dossier)` | POST | `/dossiers` |
| `getDossiers()` | GET | `/dossiers` |
| `getDossier(id)` | GET | `/dossiers/{id}` |

---

### 7.2 ExportService
Fichier : `src/app/core/services/export.service.ts`
Base URL : `http://localhost:8081/api/export`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `creerDossier(dossier)` | POST | `/dossiers` |
| `getDossiers()` | GET | `/dossiers` |
| `getDossier(id)` | GET | `/dossiers/{id}` |

---

### 7.3 RegleMetierService
Fichier : `src/app/core/services/regle.service.ts`
Base URL : `http://localhost:8081/api/regles`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/regles` |
| `getById(id)` | GET | `/api/regles/{id}` |
| `create(regle)` | POST | `/api/regles` |
| `update(id, regle)` | PUT | `/api/regles/{id}` |
| `delete(id)` | DELETE | `/api/regles/{id}` |
| `toggle(id)` | PUT | `/api/regles/{id}/toggle` |
| `getConditionsByRegle(id)` | GET | `/api/regles/{id}/conditions` |
| `getVersionsByRegle(id)` | GET | `/api/regles/{id}/versions` |
| `getAllCategories()` | GET | `/api/categories` |
| `restaurerVersion(versionId)` | POST | `/api/regles/restaurer/{id}` |

---

### 7.4 ProcessusService
Fichier : `src/app/core/services/processus.service.ts`
Base URL : `http://localhost:8081/api/process`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/process` |
| `getById(id)` | GET | `/api/process/{id}` |
| `create(p)` | POST | `/api/process` |
| `update(id, p)` | PUT | `/api/process/{id}` |
| `delete(id)` | DELETE | `/api/process/{id}` |
| `toggle(id)` | PATCH | `/api/process/{id}/toggle` |

---

### 7.5 TacheService
Fichier : `src/app/core/services/tache.service.ts`
Base URL : `http://localhost:8081/api/taches`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/taches` |
| `getByProcessus(processusId)` | GET | `/api/taches/processus/{id}` |
| `getById(id)` | GET | `/api/taches/{id}` |
| `create(tache)` | POST | `/api/taches` |
| `update(id, tache)` | PUT | `/api/taches/{id}` |
| `delete(id)` | DELETE | `/api/taches/{id}` |

---

### 7.6 UserService
Fichier : `src/app/core/services/user.service.ts`
Base URL : `http://localhost:8081/api/users`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `getUsers()` | GET | `/api/users` |
| `getUserByUsername(username)` | GET | `/api/users/{username}` |
| `updateUser(username, user)` | PUT | `/api/users/update/{username}` |
| `deleteUser(username)` | DELETE | `/api/users/{username}` |
| `toggleUserActive(username, enabled)` | PUT | `/api/users/status/{username}?enabled=` |
| `getKeycloakUsers()` | GET | `/api/users/keycloak` |
| `getUserDetails(username)` | GET | `/api/users/details/{username}` |

---

### 7.7 NlpRegleService
Fichier : `src/app/core/services/nlp-regle.service.ts`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `convertir(phrase)` | POST | `http://localhost:8081/api/nlp/convertir` |

---

### 7.8 BpmnGeneratorService
Fichier : `src/app/core/services/bpmn-generator.service.ts`
Service 100% frontend (pas d'appel HTTP).

| Méthode | Description |
|---|---|
| `generateBpmnXml(nom, id, taches)` | Génère le XML BPMN 2.0 complet à partir des tâches |
| `downloadBpmnFile(xml, filename)` | Déclenche le téléchargement du fichier `.bpmn` |

---

### 7.9 VersionService
Fichier : `src/app/core/services/version.service.ts`

| Méthode | HTTP | Endpoint |
|---|---|---|
| `getAllVersions()` | GET | `/api/versions` |
| `getByRegleId(id)` | GET | `/api/versions/regle/{id}` |
| `getLastVersion(id)` | GET | `/api/versions/regle/{id}/last` |

---

### 7.10 ConditionEvaluatorService
Fichier : `src/app/core/services/condition-evaluator.service.ts`
Service 100% frontend.

| Méthode | Description |
|---|---|
| `evaluerRegle(regle, formData)` | Évalue toutes les conditions d'une règle (logique AND) |

Opérateurs supportés : `==`, `!=`, `>`, `<`, `>=`, `<=`

---

## 8. Composants

### 8.1 Authentification

#### LoginComponent
Fichier : `src/app/login/login.ts`
Route : `/login`

Fonctionnalités :
- Connexion avec identifiant/mot de passe via Keycloak
- Lien vers inscription et mot de passe oublié
- Formulaire avec validation

---

#### RegisterComponent
Fichier : `src/app/register/register.ts`
Route : `/register`

| Méthode | Description |
|---|---|
| `register()` | Soumet le formulaire d'inscription |
| `isFormValid()` | Valide prénom, nom, email, mdp ≥ 6 chars, confirmation |
| `getPasswordStrength()` | Retourne `weak`, `medium` ou `strong` |
| `getStrengthPercent()` | Retourne `33%`, `66%` ou `100%` |
| `getStrengthColor()` | Couleur de la barre de force |
| `passwordsMatch()` | Vérifie que les deux mots de passe sont identiques |

Rôles disponibles à l'inscription :
- `Gestionnaire des processus metier`
- `Gestionnaire des règles metier`

---

### 8.2 Tableau de bord

#### DashboardComponent
Fichier : `src/app/features/dashboard/dashboard.component.ts`
Route : `/dashboard`

Page d'accueil après connexion avec KPIs et raccourcis vers les modules.

---

### 8.3 Règles métier

#### RegleMetierComponent
Fichier : `src/app/components/regle/regle.ts`
Route : `/regles`

| Méthode | Description |
|---|---|
| `loadRegles()` | Charge toutes les règles depuis le backend |
| `save()` | Crée ou met à jour une règle |
| `edit(regle)` | Pré-remplit le formulaire pour modification |
| `delete(id)` | Supprime une règle |
| `toggle(id)` | Active/désactive une règle |
| `chargerHistorique(regleId)` | Charge l'historique des versions |
| `restaurerVersion(versionId)` | Restaure une version précédente |
| `genererDrl()` | Génère le code DRL (Drools Rule Language) |

---

#### NlpInputComponent
Fichier : `src/app/components/nlp-input/`

Permet de saisir une phrase en langage naturel et de la convertir automatiquement en règle métier via le service NLP.

---

#### DrlPreviewComponent
Fichier : `src/app/components/drl-preview/`

Affiche le code DRL généré pour une règle métier.

---

### 8.4 Gestion des processus

#### ProcessusListComponent
Fichier : `src/app/features/processus/processus-list.component.ts`
Route : `/processus`

| Méthode | Description |
|---|---|
| `load()` | Charge la liste des processus |
| `loadTaches()` | Charge les tâches d'un processus sélectionné |
| `openTachesPopup()` | Ouvre la fenêtre de gestion des tâches |
| `saveTaskForm()` | Sauvegarde une tâche (création ou modification) |
| `executeDeleteTache()` | Supprime une tâche |
| `buildBpmnDiagram()` | Génère le diagramme BPMN depuis les tâches |
| `exportBpmn()` | Télécharge le fichier `.bpmn` |
| `openBpmnInViewer()` | Ouvre le BPMN dans la visionneuse |
| `tachesSorted()` | Retourne les tâches triées par ordre |
| `countByStatut(statut)` | Compte les tâches par statut |
| `getProgressPercent()` | Calcule le pourcentage de complétion |

---

#### BpmnViewerComponent
Fichier : `src/app/components/bpmn-viewer/bpmn-viewer.ts`
Route : `/bpmn-viewer/:id`

Rendu visuel des diagrammes BPMN 2.0 avec la bibliothèque `bpmn-js`.

---

#### TacheFormComponent
Fichier : `src/app/features/processus/tache-form/tache-form.ts`

Formulaire de création/modification de tâche avec :
- Champs dynamiques (`ChampDynamique`)
- Règles de transition (OUI/NON, sous-processus)
- Catalogue de 19 modèles de tâches BPMN standards

---

### 8.5 Gestion des utilisateurs

#### UsersComponent
Fichier : `src/app/features/users/users.component.ts`
Route : `/users`
Accès : SuperAdmin uniquement

| Méthode | Description |
|---|---|
| `loadUsers()` | Charge la liste des utilisateurs |
| `filterUsers()` | Filtre par nom ou rôle |
| `addUser()` | Navigue vers la création d'utilisateur |
| `editUser(username)` | Navigue vers la modification |
| `deleteUser(username)` | Supprime un utilisateur |
| `toggleUserActive(username, enabled)` | Active/désactive un compte |

---

### 8.6 Import de dossiers

#### ImportComponent
Fichier : `src/app/pages/import/import.ts`
Route : `/import`

| Méthode | Description |
|---|---|
| `soumettreDossier()` | Crée un nouveau dossier d'import |
| `chargerDossiers()` | Charge la liste des dossiers |
| `voirDossier(d)` | Affiche le détail d'un dossier |
| `fermerDetail()` | Ferme la vue détail |
| `exportExcel()` | Exporte la liste filtrée en `.xlsx` |
| `exportPDF()` | Exporte la liste filtrée en `.pdf` |

Filtres disponibles : `TOUS`, `EN_ATTENTE`, `EN_COURS`, `VALIDE`, `REFUSE`

---

### 8.7 Export de dossiers

#### ExportComponent
Fichier : `src/app/pages/export.component.ts`
Route : `/export`

Structure identique à `ImportComponent` avec les champs spécifiques à l'export :
- Exportateur, pays de destination, valeur FOB, devise, destination finale

| Méthode | Description |
|---|---|
| `soumettreDossier()` | Crée un nouveau dossier d'export |
| `chargerDossiers()` | Charge la liste des dossiers |
| `exportExcel()` | Export `.xlsx` de la liste filtrée |
| `exportPDF()` | Export `.pdf` de la liste filtrée |

---

## 9. Fonctionnalités clés

### Export PDF & Excel
- Disponible dans les modules Import et Export
- Respecte le filtre actif (par statut)
- **Excel** : colonnes complètes (tous les champs du dossier)
- **PDF** : format paysage, tableau avec en-tête coloré, date d'export
- Nommage automatique : `dossiers-import-YYYY-MM-DD.xlsx`

### Génération BPMN automatique
- À partir des tâches et de leurs règles, le `BpmnGeneratorService` génère un XML BPMN 2.0 valide
- Gère les passerelles (gateways) OUI/NON selon les règles de transition
- Téléchargeable et visualisable directement dans l'application

### Versioning des règles métier
- Chaque modification d'une règle crée un snapshot versionné
- Possibilité de restaurer n'importe quelle version antérieure

### NLP → Règles métier
- Saisie d'une phrase en français
- Conversion automatique en structure `RegleMetier` via le backend NLP
- Aperçu du code DRL généré

### Contrôle d'accès par rôles
- Routes protégées par `AuthGuardService`
- Vérification du token Keycloak à chaque navigation
- Menus et boutons filtrés selon le rôle de l'utilisateur

---

## 10. Configuration Backend

Toutes les URLs backend sont configurées directement dans les services.

| Service | Base URL |
|---|---|
| Auth / Users | `http://localhost:8081/auth` |
| Règles métier | `http://localhost:8081/api/regles` |
| Catégories | `http://localhost:8081/api/categories` |
| Processus | `http://localhost:8081/api/process` |
| Tâches | `http://localhost:8081/api/taches` |
| Utilisateurs | `http://localhost:8081/api/users` |
| Import | `http://localhost:8081/api/import` |
| Export | `http://localhost:8081/api/export` |
| NLP | `http://localhost:8081/api/nlp` |
| Versions | `http://localhost:8081/api/versions` |
| Keycloak | `http://localhost:8080` |

---

## 11. Rôles & Permissions

| Fonctionnalité | SuperAdmin | Gestionnaire processus | Gestionnaire règles |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Règles métier | ✅ | ✅ | ✅ |
| Processus & Tâches | ✅ | ✅ | ❌ |
| Visionneuse BPMN | ✅ | ✅ | ❌ |
| Import / Export | ✅ | ✅ | ✅ |
| Gestion utilisateurs | ✅ | ❌ | ❌ |
| Créer des utilisateurs | ✅ | ❌ | ❌ |

---

*Document généré le 24/05/2026*
