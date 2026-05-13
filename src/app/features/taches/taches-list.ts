import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExportService, CamundaTask } from '../../core/services/export.service';

@Component({
  selector: 'app-taches-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="container">
    <h2>Liste des Tâches Camunda</h2>
    <button (click)="load()" class="btn btn-primary">🔄 Rafraîchir</button>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th><th>Nom</th><th>Process Instance</th>
          <th>Assigné à</th><th>Créée</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of taches">
          <td>{{ t.id | slice:0:8 }}</td>
          <td>{{ t.name }}</td>
          <td>{{ t.processInstanceId | slice:0:8 }}</td>
          <td>
            <span *ngIf="t.assignee" class="badge-assignee">{{ t.assignee }}</span>
            <span *ngIf="!t.assignee" class="badge-unassigned">Non assigné</span>
          </td>
          <td>{{ t.created | date:'dd/MM/yyyy HH:mm' }}</td>
          <td>
            <button *ngIf="!t.assignee" (click)="reclamer(t)" class="btn btn-sm btn-info">Réclamer</button>
            <button (click)="ouvrirCamunda(t.id)" class="btn btn-sm btn-warning">Ouvrir</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div *ngIf="taches.length === 0 && !loading" class="empty-message">
      <p>Aucune tâche disponible</p>
    </div>

    <div *ngIf="loading" class="loading-message">
      <p>Chargement des tâches...</p>
    </div>

    <div *ngIf="error" class="error-message">
      <p>{{ error }}</p>
    </div>
  </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .table th, .table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    .table th { background: #f4f4f4; }
    .btn { padding: 6px 12px; margin: 2px; border: none; cursor: pointer; border-radius: 4px; text-decoration: none; display: inline-block; color: white; }
    .btn-primary { background: #007bff; }
    .btn-warning { background: #ffc107; color: black; }
    .btn-info { background: #17a2b8; }
    .btn-sm { font-size: 12px; padding: 4px 8px; }
    .badge-assignee { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; }
    .badge-unassigned { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; }
    .empty-message { text-align: center; padding: 40px; color: #888; }
    .loading-message { text-align: center; padding: 40px; color: #17a2b8; }
    .error-message { text-align: center; padding: 20px; color: #dc3545; background: #f8d7da; border-radius: 4px; }
  `]
})
export class TachesListComponent implements OnInit {
  private exportService = inject(ExportService);

  taches: CamundaTask[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.exportService.mesTaches().subscribe({
      next: (data) => {
        this.taches = data || [];
        this.loading = false;
        console.log('✅ Tâches chargées:', this.taches.length);
      },
      error: (err) => {
        console.error('❌ Erreur chargement tâches:', err);
        this.error = 'Impossible de charger les tâches.';
        this.loading = false;
      }
    });
  }

  reclamer(task: CamundaTask): void {
    this.exportService.reclamerTache(task.id).subscribe({
      next: () => {
        console.log('✅ Tâche réclamée');
        this.load();
      },
      error: (err) => {
        console.error('❌ Erreur réclamation:', err);
        this.error = 'Impossible de réclamer la tâche.';
      }
    });
  }

  ouvrirCamunda(taskId: string): void {
    this.exportService.ouvrirTacheCamunda(taskId);
  }
}

