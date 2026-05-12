// src/app/models/version.model.ts
import { Condition } from './condition.model';

export interface Version {
  id?: number;

  numeroVersion?: string;

  active: boolean;        // ✅ OBLIGATOIRE (non optionnel recommandé)

  conditions?: Condition[];  // ✅ OBLIGATOIRE
}