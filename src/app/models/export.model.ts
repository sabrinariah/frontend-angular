export interface DemandeExport {
  exportateur: string;
  paysDestination: string;
  typeProduit: string;
  quantite?: number;
  valeur?: string;
  codeSH?: string;
  transport?: string;
  incoterm?: string;
}

export interface TacheExport {
  id: string;
  name: string;

  
  assignee: string;
}

export interface VariablesExport {
  exportAutorise: boolean;
  motifRefusExport: string;
  niveauRisqueExport: string;
  fraisTransport: number;
  assurance: number;
  totalFrais: number;
  declarationExport: string;
  certificatExport: string;
}