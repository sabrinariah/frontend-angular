
import { Tache } from './tache.model';
export interface Processus {
  id?: number;
  nom: string;
  typeProcessus: string;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
   taches?: Tache[];
    processusId?: number;
}