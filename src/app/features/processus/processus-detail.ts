import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  loading = true;
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
    this.loadProcessus();
  }

  loadProcessus(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.service.getById(id).subscribe({
      next: (data) => {
        this.processus = data;
        this.taches = data.taches || [];
        this.loading = false;
      },
      error: () => {
        this.error = "Erreur chargement";
        this.loading = false;
      }
    });
  }

onAddTache(tache: Tache) {
  if (!this.processus?.id) return;

  // 🔥 MODE MODIFICATION
  if (this.selectedTacheIndex !== null) {

    const tacheId = this.taches[this.selectedTacheIndex]?.id;

    if (!tacheId) return;

    this.service.updateTache(this.processus.id, tacheId, tache).subscribe({
      next: () => {
        console.log("UPDATE OK FRONT");
        this.loadProcessus(); // 🔥 recharge depuis le backend
        this.cancelEdit();
      },
      error: (err) => {
        console.error("ERROR UPDATE", err);
      }
    });

  } else {
    // 🔥 MODE AJOUT
    this.service.addTache(this.processus.id, tache).subscribe({
      next: () => this.loadProcessus()
    });
  }
}
  // 🔥 EDIT
  editTache(tache: Tache) {
    this.selectedTacheIndex = this.taches.findIndex(t => t.id === tache.id);

    this.tacheFormComponent.setTache({ ...tache });
  }

  // 🔥 DELETE
  deleteTache(tache: Tache) {
    if (!tache.id) return;

    this.service.deleteTache(tache.id).subscribe(() => {
      this.taches = this.taches.filter(t => t.id !== tache.id);
    });
  }

  // 🔥 CANCEL
  cancelEdit() {
    this.selectedTacheIndex = null;
    this.tacheFormComponent.resetForm();
  }

  toggleActif() {
    if (!this.processus?.id) return;

    this.service.activer(this.processus.id).subscribe(updated => {
      if (this.processus) {
        this.processus.actif = updated.actif;
      }
    });
  }

  goBack(): void {
  this.router.navigate(['/processus']);
}
}