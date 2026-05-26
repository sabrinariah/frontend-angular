import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RegleMetierService } from '../../core/services/regle.service';
import { ProcessusService } from '../../core/services/processus.service';
import { TacheService } from '../../core/services/tache.service';
import { RegleMetier } from '../../models/regle.model';
import { Categorie } from '../../models/categorie.model';
import { Condition } from '../../models/condition.model';
import { Processus, Tache } from '../../models/processus.model';
import { Version } from '../../models/version.model'; // ✅ AJOUT
import { NlpInputComponent } from '../nlp-input/nlp-input.component';
import { DrlPreviewComponent } from '../drl-preview/drl-preview.component';

export interface Toast {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

@Component({
  selector: 'app-regle-metier',
  standalone: true,
  imports: [CommonModule, FormsModule, NlpInputComponent, DrlPreviewComponent],
  templateUrl: './regle.html',
  styleUrls: ['./regle.css']
})
export class RegleMetierComponent implements OnInit {

  regles: RegleMetier[] = [];
  categories: Categorie[] = [];
  selectedConditions: Condition[] = [];
  selected: RegleMetier = this.initRegle();

  isEditing = false;
  loading = false;
  currentCategorieType: string | null = null;

  filtreCategorieAffichage: string = 'TOUS';
  searchTerm: string = '';
  filtreStatut: 'TOUS' | 'ACTIVE' | 'INACTIVE' = 'TOUS';
  viewMode:  'table' = 'table';

  showFormPopup = false;
  showDrlPreview = false;

  selectedDetail: RegleMetier | null = null;
  // ✅ MODIFICATION : ajout de 'historique' comme onglet possible
  detailTab: 'info' | 'conditions' | 'utilisations' | 'historique' = 'info';

  toasts: Toast[] = [];
  private toastCounter = 0;

  regleToDelete: RegleMetier | null = null;
  deleting = false;

  processus: Processus[] = [];
  utilisations: Record<number, { processusNom: string; tacheNom: string }[]> = {};

  // ✅ AJOUT : propriétés pour le versioning
  historique: Version[] = [];
  loadingHistorique = false;
  motifModification = ''; // saisi par l'utilisateur avant chaque modification

  champsSuggeresParCategorie: Record<string, string[]> = {
    'TAXE': ['valeur_marchandise', 'poids_net', 'pays_origine', 'code_sh', 'taux_droit', 'taux_tva'],
    'QUOTA': ['quantite_importee', 'quota_annuel', 'categorie_produit', 'pays_origine', 'periode'],
    'CERTIFICATION': ['type_certificat', 'pays_origine', 'certificat_present', 'date_expiration'],
    'VERIFICATION': ['montant_declaration', 'nb_documents', 'signature_valide', 'niveau_risque'],
    'CONTROLE': ['type_marchandise', 'circuit_controle', 'antecedents_importateur', 'valeur_marchandise'],
    'DOUANE': ['regime_douanier', 'bureau_douane', 'statut_declaration', 'droits_acquittes']
  };

  actionsSuggeresParCategorie: Record<string, string[]> = {
    'TAXE': ['CALCULER_DROITS', 'APPLIQUER_TVA', 'EXONERER', 'TAXATION_REDUITE'],
    'QUOTA': ['AUTORISER_IMPORT', 'BLOQUER_IMPORT', 'ALERTER_QUOTA', 'DEMANDER_DEROGATION'],
    'CERTIFICATION': ['EXIGER_CERTIFICAT', 'VALIDER_CERTIFICAT', 'REJETER_CERTIFICAT'],
    'VERIFICATION': ['VERIFICATION_SIMPLE', 'VERIFICATION_APPROFONDIE', 'ESCALADE_SUPERVISEUR'],
    'CONTROLE': ['CIRCUIT_VERT', 'CIRCUIT_JAUNE', 'CIRCUIT_ROUGE', 'PRELEVER_ECHANTILLON'],
    'DOUANE': ['ACCEPTER_DECLARATION', 'LIQUIDER', 'ACCORDER_MAINLEVEE', 'EXIGER_CAUTION']
  };

  constructor(
    private regleService: RegleMetierService,
    private processusService: ProcessusService,
    private tacheService: TacheService
  ) {}

  ngOnInit(): void {
    this.loadRegles();
    this.loadCategories();
    this.loadProcessusEtUtilisations();
  }

  initRegle(): RegleMetier {
    return {
      id: undefined,
      code: '',
      nom: '',
      action: '',
      active: true,
      version: 1,
      categorie: undefined,
      conditions: []
    };
  }

  loadRegles(): void {
    this.regleService.getAll().subscribe({
      next: (data) => {
        this.regles = data ?? [];
        this.calculerUtilisations();
      },
      error: (err) => {
        console.error('Erreur regles:', err);
        this.addToast('error', 'Erreur de chargement', 'Impossible de charger les règles');
      }
    });
  }

  loadCategories(): void {
    this.regleService.getAllCategories().subscribe({
      next: (data) => this.categories = data ?? [],
      error: (err) => console.error('Erreur categories:', err)
    });
  }

  loadProcessusEtUtilisations(): void {
    this.processusService.getAll().subscribe({
      next: (data) => {
        this.processus = data ?? [];
        this.calculerUtilisations();
      },
      error: () => this.processus = []
    });
  }

  calculerUtilisations(): void {
    this.utilisations = {};
    this.regles.forEach(r => {
      if (r.id) this.utilisations[r.id] = [];
    });
    this.processus.forEach(p => {
      if (!p.id) return;
      this.tacheService.getByProcessus(p.id).subscribe({
        next: (taches: Tache[]) => {
          taches.forEach(t => {
            try {
              const data = t.formData ? JSON.parse(t.formData) : {};
              const reglesGateway = data.regles || [];
              reglesGateway.forEach((rg: any) => {
                const ids: number[] = rg.regleMetierIds || (rg.regleMetierId ? [rg.regleMetierId] : []);
                ids.forEach(id => {
                  if (id && this.utilisations[id]) {
                    this.utilisations[id].push({
                      processusNom: p.nom || '',
                      tacheNom: t.nom || ''
                    });
                  }
                });
              });
            } catch {}
          });
        }
      });
    });
  }

  getUtilisations(regleId?: number): { processusNom: string; tacheNom: string }[] {
    if (!regleId) return [];
    return this.utilisations[regleId] || [];
  }

  countByCategorie(type: string): number {
    return this.regles.filter(r => r.categorie?.type?.toUpperCase() === type.toUpperCase()).length;
  }
  countActives(): number { return this.regles.filter(r => r.active).length; }
  countInactives(): number { return this.regles.filter(r => !r.active).length; }
  countUtilisees(): number { return Object.values(this.utilisations).filter(u => u.length > 0).length; }
  countTotalUtilisations(): number { return Object.values(this.utilisations).reduce((s, u) => s + u.length, 0); }

  onCategorieChange(cat: Categorie | null): void {
    if (!cat) { this.selected.categorie = undefined; this.currentCategorieType = null; return; }
    this.selected.categorie = cat;
    this.currentCategorieType = cat.type?.toUpperCase() ?? null;
  }

  getCategoriesUtilisees(): string[] {
    const cats = new Set<string>();
    this.regles.forEach(r => { if (r.categorie?.type) cats.add(r.categorie.type.toUpperCase()); });
    return Array.from(cats).sort();
  }

  getChampsSuggeres(): string[] {
    if (!this.currentCategorieType) return [];
    return this.champsSuggeresParCategorie[this.currentCategorieType] || [];
  }

  getActionsSuggerees(): string[] {
    if (!this.currentCategorieType) return [];
    return this.actionsSuggeresParCategorie[this.currentCategorieType] || [];
  }

  appliquerSuggestionChamp(condition: Condition, champ: string): void { condition.champ = champ; }
  appliquerSuggestionAction(action: string): void { this.selected.action = action; }

  addCondition(): void {
    this.selectedConditions.push({ champ: '', operateur: '==', valeur: '' });
  }
  removeCondition(index: number): void { this.selectedConditions.splice(index, 1); }

  reglesFiltrees(): RegleMetier[] {
    let result = this.regles;
    if (this.filtreCategorieAffichage !== 'TOUS') {
      result = result.filter(r => r.categorie?.type?.toUpperCase() === this.filtreCategorieAffichage);
    }
    if (this.filtreStatut === 'ACTIVE') result = result.filter(r => r.active);
    else if (this.filtreStatut === 'INACTIVE') result = result.filter(r => !r.active);
    if (this.searchTerm?.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.code?.toLowerCase().includes(term) ||
        r.nom?.toLowerCase().includes(term) ||
        r.action?.toLowerCase().includes(term) ||
        r.categorie?.nom?.toLowerCase().includes(term)
      );
    }
    return result;
  }

  resetFilters(): void {
    this.filtreCategorieAffichage = 'TOUS';
    this.filtreStatut = 'TOUS';
    this.searchTerm = '';
  }

  iconCategorie(type?: string): string {
    const map: Record<string, string> = {
      'TAXE': '💰', 'QUOTA': '📊', 'CERTIFICATION': '📜',
      'VERIFICATION': '🔍', 'CONTROLE': '🛃', 'DOUANE': '🏛️'
    };
    return map[(type || '').toUpperCase()] || '📋';
  }

  couleurCategorie(type?: string): string {
    const map: Record<string, string> = {
      'TAXE': '#f59e0b', 'QUOTA': '#3b82f6', 'CERTIFICATION': '#10b981',
      'VERIFICATION': '#8b5cf6', 'CONTROLE': '#ef4444', 'DOUANE': '#ec4899'
    };
    return map[(type || '').toUpperCase()] || '#6b7280';
  }

  operateurLabel(op?: string): string {
    const map: Record<string, string> = {
      '==': 'est égal à', '!=': 'est différent de', '>': 'est supérieur à',
      '<': 'est inférieur à', '>=': 'est ≥ à', '<=': 'est ≤ à',
      'IN': 'est dans', 'NOT_IN': "n'est pas dans",
      'contains': 'contient', 'isEmpty': 'est vide', 'isNotEmpty': "n'est pas vide"
    };
    return map[op || ''] || op || '?';
  }

  isFormValid(): boolean {
    return !!(
      this.selected.code?.trim() &&
      this.selected.nom?.trim() &&
      this.selected.action?.trim() &&
      this.selected.categorie?.id
    );
  }

  openDetail(r: RegleMetier): void {
    this.selectedDetail = r;
    this.detailTab = 'info';
    // ✅ On réinitialise l'historique à chaque ouverture
    this.historique = [];
  }

  closeDetail(): void {
    this.selectedDetail = null;
    this.detailTab = 'info';
    this.historique = [];
  }

  editFromDetail(): void {
    if (this.selectedDetail) {
      const r = this.selectedDetail;
      this.closeDetail();
      this.openEditForm(r);
    }
  }

  // ✅ AJOUT : charge l'historique des versions depuis le backend
  chargerHistorique(regleId?: number): void {
    if (!regleId) return;
    this.loadingHistorique = true;
    this.historique = [];
    this.regleService.getVersionsByRegle(regleId).subscribe({
      next: (data) => {
        this.historique = data ?? [];
        this.loadingHistorique = false;
      },
      error: () => {
        this.addToast('error', 'Erreur', "Impossible de charger l'historique");
        this.loadingHistorique = false;
      }
    });
  }

  // ✅ AJOUT : restaure une ancienne version
  restaurerVersion(versionId: number): void {
    if (!confirm('Restaurer cette version ? La version actuelle sera archivée dans l\'historique.')) return;
    this.regleService.restaurerVersion(versionId).subscribe({
      next: () => {
        this.addToast('success', '✅ Version restaurée', 'La règle a été remise à cette version');
        this.loadRegles();
        this.closeDetail();
      },
      error: (err) => {
        this.addToast('error', 'Erreur de restauration', err?.error?.message);
      }
    });
  }

  openCreateForm(): void { this.resetForm(); this.showFormPopup = true; }

  openEditForm(r: RegleMetier): void { this.edit(r); this.showFormPopup = true; }

  closeFormPopup(): void {
    this.showFormPopup = false;
    this.resetForm();
    // ✅ On réinitialise aussi le motif quand on ferme le formulaire
    this.motifModification = '';
  }

  save(): void {
    if (!this.isFormValid()) {
      this.addToast('warning', 'Champs manquants', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    this.loading = true;

    const payload: any = {
      code: this.selected.code,
      nom: this.selected.nom,
      action: this.selected.action,
      active: this.selected.active,
      version: this.selected.version ?? 1,
      categorie: { id: this.selected.categorie?.id },
      conditions: this.selectedConditions.map(c => ({
        champ: c.champ,
        operateur: c.operateur,
        valeur: c.valeur
      })),
      // ✅ AJOUT : le motif est envoyé au backend pour être archivé dans le snapshot
      motifModification: this.motifModification || 'Modification manuelle'
    };

    if (this.isEditing && this.selected.id) {
      this.regleService.update(this.selected.id, payload).subscribe({
        next: () => {
          this.afterSave();
          this.addToast('success', '✅ Règle mise à jour', payload.code);
        },
        error: (err) => {
          console.error('Erreur update:', err);
          this.addToast('error', 'Erreur', err.error?.message || err.message);
          this.loading = false;
        }
      });
    } else {
      this.regleService.create(payload).subscribe({
        next: () => {
          this.afterSave();
          this.addToast('success', '✅ Règle créée', payload.code);
        },
        error: (err) => {
          console.error('Erreur create:', err);
          this.addToast('error', 'Erreur', err.error?.message || err.message);
          this.loading = false;
        }
      });
    }
  }

  afterSave(): void {
    this.loadRegles();
    this.closeFormPopup();
    this.motifModification = ''; // ✅ réinitialisation après sauvegarde
  }

  resetForm(): void {
    this.selected = this.initRegle();
    this.selectedConditions = [];
    this.isEditing = false;
    this.loading = false;
    this.currentCategorieType = null;
    this.showDrlPreview = false;
  }

  get drlGenere(): string {
    return this.genererDrl();
  }

  genererDrl(): string {
    const code = this.selected.code?.trim() || 'REGLE_CODE';
    const nom  = this.selected.nom?.trim()  || '';
    const action = this.selected.action?.trim() || 'ACTION';
    const categorie = this.selected.categorie?.type || '';

    const mapOp = (op: string): string => {
      const m: Record<string, string> = {
        '==': '==', '!=': '!=', '>': '>', '<': '<',
        '>=': '>=', '<=': '<=',
        'IN': 'memberOf', 'NOT_IN': 'not memberOf',
        'contains': 'contains'
      };
      return m[op] || op;
    };

    const formatValeur = (op: string, val: string): string => {
      if (['IN', 'NOT_IN'].includes(op)) return `(${val})`;
      const isNum = val.trim() !== '' && !isNaN(Number(val));
      const isBool = val === 'true' || val === 'false';
      return (isNum || isBool) ? val : `"${val}"`;
    };

    const filledConds = this.selectedConditions.filter(c => c.champ?.trim());
    let condBlock: string;
    if (filledConds.length === 0) {
      condBlock = '    $d : Declaration()';
    } else {
      const lines = filledConds.map((c, i, arr) => {
        const champ = c.champ.trim();
        const op  = mapOp(c.operateur || '==');
        const val = formatValeur(c.operateur || '==', c.valeur || '');
        return `        ${champ} ${op} ${val}${i < arr.length - 1 ? ',' : ''}`;
      });
      condBlock = `    $d : Declaration(\n${lines.join('\n')}\n    )`;
    }

    let drl = `package com.douane.rules;\n\n`;
    drl += `import com.douane.domain.Declaration;\n`;
    if (nom)       drl += `\n// Règle : ${code} — ${nom}`;
    if (categorie) drl += `\n// Catégorie : ${categorie}`;
    drl += `\n\nrule "${code}"\n`;
    drl += `    salience 10\n`;
    drl += `    dialect "java"\n`;
    drl += `when\n${condBlock}\nthen\n`;
    drl += `    $d.setDernierResultat("${action}");\n`;
    drl += `    $d.setCodeRegle("${code}");\n`;
    drl += `    update($d);\nend`;
    return drl;
  }

  edit(r: RegleMetier): void {
    this.selected = { ...r, categorie: r.categorie ? { ...r.categorie } : undefined, version: r.version ?? 1 };
    this.selectedConditions = r.conditions ? r.conditions.map(c => ({ ...c })) : [];
    this.isEditing = true;
    this.currentCategorieType = r.categorie?.type?.toUpperCase() ?? null;
    this.motifModification = ''; // ✅ réinitialiser le motif à chaque ouverture d'édition
  }

  toggleActive(id?: number): void {
    if (!id) return;
    this.regleService.toggle(id).subscribe({
      next: () => { this.loadRegles(); this.addToast('info', 'Statut modifié'); },
      error: (err) => { console.error(err); this.addToast('error', 'Erreur', err.message); }
    });
  }

  confirmDelete(r: RegleMetier): void { this.regleToDelete = r; }
  cancelDelete(): void { this.regleToDelete = null; this.deleting = false; }

  executeDelete(): void {
    if (!this.regleToDelete?.id) return;
    this.deleting = true;
    const id = this.regleToDelete.id;
    const code = this.regleToDelete.code;
    this.regleService.delete(id).subscribe({
      next: () => {
        this.deleting = false;
        this.regleToDelete = null;
        this.loadRegles();
        this.addToast('success', `✅ Règle « ${code} » supprimée`);
      },
      error: (err) => {
        this.deleting = false;
        this.addToast('error', 'Erreur', err.error?.message || err.message);
        this.regleToDelete = null;
      }
    });
  }

  addToast(type: Toast['type'], message: string, detail?: string, duration = 4000): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message, detail });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }

  trackById(index: number, item: any): number { return item?.id ?? index; }
}