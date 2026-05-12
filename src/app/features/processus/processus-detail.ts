import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProcessusService } from '../../core/services/processus.service';
import { Processus } from '../../models/processus.model';
import { Tache } from '../../models/tache.model';
import { TacheFormComponent } from './tache-form/tache-form';

@Component({
  selector: 'app-detail-processus',
  standalone: true,
  imports: [CommonModule, FormsModule, TacheFormComponent],
  templateUrl: './detail-processus.html',
  styleUrls: ['./processus-detail.css']
})
export class DetailProcessusComponent implements OnInit {

  processus: Processus | null = null;
  taches: Tache[] = [];

  loading = false;
  error = '';

  selectedTacheIndex: number | null = null;

  @ViewChild('tacheForm')
  tacheFormComponent!: TacheFormComponent;

  constructor(
    private route: ActivatedRoute,
    private service: ProcessusService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 Component INIT');
    this.loadProcessus();
  }

  // =========================
  // LOAD PROCESSUS + LOGS
  // =========================
  loadProcessus(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    console.log('📌 ID reçu depuis URL:', id);

    if (!id || id <= 0) {
      console.error('❌ ID invalide:', id);
      this.error = 'ID invalide';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('📡 Appel API getById...');

    this.service.getById(id).subscribe({
      next: (data) => {

        console.log('✅ DATA REÇUE:', data);

        if (!data) {
          console.warn('⚠️ Data vide');
        }

        this.processus = data;
        this.taches = data?.taches ?? [];

        console.log('📋 Tâches chargées:', this.taches.length);

        this.loading = false;
      },

      error: (err) => {
        console.error('❌ ERREUR HTTP:', err);
        this.error = err.message || 'Erreur chargement';
        this.loading = false;
      },

      complete: () => {
        console.log('🏁 REQUEST COMPLETE');
        this.loading = false;
      }
    });
  }

  // =========================
  // ADD / UPDATE
  // =========================
  onAddTache(tache: Tache) {

    console.log('➕ onAddTache:', tache);

    if (!this.processus?.id) {
      console.warn('⚠️ Processus ID manquant');
      return;
    }

    this.loading = true;

    if (this.selectedTacheIndex !== null) {

      const tacheId = this.taches[this.selectedTacheIndex]?.id;

      console.log('✏️ UPDATE TACHE ID:', tacheId);

      if (!tacheId) return;

      this.service.updateTache(this.processus.id, tacheId, tache)
        .subscribe({
          next: () => {
            console.log('✅ UPDATE OK');
            this.loadProcessus();
            this.cancelEdit();
          },
          error: (err) => {
            console.error('❌ UPDATE ERROR:', err);
            this.error = 'Erreur update tâche';
            this.loading = false;
          }
        });

    } else {

      console.log('🟢 ADD TACHE');

      this.service.addTache(this.processus.id, tache)
        .subscribe({
          next: () => {
            console.log('✅ ADD OK');
            this.loadProcessus();
          },
          error: (err) => {
            console.error('❌ ADD ERROR:', err);
            this.error = 'Erreur ajout tâche';
            this.loading = false;
          }
        });
    }
  }

  // =========================
  // EDIT
  // =========================
  editTache(tache: Tache): void {

    console.log('✏️ EDIT TACHE:', tache);

    if (!tache.id) return;

    this.selectedTacheIndex = this.taches.findIndex(t => t.id === tache.id);

    console.log('📍 Index sélectionné:', this.selectedTacheIndex);

    if (this.selectedTacheIndex !== -1) {
      this.tacheFormComponent.setTache({ ...tache });
    }
  }

  // =========================
  // DELETE
  // =========================
  deleteTache(tache: Tache): void {

    console.log('🗑 DELETE TACHE:', tache);

    if (!tache.id || !confirm('Supprimer ?')) return;

    this.loading = true;

    this.service.deleteTache(tache.id).subscribe({
      next: () => {
        console.log('✅ DELETE OK');
        this.taches = this.taches.filter(t => t.id !== tache.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ DELETE ERROR:', err);
        this.error = 'Erreur suppression';
        this.loading = false;
      }
    });
  }

  // =========================
  // CANCEL
  // =========================
  cancelEdit(): void {
    console.log('❎ CANCEL EDIT');
    this.selectedTacheIndex = null;

    if (this.tacheFormComponent) {
      this.tacheFormComponent.resetForm();
    }
  }

  // =========================
  // TOGGLE
  // =========================
  toggleActif(): void {

    console.log('🔁 TOGGLE ACTIF');

    if (!this.processus?.id) return;

    this.loading = true;

    this.service.activer(this.processus.id).subscribe({
      next: (updated) => {

        console.log('✅ TOGGLE OK:', updated);

        if (this.processus) {
          this.processus.actif = updated.actif;
        }

        this.loading = false;
      },

      error: (err) => {
        console.error('❌ TOGGLE ERROR:', err);
        this.error = 'Erreur toggle';
        this.loading = false;
      }
    });
  }

  // =========================
  // BACK
  // =========================
  goBack(): void {
    console.log('⬅ BACK');
    this.router.navigate(['/processus']);
  }
}