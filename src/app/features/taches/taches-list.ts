import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ExportService } from '../../core/services/export.service';
import { CamundaTask } from '../../models/export.models';

@Component({
  selector: 'app-taches-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './taches-list.html',
  styleUrls: ['./taches-list.css']
})
export class TachesListComponent implements OnInit {

  // =========================
  // DATA
  // =========================
  taches: CamundaTask[] = [];
  selectedTask: CamundaTask | null = null;

  dialogVisible = false;
  vars: any = {};

  searchText: string = '';
  filterStatus: string = '';

  // état du bouton Valider (évite double-clic)
  isValidating = false;

  constructor(
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // =========================
  // LOAD CAMUNDA TASKS
  // =========================
  load(): void {
    this.exportService.mesTaches().subscribe({
      next: (res) => {
        console.log("🔥 Camunda response =", res);
        this.taches = res || [];
      },
      error: (err) => {
        console.error("❌ Erreur API Camunda =", err);
      }
    });
  }

  // =========================
  // RECLAMER TASK
  // =========================
  reclamer(t: CamundaTask): void {
    if (!t?.id) return;

    this.exportService.reclamerTache(t.id).subscribe({
      next: () => {
        alert('✅ Tâche réclamée avec succès');
        this.load();
      },
      error: (err) => {
        console.error('❌ Erreur claim Camunda :', err);
        alert('Erreur lors de la réclamation : ' + (err.message || 'inconnue'));
      }
    });
  }

  // =========================
  // OUVRIR DIALOG (clic Compléter)
  // =========================
  completerTache(t: CamundaTask): void {
    this.selectedTask = t;
    this.vars = {};            // reset variables
    this.dialogVisible = true;
  }

  // =========================
  // FERMER DIALOG
  // =========================
  fermerDialog(): void {
    this.dialogVisible = false;
    this.selectedTask = null;
    this.vars = {};
    this.isValidating = false;
  }

  // =========================
  // VALIDER (envoie à Camunda)
  // =========================
valider(): void {

  if (!this.selectedTask?.id) return;

  if (this.isValidating) return;

  this.isValidating = true;

  try {

    // 🔥 ouvre la tâche dans Camunda Tasklist
    this.exportService.ouvrirTacheCamunda(this.selectedTask.id);

    console.log('✅ Redirection vers Camunda');

    this.fermerDialog();

  } catch (err: any) {

    console.error('❌ Erreur ouverture Camunda :', err);

    alert(
      'Erreur : ' +
      (err?.message || 'Impossible d’ouvrir la tâche Camunda')
    );

    this.isValidating = false;
  }
}

  // =========================
  // FILTER
  // =========================
  filteredTasks(): CamundaTask[] {
    return this.taches.filter(task => {
      const name = (task.name || '').toLowerCase();
      const matchSearch = name.includes(this.searchText.toLowerCase());

      const status = this.getStatus(task);
      const matchFilter = !this.filterStatus || status === this.filterStatus;

      return matchSearch && matchFilter;
    });
  }

  // =========================
  // STATUS
  // =========================
  getStatus(task: CamundaTask): string {
    const name = (task.name || '').toLowerCase();
    if (name.includes('validation')) return 'encours';
    if (name.includes('examen')) return 'attente';
    return 'nouveau';
  }

  getStatusLabel(task: CamundaTask): string {
    const s = this.getStatus(task);
    if (s === 'encours') return 'En cours';
    if (s === 'attente') return 'En attente';
    return 'Nouveau';
  }

  getStatusClass(task: CamundaTask): string {
    const s = this.getStatus(task);
    if (s === 'encours') return 'encours';
    if (s === 'attente') return 'attente';
    return 'nouveau';
  }

  // =========================
  // VARIABLES DYNAMIQUES (selon taskDefinitionKey)
  // =========================
  hasVariable(name: string): boolean {
    const key = this.selectedTask?.taskDefinitionKey || '';

    if (name === 'documentsComplets') {
      return /Saisie|Empotage|BESC/.test(key);
    }
    if (name === 'controleConforme') {
      return /Controle|Inspection/.test(key);
    }
    if (name === 'paiementEffectue') {
      return /Paiement/.test(key);
    }
    return false;
  }

  // =========================
  // KANBAN (préservé)
  // =========================
  getKanbanColumns() {
    return {
      todo: this.filteredTasks().filter(t => this.getStatus(t) === 'nouveau'),
      inProgress: this.filteredTasks().filter(t => this.getStatus(t) === 'encours'),
      done: this.filteredTasks().filter(t => this.getStatus(t) === 'attente')
    };
  }

  // =========================
  // PAGINATION (préservé)
  // =========================
  page = 1;
  pageSize = 6;

  get paginatedTasks() {
    const tasks = this.filteredTasks();
    const start = (this.page - 1) * this.pageSize;
    return tasks.slice(start, start + this.pageSize);
  }

  nextPage() {
    this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }


ouvrirCamunda(taskId: string) {
  const url = `http://localhost:8081/camunda/app/tasklist/default/#/?task=${taskId}`;
  window.open(url, '_blank');
}
}