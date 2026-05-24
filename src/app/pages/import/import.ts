import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportService } from '../../core/services/import.service';
import { DossierImport, StatutDossier } from '../../models/import.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrls: ['./import.css'],
})
export class ImportComponent implements OnInit {

  activeTab: 'nouveau' | 'mes-dossiers' = 'nouveau';

  // ── Formulaire nouveau dossier ───────────────────────────
  dossier: DossierImport = this.dossierVide();

  // ── Liste dossiers ───────────────────────────────────────
  dossiers: DossierImport[] = [];
  loadingDossiers = false;
  filtre: 'TOUS' | StatutDossier = 'TOUS';

  // ── Détail ───────────────────────────────────────────────
  dossierSelectionne: DossierImport | null = null;

  // ── État UI ──────────────────────────────────────────────
  loading = false;
  message = '';
  messageType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(private importService: ImportService) {}

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
    if (!this.dossier.importateur || !this.dossier.paysOrigine || !this.dossier.typeProduit) {
      this.showMessage('Veuillez remplir les champs obligatoires', 'warning');
      return;
    }
    this.loading = true;
    this.importService.creerDossier(this.dossier).subscribe({
      next: () => {
        this.loading = false;
        this.showMessage('Dossier soumis avec succès !', 'success');
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
    this.importService.getDossiers().subscribe({
      next: (data) => { this.dossiers = data; this.loadingDossiers = false; },
      error: () => { this.loadingDossiers = false; },
    });
  }

  voirDossier(d: DossierImport): void { this.dossierSelectionne = d; }
  fermerDetail(): void                { this.dossierSelectionne = null; }

  // ── Filtres ───────────────────────────────────────────────
  get dossiersFiltres(): DossierImport[] {
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
  private dossierVide(): DossierImport {
    return {
      importateur: '',
      paysOrigine: '',
      typeProduit: '',
      quantite: 0,
      valeur: '',
      codeSH: '',
      fournisseur: '',
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
      'N° Dossier':    d.numeroDossier || d.id || '—',
      'Importateur':   d.importateur,
      'Type produit':  d.typeProduit,
      'Pays origine':  d.paysOrigine,
      'Fournisseur':   d.fournisseur || '—',
      'Quantité':      d.quantite ?? '—',
      'Valeur':        d.valeur || '—',
      'Code SH':       d.codeSH || '—',
      'Date dépôt':    this.formatDate(d.dateDepot),
      'Statut':        this.getStatutInfo(d.statut).label,
      'Commentaire':   d.commentaire || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dossiers Import');
    XLSX.writeFile(wb, `dossiers-import-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Liste des dossiers d\'importation', 14, 15);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — Filtre : ${this.filtre}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['N° Dossier', 'Importateur', 'Produit', 'Pays origine', 'Date dépôt', 'Statut']],
      body: this.dossiersFiltres.map(d => [
        d.numeroDossier || d.id || '—',
        d.importateur,
        d.typeProduit,
        d.paysOrigine,
        this.formatDate(d.dateDepot),
        this.getStatutInfo(d.statut).label,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`dossiers-import-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
