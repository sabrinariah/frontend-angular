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

export interface Toast {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

@Component({
  selector: 'app-regle-metier',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // 🆕 Filtres
  filtreCategorieAffichage: string = 'TOUS';
  searchTerm: string = '';
  filtreStatut: 'TOUS' | 'ACTIVE' | 'INACTIVE' = 'TOUS';
  viewMode: 'cards' | 'table' = 'cards';

  // 🆕 Popup form
  showFormPopup = false;

  // 🆕 Toasts
  toasts: Toast[] = [];
  private toastCounter = 0;

  // 🆕 Confirm delete
  regleToDelete: RegleMetier | null = null;
  deleting = false;

  // 🆕 COUPLAGE PROCESSUS
  processus: Processus[] = [];
  utilisations: Record<number, { processusNom: string; tacheNom: string }[]> = {};

  // 🆕 Suggestions par catégorie
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

  // ================= INIT =================
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

  // ================= LOAD =================
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

  // 🔧 BUG CORRIGÉ : regleMetierIds (pluriel) + support de regleMetierId (singulier ancien)
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
                // ✅ Support pluriel (nouveau) + singulier (ancien) pour rétrocompat
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

  // ================= STATS =================
  countByCategorie(type: string): number {
    return this.regles.filter(r =>
      r.categorie?.type?.toUpperCase() === type.toUpperCase()
    ).length;
  }

  countActives(): number {
    return this.regles.filter(r => r.active).length;
  }

  countInactives(): number {
    return this.regles.filter(r => !r.active).length;
  }

  countUtilisees(): number {
    return Object.values(this.utilisations).filter(u => u.length > 0).length;
  }

  countTotalUtilisations(): number {
    return Object.values(this.utilisations).reduce((s, u) => s + u.length, 0);
  }

  // ================= CATEGORIE =================
// APRÈS
onCategorieChange(cat: Categorie | null): void {
  if (!cat) {
    this.selected.categorie = undefined;
    this.currentCategorieType = null;
    return;
  }
  this.selected.categorie = cat;
  this.currentCategorieType = cat.type?.toUpperCase() ?? null;
}

  getCategoriesUtilisees(): string[] {
    const cats = new Set<string>();
    this.regles.forEach(r => {
      if (r.categorie?.type) cats.add(r.categorie.type.toUpperCase());
    });
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

  appliquerSuggestionChamp(condition: Condition, champ: string): void {
    condition.champ = champ;
  }

  appliquerSuggestionAction(action: string): void {
    this.selected.action = action;
  }

  // ================= CONDITIONS =================
  addCondition(): void {
    this.selectedConditions.push({
      champ: '',
      operateur: '==',
      valeur: ''
    });
  }

  removeCondition(index: number): void {
    this.selectedConditions.splice(index, 1);
  }

  // ================= FILTRAGE & RECHERCHE =================
  reglesFiltrees(): RegleMetier[] {
    let result = this.regles;

    if (this.filtreCategorieAffichage !== 'TOUS') {
      result = result.filter(r =>
        r.categorie?.type?.toUpperCase() === this.filtreCategorieAffichage
      );
    }

    if (this.filtreStatut === 'ACTIVE') {
      result = result.filter(r => r.active);
    } else if (this.filtreStatut === 'INACTIVE') {
      result = result.filter(r => !r.active);
    }

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

  // ================= ICÔNES & COULEURS =================
  iconCategorie(type?: string): string {
    const map: Record<string, string> = {
      'TAXE': '💰',
      'QUOTA': '📊',
      'CERTIFICATION': '📜',
      'VERIFICATION': '🔍',
      'CONTROLE': '🛃',
      'DOUANE': '🏛️'
    };
    return map[(type || '').toUpperCase()] || '📋';
  }

  couleurCategorie(type?: string): string {
    const map: Record<string, string> = {
      'TAXE': '#f59e0b',
      'QUOTA': '#3b82f6',
      'CERTIFICATION': '#10b981',
      'VERIFICATION': '#8b5cf6',
      'CONTROLE': '#ef4444',
      'DOUANE': '#ec4899'
    };
    return map[(type || '').toUpperCase()] || '#6b7280';
  }

  // ================= VALIDATION =================
  isFormValid(): boolean {
    return !!(
      this.selected.code?.trim() &&
      this.selected.nom?.trim() &&
      this.selected.action?.trim() &&
      this.selected.categorie?.id
    );
  }

  // ================= POPUP FORM =================
  openCreateForm(): void {
    this.resetForm();
    this.showFormPopup = true;
  }

  openEditForm(r: RegleMetier): void {
    this.edit(r);
    this.showFormPopup = true;
  }

  closeFormPopup(): void {
    this.showFormPopup = false;
    this.resetForm();
  }

  // ================= SAVE =================
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
      }))
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
  }

  resetForm(): void {
    this.selected = this.initRegle();
    this.selectedConditions = [];
    this.isEditing = false;
    this.loading = false;
    this.currentCategorieType = null;
  }

  // ================= ACTIONS =================
  edit(r: RegleMetier): void {
    this.selected = {
      ...r,
      categorie: r.categorie ? { ...r.categorie } : undefined,
      version: r.version ?? 1
    };
    this.selectedConditions = r.conditions ? r.conditions.map(c => ({ ...c })) : [];
    this.isEditing = true;
    this.currentCategorieType = r.categorie?.type?.toUpperCase() ?? null;
  }

  toggleActive(id?: number): void {
    if (!id) return;
    this.regleService.toggle(id).subscribe({
      next: () => {
        this.loadRegles();
        this.addToast('info', 'Statut modifié');
      },
      error: (err) => {
        console.error(err);
        this.addToast('error', 'Erreur', err.message);
      }
    });
  }

  confirmDelete(r: RegleMetier): void {
    this.regleToDelete = r;
  }

  cancelDelete(): void {
    this.regleToDelete = null;
    this.deleting = false;
  }

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

  // ================= TOASTS =================
  addToast(type: Toast['type'], message: string, detail?: string, duration = 4000): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message, detail });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  trackById(index: number, item: any): number {
    return item?.id ?? index;
  }
}