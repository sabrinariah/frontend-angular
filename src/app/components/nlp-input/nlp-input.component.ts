import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NlpRegleService } from '../../core/services/nlp-regle.service';
import { RegleMetierService } from '../../core/services/regle.service';
import { DrlPreviewComponent } from '../drl-preview/drl-preview.component';

import { NlpConversionResult } from '../../models/nlp.model';
import { RegleMetier } from '../../models/regle.model';
import { Categorie } from '../../models/categorie.model';
import { Condition } from '../../models/condition.model';

type Mode = 'input' | 'preview' | 'edit';

interface NlpToast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
}

@Component({
  selector: 'app-nlp-input',
  standalone: true,
  imports: [CommonModule, FormsModule, DrlPreviewComponent],
  templateUrl: './nlp-input.component.html',
  styleUrls: ['./nlp-input.component.css']
})
export class NlpInputComponent implements OnInit {

  @Output() regleCreee = new EventEmitter<RegleMetier>();

  showModal = false;
  mode: Mode = 'input';
  loading = false;
  saving = false;
  showDrl = false;

  phrase = '';
  result: NlpConversionResult | null = null;
  categories: Categorie[] = [];

  // Champs du mode édition
  editCode = '';
  editNom = '';
  editAction = '';
  editCategorieId: number | null = null;
  editConditions: Condition[] = [];
  editActive = true;

  toasts: NlpToast[] = [];
  private toastId = 0;

  readonly exemplesPhrases = [
    'Si le score de risque est supérieur à 60, déclencher une inspection physique obligatoire',
    'Si le pays d\'origine est le Sénégal, appliquer un taux préférentiel UEMOA de 5%',
    'Si la marchandise est dangereuse, forcer automatiquement le circuit rouge',
    'Si le paiement est confirmé et la marchandise conforme, émettre le bon à enlever',
    'Si la valeur FOB dépasse 50 000 000 XAF, exiger une validation hiérarchique'
  ];

  constructor(
    private nlpService: NlpRegleService,
    private regleService: RegleMetierService
  ) {}

  ngOnInit(): void {
    this.regleService.getAllCategories().subscribe({
      next: (cats) => this.categories = cats ?? [],
      error: () => this.categories = []
    });
  }

  // =========== NAVIGATION MODALE ===========

  ouvrir(): void {
    this.reset();
    this.showModal = true;
  }

  fermer(): void {
    this.showModal = false;
    this.reset();
  }

  reset(): void {
    this.mode = 'input';
    this.phrase = '';
    this.result = null;
    this.loading = false;
    this.saving = false;
    this.showDrl = false;
    this.editCode = '';
    this.editNom = '';
    this.editAction = '';
    this.editCategorieId = null;
    this.editConditions = [];
    this.editActive = true;
  }

  // =========== NAVIGATION ENTRE MODES ===========

  recommencer(): void {
    this.mode = 'input';
    this.result = null;
    this.showDrl = false;
  }

  passEnEdition(): void {
    this.mode = 'edit';
  }

  retourApercu(): void {
    this.mode = 'preview';
  }

  // =========== CONVERSION IA ===========

  convertir(): void {
    if (!this.phrase.trim()) return;
    this.loading = true;
    this.result = null;

    this.nlpService.convertir(this.phrase.trim()).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
        this.mode = 'preview';
        this.preparerEdition(res);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || err?.message || '';
        this.addToast('error', 'Service IA indisponible',
          msg || 'Vérifiez que le backend est démarré sur le port 8081.');
      }
    });
  }

  private preparerEdition(res: NlpConversionResult): void {
    this.editCode = res.regle.code;
    this.editNom  = res.regle.nom;
    this.editAction = res.regle.action;
    this.editActive = true;
    this.editConditions = res.regle.conditions.map(c => ({ ...c }));
    const cat = this.categories.find(
      c => c.type?.toUpperCase() === res.regle.categorieType?.toUpperCase()
    );
    this.editCategorieId = cat?.id ?? null;
  }

  // =========== SAUVEGARDE ===========

  valider(): void {
    if (!this.result || !this.editCategorieId) {
      this.addToast('warning', 'Catégorie non trouvée',
        'Passez en mode édition pour sélectionner la catégorie manuellement.');
      return;
    }
    this.sauvegarder(this.editCode, this.editNom, this.editAction,
      this.editCategorieId, this.editConditions, true,
      'Générée par IA — phrase : ' + this.result.phraseOriginale);
  }

  sauvegarderEdition(): void {
    if (!this.isEditFormValid()) {
      this.addToast('warning', 'Champs manquants', 'Remplissez tous les champs obligatoires (*).');
      return;
    }
    const motif = 'Générée par IA (modifiée) — phrase : ' + (this.result?.phraseOriginale ?? '');
    this.sauvegarder(this.editCode, this.editNom, this.editAction,
      this.editCategorieId!, this.editConditions, this.editActive, motif);
  }

  private sauvegarder(
    code: string, nom: string, action: string,
    categorieId: number, conditions: Condition[],
    active: boolean, motif: string
  ): void {
    const payload: any = {
      code, nom, action, active, version: 1,
      categorie: { id: categorieId },
      conditions: conditions.map(c => ({ champ: c.champ, operateur: c.operateur, valeur: c.valeur })),
      motifModification: motif
    };

    this.saving = true;
    this.regleService.create(payload).subscribe({
      next: (r) => {
        this.saving = false;
        this.addToast('success', '✅ Règle créée avec succès', code);
        this.regleCreee.emit(r);
        setTimeout(() => this.fermer(), 1800);
      },
      error: (err) => {
        this.saving = false;
        this.addToast('error', 'Erreur de création', err?.error?.message || 'Impossible de créer la règle.');
      }
    });
  }

  // =========== CONDITIONS (MODE ÉDITION) ===========

  ajouterCondition(): void {
    this.editConditions.push({ champ: '', operateur: '==', valeur: '' });
  }

  supprimerCondition(i: number): void {
    this.editConditions.splice(i, 1);
  }

  // =========== UTILITAIRES ===========

  isEditFormValid(): boolean {
    return !!(
      this.editCode?.trim() &&
      this.editNom?.trim() &&
      this.editAction?.trim() &&
      this.editCategorieId
    );
  }

  getCategorieMatchee(): Categorie | undefined {
    if (!this.result) return undefined;
    return this.categories.find(
      c => c.type?.toUpperCase() === this.result!.regle.categorieType?.toUpperCase()
    );
  }

  pourcentageConfiance(): number {
    return Math.round((this.result?.confidence ?? 0) * 100);
  }

  couleurConfiance(): string {
    const p = this.pourcentageConfiance();
    if (p >= 85) return '#16a34a';
    if (p >= 50) return '#d97706';
    return '#dc2626';
  }

  labelConfiance(): string {
    const p = this.pourcentageConfiance();
    if (p >= 85) return 'Haute confiance — création directe recommandée';
    if (p >= 50) return 'Confiance moyenne — vérifiez les valeurs';
    return 'Confiance faible — révision manuelle obligatoire';
  }

  appliquerExemple(phrase: string): void {
    this.phrase = phrase;
  }

  iconCategorie(type?: string): string {
    const map: Record<string, string> = {
      'TAXE': '💰', 'QUOTA': '📊', 'CERTIFICATION': '📜',
      'VERIFICATION': '🔍', 'CONTROLE': '🛃', 'DOUANE': '🏛️'
    };
    return map[(type ?? '').toUpperCase()] ?? '📋';
  }

  operateurLabel(op?: string): string {
    const map: Record<string, string> = {
      '==': 'est égal à', '!=': 'est différent de',
      '>': 'est supérieur à', '<': 'est inférieur à',
      '>=': 'est ≥ à', '<=': 'est ≤ à'
    };
    return map[op ?? ''] ?? op ?? '?';
  }

  addToast(type: NlpToast['type'], message: string, detail?: string): void {
    const id = ++this.toastId;
    this.toasts.push({ id, type, message, detail });
    setTimeout(() => this.toasts = this.toasts.filter(t => t.id !== id), 5000);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
