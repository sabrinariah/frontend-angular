import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RegleMetierService } from '../../core/services/regle.service';
import { RegleMetier } from '../../models/regle.model';
import { Categorie } from '../../models/categorie.model';
import { Condition } from '../../models/condition.model';

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

  constructor(private regleService: RegleMetierService) {}

  ngOnInit(): void {
    this.loadRegles();
    this.loadCategories();
  }

  // ================= INIT =================
  initRegle(): RegleMetier {
    return {
      id: undefined,
      code: '',
      nom: '',
      action: '',
      active: true,
      categorie: undefined,
      conditions: [],
      version: 1 // ✅ version initiale
    };
  }

  // ================= LOAD =================
  loadRegles(): void {
    this.regleService.getAll().subscribe({
      next: (data) => this.regles = data ?? [],
      error: (err) => console.error('Erreur regles:', err)
    });
  }

  loadCategories(): void {
    this.regleService.getAllCategories().subscribe({
      next: (data) => this.categories = data ?? [],
      error: (err) => console.error('Erreur categories:', err)
    });
  }

  // ================= CATEGORIE =================
  onCategorieChange(categoryId: number | null): void {
    if (!categoryId) {
      this.selected.categorie = undefined;
      this.currentCategorieType = null;
      return;
    }

    const cat = this.categories.find(c => c.id === Number(categoryId));

    this.selected.categorie = cat;
    this.currentCategorieType = cat?.type?.toUpperCase() ?? null;
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

  // ================= VALIDATION =================
  isFormValid(): boolean {
    return !!(
      this.selected.code?.trim() &&
      this.selected.nom?.trim() &&
      this.selected.action?.trim() &&
      this.selected.categorie?.id
    );
  }

  // ================= SAVE =================
 save(): void {
  if (!this.isFormValid()) return;

  this.loading = true;

  const payload = {
    code: this.selected.code,
    nom: this.selected.nom,
    action: this.selected.action,
    active: this.selected.active,
    categorie: {
      id: this.selected.categorie?.id
    },
    conditions: this.selectedConditions
  };

  // 👉 MODIFIER
  if (this.isEditing && this.selected.id) {
    this.regleService.update(this.selected.id, payload).subscribe({
      next: () => this.afterSave(),
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });

  } 
  // 👉 AJOUTER
  else {
    this.regleService.create(payload).subscribe({
      next: () => this.afterSave(),
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}

  // ================= AFTER SAVE =================
  afterSave(): void {
    this.loadRegles();
    this.resetForm();
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
      version: r.version ?? 1 // ✅ récupérer version
    };

    this.selectedConditions = r.conditions ? [...r.conditions] : [];
    this.isEditing = true;

    this.currentCategorieType = r.categorie?.type?.toUpperCase() ?? null;
  }

  toggleActive(id?: number): void {
    if (!id) return;

    this.regleService.toggle(id).subscribe({
      next: () => this.loadRegles(),
      error: (err) => console.error(err)
    });
  }

  delete(id?: number): void {
    if (!id) return;

    if (confirm('Supprimer cette règle ?')) {
      this.regleService.delete(id).subscribe({
        next: () => this.loadRegles(),
        error: (err) => console.error(err)
      });
    }
  }

  // ================= TRACK =================
  trackById(index: number, item: any): number {
    return item?.id ?? index;
  }

  trackByIndex(index: number): number {
    return index;
  }
}