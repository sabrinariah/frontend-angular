export interface DemandeImport {
  importateur: string;
  paysOrigine: string;
  typeProduit: string;
  quantite?: number;
  valeur?: string;
  codeSH?: string;
  origineFinale?: string;
  fournisseur?: string;
}

export interface TacheImport {
  taskId: string;
  taskName: string;
  processInstanceId: string;
  assignee: string;
}
export interface VariablesImport {
  importateur?: { value: string };
  paysOrigine?: { value: string };
  typeProduit?: { value: string };
  totalFrais?: { value: number };

  importAutorise?: { value: boolean };
  motifRefusImport?: { value: string };
  niveauRisqueImport?: { value: string };
  droitsDouane?: { value: number };
  tva?: { value: number };
  totalDroits?: { value: number };
  declarationImport?: { value: string };
  bonDedouanement?: { value: string };
  certificatImport?: { value: string };
  licenceImport?: { value: string };
}