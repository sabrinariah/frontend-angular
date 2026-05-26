export interface DossierExport {
  id?: string;
  numeroDossier?: string;
  exportateur: string;
  paysDestination: string;
  typeProduit: string;
  quantite?: number;
  unite?: string;
  valeurFOB?: number;
  codeSH?: string;
  destinationFinale?: string;
  deviseFacture?: string;
  dateDepot?: string;
  commentaire?: string;
  dateModification?: string;
}
