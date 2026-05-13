// src/app/models/bpmn-tasks.model.ts

export interface BpmnFormField {
  id: string;
  label: string;
  type: 'string' | 'date' | 'long' | 'boolean' | 'enum';
  required?: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[]; // pour les enums
}

export interface BpmnTaskTemplate {
  id: string;              // ex: 'Task_Manifeste_Import'
  nom: string;             // ex: 'Manifeste import'
  phase: string;           // ex: 'PHASE 2 – ARRIVÉE'
  type: 'HUMAINE' | 'SYSTEME';
  ordre: number;
  assigneesSuggerees: string[];
  formFields: BpmnFormField[];  // ✅ NOUVEAU
}

export const BPMN_TASK_CATALOG: BpmnTaskTemplate[] = [
  // ============ PHASE 1 : PRÉ-DÉDOUANEMENT ============
  {
    id: 'Task_Saisie_Dossier',
    nom: 'Saisie dossier importation',
    phase: 'PHASE 1 – PRÉ-DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 1,
    assigneesSuggerees: ['OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'numeroDossier', label: 'N° Dossier', type: 'string', required: true },
      { id: 'dateOuverture', label: "Date d'ouverture", type: 'date' },
      { id: 'importateur', label: 'Importateur', type: 'string', required: true },
      { id: 'descriptionMarchandise', label: 'Description marchandise', type: 'string' }
    ]
  },
  {
    id: 'Task_Procedures_Prealables',
    nom: 'Procédures préalables',
    phase: 'PHASE 1 – PRÉ-DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 2,
    assigneesSuggerees: ['OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'numeroProcedure', label: 'N° Procédure', type: 'string', required: true },
      { id: 'typeProcedure', label: 'Type', type: 'string' },
      { id: 'organisme', label: 'Organisme', type: 'string' }
    ]
  },
  {
    id: 'Task_Declaration_Importation_DI',
    nom: "Déclaration d'importation (DI)",
    phase: 'PHASE 1 – PRÉ-DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 3,
    assigneesSuggerees: ['OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'numeroDI', label: 'N° DI', type: 'string', required: true },
      { id: 'dateDI', label: 'Date DI', type: 'date' },
      { id: 'valeurFOB', label: 'Valeur FOB', type: 'long' },
      { id: 'devise', label: 'Devise', type: 'string', defaultValue: 'XOF' }
    ]
  },
  {
    id: 'Task_Domiciliation_Assurance',
    nom: 'Domiciliation bancaire & assurance',
    phase: 'PHASE 1 – PRÉ-DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 4,
    assigneesSuggerees: ['OPERATEUR', 'BANQUE'],
    formFields: [
      { id: 'numeroDomiciliation', label: 'N° Domiciliation', type: 'string', required: true },
      { id: 'banqueDomiciliataire', label: 'Banque', type: 'string' },
      { id: 'numeroAssurance', label: 'N° Police assurance', type: 'string' },
      { id: 'compagnieAssurance', label: "Compagnie d'assurance", type: 'string' }
    ]
  },
  {
    id: 'Task_Visas_Certificats',
    nom: 'Visas & certificats',
    phase: 'PHASE 1 – PRÉ-DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 5,
    assigneesSuggerees: ['OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'typeCertificat', label: 'Type de certificat', type: 'string', required: true },
      { id: 'numeroCertificat', label: 'N° Certificat', type: 'string' },
      { id: 'dateEmission', label: 'Date émission', type: 'date' }
    ]
  },
  {
    id: 'Task_Complement_PreDedouanement',
    nom: 'Complément pré-dédouanement',
    phase: 'PHASE 1 – PRÉ-DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 6,
    assigneesSuggerees: ['OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'documentManquant', label: 'Document manquant', type: 'string', required: true },
      { id: 'actionCorrective', label: 'Action corrective', type: 'string' },
      { id: 'preClearanceConforme', label: 'Conforme après correction', type: 'boolean', defaultValue: true }
    ]
  },

  // ============ PHASE 2 : ARRIVÉE ============
  {
    id: 'Task_Manifeste_Import',
    nom: 'Manifeste import',
    phase: 'PHASE 2 – ARRIVÉE',
    type: 'HUMAINE',
    ordre: 7,
    assigneesSuggerees: ['ARMATEUR', 'CONSIGNATAIRE', 'PORT'],
    formFields: [
      { id: 'numeroManifeste', label: 'N° Manifeste', type: 'string', required: true },
      { id: 'navire', label: 'Navire', type: 'string' },
      { id: 'dateArrivee', label: 'Date arrivée', type: 'date' },
      { id: 'numeroConnaissement', label: 'N° Connaissement', type: 'string' }
    ]
  },
  {
    id: 'Task_Dechargement_Entrepot',
    nom: 'Déchargement / entrée entrepôt',
    phase: 'PHASE 2 – ARRIVÉE',
    type: 'HUMAINE',
    ordre: 8,
    assigneesSuggerees: ['PORT', 'TERMINAL', 'DOUANE'],
    formFields: [
      { id: 'numeroEntrepot', label: 'N° Entrepôt', type: 'string', required: true },
      { id: 'dateDechargement', label: 'Date déchargement', type: 'date' },
      { id: 'emplacement', label: 'Emplacement', type: 'string' },
      { id: 'numeroConteneur', label: 'N° Conteneur', type: 'string' }
    ]
  },
  {
    id: 'Task_Reconnaissance_Marchandise',
    nom: 'Reconnaissance marchandise',
    phase: 'PHASE 2 – ARRIVÉE',
    type: 'HUMAINE',
    ordre: 9,
    assigneesSuggerees: ['DOUANE', 'PORT', 'TERMINAL'],
    formFields: [
      { id: 'agentReconnaissance', label: 'Agent de reconnaissance', type: 'string', required: true },
      { id: 'dateReconnaissance', label: 'Date reconnaissance', type: 'date' },
      { id: 'poidsConstate', label: 'Poids constaté (kg)', type: 'long' },
      { id: 'anomaliesDetectees', label: 'Anomalies détectées', type: 'boolean', defaultValue: false },
      { id: 'observationsRecon', label: 'Observations', type: 'string' },
      { id: 'marchandiseConforme', label: 'Marchandise conforme', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'Task_Traitement_Anomalie',
    nom: 'Traitement anomalie',
    phase: 'PHASE 2 – ARRIVÉE',
    type: 'HUMAINE',
    ordre: 10,
    assigneesSuggerees: ['DOUANE', 'PORT', 'OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'typeAnomalie', label: "Type d'anomalie", type: 'string', required: true },
      { id: 'actionCorrective', label: 'Action corrective', type: 'string' },
      { id: 'rapportAnomalie', label: "Rapport d'anomalie", type: 'string' },
      { id: 'anomalieResolue', label: 'Anomalie résolue', type: 'boolean', defaultValue: true }
    ]
  },

  // ============ PHASE 3 : DÉDOUANEMENT ============
  {
    id: 'Task_Soumission_DAU',
    nom: 'Soumission déclaration douane (DAU)',
    phase: 'PHASE 3 – DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 11,
    assigneesSuggerees: ['TRANSITAIRE', 'OPERATEUR'],
    formFields: [
      { id: 'numeroDeclaration', label: 'N° Déclaration (DAU)', type: 'string', required: true },
      { id: 'bureauDouane', label: 'Bureau de douane', type: 'string', required: true },
      { id: 'dateDepotDouane', label: 'Date dépôt', type: 'date' },
      { id: 'declarant', label: 'Déclarant', type: 'string' },
      {
        id: 'decisionCircuit', label: 'Circuit', type: 'enum', defaultValue: 'VERT',
        options: [
          { value: 'VERT', label: 'Circuit VERT' },
          { value: 'ORANGE', label: 'Circuit ORANGE' },
          { value: 'ROUGE', label: 'Circuit ROUGE' }
        ]
      }
    ]
  },
  {
    id: 'Task_Controle_Documentaire',
    nom: 'Contrôle documentaire',
    phase: 'PHASE 3 – DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 12,
    assigneesSuggerees: ['DOUANE'],
    formFields: [
      { id: 'agentDouaneDoc', label: 'Agent douanier', type: 'string', required: true },
      { id: 'documentsVerifies', label: 'Documents vérifiés', type: 'string' },
      { id: 'conformiteDoc', label: 'Conforme', type: 'boolean', defaultValue: true },
      { id: 'observationsDoc', label: 'Observations', type: 'string' },
      { id: 'controleConforme', label: 'Contrôle conforme', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'Task_Inspection_Physique',
    nom: 'Inspection physique / scanner',
    phase: 'PHASE 3 – DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 13,
    assigneesSuggerees: ['DOUANE', 'PORT', 'ADMIN_TECHNIQUE'],
    formFields: [
      { id: 'agentDouanePhys', label: 'Agent douanier', type: 'string', required: true },
      { id: 'dateInspection', label: 'Date inspection', type: 'date' },
      { id: 'resultScanner', label: 'Résultat scanner', type: 'string' },
      { id: 'anomaliesInspection', label: 'Anomalies détectées', type: 'boolean', defaultValue: false },
      { id: 'rapportInspection', label: "Rapport d'inspection", type: 'string' },
      { id: 'controleConforme', label: 'Contrôle conforme', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'Task_Paiement_Electronique',
    nom: 'Paiement électronique',
    phase: 'PHASE 3 – DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 14,
    assigneesSuggerees: ['OPERATEUR', 'BANQUE'],
    formFields: [
      { id: 'referencePaiement', label: 'Référence paiement', type: 'string', required: true },
      { id: 'numeroQuittance', label: 'Numéro de quittance', type: 'string', required: true },
      { id: 'montantPaiement', label: 'Montant (FCFA)', type: 'long' },
      { id: 'methodePaiement', label: 'Méthode de paiement', type: 'string' },
      { id: 'banquePaiement', label: 'Banque', type: 'string' },
      { id: 'datePaiement', label: 'Date paiement', type: 'date' },
      { id: 'paiementConfirme', label: 'Paiement confirmé', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'Task_Regulariser_Paiement',
    nom: 'Régulariser paiement',
    phase: 'PHASE 3 – DÉDOUANEMENT',
    type: 'HUMAINE',
    ordre: 15,
    assigneesSuggerees: ['OPERATEUR', 'BANQUE'],
    formFields: [
      { id: 'motifIrregularite', label: 'Motif irrégularité', type: 'string', required: true },
      { id: 'actionCorrectrice', label: 'Action correctrice', type: 'string' },
      { id: 'nouvelleDatePaiement', label: 'Nouvelle date', type: 'date' }
    ]
  },

  // ============ PHASE 4 : ENLÈVEMENT ============
  {
    id: 'Task_Complement_BAE',
    nom: 'Compléter conditions BAE',
    phase: 'PHASE 4 – ENLÈVEMENT',
    type: 'HUMAINE',
    ordre: 16,
    assigneesSuggerees: ['OPERATEUR', 'TRANSITAIRE'],
    formFields: [
      { id: 'conditionManquante', label: 'Condition manquante', type: 'string' },
      { id: 'mesureCorrectrice', label: 'Mesure correctrice', type: 'string', required: true },
      { id: 'conditionsBaeOK', label: 'Conditions OK après correction', type: 'boolean', defaultValue: true }
    ]
  },
  {
    id: 'Task_Emission_BAE',
    nom: 'Émission Bon à Enlever (BAE)',
    phase: 'PHASE 4 – ENLÈVEMENT',
    type: 'HUMAINE',
    ordre: 17,
    assigneesSuggerees: ['DOUANE'],
    formFields: [
      { id: 'numeroBAE', label: 'N° BAE', type: 'string', required: true },
      { id: 'agentDouaneBAE', label: 'Agent douanier', type: 'string' },
      { id: 'dateEmissionBAE', label: 'Date émission', type: 'date' },
      { id: 'observationsBAE', label: 'Observations', type: 'string' }
    ]
  },
  {
    id: 'Task_Bon_A_Delivrer',
    nom: 'Bon à Délivrer (BAD)',
    phase: 'PHASE 4 – ENLÈVEMENT',
    type: 'HUMAINE',
    ordre: 18,
    assigneesSuggerees: ['ARMATEUR', 'CONSIGNATAIRE'],
    formFields: [
      { id: 'numeroBAD', label: 'N° BAD', type: 'string', required: true },
      { id: 'armateur', label: 'Armateur', type: 'string' },
      { id: 'dateBAD', label: 'Date BAD', type: 'date' },
      { id: 'quaiLivraison', label: 'Quai', type: 'string' }
    ]
  },
  {
    id: 'Task_Constat_Sortie',
    nom: 'Constat de sortie',
    phase: 'PHASE 4 – ENLÈVEMENT',
    type: 'HUMAINE',
    ordre: 19,
    assigneesSuggerees: ['PORT', 'DOUANE'],
    formFields: [
      { id: 'numeroConstatSortie', label: 'N° Constat sortie', type: 'string', required: true },
      { id: 'dateSortie', label: 'Date sortie', type: 'date' },
      { id: 'agentControleSortie', label: 'Agent contrôle sortie', type: 'string' },
      { id: 'conformiteSortie', label: 'Conforme', type: 'boolean', defaultValue: true },
      { id: 'observationsSortie', label: 'Observations', type: 'string' }
    ]
  }
];