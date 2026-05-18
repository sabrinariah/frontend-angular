import { Injectable } from '@angular/core';
import { Condition } from '../../models/condition.model';
import { RegleMetier } from '../../models/regle.model';

export interface EvaluationResult {
  valide: boolean;
  conditionsEchouees: ConditionEchouee[];
  message?: string;
}

export interface ConditionEchouee {
  champ: string;
  operateur: string;
  valeurAttendue: any;
  valeurReelle: any;
  raison: string;
}

@Injectable({ providedIn: 'root' })
export class ConditionEvaluatorService {

  /**
   * Évalue une règle métier complète contre les données d'un formulaire.
   * Toutes les conditions doivent être valides (logique ET).
   */
  evaluerRegle(regle: RegleMetier, formData: Record<string, any>): EvaluationResult {
    if (!regle) {
      return { valide: true, conditionsEchouees: [] };
    }

    if (!regle.active) {
      return {
        valide: false,
        conditionsEchouees: [],
        message: `La règle "${regle.nom}" est désactivée.`
      };
    }

    const conditions = regle.conditions ?? [];

    if (conditions.length === 0) {
      return { valide: true, conditionsEchouees: [] };
    }

    const echecs: ConditionEchouee[] = [];

    for (const cond of conditions) {
      const valeurReelle = formData?.[cond.champ];
      const ok = this.evaluerCondition(cond, valeurReelle);

      if (!ok) {
        echecs.push({
          champ: cond.champ,
          operateur: cond.operateur,
          valeurAttendue: cond.valeur,
          valeurReelle: valeurReelle,
          raison: this.expliquer(cond, valeurReelle)
        });
      }
    }

    return {
      valide: echecs.length === 0,
      conditionsEchouees: echecs,
      message: echecs.length === 0
        ? `✅ Règle "${regle.nom}" validée.`
        : `❌ ${echecs.length} condition(s) non respectée(s) pour la règle "${regle.nom}".`
    };
  }

  /**
   * Évalue une seule condition.
   */
  private evaluerCondition(cond: Condition, valeurReelle: any): boolean {
    const op = cond.operateur;
    const attendu = cond.valeur;

    // Champ manquant ou vide → toute condition échoue sauf "!="
    if (valeurReelle === undefined || valeurReelle === null || valeurReelle === '') {
      return op === '!=' ? this.parseValue(attendu) !== '' : false;
    }

    // Comparaison numérique si les deux côtés sont numériques
    const numReel = this.toNumber(valeurReelle);
    const numAttendu = this.toNumber(attendu);
    const sontNumeriques = numReel !== null && numAttendu !== null;

    switch (op) {
      case '==':
        if (sontNumeriques) return numReel === numAttendu;
        return String(valeurReelle) === String(attendu);

      case '!=':
        if (sontNumeriques) return numReel !== numAttendu;
        return String(valeurReelle) !== String(attendu);

      case '>':
        return sontNumeriques ? numReel! > numAttendu! : false;

      case '<':
        return sontNumeriques ? numReel! < numAttendu! : false;

      case '>=':
        return sontNumeriques ? numReel! >= numAttendu! : false;

      case '<=':
        return sontNumeriques ? numReel! <= numAttendu! : false;

      default:
        console.warn('Opérateur inconnu:', op);
        return false;
    }
  }

  /**
   * Convertit une valeur en nombre, ou null si pas convertible.
   */
  private toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  private parseValue(v: any): any {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  }

  /**
   * Génère un message explicatif pour une condition échouée.
   */
  private expliquer(cond: Condition, valeurReelle: any): string {
    const reelle = valeurReelle === undefined || valeurReelle === null || valeurReelle === ''
      ? '(vide)'
      : `"${valeurReelle}"`;

    return `Le champ "${cond.champ}" vaut ${reelle}, attendu : ${cond.operateur} "${cond.valeur}"`;
  }
}