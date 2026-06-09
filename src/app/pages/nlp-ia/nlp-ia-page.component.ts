import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NlpRegleService } from '../../core/services/nlp-regle.service';
import { RegleMetierService } from '../../core/services/regle.service';
import { DrlPreviewComponent } from '../../components/drl-preview/drl-preview.component';
import { NotificationService } from '../../core/services/notification.service';

import { NlpConversionResult } from '../../models/nlp.model';
import { Categorie } from '../../models/categorie.model';
import { Condition } from '../../models/condition.model';

interface NlpToast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  detail?: string;
}

@Component({
  selector: 'app-nlp-ia-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DrlPreviewComponent],
  templateUrl: './nlp-ia-page.component.html',
  styleUrls: ['./nlp-ia-page.component.css']
})
export class NlpIaPageComponent implements OnInit {

  loading = false;
  saving = false;
  showDrl = false;

  phrase = '';
  result: NlpConversionResult | null = null;
  categories: Categorie[] = [];

  editCode = '';
  editNom = '';
  editAction = '';
  editCategorieNom = '';
  editConditions: Condition[] = [];
  editActive = true;
  champsDepuisIA: string[] = [];

  toasts: NlpToast[] = [];
  private toastId = 0;

  readonly ACTIONS_PAR_CATEGORIE: Record<string, string[]> = {
    'CONTROLE':      ['CIRCUIT_VERT', 'CIRCUIT_JAUNE', 'CIRCUIT_ROUGE', 'PRELEVER_ECHANTILLON'],
    'TAXE':          ['CALCULER_DROITS', 'APPLIQUER_TVA', 'EXONERER', 'TAXATION_REDUITE'],
    'QUOTA':         ['AUTORISER_IMPORT', 'BLOQUER_IMPORT', 'ALERTER_QUOTA'],
    'DOUANE':        ['ACCEPTER_DECLARATION', 'LIQUIDER', 'ACCORDER_MAINLEVEE', 'EXIGER_CAUTION'],
    'CERTIFICATION': ['EXIGER_CERTIFICAT', 'VALIDER_CERTIFICAT', 'REJETER_CERTIFICAT'],
    'VERIFICATION':  ['VERIFICATION_SIMPLE', 'VERIFICATION_APPROFONDIE', 'ESCALADE_SUPERVISEUR']
  };

  readonly CHAMPS_PAR_CATEGORIE: Record<string, string[]> = {
    'CONTROLE':      ['scoreRisque', 'marchandiseDangereuse', 'type_marchandise', 'circuit_controle'],
    'TAXE':          ['valeurCAF', 'pays_origine', 'poids_net', 'code_sh', 'taux_droit', 'taux_tva'],
    'QUOTA':         ['quantite_importee', 'quota_annuel', 'categorie_produit', 'pays_origine'],
    'DOUANE':        ['regime_douanier', 'bureau_douane', 'statut_declaration', 'droits_acquittes'],
    'CERTIFICATION': ['type_certificat', 'pays_origine', 'certificat_present', 'date_expiration'],
    'VERIFICATION':  ['montant_declaration', 'nb_documents', 'signature_valide', 'niveau_risque']
  };

  constructor(
    private nlpService: NlpRegleService,
    private regleService: RegleMetierService,
    private router: Router,
    private notifSvc: NotificationService
  ) {}

  ngOnInit(): void {
    this.regleService.getAllCategories().subscribe({
      next: (cats) => this.categories = cats ?? [],
      error: () => this.categories = []
    });
  }

  getActionsDisponibles(): string[] {
    const key = this.editCategorieNom.trim().toUpperCase();
    const cat = this.categories.find(c => c.nom?.toUpperCase() === key || c.type?.toUpperCase() === key);
    const type = cat?.type?.toUpperCase() ?? key;
    return this.ACTIONS_PAR_CATEGORIE[type] ?? [];
  }

  getChampsDisponibles(): string[] {
    const key = this.editCategorieNom.trim().toUpperCase();
    const cat = this.categories.find(c => c.nom?.toUpperCase() === key || c.type?.toUpperCase() === key);
    const type = cat?.type?.toUpperCase() ?? key;
    const hardcoded = this.CHAMPS_PAR_CATEGORIE[type] ?? [];
    return Array.from(new Set([...this.champsDepuisIA, ...hardcoded]));
  }

  convertir(): void {
    if (!this.phrase.trim()) return;
    this.loading = true;
    this.result = null;

    this.nlpService.convertir(this.phrase.trim()).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
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
    this.champsDepuisIA = res.regle.conditions.map(c => c.champ).filter(ch => !!ch);
    const cat = this.categories.find(
      c => c.type?.toUpperCase() === res.regle.categorieType?.toUpperCase()
    );
    this.editCategorieNom = cat?.nom ?? res.regle.categorieType ?? '';
  }

  sauvegarder(): void {
    if (!this.isFormValid()) {
      this.addToast('warning', 'Champs manquants', 'Remplissez tous les champs obligatoires (*).');
      return;
    }
    const catMatch = this.categories.find(
      c => c.nom?.toUpperCase() === this.editCategorieNom.trim().toUpperCase()
        || c.type?.toUpperCase() === this.editCategorieNom.trim().toUpperCase()
    );
    const payload: any = {
      code: this.editCode,
      nom: this.editNom,
      action: this.editAction,
      active: this.editActive,
      version: 1,
      categorie: catMatch ? { id: catMatch.id } : { nom: this.editCategorieNom.trim() },
      conditions: this.editConditions.map(c => ({ champ: c.champ, operateur: c.operateur, valeur: c.valeur })),
      motifModification: 'Générée par IA — phrase : ' + (this.result?.phraseOriginale ?? '')
    };

    this.saving = true;
    this.regleService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.addToast('success', '✅ Règle créée avec succès', this.editCode);
        this.notifSvc.notify({ type: 'success', category: 'ia', icon: '🤖', title: 'Règle créée via IA', message: `La règle « ${this.editCode} » a été générée par l'assistant IA et créée avec succès.` });
        setTimeout(() => this.router.navigate(['/regles']), 1800);
      },
      error: (err) => {
        this.saving = false;
        this.addToast('error', 'Erreur de création', err?.error?.message || 'Impossible de créer la règle.');
      }
    });
  }

  recommencer(): void {
    this.result = null;
    this.showDrl = false;
    this.editCode = '';
    this.editNom = '';
    this.editAction = '';
    this.editCategorieNom = '';
    this.editConditions = [];
    this.editActive = true;
    this.champsDepuisIA = [];
  }

  ajouterCondition(): void {
    this.editConditions.push({ champ: '', operateur: '==', valeur: '' });
  }

  supprimerCondition(i: number): void {
    this.editConditions.splice(i, 1);
  }

  isFormValid(): boolean {
    return !!(this.editCode?.trim() && this.editNom?.trim() && this.editAction?.trim() && this.editCategorieNom?.trim());
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

  iconCategorie(type?: string): string {
    const map: Record<string, string> = {
      'TAXE': '💰', 'QUOTA': '📊', 'CERTIFICATION': '📜',
      'VERIFICATION': '🔍', 'CONTROLE': '🛃', 'DOUANE': '🏛️'
    };
    return map[(type ?? '').toUpperCase()] ?? '📋';
  }

  retour(): void {
    this.router.navigate(['/regles']);
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
