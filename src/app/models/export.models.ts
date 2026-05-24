export type StatutDossier = 'EN_ATTENTE' | 'EN_COURS' | 'VALIDE' | 'REFUSE';

export interface DossierExport {
  id?: string;
  numeroDossier?: string;
  exportateur: string;
  paysDestination: string;
  typeProduit: string;
  quantite?: number;
  valeurFOB?: number;
  codeSH?: string;
  destinationFinale?: string;
  deviseFacture?: string;
  dateDepot?: string;
  statut?: StatutDossier;
  commentaire?: string;
  dateModification?: string;
}
