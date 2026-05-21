// src/app/models/version.model.ts
import { Condition } from './condition.model';

// models/version.model.ts
export interface Version {
  id: number;
  numeroVersion: number;       // ex: 1, 2, 3...
  code: string;
  nom: string;
  action: string;
  active: boolean;
  modifiePar?: string;         // optionnel
  motifModification?: string;  // raison de la modif, saisie par l'utilisateur
  dateModification: string;    // Java LocalDateTime → string ISO en JSON
  conditionsSnapshot?: string; // snapshot JSON des conditions à ce moment-là
}