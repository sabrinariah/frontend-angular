import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';        // ✅ AJOUT
import { CommonModule } from '@angular/common';      // ✅ AJOUT

import { ImportService } from '../../core/services/import.service';
import { DemandeImport, TacheImport } from '../../models/import.model';

@Component({
  selector: 'app-import',
  standalone: true, // ✅ AJOUT IMPORTANT
  imports: [CommonModule, FormsModule], // ✅ AJOUT IMPORTANT
  templateUrl: './import.html',
  styleUrls: ['./import.css']
})
export class ImportComponent implements OnInit {

  // ── État ──────────────────────────────────────────
  etapeActive = 1;
  processInstanceId = '';
  taches: TacheImport[] = [];
  variables: any = {};
  message = '';
  loading = false;

  // ── Formulaire étape 1 ────────────────────────────
  demande: DemandeImport = {
    importateur: '',
    paysOrigine: '',
    typeProduit: ''
  };

  // ── Formulaire étape 2 ────────────────────────────
  details = {
    quantite: 0,
    valeur: '',
    codeSH: '',
    origineFinale: '',
    fournisseur: ''
  };

  // ── Formulaire inspection ─────────────────────────
  inspection = {
    resultatInspection: '',
    conformeMarchandise: 'oui',
    observations: ''
  };

  // ── Formulaire paiement ───────────────────────────
  paiement = {
    referencePaiement: '',
    montantPaye: '',
    datePaiement: ''
  };

  constructor(private importService: ImportService) {}

  ngOnInit(): void {
    this.chargerTaches();
  }

  demarrerProcessus(): void {
    this.loading = true;
    this.importService.demarrerImport(this.demande).subscribe({
      next: (res) => {
        this.processInstanceId = res.processInstanceId;
        this.message = '✅ Processus import démarré !';
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

  chargerTaches(): void {
    this.importService.getTaches().subscribe({
      next: (taches) => { this.taches = taches; },
      error: (err) => { console.error(err); }
    });
  }

  completerDetails(): void {
    if (this.taches.length === 0) return;
    const taskId = this.taches[0].taskId;
    this.loading = true;
    this.importService.completerTache(taskId, this.details).subscribe({
      next: () => {
        this.message = '✅ Détails enregistrés !';
        this.etapeActive = 3;
        this.chargerTaches();
        this.loading = false;
      },
      error: (err) => {
        this.message = '❌ Erreur : ' + err.message;
        this.loading = false;
      }
    });
  }

  completerInspection(): void {
    if (this.taches.length === 0) return;
    const taskId = this.taches[0].taskId;
    this.loading = true;
    this.importService.completerTache(taskId, this.inspection).subscribe({
      next: () => {
        this.message = '✅ Inspection complétée !';
        this.etapeActive = 4;
        this.chargerTaches();
        this.chargerVariables();
        this.loading = false;
      },
      error: (err) => {
        this.message = '❌ Erreur : ' + err.message;
        this.loading = false;
      }
    });
  }

  completerPaiement(): void {
    if (this.taches.length === 0) return;
    const taskId = this.taches[0].taskId;
    this.loading = true;
    this.importService.completerTache(taskId, this.paiement).subscribe({
      next: () => {
        this.message = '🎉 Dossier import validé !';
        this.etapeActive = 5;
        this.chargerVariables();
        this.loading = false;
      },
      error: (err) => {
        this.message = '❌ Erreur : ' + err.message;
        this.loading = false;
      }
    });
  }
chargerVariables(): void {

  if (!this.processInstanceId) return;

  this.importService.getVariables(this.processInstanceId).subscribe({
    next: (vars) => {

      console.log("VARIABLES CAMUNDA:", vars);

      this.variables = {
        totalFrais: vars.totalFrais?.value,
        importateur: vars.importateur?.value,
        paysOrigine: vars.paysOrigine?.value,
        typeProduit: vars.typeProduit?.value
      };
    },
    error: (err) => console.error(err)
  });
}
}