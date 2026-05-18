import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrls: ['./import.css']
})
export class ImportComponent implements OnInit {

  activeTab: 'demarrer' | 'taches' | 'instances' = 'demarrer';

  loading = false;

  message = '';
  messageType: 'success' | 'error' | '' = '';

  demande = {
    dossierId: '',
    importateur: '',
    paysOrigine: '',
    typeProduit: '',
    nomDossier: '',
    codeSH: '',
    quantite: 0,
    fournisseur: ''
  };

  taches: any[] = [
    {
      taskId: '1',
      taskName: 'Pré-dédouanement',
      phase: 'Pré-dédouanement',
      assignee: 'Agent Import',
      processInstanceId: 'PROC-001'
    },
    {
      taskId: '2',
      taskName: 'Prise en charge',
      phase: 'Prise en charge',
      assignee: 'Magasinier',
      processInstanceId: 'PROC-002'
    },
    {
      taskId: '3',
      taskName: 'Embarquement',
      phase: 'Embarquement',
      assignee: 'Douane',
      processInstanceId: 'PROC-003'
    }
  ];

  instances: any[] = [
    {
      id: 'INST-001',
      processDefinitionKey: 'import-process',
      startTime: new Date(),
      endTime: null
    }
  ];

  tacheSelectionnee: any = null;

  formData: any = {};

  variablesInstance: any = null;

  instanceSelectionnee: string | null = null;

  ngOnInit(): void {}

  changerOnglet(tab: 'demarrer' | 'taches' | 'instances'): void {
    this.activeTab = tab;
  }

  demarrerProcessus(): void {
    this.message = '✅ Processus démarré avec succès';
    this.messageType = 'success';
  }

  resetDemande(): void {
    this.demande = {
      dossierId: '',
      importateur: '',
      paysOrigine: '',
      typeProduit: '',
      nomDossier: '',
      codeSH: '',
      quantite: 0,
      fournisseur: ''
    };
  }

  selectionnerTache(tache: any): void {
    this.tacheSelectionnee = tache;
  }

  completerTache(): void {
    this.message = '✅ Tâche complétée';
    this.messageType = 'success';
    this.tacheSelectionnee = null;
  }

  annulerTache(): void {
    this.tacheSelectionnee = null;
  }

  voirVariables(id: string): void {

    this.instanceSelectionnee = id;

    this.variablesInstance = {
      importateur: 'ABC Import',
      paysOrigine: 'France',
      typeProduit: 'Électronique',
      phase: 'Pré-dédouanement'
    };
  }

  fermerVariables(): void {
    this.variablesInstance = null;
  }

  formatDate(date: any): string {

    if (!date) return '—';

    return new Date(date).toLocaleString('fr-FR');
  }

  getPhaseColor(phase: string): string {

    switch (phase) {

      case 'Pré-dédouanement':
        return '#3b82f6';

      case 'Prise en charge':
        return '#10b981';

      case 'Embarquement':
        return '#f59e0b';

      default:
        return '#6b7280';
    }
  }

  get instancesEnCours(): number {
    return this.instances.filter(i => !i.endTime).length;
  }

  get instancesTerminees(): number {
    return this.instances.filter(i => i.endTime).length;
  }
}