import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ============================================================
// INTERFACES — Typage fort pour éviter les "any"
// ============================================================
export interface DemandeImport {
  dossierId: string;
  importateur: string;
  paysOrigine: string;
  typeProduit: string;
  nomDossier: string;
  codeSH: string;
  quantite: number;
  fournisseur: string;
  devise?: string;
  valeurEstimee?: number;
  dateArrivee?: string;
  modeTransport?: 'MARITIME' | 'AERIEN' | 'ROUTIER' | 'FERROVIAIRE';
}

export interface TacheImport {
  taskId: string;
  taskName: string;
  phase: string;
  assignee: string;
  processInstanceId: string;
  priorite?: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  dateCreation?: Date;
  dateEcheance?: Date;
  statut?: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE';
  description?: string;
}

export interface InstanceProcessus {
  id: string;
  processDefinitionKey: string;
  startTime: Date;
  endTime: Date | null;
  importateur?: string;
  phaseActuelle?: string;
  progression?: number; // 0 à 100
  statut?: 'EN_COURS' | 'TERMINE' | 'SUSPENDU' | 'ANNULE';
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrls: ['./import.css']
})
export class ImportComponent implements OnInit, OnDestroy {

  // ============================================================
  // ÉTAT DE L'APPLICATION
  // ============================================================
  activeTab: 'demarrer' | 'taches' | 'instances' = 'demarrer';
  loading = false;
  loadingAction = false; // pour les actions ponctuelles

  // ============================================================
  // SYSTÈME DE TOASTS (au lieu du message simple)
  // ============================================================
  toasts: Toast[] = [];
  private toastIdCounter = 0;
  private toastTimers: Map<number, any> = new Map();

  // ============================================================
  // FORMULAIRE DEMANDE
  // ============================================================
  demande: DemandeImport = this.getEmptyDemande();
  formErrors: { [key: string]: string } = {};

  // Listes de référence
  paysList: string[] = [
    'France', 'Italie', 'Allemagne', 'Espagne', 'Chine',
    'Turquie', 'États-Unis', 'Maroc', 'Algérie', 'Égypte'
  ];

  typesProduit: string[] = [
    'Électronique', 'Textile', 'Alimentaire', 'Pharmaceutique',
    'Automobile', 'Machinerie', 'Chimique', 'Agricole'
  ];

  modesTransport = [
    { value: 'MARITIME', label: '🚢 Maritime' },
    { value: 'AERIEN', label: '✈️ Aérien' },
    { value: 'ROUTIER', label: '🚛 Routier' },
    { value: 'FERROVIAIRE', label: '🚆 Ferroviaire' }
  ];

  devises: string[] = ['EUR', 'USD', 'TND', 'GBP', 'JPY', 'CNY'];

  // ============================================================
  // TÂCHES
  // ============================================================
  taches: TacheImport[] = [];
  tachesFiltrees: TacheImport[] = [];
  tacheSelectionnee: TacheImport | null = null;
  formData: { [key: string]: any } = {};

  // Filtres tâches
  searchTache = '';
  filterPhase = 'TOUTES';
  filterAssignee = 'TOUS';
  filterPriorite = 'TOUTES';

  // ============================================================
  // INSTANCES
  // ============================================================
  instances: InstanceProcessus[] = [];
  instancesFiltrees: InstanceProcessus[] = [];
  variablesInstance: any = null;
  instanceSelectionnee: string | null = null;

  // Filtres instances
  searchInstance = '';
  filterStatutInstance = 'TOUS';

  // Tri
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  pageSize = 10;
  currentPageTaches = 1;
  currentPageInstances = 1;

  // ============================================================
  // CONFIRMATION
  // ============================================================
  showConfirmModal = false;
  confirmAction: (() => void) | null = null;
  confirmTitle = '';
  confirmMessage = '';

  // ============================================================
  // CYCLE DE VIE
  // ============================================================
  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngOnDestroy(): void {
    // Nettoyage des timers de toasts
    this.toastTimers.forEach(timer => clearTimeout(timer));
    this.toastTimers.clear();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  chargerDonnees(): void {
    

    // Simulation d'appel API (à remplacer par votre service réel)
    setTimeout(() => {
      try {
        this.taches = this.getMockTaches();
        this.instances = this.getMockInstances();
        this.appliquerFiltresTaches();
        this.appliquerFiltresInstances();
        this.loading = false;
      } catch (error) {
        this.loading = false;
        this.afficherToast('error', 'Erreur', 'Impossible de charger les données');
      }
    }, 400);
  }

  rafraichir(): void {
    this.chargerDonnees();
    this.afficherToast('info', 'Actualisé', 'Données rafraîchies');
  }

  private getMockTaches(): TacheImport[] {
    return [
      {
        taskId: '1',
        taskName: 'Pré-dédouanement',
        phase: 'Pré-dédouanement',
        assignee: 'Agent Import',
        processInstanceId: 'PROC-001',
        priorite: 'HAUTE',
        dateCreation: new Date('2026-05-15'),
        dateEcheance: new Date('2026-05-20'),
        statut: 'EN_COURS',
        description: 'Vérification des documents douaniers'
      },
      {
        taskId: '2',
        taskName: 'Prise en charge',
        phase: 'Prise en charge',
        assignee: 'Magasinier',
        processInstanceId: 'PROC-002',
        priorite: 'NORMALE',
        dateCreation: new Date('2026-05-16'),
        dateEcheance: new Date('2026-05-22'),
        statut: 'EN_ATTENTE',
        description: 'Réception et stockage de la marchandise'
      },
      {
        taskId: '3',
        taskName: 'Embarquement',
        phase: 'Embarquement',
        assignee: 'Douane',
        processInstanceId: 'PROC-003',
        priorite: 'URGENTE',
        dateCreation: new Date('2026-05-17'),
        dateEcheance: new Date('2026-05-19'),
        statut: 'EN_COURS',
        description: 'Validation douanière finale'
      }
    ];
  }

  private getMockInstances(): InstanceProcessus[] {
    return [
      {
        id: 'INST-001',
        processDefinitionKey: 'import-process',
        startTime: new Date('2026-05-10'),
        endTime: null,
        importateur: 'ABC Import',
        phaseActuelle: 'Pré-dédouanement',
        progression: 35,
        statut: 'EN_COURS'
      },
      {
        id: 'INST-002',
        processDefinitionKey: 'import-process',
        startTime: new Date('2026-04-20'),
        endTime: new Date('2026-05-05'),
        importateur: 'XYZ Trading',
        phaseActuelle: 'Terminé',
        progression: 100,
        statut: 'TERMINE'
      }
    ];
  }

  // ============================================================
  // GESTION ONGLETS
  // ============================================================
  changerOnglet(tab: 'demarrer' | 'taches' | 'instances'): void {
    this.activeTab = tab;
    // Reset des sélections au changement
    this.tacheSelectionnee = null;
    this.variablesInstance = null;
  }

  // ============================================================
  // FORMULAIRE DEMANDE
  // ============================================================
  getEmptyDemande(): DemandeImport {
    return {
      dossierId: '',
      importateur: '',
      paysOrigine: '',
      typeProduit: '',
      nomDossier: '',
      codeSH: '',
      quantite: 0,
      fournisseur: '',
      devise: 'EUR',
      valeurEstimee: 0,
      dateArrivee: '',
      modeTransport: 'MARITIME'
    };
  }

  validerFormulaire(): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!this.demande.dossierId.trim()) {
      this.formErrors['dossierId'] = 'ID du dossier obligatoire';
      isValid = false;
    }

    if (!this.demande.importateur.trim()) {
      this.formErrors['importateur'] = 'Nom de l\'importateur obligatoire';
      isValid = false;
    }

    if (!this.demande.paysOrigine) {
      this.formErrors['paysOrigine'] = 'Pays d\'origine obligatoire';
      isValid = false;
    }

    if (!this.demande.typeProduit) {
      this.formErrors['typeProduit'] = 'Type de produit obligatoire';
      isValid = false;
    }

    if (!this.demande.codeSH.trim()) {
      this.formErrors['codeSH'] = 'Code SH obligatoire';
      isValid = false;
    } else if (!/^\d{4}\.\d{2}\.\d{2}$/.test(this.demande.codeSH)) {
      this.formErrors['codeSH'] = 'Format invalide (ex: 6109.10.00)';
      isValid = false;
    }

    if (this.demande.quantite <= 0) {
      this.formErrors['quantite'] = 'Quantité doit être supérieure à 0';
      isValid = false;
    }

    if (!this.demande.fournisseur.trim()) {
      this.formErrors['fournisseur'] = 'Fournisseur obligatoire';
      isValid = false;
    }

    return isValid;
  }

  demarrerProcessus(): void {
    if (!this.validerFormulaire()) {
      this.afficherToast('error', 'Formulaire invalide', 'Veuillez corriger les erreurs');
      return;
    }

    this.loadingAction = true;

    // Simulation d'appel API
    setTimeout(() => {
      const newInstance: InstanceProcessus = {
        id: 'INST-' + String(this.instances.length + 1).padStart(3, '0'),
        processDefinitionKey: 'import-process',
        startTime: new Date(),
        endTime: null,
        importateur: this.demande.importateur,
        phaseActuelle: 'Pré-dédouanement',
        progression: 0,
        statut: 'EN_COURS'
      };

      this.instances.unshift(newInstance);
      this.appliquerFiltresInstances();

      this.afficherToast(
        'success',
        'Processus démarré',
        `Instance ${newInstance.id} créée pour ${this.demande.importateur}`
      );

      this.resetDemande();
      this.loadingAction = false;
      this.changerOnglet('instances');
    }, 600);
  }

  resetDemande(): void {
    this.demande = this.getEmptyDemande();
    this.formErrors = {};
  }

  // ============================================================
  // GESTION TÂCHES
  // ============================================================
  appliquerFiltresTaches(): void {
    let result = [...this.taches];

    if (this.searchTache.trim()) {
      const term = this.searchTache.toLowerCase();
      result = result.filter(t =>
        t.taskName.toLowerCase().includes(term) ||
        t.assignee.toLowerCase().includes(term) ||
        t.processInstanceId.toLowerCase().includes(term)
      );
    }

    if (this.filterPhase !== 'TOUTES') {
      result = result.filter(t => t.phase === this.filterPhase);
    }

    if (this.filterAssignee !== 'TOUS') {
      result = result.filter(t => t.assignee === this.filterAssignee);
    }

    if (this.filterPriorite !== 'TOUTES') {
      result = result.filter(t => t.priorite === this.filterPriorite);
    }

    this.tachesFiltrees = this.trier(result, this.sortColumn, this.sortDirection);
  }

  resetFiltresTaches(): void {
    this.searchTache = '';
    this.filterPhase = 'TOUTES';
    this.filterAssignee = 'TOUS';
    this.filterPriorite = 'TOUTES';
    this.appliquerFiltresTaches();
  }

  selectionnerTache(tache: TacheImport): void {
    this.tacheSelectionnee = tache;
    this.formData = {};
  }

  completerTache(): void {
    if (!this.tacheSelectionnee) return;

    this.demanderConfirmation(
      'Confirmer la complétion',
      `Êtes-vous sûr de vouloir terminer la tâche "${this.tacheSelectionnee.taskName}" ?`,
      () => {
        this.loadingAction = true;
        setTimeout(() => {
          this.taches = this.taches.filter(t => t.taskId !== this.tacheSelectionnee!.taskId);
          this.appliquerFiltresTaches();
          this.afficherToast(
            'success',
            'Tâche complétée',
            `${this.tacheSelectionnee!.taskName} terminée avec succès`
          );
          this.tacheSelectionnee = null;
          this.loadingAction = false;
        }, 400);
      }
    );
  }

  annulerTache(): void {
    this.tacheSelectionnee = null;
    this.formData = {};
  }

  // ============================================================
  // GESTION INSTANCES
  // ============================================================
  appliquerFiltresInstances(): void {
    let result = [...this.instances];

    if (this.searchInstance.trim()) {
      const term = this.searchInstance.toLowerCase();
      result = result.filter(i =>
        i.id.toLowerCase().includes(term) ||
        (i.importateur?.toLowerCase().includes(term) ?? false)
      );
    }

    if (this.filterStatutInstance !== 'TOUS') {
      result = result.filter(i => i.statut === this.filterStatutInstance);
    }

    this.instancesFiltrees = this.trier(result, this.sortColumn, this.sortDirection);
  }

  resetFiltresInstances(): void {
    this.searchInstance = '';
    this.filterStatutInstance = 'TOUS';
    this.appliquerFiltresInstances();
  }

  voirVariables(id: string): void {
    this.instanceSelectionnee = id;
    const instance = this.instances.find(i => i.id === id);

    this.variablesInstance = {
      importateur: instance?.importateur ?? 'N/A',
      paysOrigine: 'France',
      typeProduit: 'Électronique',
      phase: instance?.phaseActuelle ?? 'N/A',
      progression: instance?.progression ?? 0,
      statut: instance?.statut ?? 'EN_COURS',
      dateDebut: instance?.startTime,
      dateFin: instance?.endTime
    };
  }

  fermerVariables(): void {
    this.variablesInstance = null;
    this.instanceSelectionnee = null;
  }

  suspendreInstance(id: string): void {
    this.demanderConfirmation(
      'Suspendre l\'instance',
      `Voulez-vous suspendre l'instance ${id} ?`,
      () => {
        const instance = this.instances.find(i => i.id === id);
        if (instance) {
          instance.statut = 'SUSPENDU';
          this.appliquerFiltresInstances();
          this.afficherToast('warning', 'Suspendue', `Instance ${id} suspendue`);
        }
      }
    );
  }

  // ============================================================
  // TRI
  // ============================================================
  trierPar(colonne: string): void {
    if (this.sortColumn === colonne) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = colonne;
      this.sortDirection = 'asc';
    }

    if (this.activeTab === 'taches') this.appliquerFiltresTaches();
    if (this.activeTab === 'instances') this.appliquerFiltresInstances();
  }

  private trier<T>(items: T[], colonne: string, direction: 'asc' | 'desc'): T[] {
    if (!colonne) return items;

    return [...items].sort((a: any, b: any) => {
      const valA = a[colonne];
      const valB = b[colonne];

      if (valA == null) return 1;
      if (valB == null) return -1;

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // ============================================================
  // PAGINATION
  // ============================================================
  get tachesPaginees(): TacheImport[] {
    const start = (this.currentPageTaches - 1) * this.pageSize;
    return this.tachesFiltrees.slice(start, start + this.pageSize);
  }

  get instancesPaginees(): InstanceProcessus[] {
    const start = (this.currentPageInstances - 1) * this.pageSize;
    return this.instancesFiltrees.slice(start, start + this.pageSize);
  }

  get totalPagesTaches(): number {
    return Math.ceil(this.tachesFiltrees.length / this.pageSize);
  }

  get totalPagesInstances(): number {
    return Math.ceil(this.instancesFiltrees.length / this.pageSize);
  }

  pageSuivante(type: 'taches' | 'instances'): void {
    if (type === 'taches' && this.currentPageTaches < this.totalPagesTaches) {
      this.currentPageTaches++;
    }
    if (type === 'instances' && this.currentPageInstances < this.totalPagesInstances) {
      this.currentPageInstances++;
    }
  }

  pagePrecedente(type: 'taches' | 'instances'): void {
    if (type === 'taches' && this.currentPageTaches > 1) {
      this.currentPageTaches--;
    }
    if (type === 'instances' && this.currentPageInstances > 1) {
      this.currentPageInstances--;
    }
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================
  get instancesEnCours(): number {
    return this.instances.filter(i => i.statut === 'EN_COURS').length;
  }

  get instancesTerminees(): number {
    return this.instances.filter(i => i.statut === 'TERMINE').length;
  }

  get instancesSuspendues(): number {
    return this.instances.filter(i => i.statut === 'SUSPENDU').length;
  }

  get totalTaches(): number {
    return this.taches.length;
  }

  get tachesUrgentes(): number {
    return this.taches.filter(t => t.priorite === 'URGENTE').length;
  }

  // ============================================================
  // EXPORT EXCEL/CSV
  // ============================================================
  exporterInstances(): void {
    if (this.instancesFiltrees.length === 0) {
      this.afficherToast('warning', 'Export impossible', 'Aucune donnée à exporter');
      return;
    }

    const headers = ['ID', 'Importateur', 'Phase', 'Progression', 'Statut', 'Date Début', 'Date Fin'];
    const rows = this.instancesFiltrees.map(i => [
      i.id,
      i.importateur ?? '',
      i.phaseActuelle ?? '',
      `${i.progression ?? 0}%`,
      i.statut ?? '',
      this.formatDate(i.startTime),
      this.formatDate(i.endTime)
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `instances_import_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.afficherToast('success', 'Export réussi', `${this.instancesFiltrees.length} instance(s) exportée(s)`);
  }

  // ============================================================
  // SYSTÈME DE TOASTS
  // ============================================================
  afficherToast(type: Toast['type'], title: string, message: string, duration = 4000): void {
    const id = ++this.toastIdCounter;
    this.toasts.push({ id, type, title, message });

    const timer = setTimeout(() => this.fermerToast(id), duration);
    this.toastTimers.set(id, timer);
  }

  fermerToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    const timer = this.toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.toastTimers.delete(id);
    }
  }

  // ============================================================
  // CONFIRMATION
  // ============================================================
  demanderConfirmation(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.showConfirmModal = true;
  }

  confirmer(): void {
    if (this.confirmAction) this.confirmAction();
    this.fermerConfirmation();
  }

  fermerConfirmation(): void {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================
  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateCourte(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getPhaseColor(phase: string): string {
    switch (phase) {
      case 'Pré-dédouanement': return '#3b82f6';
      case 'Prise en charge': return '#10b981';
      case 'Embarquement': return '#f59e0b';
      case 'Terminé': return '#6b7280';
      default: return '#6b7280';
    }
  }

  getPrioriteClass(priorite?: string): string {
    switch (priorite) {
      case 'URGENTE': return 'priorite-urgente';
      case 'HAUTE': return 'priorite-haute';
      case 'NORMALE': return 'priorite-normale';
      case 'BASSE': return 'priorite-basse';
      default: return 'priorite-normale';
    }
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'EN_COURS': return 'statut-en-cours';
      case 'TERMINE': return 'statut-termine';
      case 'SUSPENDU': return 'statut-suspendu';
      case 'ANNULE': return 'statut-annule';
      case 'EN_ATTENTE': return 'statut-attente';
      default: return 'statut-en-cours';
    }
  }

  estEnRetard(dateEcheance?: Date): boolean {
    if (!dateEcheance) return false;
    return new Date(dateEcheance) < new Date();
  }

  // Optimisation des *ngFor
  trackByTacheId(index: number, tache: TacheImport): string {
    return tache.taskId;
  }

  trackByInstanceId(index: number, instance: InstanceProcessus): string {
    return instance.id;
  }

  // Listes uniques pour les filtres
  get phasesUniques(): string[] {
    return [...new Set(this.taches.map(t => t.phase))];
  }

  get assigneesUniques(): string[] {
    return [...new Set(this.taches.map(t => t.assignee))];
  }
}