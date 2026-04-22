import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-import-export',
  standalone: true,              // ✅ IMPORTANT si Angular 15+
  imports: [
    CommonModule,                // ✔ *ngIf, *ngFor
    FormsModule                  // ✔ ngModel
  ],
  templateUrl: './import-export.component.html',
  styleUrls: ['./import-export.component.css']
})
export class ImportExportComponent {

  // ─────────────────────────────
  // GLOBAL STATE
  // ─────────────────────────────
  modeSelectionne: 'import' | 'export' | null = null;
  etapeActive = 1;
  loading = false;
  message = '';

  // ─────────────────────────────
  // DATA IMPORT / EXPORT
  // ─────────────────────────────
  demande: any = {
    importateur: '',
    paysOrigine: '',
    typeProduit: '',
    exportateur: '',
    paysDestination: ''
  };

  details: any = {
    quantite: null,
    valeur: '',
    codeSH: '',
    destinationFinale: ''
  };

  inspection: any = {
    conformeMarchandise: 'oui'
  };

  paiement: any = {
    referencePaiement: '',
    montantPaye: ''
  };

  verification: any = {
    exportAutorise: 'true',
    motifRefus: ''
  };

  frais: any = {
    confirmation: ''
  };

  validationDocs: any = {
    documentsValides: 'true',
    observations: ''
  };

  variables: any = {
    totalFrais: 0
  };

  // ─────────────────────────────
  // MODE SELECTION
  // ─────────────────────────────
  choisirImport() {
    this.modeSelectionne = 'import';
    this.etapeActive = 1;
    this.message = '';
  }

  choisirExport() {
    this.modeSelectionne = 'export';
    this.etapeActive = 1;
    this.message = '';
  }

  reinitialiser() {
    this.modeSelectionne = null;
    this.etapeActive = 1;
    this.message = '';
  }

  // ─────────────────────────────
  // IMPORT FLOW
  // ─────────────────────────────
  demarrerProcessus() {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.etapeActive = 2;
      this.message = 'Import démarré ✔';
    }, 500);
  }

  completerDetails() {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.etapeActive = 3;
      this.message = 'Détails enregistrés ✔';
    }, 500);
  }

  completerInspection() {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.etapeActive = 4;

      this.variables.totalFrais =
        (Number(this.details.valeur) || 0) * 0.1 + 1000;

      this.message = 'Inspection validée ✔';
    }, 500);
  }

  completerPaiement() {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.etapeActive = 5;
      this.message = 'Paiement confirmé ✔';
    }, 500);
  }

  // ─────────────────────────────
  // EXPORT FLOW
  // ─────────────────────────────
  demarrerProcessusExport() {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.etapeActive = 2;
      this.message = 'Export démarré ✔';
    }, 500);
  }

  completerTacheEtape(data: any, prochaineEtape: number) {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      this.etapeActive = prochaineEtape;

      if (prochaineEtape === 4) {
        this.variables.totalFrais = 2500;
      }

      this.message = 'Étape validée ✔';
    }, 500);
  }
}