import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProcessusService } from '../../core/services/processus.service';
import { BpmnViewerComponent } from '../bpmn-viewer/bpmn-viewer';  // ← Chemin CORRECT

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BpmnViewerComponent   // ← Important
  ],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css']
})
export class TaskListComponent implements OnInit {

  tasks: any[] = [];
  searchText: string = '';
  filterStatus: string = '';
  selectedTask: any = null;

  constructor(private service: ProcessusService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks() {
    this.service.getCamundaTasks().subscribe({
      next: (data: any[]) => {
        this.tasks = data || [];
      },
      error: (err) => console.error('Erreur chargement tâches', err)
    });
  }

  // Cliquer sur "Voir Workflow"
  selectAndShowWorkflow(task: any) {
    this.selectedTask = task;
  }

  // Ouvrir dans l'ancienne interface Camunda
  openInCamundaTasklist(taskId: string) {
    window.open(`http://localhost:8081/camunda/app/tasklist/default/#/task/${taskId}`, '_blank');
  }

  filteredTasks() {
    return this.tasks.filter(task => {
      const name = (task.name || '').toLowerCase();
      const matchSearch = name.includes(this.searchText.toLowerCase());
      const status = this.getStatus(task);
      const matchFilter = !this.filterStatus || status === this.filterStatus;
      return matchSearch && matchFilter;
    });
  }

  getStatus(task: any): string {
    const name = (task.name || '').toLowerCase();
    if (name.includes('validation')) return 'encours';
    if (name.includes('examen')) return 'attente';
    return 'nouveau';
  }

  getStatusLabel(task: any): string {
    const s = this.getStatus(task);
    if (s === 'encours') return 'En cours';
    if (s === 'attente') return 'En attente';
    return 'Nouveau';
  }

  getStatusClass(task: any): string {
    const s = this.getStatus(task);
    if (s === 'encours') return 'status-green';
    if (s === 'attente') return 'status-yellow';
    return 'status-blue';
  }
}