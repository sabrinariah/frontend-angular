import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../core/services/export.service';
import { DossierExport, StatutDossier } from '../models/export.models';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export.html',
  styleUrls: ['./export.css'],
})
export class ExportComponent implements OnInit {

  activeTab: 'nouveau' | 'mes-dossiers' = 'nouveau';

  // ── Formulaire nouveau dossier ───────────────────────────
  dossier: DossierExport = this.dossierVide();

  // ── Liste dossiers ───────────────────────────────────────
  dossiers: DossierExport[] = [];
  loadingDossiers = false;
  filtre: 'TOUS' | StatutDossier = 'TOUS';

  // ── Détail ───────────────────────────────────────────────
  dossierSelectionne: DossierExport | null = null;

  // ── État UI ──────────────────────────────────────────────
  loading = false;
  message = '';
  messageType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(private exportService: ExportService) {}

  ngOnInit(): void {
    this.chargerDossiers();
  }

  changerOnglet(tab: 'nouveau' | 'mes-dossiers'): void {
    this.activeTab = tab;
    if (tab === 'mes-dossiers') this.chargerDossiers();
  }

  // ── Créer un dossier ──────────────────────────────────────
  soumettreDossier(): void {
    if (this.loading) return;
    if (!this.dossier.exportateur || !this.dossier.paysDestination || !this.dossier.typeProduit) {
      this.showMessage('Veuillez remplir les champs obligatoires', 'warning');
      return;
    }
    this.loading = true;
    this.exportService.creerDossier(this.dossier).subscribe({
      next: () => {
        this.loading = false;
        this.showMessage('Dossier soumis avec succes !', 'success');
        this.dossier = this.dossierVide();
        this.chargerDossiers();
        this.activeTab = 'mes-dossiers';
      },
      error: (err) => this.handleError(err),
    });
  }

  // ── Charger la liste ──────────────────────────────────────
  chargerDossiers(): void {
    this.loadingDossiers = true;
    this.exportService.getDossiers().subscribe({
      next: (data) => { this.dossiers = data; this.loadingDossiers = false; },
      error: () => { this.loadingDossiers = false; },
    });
  }

  voirDossier(d: DossierExport): void { this.dossierSelectionne = d; }
  fermerDetail(): void                { this.dossierSelectionne = null; }

  // ── Filtres ───────────────────────────────────────────────
  get dossiersFiltres(): DossierExport[] {
    if (this.filtre === 'TOUS') return this.dossiers;
    return this.dossiers.filter(d => d.statut === this.filtre);
  }

  get nbEnAttente(): number { return this.dossiers.filter(d => d.statut === 'EN_ATTENTE').length; }
  get nbEnCours(): number   { return this.dossiers.filter(d => d.statut === 'EN_COURS').length; }
  get nbValide(): number    { return this.dossiers.filter(d => d.statut === 'VALIDE').length; }
  get nbRefuse(): number    { return this.dossiers.filter(d => d.statut === 'REFUSE').length; }

  getStatutInfo(statut: StatutDossier | undefined): { label: string; cls: string } {
    switch (statut) {
      case 'EN_ATTENTE': return { label: 'En attente', cls: 'attente' };
      case 'EN_COURS':   return { label: 'En cours',   cls: 'encours' };
      case 'VALIDE':     return { label: 'Approuve',   cls: 'valide'  };
      case 'REFUSE':     return { label: 'Refuse',     cls: 'refuse'  };
      default:           return { label: 'Inconnu',    cls: 'attente' };
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  private dossierVide(): DossierExport {
    return {
      exportateur: '',
      paysDestination: '',
      typeProduit: '',
      quantite: 0,
      valeurFOB: 0,
      codeSH: '',
      destinationFinale: '',
      deviseFacture: 'USD',
      dateDepot: new Date().toISOString().split('T')[0],
    };
  }

  showMessage(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }

  private handleError(err: any): void {
    this.loading = false;
    this.showMessage('Erreur : ' + (err?.message || 'Erreur inconnue'), 'error');
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return '—';
    try { return new Date(dateValue).toLocaleDateString('fr-FR'); }
    catch { return String(dateValue); }
  }

  exportExcel(): void {
    const rows = this.dossiersFiltres.map(d => ({
      'N° Dossier':       d.numeroDossier || d.id || '—',
      'Exportateur':      d.exportateur,
      'Type produit':     d.typeProduit,
      'Pays destination': d.paysDestination,
      'Destination finale': d.destinationFinale || '—',
      'Valeur FOB':       d.valeurFOB ?? '—',
      'Devise':           d.deviseFacture || '—',
      'Code SH':          d.codeSH || '—',
      'Date dépôt':       this.formatDate(d.dateDepot),
      'Statut':           this.getStatutInfo(d.statut).label,
      'Commentaire':      d.commentaire || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dossiers Export');
    XLSX.writeFile(wb, `dossiers-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Liste des dossiers d\'exportation', 14, 15);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — Filtre : ${this.filtre}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['N° Dossier', 'Exportateur', 'Produit', 'Destination', 'Date dépôt', 'Statut']],
      body: this.dossiersFiltres.map(d => [
        d.numeroDossier || d.id || '—',
        d.exportateur,
        d.typeProduit,
        d.paysDestination,
        this.formatDate(d.dateDepot),
        this.getStatutInfo(d.statut).label,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 174, 96] },
    });

    doc.save(`dossiers-export-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
