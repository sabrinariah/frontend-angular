import { Categorie } from './categorie.model';
import { Condition } from './condition.model';

export interface RegleMetier {
  id?: number;
  code: string;
  nom: string;
  action: string;
  active: boolean;
  version?: number;

  categorie?: Categorie;
  conditions?: Condition[];
}