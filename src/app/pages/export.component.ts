import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../core/services/export.service';
import { DossierExport } from '../models/export.models';
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

  // ── Formulaire nouveau dossier
  dossier: DossierExport = this.dossierVide();
  erreurs: Partial<Record<keyof DossierExport, string>> = {};

  // ── Liste dossiers
  dossiers: DossierExport[] = [];
  loadingDossiers = false;
  recherche = '';

  // ── Modal
  dossierSelectionne: DossierExport | null = null;
  dossierEdition: DossierExport | null = null;
  modeEdition = false;
  confirmSuppression = false;

  // ── État UI
  loading = false;
  loadingAction = false;
  message = '';
  messageType: 'success' | 'error' | 'warning' | 'info' = 'info';

  readonly UNITES = ['kg', 'tonnes', 'litres', 'pièces', 'cartons', 'conteneurs', 'm³'];
  readonly DEVISES = ['USD', 'EUR', 'GBP', 'XOF', 'MAD', 'DZD', 'TND'];

  constructor(private exportService: ExportService) {}

  ngOnInit(): void {
    this.chargerDossiers();
  }

  changerOnglet(tab: 'nouveau' | 'mes-dossiers'): void {
    this.activeTab = tab;
    if (tab === 'mes-dossiers') this.chargerDossiers();
  }

  // ── Créer un dossier
  soumettreDossier(): void {
    if (this.loading) return;
    if (!this.validerFormulaire()) return;
    this.loading = true;
    this.exportService.creerDossier(this.dossier).subscribe({
      next: () => {
        this.loading = false;
        this.showMessage('Dossier soumis avec succès !', 'success');
        this.dossier = this.dossierVide();
        this.erreurs = {};
        this.chargerDossiers();
        this.activeTab = 'mes-dossiers';
      },
      error: (err) => this.handleError(err),
    });
  }

  reinitialiserFormulaire(): void {
    this.dossier = this.dossierVide();
    this.erreurs = {};
  }

  // ── Charger la liste
  chargerDossiers(): void {
    this.loadingDossiers = true;
    this.exportService.getDossiers().subscribe({
      next: (data) => { this.dossiers = data; this.loadingDossiers = false; },
      error: () => { this.loadingDossiers = false; },
    });
  }

  // ── Recherche
  get dossiersFiltres(): DossierExport[] {
    if (!this.recherche.trim()) return this.dossiers;
    const q = this.recherche.toLowerCase();
    return this.dossiers.filter(d =>
      d.exportateur?.toLowerCase().includes(q) ||
      d.paysDestination?.toLowerCase().includes(q) ||
      d.typeProduit?.toLowerCase().includes(q) ||
      d.numeroDossier?.toLowerCase().includes(q) ||
      d.codeSH?.toLowerCase().includes(q)
    );
  }

  // ── Stats
  get totalDossiers(): number { return this.dossiers.length; }

  get valeurFOBTotale(): number {
    return this.dossiers.reduce((s, d) => s + (d.valeurFOB || 0), 0);
  }

  get paysDistincts(): number {
    return new Set(this.dossiers.map(d => d.paysDestination).filter(Boolean)).size;
  }

  get dossiersCeMois(): number {
    const now = new Date();
    return this.dossiers.filter(d => {
      if (!d.dateDepot) return false;
      const dt = new Date(d.dateDepot);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
  }

  // ── Détail
  voirDossier(d: DossierExport): void {
    this.dossierSelectionne = d;
    this.modeEdition = false;
    this.confirmSuppression = false;
  }

  fermerDetail(): void {
    this.dossierSelectionne = null;
    this.dossierEdition = null;
    this.modeEdition = false;
    this.confirmSuppression = false;
  }

  // ── Edition
  activerEdition(): void {
    if (!this.dossierSelectionne) return;
    this.dossierEdition = { ...this.dossierSelectionne };
    this.modeEdition = true;
  }

  annulerEdition(): void {
    this.modeEdition = false;
    this.dossierEdition = null;
  }

  sauvegarderEdition(): void {
    if (!this.dossierEdition || this.loadingAction) return;
    const id = this.dossierEdition.id;
    if (!id) return;
    if (!this.dossierEdition.exportateur?.trim() || !this.dossierEdition.paysDestination?.trim() || !this.dossierEdition.typeProduit?.trim()) {
      this.showMessage('Champs obligatoires manquants', 'warning');
      return;
    }
    this.loadingAction = true;
    this.exportService.updateDossier(id, this.dossierEdition).subscribe({
      next: (updated) => {
        this.loadingAction = false;
        const idx = this.dossiers.findIndex(d => d.id === id);
        if (idx !== -1) this.dossiers[idx] = updated;
        this.dossierSelectionne = updated;
        this.modeEdition = false;
        this.dossierEdition = null;
        this.showMessage('Dossier mis à jour avec succès !', 'success');
      },
      error: (err) => { this.loadingAction = false; this.handleError(err); },
    });
  }

  // ── Suppression
  demanderSuppression(): void  { this.confirmSuppression = true; }
  annulerSuppression(): void   { this.confirmSuppression = false; }

  confirmerSuppression(): void {
    if (!this.dossierSelectionne?.id || this.loadingAction) return;
    this.loadingAction = true;
    this.exportService.deleteDossier(this.dossierSelectionne.id).subscribe({
      next: () => {
        this.loadingAction = false;
        this.dossiers = this.dossiers.filter(d => d.id !== this.dossierSelectionne?.id);
        this.fermerDetail();
        this.showMessage('Dossier supprimé avec succès.', 'info');
      },
      error: (err) => { this.loadingAction = false; this.handleError(err); },
    });
  }

  // ── Duplication
  dupliquerDossier(d: DossierExport): void {
    this.dossier = {
      exportateur:      d.exportateur,
      paysDestination:  d.paysDestination,
      typeProduit:      d.typeProduit,
      quantite:         d.quantite,
      unite:            d.unite,
      valeurFOB:        d.valeurFOB,
      codeSH:           d.codeSH,
      destinationFinale: d.destinationFinale,
      deviseFacture:    d.deviseFacture,
      dateDepot:        new Date().toISOString().split('T')[0],
    };
    this.fermerDetail();
    this.activeTab = 'nouveau';
    this.showMessage('Données copiées. Modifiez puis soumettez.', 'info');
  }

  // ── Validation
  private validerFormulaire(): boolean {
    this.erreurs = {};
    if (!this.dossier.exportateur?.trim())
      this.erreurs.exportateur = 'Champ obligatoire';
    if (!this.dossier.paysDestination?.trim())
      this.erreurs.paysDestination = 'Champ obligatoire';
    if (!this.dossier.typeProduit?.trim())
      this.erreurs.typeProduit = 'Champ obligatoire';
    if (this.dossier.quantite !== undefined && this.dossier.quantite !== null && this.dossier.quantite < 0)
      this.erreurs.quantite = 'La quantité doit être positive';
    if (this.dossier.valeurFOB !== undefined && this.dossier.valeurFOB !== null && this.dossier.valeurFOB < 0)
      this.erreurs.valeurFOB = 'La valeur FOB doit être positive';
    if (this.dossier.codeSH && !/^\d{6,8}$/.test(this.dossier.codeSH))
      this.erreurs.codeSH = 'Le code SH doit contenir 6 à 8 chiffres';
    return Object.keys(this.erreurs).length === 0;
  }

  // ── Helpers
  private dossierVide(): DossierExport {
    return {
      exportateur:     '',
      paysDestination: '',
      typeProduit:     '',
      deviseFacture:   'USD',
      unite:           'kg',
      dateDepot:       new Date().toISOString().split('T')[0],
    };
  }

  showMessage(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 5000);
  }

  private handleError(err: any): void {
    this.loading = false;
    this.loadingAction = false;
    this.showMessage('Erreur : ' + (err?.message || 'Erreur inconnue'), 'error');
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return '—';
    try { return new Date(dateValue).toLocaleDateString('fr-FR'); }
    catch { return String(dateValue); }
  }

  formatNombre(val?: number): string {
    if (val === undefined || val === null || val === 0) return '—';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(val);
  }

  formatFOB(val?: number, devise?: string): string {
    if (!val) return '—';
    const n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(val);
    return devise ? `${n} ${devise}` : n;
  }

  exportExcel(): void {
    const rows = this.dossiersFiltres.map(d => ({
      'N° Dossier':         d.numeroDossier || d.id || '—',
      'Exportateur':        d.exportateur,
      'Type produit':       d.typeProduit,
      'Pays destination':   d.paysDestination,
      'Destination finale': d.destinationFinale || '—',
      'Quantité':           d.quantite ?? '—',
      'Unité':              d.unite || '—',
      'Valeur FOB':         d.valeurFOB ?? '—',
      'Devise':             d.deviseFacture || '—',
      'Code SH':            d.codeSH || '—',
      'Date dépôt':         this.formatDate(d.dateDepot),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dossiers Export');
    XLSX.writeFile(wb, `dossiers-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text("Liste des dossiers d'exportation", 14, 15);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['N° Dossier', 'Exportateur', 'Produit', 'Pays destination', 'Quantité', 'Valeur FOB', 'Date dépôt']],
      body: this.dossiersFiltres.map(d => [
        d.numeroDossier || d.id || '—',
        d.exportateur,
        d.typeProduit,
        d.paysDestination,
        d.quantite ? `${d.quantite} ${d.unite || ''}` : '—',
        d.valeurFOB ? `${d.valeurFOB} ${d.deviseFacture || ''}` : '—',
        this.formatDate(d.dateDepot),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`dossiers-export-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
