// src/app/models/import.model.ts

export interface DemandeImport {
  // Champs de base (Task_Saisie_Dossier)
  dossierId?: string;
  importateur: string;
  paysOrigine: string;
  typeProduit: string;
  nomDossier?: string;
  dateDepot?: string;
  quantite?: number;
  valeur?: string;
  codeSH?: string;
  origineFinale?: string;
  fournisseur?: string;
}

export interface TacheImport {
  taskId: string;
  taskName: string;
  taskDefinitionKey?: string;
  processInstanceId: string;
  assignee: string;
  created?: string;
}

export interface VariablesImport {
  // Phase 1
  importateur?: { value: string };
  paysOrigine?: { value: string };
  typeProduit?: { value: string };
  importEligible?: { value: boolean };
  preClearanceConforme?: { value: boolean };
  numeroDI?: { value: string };
  banqueDomiciliataire?: { value: string };

  // Phase 2
  numeroManifeste?: { value: string };
  numeroEntrepot?: { value: string };
  marchandiseConforme?: { value: boolean };

  // Phase 3
  numeroDeclaration?: { value: string };
  decisionCircuit?: { value: string };  // VERT / ORANGE / ROUGE
  controleConforme?: { value: boolean };
  droitsDouane?: { value: number };
  tva?: { value: number };
  totalDroits?: { value: number };
  totalFrais?: { value: number };
  numeroQuittance?: { value: string };
  paiementConfirme?: { value: boolean };

  // Phase 4
  conditionsBaeOK?: { value: boolean };
  numeroBAE?: { value: string };
  numeroBAD?: { value: string };
  numeroConstatSortie?: { value: string };

  // Documents générés
  declarationImport?: { value: string };
  bonDedouanement?: { value: string };
  certificatImport?: { value: string };
  licenceImport?: { value: string };
  motifRefusImport?: { value: string };
  niveauRisqueImport?: { value: string };
  importAutorise?: { value: boolean };
}

// Configuration des formulaires par taskDefinitionKey
export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'string' | 'long' | 'boolean' | 'date' | 'enum';
  required?: boolean;
  defaultValue?: any;
  options?: { id: string; name: string }[];
}