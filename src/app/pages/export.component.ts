import { Component, OnInit } from '@angular/core';
import { ExportService } from '../core/services/export.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './export.html',
  styleUrls: ['./export.css']
})
export class ExportComponent implements OnInit {

  etapeActive = 1;
  processInstanceId = '';
  taches: any[] = [];
  variables: any = {};
  message = '';
  loading = false;

  // Étape 1
  demande = {
    exportateur: '',
    paysDestination: '',
    typeProduit: ''
  };

  // Étape 2
  details = {
    quantite: 0,
    valeur: '',
    codeSH: '',
    destinationFinale: ''
  };

  // Étape 3
  verification = {
    exportAutorise: 'true',
    motifRefus: '',
    observations: ''
  };

  // Étape 4
  frais = {
    confirmation: ''
  };

  // Étape 5
  validationDocs = {
    documentsValides: 'true',
    observations: ''
  };

  constructor(private exportService: ExportService) {}

  ngOnInit(): void {
    this.chargerTaches();
  }

  // ✅ Démarrer processus
  demarrerProcessus(): void {
    this.loading = true;

    this.exportService.demarrerExport(this.demande).subscribe({
      next: (res: any) => {
        this.processInstanceId = res?.processInstanceId;
        this.message = '✅ Processus démarré';
        this.etapeActive = 2;
        this.chargerTaches();
        this.loading = false;
      },
      error: (err) => {
        this.message = '❌ Erreur : ' + err.message;
        this.loading = false;
      }
    });
  }

  // ✅ Charger tâches
  chargerTaches(): void {
    this.exportService.getTaches().subscribe({
      next: (t) => {
        this.taches = t || [];
        console.log("Tâches:", this.taches);
      },
      error: (err) => console.error(err)
    });
  }

  // ✅ Compléter tâche
  completerTacheEtape(variables: any, prochaineEtape: number): void {

    if (!this.taches.length) {
      this.message = '⚠️ Aucune tâche disponible';
      return;
    }

    const taskId = this.taches[0]?.id;

    this.loading = true;

    this.exportService.completerTache(taskId, variables).subscribe({
      next: () => {
        this.message = '✅ Étape validée';
        this.etapeActive = prochaineEtape;
        this.chargerTaches();
        this.loading = false;
      },
      error: (err) => {
        this.message = '❌ Erreur : ' + err.message;
        this.loading = false;
      }
    });
  }

  // ✅ Reset
  reinitialiser(): void {
    this.etapeActive = 1;
    this.message = '';
    this.processInstanceId = '';
    this.variables = {};

    this.demande = {
      exportateur: '',
      paysDestination: '',
      typeProduit: ''
    };

    this.details = {
      quantite: 0,
      valeur: '',
      codeSH: '',
      destinationFinale: ''
    };
  }
}