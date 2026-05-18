// ============================================================
//  MODÈLE TÂCHE PARAMÉTRABLE — RÈGLES SIMPLES SI/ALORS
// ============================================================

export type TacheType = 'MANUELLE' | 'SYSTEME' | 'VALIDATION' | 'NOTIFICATION' | 'DECISION';
export type TacheStatut = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'REJETE' | 'BLOQUE';
export type ChampType = 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'textarea';
export type OperateurCondition =
  | '==' | '!=' | '>' | '<' | '>=' | '<='
  | 'contains' | 'isEmpty' | 'isNotEmpty';

// ---------- CHAMP DYNAMIQUE ----------
export interface ChampDynamique {
  id: string;
  label: string;
  type: ChampType;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { value: any; label: string }[];
}

// ---------- RÈGLE : SI condition ALORS passer à tâche Y ----------
export interface RegleTransition {
  id: string;
  nom: string;
  champId: string;
  operateur: OperateurCondition;
  valeur: any;
  tacheCibleOrdre: number;
  actif: boolean;
}

// ---------- TÂCHE PARAMÉTRABLE ----------
export interface TacheParametrable {
  id?: number;
  nom: string;
  description?: string;
  type: TacheType;
  statut: TacheStatut;
  ordre: number;
  assignee?: string;
  processusId: number;
  champs: ChampDynamique[];
  valeurs: Record<string, any>;
  regles: RegleTransition[];
  ordreSuivantParDefaut?: number;
}