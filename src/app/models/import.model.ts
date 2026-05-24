export type StatutDossier = 'EN_ATTENTE' | 'EN_COURS' | 'VALIDE' | 'REFUSE';

export interface DossierImport {
  id?: string;
  numeroDossier?: string;
  importateur: string;
  paysOrigine: string;
  typeProduit: string;
  quantite?: number;
  valeur?: string;
  codeSH?: string;
  fournisseur?: string;
  dateDepot?: string;
  statut?: StatutDossier;
  commentaire?: string;
  dateModification?: string;
}
