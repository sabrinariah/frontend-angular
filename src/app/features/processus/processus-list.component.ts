import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { Processus } from '../../models/processus.model';

@Component({
  selector: 'app-processus-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processus-list.html',
  styleUrls: ['./processus-list.css']
})
export class ProcessusListComponent implements OnInit {

  processusList: Processus[] = [];
  loading: boolean = false;
  error: string = '';
  message: string | null = null;

  constructor(
    private service: ProcessusService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProcessus();
  }

  // 🔹 Charger la liste
  loadProcessus(): void {
    this.loading = true;
    this.error = '';

    this.service.getAll().subscribe({
      next: (data: Processus[]) => {
        this.processusList = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des processus';
        this.loading = false;
      }
    });
  }

  // 🔹 Activer / désactiver
  activer(id: number): void {
    this.service.activer(id).subscribe({
      next: () => {
        this.loadProcessus();
        this.showMessage('Statut mis à jour');
      },
      error: () => {
        this.showMessage('Erreur activation');
      }
    });
  }

  // 🔹 Supprimer
  supprimer(id: number): void {
    if (!confirm('Supprimer ce processus ?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.loadProcessus();
        this.showMessage('Processus supprimé avec succès');
      },
      error: () => {
        this.showMessage('Erreur suppression');
      }
    });
  }

  // 🔹 Modifier
  modifier(id: number): void {
    this.router.navigate(['/processus', id, 'edit']);
  }

  // 🔹 Ajouter
  ajouter(): void {
    this.router.navigate(['/processus/new']);
  }

  // 🔹 Détail
  detail(id: number): void {
    this.router.navigate(['/processus', id]);
  }

  // 🔹 Toggle statut
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

  // 🔹 Message temporaire
  private showMessage(msg: string): void {
    this.message = msg;
    setTimeout(() => this.message = null, 3000);
  }

  // 🔥 Camunda - démarrer processus
  demarrerProcessus(): void {

    const variables = {
      importateur: { value: 'Entreprise X', type: 'String' },
      paysOrigine: { value: 'Tunisie', type: 'String' },
      totalFrais: { value: 1200, type: 'Double' }
    };

    this.service.demarrerProcessus(variables).subscribe({
      next: () => {
        this.showMessage('Processus démarré');
      },
      error: () => {
        this.showMessage('Erreur démarrage processus');
      }
    });
  }
}