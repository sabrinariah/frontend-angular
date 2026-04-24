import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProcessusService } from '../../core/services/processus.service';
import { TacheService } from '../../core/services/tache.service';

import { Processus } from '../../models/processus.model';
import { TacheFormComponent } from './tache-form/tache-form';

@Component({
  selector: 'app-processus-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TacheFormComponent
  ],
  templateUrl: './processus-list.html',
  styleUrls: ['./processus-list.css']
})
export class ProcessusListComponent implements OnInit {

  processusList: Processus[] = [];
  loading = false;
  error = '';
  message: string | null = null;

  selectedProcessus: Processus | null = null;
  selectedProcessusForTacheId: number | null = null;

  // 🔍 SEARCH
  searchTerm: string = '';

  constructor(
    private service: ProcessusService,
    private tacheService: TacheService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProcessus();
  }

  loadProcessus(): void {
    this.loading = true;

    this.service.getAll().subscribe({
      next: (data) => {
        this.processusList = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement';
        this.loading = false;
      }
    });
  }

  // 🔍 FILTER
  filteredProcessus(): Processus[] {
    if (!this.searchTerm) return this.processusList;

    const term = this.searchTerm.toLowerCase();

    return this.processusList.filter(p =>
      p.nom?.toLowerCase().includes(term) ||
      p.typeProcessus?.toLowerCase().includes(term)
    );
  }

  detail(id: number): void {
    this.selectedProcessus =
      this.processusList.find(p => p.id === id) || null;
  }

  closePopup(): void {
    this.selectedProcessus = null;
  }

  openTache(p: Processus): void {
    this.selectedProcessusForTacheId = p.id!;
  }

  closeTache(): void {
    this.selectedProcessusForTacheId = null;
  }

  onTacheAdded(tache: any): void {
    if (!this.selectedProcessusForTacheId) return;

    this.tacheService.create(this.selectedProcessusForTacheId, tache)
      .subscribe({
        next: () => {
          this.showMessage('Tâche ajoutée avec succès');
          this.closeTache();
        },
        error: () => {
          this.showMessage('Erreur création tâche');
        }
      });
  }

  ajouter(): void {
    this.router.navigate(['/processus/new']);
  }

  modifier(id: number): void {
    this.router.navigate(['/processus', id, 'edit']);
  }

  supprimer(id: number): void {
    if (!confirm('Supprimer ce processus ?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.loadProcessus();
        this.showMessage('Processus supprimé');
      },
      error: () => {
        this.showMessage('Erreur suppression');
      }
    });
  }

  toggle(id: number): void {
    this.service.toggleProcessus(id).subscribe({
      next: () => {
        this.loadProcessus();
        this.showMessage('Statut modifié');
      },
      error: () => {
        this.showMessage('Erreur toggle');
      }
    });
  }

  private showMessage(msg: string): void {
    this.message = msg;
    setTimeout(() => this.message = null, 3000);
  }

  goBack(): void {
    this.router.navigate(['/processus']);
  }
  // Ajoutez ces méthodes utilitaires dans votre composant TypeScript

getActifCount(): number {
  return this.filteredProcessus().filter(p => p.actif).length;
}

getInactifCount(): number {
  return this.filteredProcessus().filter(p => !p.actif).length;
}
}