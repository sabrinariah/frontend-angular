import { Categorie } from './categorie.model';
import { Condition } from './condition.model';
import { Version } from './version.model';

export interface RegleMetier {
  id?: number;
  code: string;
  nom: string;
  action: string;
  active: boolean;

  categorie?: Categorie;

  conditions?: Condition[];
 version?: number;
}