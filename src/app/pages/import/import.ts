// src/app/components/import/import.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportService } from '../../core/services/import.service';
import {
  DemandeImport,
  TacheImport,
  VariablesImport,
  FormFieldConfig
} from '../../models/import.model';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrls: ['./import.css']
})
export class ImportComponent implements OnInit {

  // ===== Onglet actif =====
  activeTab: 'demarrer' | 'taches' | 'instances' = 'demarrer';

  // ===== Démarrage =====
  demande: DemandeImport = {
    importateur: '',
    paysOrigine: '',
    typeProduit: '',
    nomDossier: '',
    dossierId: '',
    quantite: 0,
    codeSH: '',
    fournisseur: ''
  };
  message = '';
  messageType: 'success' | 'error' | '' = '';

  // ===== Tâches =====
  taches: TacheImport[] = [];
  tacheSelectionnee: TacheImport | null = null;
  formData: { [key: string]: any } = {};
  loading = false;

  // ===== Instances =====
  instances: any[] = [];
  variablesInstance: VariablesImport | null = null;
  instanceSelectionnee: string | null = null;

  // ===== Configuration des formulaires par tâche =====
  formulairesConfig: { [taskName: string]: FormFieldConfig[] } = {

    // ---------- PHASE 1 ----------
    'Saisie dossier import': [
      { id: 'dossierId', label: 'Numéro de dossier', type: 'string', required: true },
      { id: 'importateur', label: 'Importateur', type: 'string', required: true },
      { id: 'paysOrigine', label: "Pays d'origine", type: 'string', required: true },
      { id: 'typeProduit', label: 'Type de produit', type: 'string', required: true },
      { id: 'nomDossier', label: 'Nom du dossier', type: 'string' },
      { id: 'dateDepot', label: 'Date de dépôt', type: 'date' },
      { id: 'importEligible', label: 'Éligible (Drools)', type: 'boolean', defaultValue: true }
    ],

    'Procédures préalables': [
      { id: 'licenceImport', label: 'N° Licence import', type: 'string' },
      { id: 'autoriteCompetente', label: 'Autorité compétente', type: 'string' },
      { id: 'referenceAutorisation', label: 'Référence autorisation', type: 'string' },
      { id: 'observationsPrealables', label: 'Observations', type: 'string' }
    ],

    "Déclaration d'importation DI": [
      { id: 'numeroDI', label: 'N° DI', type: 'string', required: true },
      { id: 'codeSH', label: 'Code SH marchandise', type: 'string' },
      { id: 'quantite', label: 'Quantité', type: 'long' },
      { id: 'valeurCAF', label: 'Valeur CAF', type: 'long' },
      { id: 'deviseFacture', label: 'Devise facture', type: 'string', defaultValue: 'EUR' },
      { id: 'origineMarchandise', label: 'Origine marchandise', type: 'string' }
    ],

    'Domiciliation bancaire / assurance': [
      { id: 'banqueDomiciliataire', label: 'Banque domiciliataire', type: 'string', required: true },
      { id: 'numeroCompte', label: 'Numéro de compte', type: 'string' },
      { id: 'referenceAssurance', label: 'Référence assurance', type: 'string' },
      { id: 'montantAssure', label: 'Montant assuré', type: 'long' },
      { id: 'devise', label: 'Devise', type: 'string', defaultValue: 'EUR' }
    ],

    'Visas techniques / certificats': [
      { id: 'visaTechnique', label: 'Visa technique fourni', type: 'boolean', defaultValue: false },
      { id: 'certificatConformite', label: 'Certificat de conformité', type: 'boolean', defaultValue: false },
      { id: 'certificatOrigine', label: "Certificat d'origine", type: 'boolean', defaultValue: false },
      { id: 'autresDocuments', label: 'Autres documents', type: 'string' },
      { id: 'preClearanceConforme', label: 'Pré-dédouanement conforme', type: 'boolean', defaultValue: true }
    ],

    'Compléter dossier pré-dédouanement': [
      { id: 'champsCorrigesPre', label: 'Champs corrigés', type: 'string' },
      { id: 'commentairePre', label: 'Commentaire', type: 'string', required: true },
      { id: 'preClearanceConforme', label: 'Conforme après correction ?', type: 'boolean', defaultValue: true }
    ],

    // ---------- PHASE 2 ----------
    'Manifeste import': [
      { id: 'numeroManifeste', label: 'N° Manifeste', type: 'string', required: true },
      { id: 'navire', label: 'Nom du navire', type: 'string' },
      { id: 'dateArrivee', label: "Date d'arrivée", type: 'date' },
      { id: 'portArrivee', label: "Port d'arrivée", type: 'string' },
      { id: 'numeroConnaissement', label: 'N° Connaissement', type: 'string' }
    ],

    'Déchargement / entrée entrepôt': [
      { id: 'numeroEntrepot', label: 'N° Entrepôt', type: 'string', required: true },
      { id: 'dateDechargement', label: 'Date déchargement', type: 'date' },
      { id: 'emplacement', label: 'Emplacement', type: 'string' },
      { id: 'numeroConteneur', label: 'N° Conteneur', type: 'string' }
    ],

    'Reconnaissance marchandise': [
      { id: 'agentReconnaissance', label: 'Agent de reconnaissance', type: 'string', required: true },
      { id: 'dateReconnaissance', label: 'Date reconnaissance', type: 'date' },
      { id: 'poidsConstate', label: 'Poids constaté (kg)', type: 'long' },
      { id: 'anomaliesDetectees', label: 'Anomalies détectées', type: 'boolean', defaultValue: false },
      { id: 'observationsRecon', label: 'Observations', type: 'string' },
      { id: 'marchandiseConforme', label: 'Marchandise conforme', type: 'boolean', defaultValue: true }
    ],

    'Traitement anomalie': [
      { id: 'typeAnomalie', label: "Type d'anomalie", type: 'string', required: true },
      { id: 'actionCorrective', label: 'Action corrective', type: 'string' },
      { id: 'rapportAnomalie', label: "Rapport d'anomalie", type: 'string' },
      { id: 'anomalieResolue', label: 'Anomalie résolue', type: 'boolean', defaultValue: true }
    ],

    // ---------- PHASE 3 ----------
    'Soumission déclaration douane DAU': [
      { id: 'numeroDeclaration', label: 'N° Déclaration douane (DAU)', type: 'string', required: true },
      { id: 'bureauDouane', label: 'Bureau de douane', type: 'string', required: true },
      { id: 'dateDepotDouane', label: 'Date dépôt', type: 'date' },
      { id: 'declarant', label: 'Déclarant', type: 'string' },
      {
        id: 'decisionCircuit', label: 'Circuit (Drools)', type: 'enum', defaultValue: 'VERT',
        options: [
          { id: 'VERT', name: 'Circuit VERT' },
          { id: 'ORANGE', name: 'Circuit ORANGE' },
          { id: 'ROUGE', name: 'Circuit ROUGE' }
        ]
      }
    ],

    'Contrôle documentaire': [
      { id: 'agentDouaneDoc', label: 'Agent douanier', type: 'string', required: true },
      { id: 'documentsVerifies', label: 'Documents vérifiés', type: 'string' },
      { id: 'conformiteDoc', label: 'Conforme', type: 'boolean', defaultValue: true },
      { id: 'observationsDoc', label: 'Observations', type: 'string' },
      { id: 'controleConforme', label: 'Contrôle conforme', type: 'boolean', defaultValue: true }
    ],

    'Inspection physique / scanner': [
      { id: 'agentDouanePhys', label: 'Agent douanier', type: 'string', required: true },
      { id: 'dateInspection', label: 'Date inspection', type: 'date' },
      { id: 'resultScanner', label: 'Résultat scanner', type: 'string' },
      { id: 'anomaliesInspection', label: 'Anomalies détectées', type: 'boolean', defaultValue: false },
      { id: 'rapportInspection', label: "Rapport d'inspection", type: 'string' },
      { id: 'controleConforme', label: 'Contrôle conforme', type: 'boolean', defaultValue: true }
    ],

    'Paiement électronique simulé': [
      { id: 'referencePaiement', label: 'Référence paiement', type: 'string', required: true },
      { id: 'numeroQuittance', label: 'Numéro de quittance', type: 'string', required: true },
      { id: 'montantPaiement', label: 'Montant (FCFA)', type: 'long' },
      { id: 'methodePaiement', label: 'Méthode de paiement', type: 'string' },
      { id: 'banquePaiement', label: 'Banque', type: 'string' },
      { id: 'datePaiement', label: 'Date paiement', type: 'date' },
      { id: 'paiementConfirme', label: 'Paiement confirmé', type: 'boolean', defaultValue: true }
    ],

    'Régulariser paiement': [
      { id: 'motifIrregularite', label: 'Motif irrégularité', type: 'string', required: true },
      { id: 'actionCorrectrice', label: 'Action correctrice', type: 'string' },
      { id: 'nouvelleDatePaiement', label: 'Nouvelle date', type: 'date' }
    ],

    // ---------- PHASE 4 ----------
    'Compléter conditions BAE': [
      { id: 'conditionManquante', label: 'Condition manquante', type: 'string' },
      { id: 'mesureCorrectrice', label: 'Mesure correctrice', type: 'string', required: true },
      { id: 'conditionsBaeOK', label: 'Conditions OK après correction ?', type: 'boolean', defaultValue: true }
    ],

    'Émission Bon à Enlever (BAE)': [
      { id: 'numeroBAE', label: 'N° BAE', type: 'string', required: true },
      { id: 'agentDouaneBAE', label: 'Agent douanier', type: 'string' },
      { id: 'dateEmissionBAE', label: 'Date émission', type: 'date' },
      { id: 'observationsBAE', label: 'Observations', type: 'string' }
    ],

    'Bon à Délivrer (BAD)': [
      { id: 'numeroBAD', label: 'N° BAD', type: 'string', required: true },
      { id: 'armateur', label: 'Armateur', type: 'string' },
      { id: 'dateBAD', label: 'Date BAD', type: 'date' },
      { id: 'quaiLivraison', label: 'Quai', type: 'string' }
    ],

    'Constat de sortie': [
      { id: 'numeroConstatSortie', label: 'N° Constat sortie', type: 'string', required: true },
      { id: 'dateSortie', label: 'Date sortie', type: 'date' },
      { id: 'agentControleSortie', label: 'Agent contrôle sortie', type: 'string' },
      { id: 'conformiteSortie', label: 'Conforme', type: 'boolean', defaultValue: true },
      { id: 'observationsSortie', label: 'Observations', type: 'string' }
    ]
  };

  constructor(private importService: ImportService) {}

  ngOnInit(): void {
    this.chargerTaches();
  }

  // ====================================
  // GESTION DES ONGLETS
  // ====================================
  changerOnglet(tab: 'demarrer' | 'taches' | 'instances'): void {
    this.activeTab = tab;
    this.message = '';
    if (tab === 'taches') this.chargerTaches();
    if (tab === 'instances') this.chargerInstances();
  }

  // ====================================
  // PHASE 0 : DÉMARRAGE
  // ====================================
  demarrerProcessus(): void {
    if (!this.demande.importateur || !this.demande.paysOrigine || !this.demande.typeProduit) {
      this.afficherMessage('Veuillez remplir les champs obligatoires', 'error');
      return;
    }

    this.loading = true;
    this.importService.demarrerImport(this.demande).subscribe({
      next: (res) => {
        this.afficherMessage(
          `✅ Processus démarré avec succès ! ID : ${res.processInstanceId || res.id || 'N/A'}`,
          'success'
        );
        this.resetDemande();
        this.loading = false;
        setTimeout(() => this.changerOnglet('taches'), 1500);
      },
      error: (err) => {
        this.afficherMessage(`❌ Erreur : ${err.message || 'Démarrage échoué'}`, 'error');
        this.loading = false;
      }
    });
  }

  resetDemande(): void {
    this.demande = {
      importateur: '',
      paysOrigine: '',
      typeProduit: '',
      nomDossier: '',
      dossierId: '',
      quantite: 0,
      codeSH: '',
      fournisseur: ''
    };
  }

  // ====================================
  // GESTION DES TÂCHES
  // ====================================
  chargerTaches(): void {
    this.loading = true;
    this.importService.getTaches().subscribe({
      next: (taches) => {
        this.taches = taches;
        this.loading = false;
      },
      error: (err) => {
        this.afficherMessage(`Erreur chargement tâches : ${err.message}`, 'error');
        this.loading = false;
      }
    });
  }

  selectionnerTache(tache: TacheImport): void {
    this.tacheSelectionnee = tache;
    this.formData = {};

    // Pré-remplir avec defaultValue
    const config = this.getFormulaireConfig(tache.taskName);
    config.forEach(field => {
      if (field.defaultValue !== undefined) {
        this.formData[field.id] = field.defaultValue;
      } else if (field.type === 'boolean') {
        this.formData[field.id] = false;
      } else {
        this.formData[field.id] = '';
      }
    });
  }

  getFormulaireConfig(taskName: string): FormFieldConfig[] {
    return this.formulairesConfig[taskName] || [];
  }

  completerTache(): void {
    if (!this.tacheSelectionnee) return;

    // Validation des champs requis
    const config = this.getFormulaireConfig(this.tacheSelectionnee.taskName);
    for (const field of config) {
      if (field.required && (this.formData[field.id] === '' || this.formData[field.id] === null || this.formData[field.id] === undefined)) {
        this.afficherMessage(`Le champ "${field.label}" est obligatoire`, 'error');
        return;
      }
    }

    // Conversion des types pour Camunda
    const variables: any = {};
    config.forEach(field => {
      let value = this.formData[field.id];
      if (value === '' || value === null || value === undefined) return;

      let type = 'String';
      if (field.type === 'long') {
        type = 'Long';
        value = Number(value);
      } else if (field.type === 'boolean') {
        type = 'Boolean';
        value = Boolean(value);
      } else if (field.type === 'date') {
        type = 'Date';
      }

      variables[field.id] = { value, type };
    });

    this.loading = true;
    this.importService.completerTache(this.tacheSelectionnee.taskId, { variables }).subscribe({
      next: () => {
        this.afficherMessage(`✅ Tâche "${this.tacheSelectionnee?.taskName}" complétée`, 'success');
        this.tacheSelectionnee = null;
        this.formData = {};
        this.chargerTaches();
        this.loading = false;
      },
      error: (err) => {
        this.afficherMessage(`❌ Erreur : ${err.message || 'Complétion échouée'}`, 'error');
        this.loading = false;
      }
    });
  }

  annulerTache(): void {
    this.tacheSelectionnee = null;
    this.formData = {};
  }

  // ====================================
  // INSTANCES
  // ====================================
  chargerInstances(): void {
    this.loading = true;
    this.importService.getInstances().subscribe({
      next: (instances) => {
        this.instances = instances;
        this.loading = false;
      },
      error: (err) => {
        this.afficherMessage(`Erreur : ${err.message}`, 'error');
        this.loading = false;
      }
    });
  }

  voirVariables(processInstanceId: string): void {
    this.instanceSelectionnee = processInstanceId;
    this.importService.getVariables(processInstanceId).subscribe({
      next: (vars) => this.variablesInstance = vars,
      error: (err) => this.afficherMessage(`Erreur : ${err.message}`, 'error')
    });
  }

  fermerVariables(): void {
    this.variablesInstance = null;
    this.instanceSelectionnee = null;
  }

  // ====================================
  // UTILITAIRES
  // ====================================
  afficherMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  getPhaseFromTaskName(taskName: string): string {
    const phase1 = ['Saisie dossier', 'Procédures préalables', 'Déclaration d\'importation', 'Domiciliation', 'Visas', 'Compléter dossier pré'];
    const phase2 = ['Manifeste', 'Déchargement', 'Reconnaissance', 'Traitement anomalie'];
    const phase3 = ['Soumission déclaration', 'Contrôle documentaire', 'Inspection physique', 'Paiement', 'Régulariser'];
    const phase4 = ['Compléter conditions BAE', 'Émission Bon', 'Bon à Délivrer', 'Constat de sortie'];

    if (phase1.some(k => taskName.includes(k))) return 'Phase 1';
    if (phase2.some(k => taskName.includes(k))) return 'Phase 2';
    if (phase3.some(k => taskName.includes(k))) return 'Phase 3';
    if (phase4.some(k => taskName.includes(k))) return 'Phase 4';
    return '?';
  }

  getPhaseColor(phase: string): string {
    switch (phase) {
      case 'Phase 1': return '#3b82f6';
      case 'Phase 2': return '#10b981';
      case 'Phase 3': return '#f59e0b';
      case 'Phase 4': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getVariableEntries(): { key: string; value: any }[] {
    if (!this.variablesInstance) return [];
    return Object.entries(this.variablesInstance).map(([key, val]) => ({
      key,
      value: val?.value
    }));
  }
  // ====================================
// UTILITAIRES INSTANCES
// ====================================
formatDate(dateValue: any): string {
  if (!dateValue) return '—';
  try {
    const d = new Date(dateValue);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateValue);
  }
}

formatDuree(ms: number): string {
  if (!ms || ms < 0) return '—';
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const heures = Math.floor(min / 60);
  const jours = Math.floor(heures / 24);

  if (jours > 0) return `${jours}j ${heures % 24}h`;
  if (heures > 0) return `${heures}h ${min % 60}min`;
  if (min > 0) return `${min}min ${sec % 60}s`;
  return `${sec}s`;
}

getStatutInstance(inst: any): { label: string; class: string; icon: string } {
  if (inst.ended || inst.endTime) {
    if (inst.state === 'EXTERNALLY_TERMINATED' || inst.state === 'INTERNALLY_TERMINATED') {
      return { label: 'Annulée', class: 'cancelled', icon: '🚫' };
    }
    return { label: 'Terminée', class: 'ended', icon: '✅' };
  }
  return { label: 'En cours', class: 'active', icon: '⏳' };
}

// Filtres pour stats rapides
get instancesEnCours(): number {
  return this.instances.filter(i => !i.ended && !i.endTime).length;
}

get instancesTerminees(): number {
  return this.instances.filter(i => i.ended || i.endTime).length;
}

// Filtre actif (optionnel)
filtreInstance: 'tous' | 'enCours' | 'terminees' = 'tous';

get instancesFiltrees(): any[] {
  if (this.filtreInstance === 'enCours') {
    return this.instances.filter(i => !i.ended && !i.endTime);
  }
  if (this.filtreInstance === 'terminees') {
    return this.instances.filter(i => i.ended || i.endTime);
  }
  return this.instances;
}
}