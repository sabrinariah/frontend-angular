import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { TacheService } from '../../core/services/tache.service';
import { RegleMetierService } from '../../core/services/regle.service';
import { Processus, Tache } from '../../models/processus.model';
import { RegleMetier } from '../../models/regle.model';
import { BpmnViewerComponent } from './bpmn-viewer.component';
import { NotificationService } from '../../core/services/notification.service';

export type ChampType = 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'textarea';
export type OperateurCondition =
  | '==' | '!=' | '>' | '<' | '>=' | '<='
  | 'contains' | 'isEmpty' | 'isNotEmpty';

export interface ChampDynamique {
  id: string;
  label: string;
  type: ChampType;
  required: boolean;
  options?: { value: any; label: string }[];
}

export interface SubProcess {
  id: string;
  nom: string;
  description?: string;
  couleur?: string;
  tacheIds?: number[];
}

export interface SubprocessDirect {
  actif: boolean;
  nom: string;
  taches: { nom: string; type: 'HUMAINE' | 'SYSTEME'; assignee?: string; branche?: 'OUI' | 'NON' | null }[];
}

export interface RegleTransition {
  id: string;
  nom: string;
  modeRegle: 'simple' | 'metier';
  champId?: string;
  operateur?: OperateurCondition;
  valeur?: any;
  regleMetierIds?: number[];
  logiqueCombinaison?: 'ET' | 'OU';
  actionDouaniere?: string;
  tacheOuiOrdres?: number[];
  tacheSinonOrdre?: number;
  tacheOuiOrdre?: number;
  tacheCibleOrdre: number;
  cibleType: 'suivante' | 'specifique';
  actif: boolean;
}

export interface WfNode {
  kind: 'start' | 'end' | 'task' | 'gateway';
  id: string;
  tache?: Tache;
  sourceTache?: Tache;
  label?: string;
}

export interface BpmnElement {
  type: 'startEvent' | 'endEvent' | 'task' | 'gateway' | 'subprocess';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  sublabel?: string;
  status?: string;
  branches?: { label: string }[];
  tache?: Tache;
  sourceTache?: Tache;
  question?: string;
  isCorrection?: boolean;
  lane?: number;
  isVirtual?: boolean;
  virtualTaches?: { nom: string; type: string; assignee?: string }[];
}

export interface BpmnEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  branchType?: 'oui' | 'non' | 'normal';
  routing?: 'straight' | 'down-loop' | 'oui-jump' | 'oui-fork';
  isLoopBack?: boolean;
  jumpIndex?: number;
}

export interface BpmnDiagram {
  elements: BpmnElement[];
  edges: BpmnEdge[];
  viewWidth: number;
  viewHeight: number;
}

export interface Toast {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

@Component({
  selector: 'app-processus-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BpmnViewerComponent],
  templateUrl: './processus-list.html',
  styleUrls: ['./processus-list.css']
})
export class ProcessusListComponent implements OnInit {
  private processusService = inject(ProcessusService);
  private tacheService = inject(TacheService);
  private regleMetierService = inject(RegleMetierService);
  private notifSvc = inject(NotificationService);

  processus: Processus[] = [];
  taskCounts: Record<number, number> = {};
  searchTerm = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  filterType = 'all';

  // ── Pagination ──
  currentPage = 1;
  pageSize = 8;
  selectedProcessus: Processus | null = null;
  taches: Tache[] = [];
  errorMessage = '';
  successMessage = '';
  workflowNodes: WfNode[] = [];

  formTaskOpen: Tache | null = null;
  isNewTask = false;
  formStep = 1;
  editorTab: 'info' | 'champs' | 'regles' | 'donnees' | 'subprocess' = 'info';
  currentSubprocess: SubprocessDirect = { actif: false, nom: '', taches: [] };
  currentChamps: ChampDynamique[] = [];
  currentRegles: RegleTransition[] = [];
  formValues: Record<string, any> = {};
  formError = '';

  toasts: Toast[] = [];
  tacheToDelete: Tache | null = null;
  deleting = false;
  processusToDelete: Processus | null = null;
  deletingProcessus = false;

  openMenuId: number | null = null;
  toggleMenu(id: number): void { this.openMenuId = this.openMenuId === id ? null : id; }
  closeMenu(): void { this.openMenuId = null; }

  viewMode: 'svg' | 'bpmn' = 'svg';
  generatedBpmnUrl: string | null = null;
  private originalFileBpmn: string | undefined = undefined;

  // ── Modal nouveau processus ──
  showNewProcessusModal = false;
  newProcessusLoading = false;
  newProcessusError = '';
  newProcessus: Partial<Processus> = this.emptyProcessus();
  newTypeSelect = '';
  newTypeLibre = '';

  // ── Modal BPMN seul ──
  showBpmnModal = false;
  bpmnModalXml = '';
  bpmnModalProcessus: Processus | null = null;

  // ── Modal modifier processus ──
  showEditProcessusModal = false;
  editProcessusLoading = false;
  editProcessusError = '';
  editProcessus: Partial<Processus> = {};
  editTypeSelect = '';
  editTypeLibre = '';

  private readonly predefinedTypes = ['import', 'export', 'transit', 'dedouanement', 'entreposage'];

  reglesMetierDisponibles: RegleMetier[] = [];
  filtreCategorieRegle: string = 'TOUS';

  // ── Popup liste des tâches ──
  showTachesListPopup = false;
  tachesListProcessus: Processus | null = null;
  tachesList: Tache[] = [];
  tachesListLoading = false;
  selectedTacheDetail: Tache | null = null;

  private actionsSuggeresParCategorie: Record<string, string[]> = {
    'TAXE':          ['CALCULER_DROITS', 'APPLIQUER_TVA', 'EXONERER', 'TAXATION_REDUITE'],
    'QUOTA':         ['AUTORISER_IMPORT', 'BLOQUER_IMPORT', 'ALERTER_QUOTA', 'DEMANDER_DEROGATION'],
    'CERTIFICATION': ['EXIGER_CERTIFICAT', 'VALIDER_CERTIFICAT', 'REJETER_CERTIFICAT'],
    'VERIFICATION':  ['VERIFICATION_SIMPLE', 'VERIFICATION_APPROFONDIE', 'ESCALADE_SUPERVISEUR'],
    'CONTROLE':      ['CIRCUIT_VERT', 'CIRCUIT_JAUNE', 'CIRCUIT_ROUGE', 'PRELEVER_ECHANTILLON'],
    'DOUANE':        ['ACCEPTER_DECLARATION', 'LIQUIDER', 'ACCORDER_MAINLEVEE', 'EXIGER_CAUTION']
  };

  bpmnDiagram: BpmnDiagram = { elements: [], edges: [], viewWidth: 800, viewHeight: 280 };

  private readonly TASK_W = 160;
  private readonly TASK_H = 70;
  private readonly GW_SIZE = 54;
  private readonly EVT_R = 20;
  private readonly H_GAP = 70;
  private readonly LANE_TOP_Y = 200;
  private readonly LANE_BOT_OFFSET = 130;
  private toastCounter = 0;

  ngOnInit() {
    this.load();
    this.loadReglesMetier();
  }

  load() {
    this.processusService.getAll().subscribe(data => {
      this.processus = data;
      this.loadAllTaskCounts();
    });
  }

  // ============================================================
  // SVG HELPERS — Couleurs et markers des arêtes
  // ============================================================
  getEdgeColor(edge: BpmnEdge): string {
    if (edge.branchType === 'oui') return '#10b981';
    if (edge.branchType === 'non') return '#ef4444';
    return '#64748b';
  }

  getEdgeLabelBg(edge: BpmnEdge): string {
    if (edge.branchType === 'oui') return '#d1fae5';
    if (edge.branchType === 'non') return '#fee2e2';
    return '#f1f5f9';
  }

  getEdgeMarker(edge: BpmnEdge): string {
    if (edge.branchType === 'oui') return 'url(#bpmn-arrow-oui)';
    if (edge.branchType === 'non') return 'url(#bpmn-arrow-non)';
    return 'url(#bpmn-arrow)';
  }

  getEdgeStrokeWidth(edge: BpmnEdge): number {
    if (edge.branchType === 'oui') return 2.5;
    if (edge.branchType === 'non') return 2.5;
    return 2;
  }

  getEdgeDashArray(edge: BpmnEdge): string {
    if (edge.branchType === 'non') return '7,4';
    return 'none';
  }

  loadReglesMetier(): void {
    this.regleMetierService.getAll().subscribe({
      next: (data) => { this.reglesMetierDisponibles = (data || []).filter(r => r.active); },
      error: () => { this.reglesMetierDisponibles = []; }
    });
  }

  loadAllTaskCounts() {
    this.processus.forEach(p => {
      if (p.id) {
        this.tacheService.getByProcessus(p.id).subscribe({
          next: (taches) => { this.taskCounts[p.id!] = taches.length; },
          error: () => { this.taskCounts[p.id!] = 0; }
        });
      }
    });
  }

  allFiltered(): Processus[] {
    return this.processus.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.typeProcessus?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus =
        this.filterStatus === 'all' ||
        (this.filterStatus === 'active' && p.actif) ||
        (this.filterStatus === 'inactive' && !p.actif);
      const matchType =
        this.filterType === 'all' ||
        (p.typeProcessus || '').toLowerCase() === this.filterType.toLowerCase();
      return matchSearch && matchStatus && matchType;
    });
  }

  availableTypes(): string[] {
    const types = new Set<string>();
    this.processus.forEach(p => { if (p.typeProcessus) types.add(p.typeProcessus); });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }

  filteredProcessus(): Processus[] {
    const all = this.allFiltered();
    const start = (this.currentPage - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.allFiltered().length / this.pageSize));
  }

  pages(): number[] {
    const result: number[] = [];
    const total = this.totalPages();
    if (total <= 7) {
      for (let i = 1; i <= total; i++) result.push(i);
    } else {
      const around = [this.currentPage - 1, this.currentPage, this.currentPage + 1]
        .filter(p => p >= 1 && p <= total);
      const all = Array.from(new Set([1, ...around, total])).sort((a, b) => a - b);
      for (let i = 0; i < all.length; i++) {
        if (i > 0 && all[i] - all[i - 1] > 1) result.push(-1);
        result.push(all[i]);
      }
    }
    return result;
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.currentPage = p;
  }

  resetPage() { this.currentPage = 1; }

  countActifs(): number { return this.processus.filter(p => p.actif).length; }
  countInactifs(): number { return this.processus.filter(p => !p.actif).length; }
  totalTaches(): number { return Object.values(this.taskCounts).reduce((s, n) => s + (n || 0), 0); }
  countGateways(): number { return this.taches.filter(t => this.getRegles(t).length > 0).length; }
  countByStatut(statut: string): number { return this.taches.filter(t => t.statut === statut).length; }
  progressPercent(): number {
    if (!this.taches.length) return 0;
    return Math.round((this.countByStatut('TERMINE') / this.taches.length) * 100);
  }

  toggle(id: number) {
    const p = this.processus.find(x => x.id === id);
    if (!p) return;
    const old = p.actif;
    p.actif = !p.actif;
    this.processusService.toggle(id).subscribe({
      next: (upd: any) => {
        if (upd && typeof upd.actif === 'boolean') p.actif = upd.actif;
        const etat = p.actif ? 'activé' : 'désactivé';
        this.addToast('success', p.actif ? '✅ Processus activé' : '⏸️ Processus désactivé', p.nom || '');
        this.notifSvc.notify({ type: 'info', category: 'processus', icon: p.actif ? '▶️' : '⏸️', title: `Processus ${etat}`, message: `Le processus « ${p.nom || id} » a été ${etat}.` });
      },
      error: (err) => { p.actif = old; this.addToast('error', 'Erreur lors du changement de statut', err?.error?.message || err.message); }
    });
  }

  confirmDeleteProcessus(p: Processus): void {
    if (!p.id) return;
    this.processusToDelete = p;
  }

  cancelDeleteProcessus(): void {
    this.processusToDelete = null;
    this.deletingProcessus = false;
  }

  executeDeleteProcessus(): void {
    if (!this.processusToDelete?.id) return;
    this.deletingProcessus = true;
    const id = this.processusToDelete.id;
    const nom = this.processusToDelete.nom;
    this.processusService.delete(id).subscribe({
      next: () => {
        this.deletingProcessus = false;
        this.processusToDelete = null;
        this.load();
        this.addToast('success', `Processus "${nom}" supprimé`);
      },
      error: (err) => {
        this.deletingProcessus = false;
        this.processusToDelete = null;
        this.addToast('error', 'Erreur lors de la suppression', err?.error?.message);
      }
    });
  }

  openTachesPopup(p: Processus) {
    this.selectedProcessus = p;
    this.originalFileBpmn = p.fileBpmn;
    this.errorMessage = ''; this.successMessage = '';
    this.viewMode = 'svg';
    this.loadTaches();
  }

  ouvrirVueBpmn(p: Processus): void {
    this.ouvrirBpmnSeul(p);
  }

  ouvrirBpmnSeul(p: Processus): void {
    if (!p.id) return;
    this.tacheService.getByProcessus(p.id).subscribe({
      next: (taches) => {
        if (taches.length === 0) {
          this.addToast('warning', 'Aucune tâche', 'Ce processus ne contient pas de tâches.');
          return;
        }
        const prevSelected = this.selectedProcessus;
        const prevTaches = [...this.taches];
        this.selectedProcessus = p;
        this.taches = taches;
        const xml = this.generateBpmnXml();
        this.selectedProcessus = prevSelected;
        this.taches = prevTaches;
        if (!xml) return;
        this.bpmnModalXml = xml;
        this.bpmnModalProcessus = p;
        this.showBpmnModal = true;
      },
      error: () => this.addToast('error', 'Erreur', 'Impossible de charger les tâches.')
    });
  }

  fermerBpmnModal(): void {
    this.showBpmnModal = false;
    this.bpmnModalXml = '';
    this.bpmnModalProcessus = null;
  }

  exporterBpmnDirect(p: Processus): void {
    if (!p.id) return;
    this.tacheService.getByProcessus(p.id).subscribe({
      next: (taches) => {
        if (taches.length === 0) { this.addToast('warning', 'Aucune tâche', 'Ce processus ne contient pas de tâches.'); return; }
        const prevSelected = this.selectedProcessus;
        const prevTaches = [...this.taches];
        this.selectedProcessus = p;
        this.taches = taches;
        const xml = this.generateBpmnXml();
        this.selectedProcessus = prevSelected;
        this.taches = prevTaches;
        if (!xml) return;
        const nom = (p.nom || 'processus').replace(/\s+/g, '_').toLowerCase();
        const filename = `${nom}_${p.id}.bpmn`;
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename; link.click();
        URL.revokeObjectURL(url);
        this.addToast('success', '✅ BPMN exporté', filename, 4000);
      },
      error: () => this.addToast('error', 'Erreur', 'Impossible de charger les tâches.')
    });
  }

  exporterBpmnSeul(): void {
    if (!this.bpmnModalXml || !this.bpmnModalProcessus) return;
    const nom = (this.bpmnModalProcessus.nom || 'processus').replace(/\s+/g, '_').toLowerCase();
    const filename = `${nom}_${this.bpmnModalProcessus.id}.bpmn`;
    const blob = new Blob([this.bpmnModalXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
    this.addToast('success', '✅ BPMN exporté', filename, 4000);
  }

  deployingProcessusId: number | null = null;

  deployerVersCamunda(p: Processus): void {
    if (!p.id) return;
    this.tacheService.getByProcessus(p.id).subscribe({
      next: (taches) => {
        if (taches.length === 0) { this.addToast('warning', 'Aucune tâche', 'Ce processus ne contient pas de tâches.'); return; }
        const prevSelected = this.selectedProcessus;
        const prevTaches = [...this.taches];
        this.selectedProcessus = p;
        this.taches = taches;
        const xml = this.generateBpmnXml();
        this.selectedProcessus = prevSelected;
        this.taches = prevTaches;
        if (!xml) return;
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        this.envoyerDeploiement(p, blob);
      },
      error: () => this.addToast('error', 'Erreur', 'Impossible de charger les tâches.')
    });
  }

  deployerBpmnSeul(): void {
    if (!this.bpmnModalXml || !this.bpmnModalProcessus) return;
    const blob = new Blob([this.bpmnModalXml], { type: 'application/xml;charset=utf-8' });
    this.envoyerDeploiement(this.bpmnModalProcessus, blob);
  }

  private envoyerDeploiement(p: Processus, blob: Blob): void {
    if (!p.id) return;
    const nom = (p.nom || 'processus').replace(/\s+/g, '_').toLowerCase();
    const filename = `${nom}_${p.id}.bpmn`;
    this.deployingProcessusId = p.id;
    this.processusService.deployerProcessus(p.id, blob, filename).subscribe({
      next: (res) => {
        this.deployingProcessusId = null;
        const cle = res?.processDefinitionKey ?? '';
        const version = res?.version ?? res?.processDefinitionVersion ?? '';
        this.addToast('success', '✅ Déployé vers Camunda', `${cle} ${version ? 'v' + version : ''}`.trim(), 5000);
      },
      error: (err) => {
        this.deployingProcessusId = null;
        const detail = err?.error?.message ?? err?.message ?? 'Erreur inconnue';
        this.addToast('error', '❌ Déploiement échoué', detail, 6000);
      }
    });
  }

  closePopup() {
    if (this.generatedBpmnUrl) { URL.revokeObjectURL(this.generatedBpmnUrl); this.generatedBpmnUrl = null; }
    if (this.selectedProcessus && this.originalFileBpmn !== undefined) this.selectedProcessus.fileBpmn = this.originalFileBpmn;
    this.originalFileBpmn = undefined;
    this.selectedProcessus = null;
    this.taches = [];
    this.bpmnDiagram = { elements: [], edges: [], viewWidth: 800, viewHeight: 280 };
    this.errorMessage = ''; this.successMessage = '';
    this.viewMode = 'svg';
  }

  loadTaches(onLoaded?: (taches: Tache[]) => void) {
    if (!this.selectedProcessus?.id) return;
    this.tacheService.getByProcessus(this.selectedProcessus.id).subscribe({
      next: (data) => {
        this.taches = data;
        if (this.selectedProcessus?.id) this.taskCounts[this.selectedProcessus.id] = data.length;
        this.buildBpmnDiagram();
        if (onLoaded) onLoaded(data);
      },
      error: (err) => { this.errorMessage = err?.error?.message || 'Erreur chargement tâches'; }
    });
  }

  tachesSorted(): Tache[] {
    return [...this.taches].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }

  // ============================================================
  // BUILD BPMN DIAGRAM (vue SVG dynamique)
  // ============================================================
  buildBpmnDiagram(): void {
    const elements: BpmnElement[] = [];
    const edges: BpmnEdge[] = [];
    const sorted = this.tachesSorted();
    const { EVT_R, TASK_W, TASK_H, GW_SIZE, H_GAP, LANE_TOP_Y } = {
      EVT_R: this.EVT_R, TASK_W: this.TASK_W, TASK_H: this.TASK_H,
      GW_SIZE: this.GW_SIZE, H_GAP: this.H_GAP, LANE_TOP_Y: this.LANE_TOP_Y
    };

    let x = 40;

    const startId = 'start';
    elements.push({
      type: 'startEvent', id: startId,
      x, y: LANE_TOP_Y - EVT_R, width: EVT_R * 2, height: EVT_R * 2,
      label: 'Début', lane: 0
    });
    let prevId = startId;
    x += EVT_R * 2 + H_GAP;

    const ordreToTaskId = new Map<number, string>();
    const ordreToGwId = new Map<number, string>();

    const SP_TASK_W = 130;
    const SP_TASK_H = 56;
    const SP_V_GAP  = 80;

    // sous-tâches orphelines à relier en post-pass (tâche sans règle)
    const pendingSpTasks: { spIds: string[]; tIdx: number }[] = [];
    const pendingNonSpTasks: { lastSpId: string; tIdx: number }[] = [];
    const gwToLastOuiSpId = new Map<string, string>();
    const gwToLastNonSpId = new Map<string, string>();
    let skipNextMainEdge = false;

    sorted.forEach((t, tIdx) => {
      const taskId = 'task_' + t.id;
      elements.push({
        type: 'task', id: taskId,
        x, y: LANE_TOP_Y - TASK_H / 2, width: TASK_W, height: TASK_H,
        label: t.nom, sublabel: t.type, status: t.statut, tache: t,
        isCorrection: false, lane: 0
      });
      ordreToTaskId.set(t.ordre ?? 0, taskId);

      if (!skipNextMainEdge) {
        const effectivePrev = gwToLastOuiSpId.get(prevId) ?? prevId;
        edges.push({ id: `e_${effectivePrev}_${taskId}`, from: effectivePrev, to: taskId, branchType: 'normal', routing: 'straight' });
      }
      skipNextMainEdge = false;
      prevId = taskId;
      x += TASK_W + H_GAP;

      const sp = this.getSubprocessDirect(t);
      const spIds: string[] = [];
      const regles = this.getRegles(t);

      // Gateway de règle (OUI/NON) — sert aussi de fork pour les sous-tâches
      if (regles.length > 0) {
        const gwId = 'gw_' + t.id;
        const regle = regles[0];
        elements.push({
          type: 'gateway', id: gwId,
          x, y: LANE_TOP_Y - GW_SIZE / 2, width: GW_SIZE, height: GW_SIZE,
          label: regle.nom || 'Condition',
          question: regle.nom || 'Condition ?',
          sourceTache: t, lane: 0
        });
        ordreToGwId.set(t.ordre ?? 0, gwId);
        edges.push({ id: `e_${prevId}_${gwId}`, from: prevId, to: gwId, branchType: 'normal', routing: 'straight' });
        prevId = gwId;
        x += GW_SIZE + H_GAP;

        // Sous-tâches : OUI branch (au-dessus), NON branch (en-dessous), neutres (parallèles)
        const spTaches = sp ? sp.taches : [];
        const ouiSpTaches  = spTaches.filter(st => st.branche === 'OUI');
        const nonSpTaches  = spTaches.filter(st => st.branche === 'NON');
        const neutralTaches = spTaches.filter(st => !st.branche);
        const spX = x;

        if (ouiSpTaches.length > 0) {
          let prevSp = gwId;
          ouiSpTaches.forEach((st, i) => {
            const spY = LANE_TOP_Y - TASK_H - 70 - i * (SP_TASK_H + 24);
            const spId = `sp_task_${t.id}_oui_${i}`;
            elements.push({ type: 'task', id: spId, x: spX, y: spY, width: SP_TASK_W, height: SP_TASK_H,
              label: st.nom || `Sous-tâche OUI ${i + 1}`, sublabel: st.type, lane: 1 });
            edges.push({ id: `e_${prevSp}_${spId}`, from: prevSp, to: spId,
              label: i === 0 ? 'Oui' : undefined, branchType: 'oui', routing: 'straight' });
            prevSp = spId;
          });
          gwToLastOuiSpId.set(gwId, prevSp);
        }

        if (nonSpTaches.length > 0) {
          let prevSp = gwId;
          nonSpTaches.forEach((st, i) => {
            const spY = LANE_TOP_Y + TASK_H / 2 + 60 + i * (SP_TASK_H + 24);
            const spId = `sp_task_${t.id}_non_${i}`;
            elements.push({ type: 'task', id: spId, x: spX, y: spY, width: SP_TASK_W, height: SP_TASK_H,
              label: st.nom || `Sous-tâche NON ${i + 1}`, sublabel: st.type, lane: 1 });
            edges.push({ id: `e_${prevSp}_${spId}`, from: prevSp, to: spId,
              label: i === 0 ? 'Non' : undefined, branchType: 'non', routing: 'straight' });
            prevSp = spId;
          });
          gwToLastNonSpId.set(gwId, prevSp);
          pendingNonSpTasks.push({ lastSpId: prevSp, tIdx });
        }

        if (neutralTaches.length > 0) {
          const N = neutralTaches.length;
          neutralTaches.forEach((st, i) => {
            const subY = LANE_TOP_Y + (i - (N - 1) / 2) * SP_V_GAP - SP_TASK_H / 2;
            const spId = `sp_task_${t.id}_${i}`;
            elements.push({ type: 'task', id: spId, x: spX, y: subY, width: SP_TASK_W, height: SP_TASK_H,
              label: st.nom || `Sous-tâche ${i + 1}`, sublabel: st.type, lane: 1 });
            edges.push({ id: `e_${gwId}_${spId}`, from: gwId, to: spId, branchType: 'oui', routing: 'straight' });
            spIds.push(spId);
          });
          pendingSpTasks.push({ spIds: [...spIds], tIdx });
        }

        if (ouiSpTaches.length > 0 || nonSpTaches.length > 0 || neutralTaches.length > 0) {
          x += SP_TASK_W + H_GAP;
        }

      } else if (sp && sp.taches.length > 0) {
        // Pas de règle : sous-tâches branchent directement depuis la tâche
        const N = sp.taches.length;
        for (let i = 0; i < N; i++) {
          const subY = LANE_TOP_Y + (i - (N - 1) / 2) * SP_V_GAP - SP_TASK_H / 2;
          const spId = `sp_task_${t.id}_${i}`;
          elements.push({
            type: 'task', id: spId,
            x, y: subY, width: SP_TASK_W, height: SP_TASK_H,
            label: sp.taches[i].nom || `Sous-tâche ${i + 1}`,
            sublabel: sp.taches[i].type, lane: 1
          });
          edges.push({ id: `e_${prevId}_${spId}`, from: prevId, to: spId, branchType: 'oui', routing: 'straight' });
          spIds.push(spId);
        }
        x += SP_TASK_W + H_GAP;
        pendingSpTasks.push({ spIds: [...spIds], tIdx });
        skipNextMainEdge = true;
      }
    });

    const endId = 'end';
    elements.push({
      type: 'endEvent', id: endId,
      x, y: LANE_TOP_Y - EVT_R, width: EVT_R * 2, height: EVT_R * 2,
      label: 'Fin', lane: 0
    });

    // Post-pass : sous-tâches sans rule gateway → tâche suivante ou fin
    pendingSpTasks.forEach(({ spIds, tIdx }) => {
      const nextT = sorted[tIdx + 1];
      const nextId = nextT ? `task_${nextT.id}` : endId;
      spIds.forEach(spId => {
        edges.push({ id: `e_${spId}_${nextId}`, from: spId, to: nextId, branchType: 'normal', routing: 'straight' });
      });
    });

    const effectiveLastPrev = gwToLastOuiSpId.get(prevId) ?? prevId;
    const lastIsGateway = prevId.startsWith('gw_') && !gwToLastOuiSpId.has(prevId);
    edges.push({
      id: `e_${effectiveLastPrev}_${endId}`, from: effectiveLastPrev, to: endId,
      label: lastIsGateway ? 'Oui' : undefined,
      branchType: lastIsGateway ? 'oui' : 'normal',
      routing: 'straight'
    });

    edges.forEach(e => {
      if (e.from.startsWith('gw_')
          && (e.to.startsWith('task_') || e.to === endId)
          && e.branchType !== 'oui' && e.branchType !== 'non') {
        e.label = 'Oui';
        e.branchType = 'oui';
      }
    });

    // BRANCHES OUI
    sorted.forEach(t => {
      const regles = this.getRegles(t);
      regles.forEach(regle => {
        const gwId = ordreToGwId.get(t.ordre ?? 0);
        if (!gwId) return;

        const nextInOrder = sorted.find(tt => (tt.ordre ?? 0) > (t.ordre ?? 0));
        const cibles = this.getOuiOrdres(regle);
        const lastOuiSpId = gwToLastOuiSpId.get(gwId);

        // Si le gateway a des sp-tâches OUI, elles gèrent le chemin OUI
        if (lastOuiSpId) {
          if (cibles.length === 0) return; // déjà routé via effectivePrev dans le main loop
          // Cible spécifique : retirer l'edge sp_last → next normal, ajouter sp_last → cible
          const oldIdx = edges.findIndex(e => e.from === lastOuiSpId);
          if (oldIdx >= 0) edges.splice(oldIdx, 1);
          cibles.forEach((ordreCible, idx) => {
            const cibleId = ordreToTaskId.get(ordreCible);
            if (cibleId) edges.push({
              id: `e_oui_sp_${lastOuiSpId}_${cibleId}_${idx}`,
              from: lastOuiSpId, to: cibleId,
              label: cibles.length > 1 ? `Oui #${idx + 1}` : undefined,
              branchType: 'oui', routing: 'straight'
            });
          });
          return;
        }

        if (cibles.length === 0) return;

        if (cibles.length === 1) {
          const ordreCible = cibles[0];
          if (nextInOrder && nextInOrder.ordre === ordreCible) return;
          const cibleId = ordreToTaskId.get(ordreCible);
          if (cibleId) {
            const oldIdx = edges.findIndex(e => e.from === gwId && e.branchType === 'oui');
            if (oldIdx >= 0) edges.splice(oldIdx, 1);
            edges.push({
              id: `e_oui_${gwId}_${cibleId}`, from: gwId, to: cibleId,
              label: 'Oui', branchType: 'oui', routing: 'oui-jump', jumpIndex: 0
            });
          }
          return;
        }

        const oldIdx = edges.findIndex(e => e.from === gwId && e.branchType === 'oui');
        if (oldIdx >= 0) edges.splice(oldIdx, 1);
        cibles.forEach((ordreCible, idx) => {
          const cibleId = ordreToTaskId.get(ordreCible);
          if (!cibleId) return;
          edges.push({
            id: `e_oui_multi_${gwId}_${cibleId}_${idx}`,
            from: gwId, to: cibleId,
            label: `Oui #${idx + 1}`, branchType: 'oui',
            routing: 'oui-jump', jumpIndex: idx
          });
        });
      });
    });

    // BRANCHES NON
    sorted.forEach(t => {
      const regles = this.getRegles(t);
      regles.forEach(regle => {
        const gwId = ordreToGwId.get(t.ordre ?? 0);
        if (!gwId) return;

        if (regle.tacheSinonOrdre && regle.tacheSinonOrdre > 0) {
          const cibleId = ordreToTaskId.get(regle.tacheSinonOrdre);
          if (!cibleId) return;
          const lastNonSpId = gwToLastNonSpId.get(gwId);
          if (lastNonSpId) {
            // Edge gw→sp_non_1 déjà ajouté, connecter la dernière sp-tâche NON → cible
            edges.push({
              id: `e_non_sp_${lastNonSpId}_${cibleId}`,
              from: lastNonSpId, to: cibleId,
              branchType: 'non', routing: 'straight'
            });
          } else {
            edges.push({
              id: `e_non_${gwId}_${cibleId}`, from: gwId, to: cibleId,
              label: 'Non', branchType: 'non',
              routing: 'down-loop',
              isLoopBack: regle.tacheSinonOrdre < (t.ordre ?? 0)
            });
          }
        }
      });
    });

    // Post-pass NON sp-tâches sans cible explicite → tâche suivante ou fin
    pendingNonSpTasks.forEach(({ lastSpId, tIdx }) => {
      const regle = this.getRegles(sorted[tIdx])?.[0];
      if (regle?.tacheSinonOrdre && regle.tacheSinonOrdre > 0) return;
      const nextT = sorted[tIdx + 1];
      const targetId = nextT ? `task_${nextT.id}` : endId;
      edges.push({ id: `e_non_sp_${lastSpId}_${targetId}`, from: lastSpId, to: targetId, branchType: 'non', routing: 'straight' });
    });

    const hasBranchesNon = edges.some(e => e.branchType === 'non');
    const hasJumps = edges.some(e => e.routing === 'oui-jump');
    const maxJumpIdx = Math.max(0, ...edges.filter(e => e.routing === 'oui-jump').map(e => e.jumpIndex ?? 0));
    const totalW = Math.max(x + EVT_R * 2 + 80, 900);
    const jumpTopSpace = hasJumps ? (80 + maxJumpIdx * 28) : 0;
    const loopSpace = hasBranchesNon ? this.LANE_BOT_OFFSET + 50 : 0;

    // Espace vertical occupé par les sous-processus
    const spElements = elements.filter(e => e.lane === 1);
    const spTopY  = spElements.length > 0 ? Math.min(...spElements.map(e => e.y)) : LANE_TOP_Y;
    const spBotY  = spElements.length > 0 ? Math.max(...spElements.map(e => e.y + e.height)) : LANE_TOP_Y;
    const spTopExtra = spTopY < LANE_TOP_Y ? LANE_TOP_Y - spTopY + 30 : 0;
    const spBotExtra = spBotY > LANE_TOP_Y + TASK_H ? spBotY - (LANE_TOP_Y + TASK_H) + 30 : 0;

    const topExtra = Math.max(jumpTopSpace, spTopExtra);
    const botExtra = Math.max(loopSpace, spBotExtra);

    const baseH = LANE_TOP_Y + TASK_H + 50;
    const totalH = baseH + botExtra + (topExtra > LANE_TOP_Y ? topExtra - LANE_TOP_Y : 0);

    this.bpmnDiagram = { elements, edges, viewWidth: totalW, viewHeight: Math.max(totalH, 350) };
  }

  getOuiOrdres(regle: RegleTransition): number[] {
    if (regle.tacheOuiOrdres && regle.tacheOuiOrdres.length > 0) {
      return regle.tacheOuiOrdres.filter(o => o > 0);
    }
    if (regle.tacheOuiOrdre && regle.tacheOuiOrdre > 0) {
      return [regle.tacheOuiOrdre];
    }
    return [];
  }

  // ============================================================
  // EXPORT BPMN
  // ============================================================
  exportBpmn(): void {
    if (!this.selectedProcessus || this.taches.length === 0) return;
    const xml = this.generateBpmnXml();
    if (!xml) return;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${(this.selectedProcessus.nom || 'processus').replace(/\s+/g, '_').toLowerCase()}_${this.selectedProcessus.id}.bpmn`;
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
    this.addToast('success', `✅ Fichier BPMN exporté`, `📁 ${filename}`, 5000);
  }

  openBpmnInViewer(): void {
    if (!this.selectedProcessus || this.taches.length === 0) return;
    const xml = this.generateBpmnXml();
    if (!xml) return;
    if (this.generatedBpmnUrl) URL.revokeObjectURL(this.generatedBpmnUrl);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    this.generatedBpmnUrl = URL.createObjectURL(blob);
    this.selectedProcessus.fileBpmn = this.generatedBpmnUrl;
    this.viewMode = 'bpmn';
    this.addToast('success', '👁️ BPMN ouvert dans le viewer', '', 3500);
  }

  clearGeneratedBpmn(): void {
    if (this.generatedBpmnUrl) { URL.revokeObjectURL(this.generatedBpmnUrl); this.generatedBpmnUrl = null; }
    if (this.selectedProcessus) this.selectedProcessus.fileBpmn = this.originalFileBpmn;
    this.addToast('info', 'BPMN généré effacé');
  }

  // ════════════════════════════════════════════════════════════════
  // 🔥 GÉNÉRATION BPMN XML — SANS START/END EVENTS DANS SUBPROCESS
  // - SubProcess : uniquement les tâches internes (pas de start/end)
  // - Toutes les flèches visibles (OUI, NON, retours subprocess)
  // - SubProcess en swimlanes séparées (au-dessus / en-dessous)
  // ════════════════════════════════════════════════════════════════
  generateBpmnXml(): string | null {
    if (!this.selectedProcessus || this.taches.length === 0) return null;
    const sorted = this.tachesSorted();
    const processId = `Process_${this.selectedProcessus.id}`;
    const processName = (this.selectedProcessus.nom || 'Processus').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] || c));

    const TASK_W = 100, TASK_H = 80, GW_SIZE = 50, EVT_R = 18, H_GAP = 60;
    const Y_CENTER = 280;

    interface LayoutNode {
      kind: 'start' | 'end' | 'task' | 'gateway' | 'subProcess';
      id: string; x: number; y: number; w: number; h: number; label: string;
      tache?: Tache;
      regles?: RegleTransition[];
      spTaches?: { nom: string; type: string; assignee?: string }[];
      spBranche?: 'oui' | 'non';
      gatewayId?: string;
      internalNodes?: InternalNode[];
      isSpTask?: boolean;
      spTaskType?: string;
      spTaskAssignee?: string;
      spNodeIds?: string[];
    }

    interface InternalNode {
      kind: 'task';
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      label: string;
      type?: string;
      assignee?: string;
    }

    const nodes: LayoutNode[] = [];
    let curX = 60;

    // ─── START ───
    nodes.push({
      kind: 'start', id: 'StartEvent_1',
      x: curX, y: Y_CENTER - EVT_R, w: EVT_R*2, h: EVT_R*2,
      label: 'Début'
    });
    curX += EVT_R*2 + H_GAP;

    // ─── TÂCHES + GATEWAYS + SOUS-TÂCHES ───
    const SP_Y_GAP = 100;
    sorted.forEach(t => {
      const tid = `Task_${t.id}`;
      nodes.push({
        kind: 'task', id: tid,
        x: curX, y: Y_CENTER - TASK_H/2, w: TASK_W, h: TASK_H,
        label: t.nom, tache: t
      });
      curX += TASK_W + H_GAP;

      const regles = this.getRegles(t);
      const sp = this.getSubprocessDirect(t);

      if (regles.length > 0) {
        const gwId = `Gateway_${t.id}`;
        const spNodeIds: string[] = [];
        nodes.push({
          kind: 'gateway', id: gwId,
          x: curX, y: Y_CENTER - GW_SIZE/2, w: GW_SIZE, h: GW_SIZE,
          label: 'SI/SINON', tache: t, regles, spNodeIds
        });
        curX += GW_SIZE + H_GAP;

        // Sous-tâches du sous-processus branchant depuis ce gateway
        if (sp && sp.taches.length > 0) {
          const N = sp.taches.length;
          for (let i = 0; i < N; i++) {
            const spY = Y_CENTER + (i - (N - 1) / 2) * SP_Y_GAP - TASK_H / 2;
            const spId = `SpTask_${t.id}_${i}`;
            nodes.push({
              kind: 'task', id: spId,
              x: curX, y: spY, w: TASK_W, h: TASK_H,
              label: sp.taches[i].nom || `Sous-tâche ${i + 1}`,
              isSpTask: true,
              spTaskType: sp.taches[i].type,
              spTaskAssignee: sp.taches[i].assignee
            });
            spNodeIds.push(spId);
          }
          curX += TASK_W + H_GAP;
        }
      }
    });

    // ─── END ───
    nodes.push({
      kind: 'end', id: 'EndEvent_1',
      x: curX, y: Y_CENTER - EVT_R, w: EVT_R*2, h: EVT_R*2,
      label: 'Fin'
    });

    // ═══════════════════════════════════════════════════════════
    // CONSTRUCTION DES FLUX
    // ═══════════════════════════════════════════════════════════
    interface Flow {
      id: string; from: string; to: string;
      name?: string;
      isCondition?: boolean;
      condExpr?: string;
      type?: 'main' | 'oui-sp' | 'non-sp' | 'sp-internal' | 'sp-return';
    }
    const flows: Flow[] = [];

    // mainFlow exclut les sous-tâches sp (elles sont gérées séparément)
    const mainFlow = nodes.filter(n => n.kind !== 'subProcess' && !n.isSpTask);

    for (let i = 0; i < mainFlow.length - 1; i++) {
      const cur = mainFlow[i];
      const nxt = mainFlow[i + 1];

      if (cur.kind === 'gateway' && cur.regles?.length) {
        const regle = cur.regles[0];
        const cibles = this.getOuiOrdres(regle);
        const hasSp = (cur.spNodeIds?.length ?? 0) > 0;

        if (hasSp) {
          // Sous-tâches branchent depuis ce gateway → chaque sous-tâche → nxt
          cur.spNodeIds!.forEach((spId, idx) => {
            flows.push({
              id: `Flow_SP_GW_${cur.id}_${idx}`, from: cur.id, to: spId,
              name: `✓ ${idx + 1}`, isCondition: true,
              condExpr: this.buildCondExpression(regle), type: 'main'
            });
            flows.push({
              id: `Flow_SP_${spId}_next`, from: spId, to: nxt.id, type: 'main'
            });
          });
        } else if (cibles.length === 0) {
          flows.push({
            id: `Flow_OUI_${cur.id}`, from: cur.id, to: nxt.id,
            name: `✓ ${regle.nom || 'OUI'}`,
            isCondition: true, condExpr: this.buildCondExpression(regle),
            type: 'main'
          });
        } else {
          cibles.forEach((ordreCible, idx) => {
            const cible = sorted.find(t => t.ordre === ordreCible);
            const targetId = cible ? `Task_${cible.id}` : nxt.id;
            flows.push({
              id: `Flow_OUI_${cur.id}_${idx}`, from: cur.id, to: targetId,
              name: cibles.length > 1 ? `✓ OUI #${idx + 1}` : `✓ ${regle.nom || 'OUI'}`,
              isCondition: true, condExpr: this.buildCondExpression(regle),
              type: 'main'
            });
          });
        }

        if (regle.tacheSinonOrdre && regle.tacheSinonOrdre > 0) {
          const cibleAlt = sorted.find(t => t.ordre === regle.tacheSinonOrdre);
          flows.push({
            id: `Flow_NON_${cur.id}`, from: cur.id,
            to: cibleAlt ? `Task_${cibleAlt.id}` : 'EndEvent_1',
            name: '✗ SINON', type: 'main'
          });
        }

      } else if (cur.kind !== 'gateway') {
        flows.push({
          id: `Flow_${cur.id}_${nxt.id}`, from: cur.id, to: nxt.id,
          type: 'main'
        });
      }
    }

    nodes.filter(n => n.kind === 'subProcess' && n.internalNodes).forEach(sp => {
      const inner = sp.internalNodes!;
      for (let i = 0; i < inner.length - 1; i++) {
        flows.push({
          id: `Flow_${inner[i].id}_${inner[i+1].id}`,
          from: inner[i].id, to: inner[i+1].id,
          type: 'sp-internal'
        });
      }
    });

    // ═══════════════════════════════════════════════════════════
    // SÉRIALISATION XML
    // ═══════════════════════════════════════════════════════════
    const esc = (s: string) => (s || '').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] || c));

    const bpmnElements = nodes.map(n => {
      switch (n.kind) {
        case 'start': {
          const out = flows.filter(f => f.from === n.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
          return `    <bpmn:startEvent id="${n.id}" name="${esc(n.label)}">${out}</bpmn:startEvent>`;
        }
        case 'end': {
          const inF = flows.filter(f => f.to === n.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
          return `    <bpmn:endEvent id="${n.id}" name="${esc(n.label)}">${inF}</bpmn:endEvent>`;
        }
        case 'subProcess': {
          const inF  = flows.filter(f => f.to   === n.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
          const outF = flows.filter(f => f.from === n.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');

          const innerNodes = (n.internalNodes || []).map(inn => {
            const innIn  = flows.filter(f => f.to   === inn.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
            const innOut = flows.filter(f => f.from === inn.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
            const tt = inn.type === 'HUMAINE' ? 'bpmn:userTask' : 'bpmn:serviceTask';
            const aa = tt === 'bpmn:userTask'
              ? (inn.assignee ? ` camunda:assignee="${esc(inn.assignee)}"` : '')
              : ` camunda:type="external" camunda:topic="${esc(inn.id)}"`;
            return `      <${tt} id="${inn.id}" name="${esc(inn.label)}"${aa}>${innIn}${innOut}</${tt}>`;
          }).join('\n');

          const innerFlows = flows
            .filter(f => f.type === 'sp-internal' && f.from.startsWith(n.id))
            .map(f => `      <bpmn:sequenceFlow id="${f.id}" sourceRef="${f.from}" targetRef="${f.to}" />`)
            .join('\n');

          return `    <bpmn:subProcess id="${n.id}" name="${esc(n.label)}" triggeredByEvent="false">${inF}${outF}
${innerNodes}
${innerFlows}
    </bpmn:subProcess>`;
        }
        case 'task': {
          const inF  = flows.filter(f => f.to   === n.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
          const outF = flows.filter(f => f.from === n.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
          if (n.isSpTask) {
            const tt = n.spTaskType === 'HUMAINE' ? 'bpmn:userTask' : 'bpmn:serviceTask';
            const aa = tt === 'bpmn:userTask'
              ? (n.spTaskAssignee ? ` camunda:assignee="${esc(n.spTaskAssignee)}"` : '')
              : ` camunda:type="external" camunda:topic="${esc(n.id)}"`;
            return `    <${tt} id="${n.id}" name="${esc(n.label)}"${aa}>${inF}${outF}</${tt}>`;
          }
          const t = n.tache!;
          const tt = t.type === 'HUMAINE' ? 'bpmn:userTask' : 'bpmn:serviceTask';
          const aa = tt === 'bpmn:userTask'
            ? (t.assignee ? ` camunda:assignee="${esc(t.assignee)}"` : '')
            : ` camunda:type="external" camunda:topic="${esc(n.id)}"`;
          const formData = tt === 'bpmn:userTask' ? this.buildFormDataXml(t, esc) : '';
          return `    <${tt} id="${n.id}" name="${esc(t.nom)}"${aa}>${formData}${inF}${outF}</${tt}>`;
        }
        case 'gateway': {
          const inF  = flows.filter(f => f.to   === n.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
          const outF = flows.filter(f => f.from === n.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
          const defFlow = flows.find(f => f.from === n.id && (f.id.startsWith('Flow_NON_') || f.id.startsWith('Flow_NON_SP_')));
          const defAttr = defFlow ? ` default="${defFlow.id}"` : '';
          return `    <bpmn:exclusiveGateway id="${n.id}" gatewayDirection="Diverging"${defAttr}>${inF}${outF}</bpmn:exclusiveGateway>`;
        }
      }
    }).join('\n');

    const flowsXml = flows
      .filter(f => f.type !== 'sp-internal')
      .map(f => {
        if (f.isCondition && f.condExpr) {
          return `    <bpmn:sequenceFlow id="${f.id}" sourceRef="${f.from}" targetRef="${f.to}"><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${esc(f.condExpr)}</bpmn:conditionExpression></bpmn:sequenceFlow>`;
        }
        return `    <bpmn:sequenceFlow id="${f.id}" sourceRef="${f.from}" targetRef="${f.to}" />`;
      }).join('\n');

    // ═══════════════════════════════════════════════════════════
    // SHAPES + EDGES (BPMNDI)
    // ═══════════════════════════════════════════════════════════
    const shapesArr: string[] = [];
    nodes.forEach(n => {
      shapesArr.push(
        `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${n.kind === 'gateway' ? ' isMarkerVisible="true"' : ''}${n.kind === 'subProcess' ? ' isExpanded="true"' : ''}><dc:Bounds x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" />${n.kind === 'subProcess' ? `<bpmndi:BPMNLabel><dc:Bounds x="${n.x + 10}" y="${n.y + 4}" width="${n.w - 20}" height="14" /></bpmndi:BPMNLabel>` : ''}</bpmndi:BPMNShape>`
      );
      if (n.kind === 'subProcess' && n.internalNodes) {
        n.internalNodes.forEach(inn => {
          shapesArr.push(
            `      <bpmndi:BPMNShape id="${inn.id}_di" bpmnElement="${inn.id}"><dc:Bounds x="${inn.x}" y="${inn.y}" width="${inn.w}" height="${inn.h}" /></bpmndi:BPMNShape>`
          );
        });
      }
    });
    const shapes = shapesArr.join('\n');

    const allNodesFlat: { id: string; x: number; y: number; w: number; h: number }[] = [];
    nodes.forEach(n => {
      allNodesFlat.push({ id: n.id, x: n.x, y: n.y, w: n.w, h: n.h });
      if (n.kind === 'subProcess' && n.internalNodes) {
        n.internalNodes.forEach(inn => {
          allNodesFlat.push({ id: inn.id, x: inn.x, y: inn.y, w: inn.w, h: inn.h });
        });
      }
    });

    const edgesXml = flows.map(f => {
      const fn = allNodesFlat.find(n => n.id === f.from);
      const tn = allNodesFlat.find(n => n.id === f.to);
      if (!fn || !tn) return '';

      let wp = '';
      let labelPos = { x: 0, y: 0 };

      const fromN = nodes.find(n => n.id === f.from);
      const toN   = nodes.find(n => n.id === f.to);

      const toIsSPAbove   = toN?.kind === 'subProcess' && toN.y < Y_CENTER - 50;
      const toIsSPBelow   = toN?.kind === 'subProcess' && toN.y > Y_CENTER + 50;
      const fromIsSPAboveX = fromN?.kind === 'subProcess' && fromN.y < Y_CENTER - 50;
      const fromIsSPBelowX = fromN?.kind === 'subProcess' && fromN.y > Y_CENTER + 50;

      const fcx = fn.x + fn.w/2;
      const fcy = fn.y + fn.h/2;
      const tcx = tn.x + tn.w/2;
      const tcy = tn.y + tn.h/2;

      if (f.type === 'oui-sp' && toIsSPAbove) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      } else if (f.type === 'oui-sp' && toIsSPBelow) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y + fn.h}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      } else if (f.type === 'non-sp' && toIsSPBelow) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y + fn.h}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      } else if (f.type === 'non-sp' && toIsSPAbove) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      } else if (f.type === 'sp-return' && fromIsSPAboveX) {
        wp = `<di:waypoint x="${fn.x + fn.w}" y="${fcy}" /><di:waypoint x="${tcx}" y="${fcy}" /><di:waypoint x="${tcx}" y="${tn.y}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      } else if (f.type === 'sp-return' && fromIsSPBelowX) {
        wp = `<di:waypoint x="${fn.x + fn.w}" y="${fcy}" /><di:waypoint x="${tcx}" y="${fcy}" /><di:waypoint x="${tcx}" y="${tn.y + tn.h}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      } else if (f.type === 'main' && f.id.startsWith('Flow_NON_')) {
        // Boucle de retour : on route sous le diagramme et on place le
        // label sur ce chemin bas pour éviter qu'il ne chevauche les
        // tâches situées entre la source et la cible.
        const lowY = Math.max(fn.y + fn.h, tn.y + tn.h) + 60;
        wp = `<di:waypoint x="${fcx}" y="${fn.y + fn.h}" /><di:waypoint x="${fcx}" y="${lowY}" /><di:waypoint x="${tcx}" y="${lowY}" /><di:waypoint x="${tcx}" y="${tn.y + tn.h}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: lowY + 4 };
      } else if (f.type === 'main' && f.id.startsWith('Flow_OUI_') && Math.abs(tn.x - (fn.x + fn.w)) > H_GAP * 2) {
        const highY = Math.min(fn.y, tn.y) - 50;
        wp = `<di:waypoint x="${fcx}" y="${fn.y}" /><di:waypoint x="${fcx}" y="${highY}" /><di:waypoint x="${tcx}" y="${highY}" /><di:waypoint x="${tcx}" y="${tn.y}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: highY - 18 };
      } else {
        wp = `<di:waypoint x="${fn.x + fn.w}" y="${fcy}" /><di:waypoint x="${tn.x}" y="${tcy}" />`;
        labelPos = { x: (fcx + tcx)/2 - 30, y: Math.min(fcy, tcy) - 20 };
      }

      return `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">${wp}</bpmndi:BPMNEdge>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="ProcessusManager" exporterVersion="4.0">
  <bpmn:process id="${processId}" name="${processName}" isExecutable="true">
${bpmnElements}
${flowsXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
${shapes}
${edgesXml}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  private buildCondExpression(regle: RegleTransition): string {
    if (regle.modeRegle === 'metier') {
      const exprs: string[] = [];
      (regle.regleMetierIds || []).forEach(rmId => {
        const rm = this.reglesMetierDisponibles.find(r => r.id === rmId);
        rm?.conditions?.forEach(c => {
          exprs.push(this.conditionToExpression(c.champ, c.operateur, c.valeur).replace(/^\$\{|\}$/g, ''));
        });
      });
      const sep = regle.logiqueCombinaison === 'OU' ? ' || ' : ' && ';
      return exprs.length > 0 ? `\${${exprs.join(sep)}}` : '${true}';
    }
    return this.conditionToExpression(regle.champId || '', regle.operateur || '==', regle.valeur);
  }

  private mapChampTypeCamunda(type: ChampType): string {
    switch (type) {
      case 'number':   return 'long';
      case 'boolean':  return 'boolean';
      case 'date':     return 'date';
      case 'enum':     return 'enum';
      default:         return 'string';
    }
  }

  // Déclare les champs de la tâche comme camunda:formField, avec le même id
  // que celui référencé par regle.champId dans la conditionExpression de la
  // gateway suivante — sans ça la variable n'existe jamais dans le process Camunda.
  private buildFormDataXml(t: Tache, esc: (s: string) => string): string {
    const champs = this.getChamps(t);
    if (champs.length === 0) return '';
    const fields = champs.map(c => {
      const type = this.mapChampTypeCamunda(c.type);
      if (type === 'enum' && c.options?.length) {
        const values = c.options
          .map(o => `          <camunda:value id="${esc(String(o.value))}" name="${esc(o.label)}" />`)
          .join('\n');
        return `        <camunda:formField id="${esc(c.id)}" label="${esc(c.label)}" type="enum">\n${values}\n        </camunda:formField>`;
      }
      return `        <camunda:formField id="${esc(c.id)}" label="${esc(c.label)}" type="${type}" />`;
    }).join('\n');
    return `    <bpmn:extensionElements>\n      <camunda:formData>\n${fields}\n      </camunda:formData>\n    </bpmn:extensionElements>\n`;
  }

  private conditionToExpression(champ: string, operateur: string, valeur: any): string {
    switch (operateur) {
      case '==':         return `\${${champ} == '${valeur}'}`;
      case '!=':         return `\${${champ} != '${valeur}'}`;
      case '>':          return `\${${champ} > ${valeur}}`;
      case '<':          return `\${${champ} < ${valeur}}`;
      case '>=':         return `\${${champ} >= ${valeur}}`;
      case '<=':         return `\${${champ} <= ${valeur}}`;
      case 'contains':   return `\${${champ}.contains('${valeur}')}`;
      case 'isEmpty':    return `\${${champ} == null || ${champ} == ''}`;
      case 'isNotEmpty': return `\${${champ} != null && ${champ} != ''}`;
      default:           return `\${${champ} == '${valeur}'}`;
    }
  }

  // ============================================================
  // SVG HELPERS — Routage des arêtes (VUE SVG DYNAMIQUE)
  // ============================================================
  getEdgePath(edge: BpmnEdge): { d: string; labelX: number; labelY: number } | null {
    const from = this.bpmnDiagram.elements.find(e => e.id === edge.from);
    const to   = this.bpmnDiagram.elements.find(e => e.id === edge.to);
    if (!from || !to) return null;

    const fromCx = from.x + from.width / 2;
    const fromCy = from.y + from.height / 2;
    const toCx   = to.x + to.width / 2;
    const toCy   = to.y + to.height / 2;

    if (edge.routing === 'down-loop') {
      const fromBotY = from.y + from.height;
      const toBotY   = to.y + to.height;
      const pathY    = Math.max(fromBotY, toBotY) + 90;
      const d = `M ${fromCx},${fromBotY} L ${fromCx},${pathY} L ${toCx},${pathY} L ${toCx},${toBotY}`;
      return { d, labelX: (fromCx + toCx) / 2, labelY: pathY + 12 };
    }

    if (edge.routing === 'oui-jump') {
      const fromTopY = from.y;
      const toTopY   = to.y;
      const jumpIdx  = edge.jumpIndex ?? 0;
      const peakY    = Math.min(fromTopY, toTopY) - (50 + jumpIdx * 26);
      const d = `M ${fromCx},${fromTopY} L ${fromCx},${peakY} L ${toCx},${peakY} L ${toCx},${toTopY}`;
      return { d, labelX: (fromCx + toCx) / 2, labelY: peakY - 8 };
    }

    const x1 = from.x + from.width;
    const y1 = fromCy;
    const x2 = to.x;
    const y2 = toCy;

    if (Math.abs(y1 - y2) < 5) {
      const d = `M ${x1},${y1} L ${x2},${y2}`;
      return { d, labelX: (x1 + x2) / 2, labelY: y1 - 10 };
    }

    const midX = (x1 + x2) / 2;
    const d = `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`;
    return { d, labelX: midX + 4, labelY: (y1 + y2) / 2 };
  }

  getDiamondPoints(x: number, y: number, w: number, h: number): string {
    const cx = x + w/2, cy = y + h/2;
    return `${cx},${y} ${x+w},${cy} ${cx},${y+h} ${x},${cy}`;
  }

  getTaskFill(t?: Tache): string {
    if (!t) return '#ffffff';
    if (t.statut === 'TERMINE') return '#ecfdf5';
    if (t.statut === 'EN_COURS') return '#ecfeff';
    return '#ffffff';
  }

  getTaskStroke(t?: Tache): string {
    if (!t) return '#d1d5db';
    if (t.statut === 'TERMINE') return '#10b981';
    if (t.statut === 'EN_COURS') return '#06b6d4';
    return '#d1d5db';
  }

  getTaskTextColor(t?: Tache): string {
    if (!t) return '#111827';
    if (t.statut === 'TERMINE') return '#065f46';
    if (t.statut === 'EN_COURS') return '#155e75';
    return '#111827';
  }

  truncate(s: string, max: number): string {
    if (!s) return '';
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  getChamps(t: Tache): ChampDynamique[] {
    try { if (!t.formData) return []; return JSON.parse(t.formData).champs || []; } catch { return []; }
  }

  getRegles(t: Tache): RegleTransition[] {
    try {
      if (!t.formData) return [];
      return (JSON.parse(t.formData).regles || []).filter((r: RegleTransition) => r.actif !== false);
    } catch { return []; }
  }

  getReglesAll(t: Tache): RegleTransition[] {
    try { if (!t.formData) return []; return JSON.parse(t.formData).regles || []; } catch { return []; }
  }

  getValeurs(t: Tache): Record<string, any> {
    try { if (!t.formData) return {}; return JSON.parse(t.formData).valeurs || {}; } catch { return {}; }
  }

  hasFormData(t: Tache): boolean {
    return Object.values(this.getValeurs(t)).some(v => v !== '' && v !== null && v !== undefined);
  }

  getTacheNameByOrdre(ordre: number): string {
    return this.taches.find(t => t.ordre === ordre)?.nom || '?';
  }

  getTacheSuivante(): Tache | null {
    if (!this.formTaskOpen?.ordre) return null;
    const ordreCourant = this.formTaskOpen.ordre;
    const suivantes = this.tachesSorted().filter(t => (t.ordre ?? 0) > ordreCourant && t.id !== this.formTaskOpen!.id);
    return suivantes.length > 0 ? suivantes[0] : null;
  }

  openNewTacheForm() {
    if (!this.selectedProcessus?.id) return;
    this.isNewTask = true;
    this.formTaskOpen = {
      nom: 'Nouvelle tâche', description: '', assignee: '',
      type: 'HUMAINE', statut: 'TERMINE',
      ordre: this.taches.length + 1,
      processusId: this.selectedProcessus.id, formData: ''
    };
    this.currentChamps = []; this.currentRegles = []; this.formValues = {};
    this.currentSubprocess = { actif: false, nom: '', taches: [] };
    this.formError = ''; this.editorTab = 'info'; this.formStep = 1;
  }

  openTaskForm(tache: Tache) {
    this.isNewTask = false;
    this.formTaskOpen = { ...tache };
    this.currentChamps = this.getChamps(tache).map(c => ({ ...c }));
    this.currentRegles = this.getReglesAll(tache).map(r => {
      let ouiOrdres = r.tacheOuiOrdres || [];
      if ((!ouiOrdres || ouiOrdres.length === 0) && r.tacheOuiOrdre && r.tacheOuiOrdre > 0) {
        ouiOrdres = [r.tacheOuiOrdre];
      }
      return {
        ...r,
        modeRegle: r.modeRegle || 'simple',
        regleMetierIds: r.regleMetierIds || [],
        logiqueCombinaison: r.logiqueCombinaison || 'ET',
        actionDouaniere: r.actionDouaniere || '',
        tacheOuiOrdres: ouiOrdres,
        tacheOuiOrdre: r.tacheOuiOrdre || 0,
        tacheSinonOrdre: r.tacheSinonOrdre || 0,
        cibleType: r.cibleType || 'suivante',
        tacheCibleOrdre: r.tacheCibleOrdre || 0,
      };
    });
    this.formValues = { ...this.getValeurs(tache) };
    try {
      const data = JSON.parse(tache.formData || '{}');
      const sp = data.subprocess || { actif: false, nom: '', taches: [] };
      if (sp.taches) sp.taches.forEach((st: any) => { if (!st.branche) st.branche = ''; });
      this.currentSubprocess = sp;
    } catch { this.currentSubprocess = { actif: false, nom: '', taches: [] }; }
    this.formError = ''; this.editorTab = 'info'; this.formStep = 1;
  }

  closeTaskForm() {
    this.formTaskOpen = null;
    this.currentChamps = []; this.currentRegles = [];
    this.formValues = {}; this.formError = '';
    this.currentSubprocess = { actif: false, nom: '', taches: [] };
    this.formStep = 1;
  }

  nextFormStep(): void { if (this.formStep < 4) this.formStep++; }
  prevFormStep(): void { if (this.formStep > 1) this.formStep--; }
  goToStep(n: number): void { if (n <= this.formStep) this.formStep = n; }

  toggleOuiCible(regle: RegleTransition, ordre: number): void {
    if (!regle.tacheOuiOrdres) regle.tacheOuiOrdres = [];
    const idx = regle.tacheOuiOrdres.indexOf(ordre);
    if (idx >= 0) regle.tacheOuiOrdres.splice(idx, 1);
    else regle.tacheOuiOrdres.push(ordre);
  }

  isOuiCibleSelected(regle: RegleTransition, ordre: number): boolean {
    return (regle.tacheOuiOrdres || []).includes(ordre);
  }

  getOuiCiblesLabel(regle: RegleTransition): string {
    const ordres = regle.tacheOuiOrdres || [];
    if (ordres.length === 0) {
      const suiv = this.getTacheSuivante();
      return suiv ? `#${suiv.ordre} ${suiv.nom} (automatique)` : 'Fin du processus';
    }
    if (ordres.length === 1) return `#${ordres[0]} ${this.getTacheNameByOrdre(ordres[0])}`;
    return `${ordres.length} tâches en parallèle : ${ordres.map(o => `#${o}`).join(', ')}`;
  }

  saveTaskForm() {
    if (!this.formTaskOpen) return;
    this.formError = '';

    if (!this.formTaskOpen.nom?.trim()) { this.formError = 'Le nom de la tâche est obligatoire.'; return; }

    for (const r of this.currentRegles) {
      if (r.modeRegle === 'metier' && (!r.regleMetierIds || r.regleMetierIds.length === 0)) {
        this.formError = `La règle "${r.nom || 'sans nom'}" : sélectionnez au moins une règle métier.`; return;
      }
      if (r.modeRegle === 'simple' && !r.champId) {
        this.formError = `La règle "${r.nom || 'sans nom'}" : champ manquant.`; return;
      }
    }

    if (!this.isNewTask && this.currentChamps.length > 0) {
      for (const c of this.currentChamps) {
        if (c.required) {
          const v = this.formValues[c.id];
          if (v === undefined || v === null || v === '') { this.formError = `Le champ "${c.label}" est obligatoire.`; return; }
        }
      }
    }

    const evaluation = (!this.isNewTask && this.currentChamps.length > 0) ? this.getEvaluationResult() : null;
    if (evaluation) this.formTaskOpen.statut = 'TERMINE';

    const payload: Tache = {
      nom: this.formTaskOpen.nom,
      description: this.formTaskOpen.description || '',
      assignee: this.formTaskOpen.assignee || '',
      type: this.formTaskOpen.type,
      statut: this.formTaskOpen.statut,
      ordre: this.formTaskOpen.ordre,
      processusId: this.formTaskOpen.processusId,
      formData: JSON.stringify({ champs: this.currentChamps, regles: this.currentRegles, valeurs: this.formValues, subprocess: this.currentSubprocess })
    };

    const obs = (!this.isNewTask && this.formTaskOpen.id)
      ? this.tacheService.update(this.formTaskOpen.id, payload)
      : this.tacheService.create(payload);

    obs.subscribe({
      next: () => {
        this.closeTaskForm();
        if (evaluation) {
          let ordreCible: number;
          if (evaluation.match) {
            const ouiOrdres = this.getOuiOrdres(evaluation.regle);
            ordreCible = ouiOrdres.length > 0 ? ouiOrdres[0] : (this.getTacheSuivante()?.ordre ?? 0);
          } else {
            ordreCible = evaluation.regle.tacheSinonOrdre ?? 0;
          }

          this.loadTaches((taches) => {
            const tacheCible = taches.find(t => t.ordre === ordreCible);
            if (evaluation.match) {
              const ouiOrdres = this.getOuiOrdres(evaluation.regle);
              const detail = ouiOrdres.length > 1
                ? `→ ${ouiOrdres.length} tâches en parallèle`
                : (tacheCible ? `→ ${tacheCible.nom}` : 'Fin du processus');
              this.addToast('success', `✅ Règle « ${evaluation.regle.nom || 'sans nom'} » VALIDÉE`, detail, 5000);
            } else {
              this.addToast('info', `↪️ Règle « ${evaluation.regle.nom || 'sans nom'} » non validée`,
                tacheCible ? `→ ${tacheCible.nom}` : 'Fin du processus', 5000);
            }
            if (tacheCible) this.openTaskForm(tacheCible);
          });
        } else {
          this.loadTaches();
          this.addToast('success', `Tâche ${this.isNewTask ? 'créée' : 'mise à jour'} avec succès`);
        }
      },
      error: (err) => { this.formError = err?.error?.message || err?.error?.error || 'Erreur lors de la sauvegarde'; }
    });
  }

  confirmDeleteTache(tache: Tache): void { if (!tache.id) return; this.tacheToDelete = tache; }
  cancelDeleteTache(): void { this.tacheToDelete = null; this.deleting = false; }

  executeDeleteTache(): void {
    if (!this.tacheToDelete?.id) return;
    this.deleting = true;
    const id = this.tacheToDelete.id;
    const nom = this.tacheToDelete.nom;
    this.tacheService.delete(id).subscribe({
      next: () => {
        this.deleting = false; this.tacheToDelete = null;
        if (this.formTaskOpen?.id === id) this.closeTaskForm();
        this.loadTaches();
        if (this.showTachesListPopup && this.tachesListProcessus) {
          this.tachesList = this.tachesList.filter(t => t.id !== id);
          if (this.tachesListProcessus.id) this.taskCounts[this.tachesListProcessus.id] = this.tachesList.length;
        }
        this.addToast('success', `Tâche "${nom}" supprimée`);
      },
      error: (err) => {
        this.deleting = false;
        this.addToast('error', 'Erreur lors de la suppression', err?.error?.message);
        this.tacheToDelete = null;
      }
    });
  }

  addChamp() {
    this.currentChamps.push({ id: 'champ_' + (this.currentChamps.length + 1), label: '', type: 'string', required: false });
  }
  removeChamp(i: number) { this.currentChamps.splice(i, 1); }
  enumOptionsToString(c: ChampDynamique): string { return (c.options || []).map(o => o.label).join(', '); }
  stringToEnumOptions(c: ChampDynamique, val: string) {
    c.options = val.split(',').map(s => s.trim()).filter(s => s).map(s => ({ value: s, label: s }));
  }

  addRegle() {
    this.currentRegles.push({
      id: 'r_' + Date.now(),
      nom: '',
      modeRegle: 'simple',
      champId: '',
      operateur: '==',
      valeur: '',
      regleMetierIds: [],
      logiqueCombinaison: 'ET',
      actionDouaniere: '',
      tacheOuiOrdres: [],
      tacheOuiOrdre: 0,
      tacheSinonOrdre: 0,
      tacheCibleOrdre: 0,
      cibleType: 'suivante',
      actif: true
    });
  }

  removeRegle(i: number) { this.currentRegles.splice(i, 1); }

  getSubprocessDirect(tache: Tache): SubprocessDirect | null {
    try {
      const data = JSON.parse(tache.formData || '{}');
      const sp = data.subprocess as SubprocessDirect;
      return sp?.actif && (sp?.taches?.length ?? 0) > 0 ? sp : null;
    } catch { return null; }
  }

  hasSubprocessDirect(tache: Tache): boolean {
    return this.getSubprocessDirect(tache) !== null;
  }

  addSubprocessDirectTache(): void {
    this.currentSubprocess = {
      ...this.currentSubprocess,
      taches: [...(this.currentSubprocess.taches || []), { nom: '', type: 'HUMAINE', assignee: '', branche: null }]
    };
  }

  removeSubprocessDirectTache(idx: number): void {
    this.currentSubprocess = {
      ...this.currentSubprocess,
      taches: this.currentSubprocess.taches.filter((_, i) => i !== idx)
    };
  }

  trackByIndex(index: number): number { return index; }

  openSubprocessParent(el: BpmnElement): void {
    const match = el.id.match(/^sp_task_(\d+)(?:_(?:oui|non))?_\d+$/);
    if (!match) return;
    const parentId = parseInt(match[1], 10);
    const parentTache = this.taches.find(t => t.id === parentId);
    if (!parentTache) return;
    this.openTaskForm(parentTache);
    this.editorTab = 'subprocess';
  }

  autresTaches(): Tache[] {
    if (!this.formTaskOpen) return [];
    return this.tachesSorted().filter(t => t.ordre !== this.formTaskOpen!.ordre);
  }

  toggleModeRegle(regle: RegleTransition, mode: 'simple' | 'metier'): void {
    regle.modeRegle = mode;
    if (mode === 'metier') { if (!regle.regleMetierIds) regle.regleMetierIds = []; if (!regle.logiqueCombinaison) regle.logiqueCombinaison = 'ET'; }
    else { if (!regle.operateur) regle.operateur = '=='; }
  }

  toggleRegleMetier(regle: RegleTransition, regleMetierId: number): void {
    if (!regle.regleMetierIds) regle.regleMetierIds = [];
    const idx = regle.regleMetierIds.indexOf(regleMetierId);
    if (idx >= 0) regle.regleMetierIds.splice(idx, 1);
    else regle.regleMetierIds.push(regleMetierId);
  }

  isRegleMetierSelected(regle: RegleTransition, regleMetierId?: number): boolean {
    if (!regleMetierId || !regle.regleMetierIds) return false;
    return regle.regleMetierIds.includes(regleMetierId);
  }

  getCategoriesDistinctes(): string[] {
    const cats = new Set<string>();
    this.reglesMetierDisponibles.forEach(r => { if (r.categorie?.type) cats.add(r.categorie.type.toUpperCase()); });
    return Array.from(cats).sort();
  }

  getReglesMetierFiltrees(): RegleMetier[] {
    if (this.filtreCategorieRegle === 'TOUS') return this.reglesMetierDisponibles;
    return this.reglesMetierDisponibles.filter(r => r.categorie?.type?.toUpperCase() === this.filtreCategorieRegle);
  }

  getRegleMetierLabel(regleMetierId: number): string {
    const rm = this.reglesMetierDisponibles.find(r => r.id === regleMetierId);
    return rm ? `${rm.code} — ${rm.nom}` : `Règle #${regleMetierId} (introuvable)`;
  }

  getActionsSuggestionsForRegle(regle: RegleTransition): string[] {
    if (regle.modeRegle !== 'metier' || !regle.regleMetierIds?.length) return [];
    const actions = new Set<string>();
    regle.regleMetierIds.forEach(id => {
      const rm = this.reglesMetierDisponibles.find(r => r.id === id);
      const cat = rm?.categorie?.type?.toUpperCase();
      if (cat && this.actionsSuggeresParCategorie[cat]) this.actionsSuggeresParCategorie[cat].forEach(a => actions.add(a));
    });
    return Array.from(actions);
  }

  iconCategorie(type?: string): string {
    const map: Record<string, string> = { 'TAXE':'💰','QUOTA':'📊','CERTIFICATION':'📜','VERIFICATION':'🔍','CONTROLE':'🛃','DOUANE':'🏛️' };
    return map[(type || '').toUpperCase()] || '📋';
  }

  couleurCategorie(type?: string): string {
    const map: Record<string, string> = { 'TAXE':'#f59e0b','QUOTA':'#3b82f6','CERTIFICATION':'#10b981','VERIFICATION':'#8b5cf6','CONTROLE':'#ef4444','DOUANE':'#ec4899' };
    return map[(type || '').toUpperCase()] || '#6b7280';
  }

  getEvaluationResult(): { regle: RegleTransition; match: boolean } | null {
    for (const r of this.currentRegles) {
      if (!r.actif) continue;
      return { regle: r, match: this.evaluerRegle(r, this.formValues) };
    }
    return null;
  }

  private evaluerRegle(r: RegleTransition, vals: Record<string, any>): boolean {
    if (r.modeRegle === 'metier') {
      if (!r.regleMetierIds?.length) return false;
      const champIds = new Set(this.currentChamps.map(c => c.id));
      const resultats = r.regleMetierIds.map(rmId => {
        const rm = this.reglesMetierDisponibles.find(x => x.id === rmId);
        if (!rm?.conditions?.length) return false;
        const champsManquants = rm.conditions.filter(c => c.champ && !champIds.has(c.champ));
        if (champsManquants.length > 0) {
          console.warn(`[Règle métier "${rm.code}"] Champs introuvables dans la tâche : ${champsManquants.map(c => c.champ).join(', ')}. Ajoutez ces champs dans l'onglet "Champs".`);
        }
        return rm.conditions.every(c => this.evaluerConditionSimple(c.champ, c.operateur, c.valeur, vals));
      });
      return r.logiqueCombinaison === 'OU' ? resultats.some(ok => ok) : resultats.every(ok => ok);
    }
    return this.evaluerConditionSimple(r.champId || '', r.operateur || '==', r.valeur, vals);
  }

  getChampsManquantsRegleMetier(r: RegleTransition): string[] {
    if (r.modeRegle !== 'metier' || !r.regleMetierIds?.length) return [];
    const champIds = new Set(this.currentChamps.map(c => c.id));
    const manquants = new Set<string>();
    r.regleMetierIds.forEach(rmId => {
      const rm = this.reglesMetierDisponibles.find(x => x.id === rmId);
      (rm?.conditions || []).forEach(c => { if (c.champ && !champIds.has(c.champ)) manquants.add(c.champ); });
    });
    return Array.from(manquants);
  }

  private evaluerConditionSimple(champ: string, operateur: string, valeur: any, vals: Record<string, any>): boolean {
    if (!champ) return false;
    const v = vals[champ];
    switch (operateur) {
      case '==': return this.norm(v) === this.norm(valeur);
      case '!=': return this.norm(v) !== this.norm(valeur);
      case '>':  return Number(v) > Number(valeur);
      case '<':  return Number(v) < Number(valeur);
      case '>=': return Number(v) >= Number(valeur);
      case '<=': return Number(v) <= Number(valeur);
      case 'contains':   return String(v ?? '').toLowerCase().includes(String(valeur ?? '').toLowerCase());
      case 'isEmpty':    return v === undefined || v === null || v === '';
      case 'isNotEmpty': return v !== undefined && v !== null && v !== '';
      default: return false;
    }
  }

  private norm(v: any): any {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') return Number(v);
    return v;
  }

  // ── Popup liste des tâches ────────────────────────────────
  openTachesListPopup(p: Processus): void {
    this.tachesListProcessus = p;
    this.showTachesListPopup = true;
    this.tachesListLoading = true;
    this.tachesList = [];
    this.selectedTacheDetail = null;
    this.tacheService.getByProcessus(p.id!).subscribe({
      next: (data) => {
        this.tachesList = data.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
        this.tachesListLoading = false;
      },
      error: () => { this.tachesListLoading = false; }
    });
  }

  closeTachesListPopup(): void {
    this.tachesListProcessus = null;
    this.showTachesListPopup = false;
    this.tachesList = [];
    this.selectedTacheDetail = null;
  }

  editTacheFromList(t: Tache): void {
    if (!this.tachesListProcessus) return;
    const p = this.tachesListProcessus;
    const tId = t.id;
    this.selectedProcessus = p;
    this.originalFileBpmn = p.fileBpmn;
    this.viewMode = 'svg';
    this.errorMessage = ''; this.successMessage = '';
    this.taches = [...this.tachesList];
    this.buildBpmnDiagram();
    this.closeTachesListPopup();
    const tache = this.taches.find(tt => tt.id === tId);
    if (tache) this.openTaskForm(tache);
  }

  openTacheDetail(t: Tache): void { this.selectedTacheDetail = t; }
  closeTacheDetail(): void { this.selectedTacheDetail = null; }

  addToast(type: Toast['type'], message: string, detail?: string, duration = 4000): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message, detail });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }

  // ── Modal nouveau processus ──────────────────────────────
  private emptyProcessus(): Partial<Processus> {
    return { nom: '', typeProcessus: '', dateDebut: '', dateFin: '', actif: true };
  }

  openNewProcessusModal(): void {
    this.newProcessus = this.emptyProcessus();
    this.newProcessusError = '';
    this.newTypeSelect = '';
    this.newTypeLibre = '';
    this.showNewProcessusModal = true;
  }

  closeNewProcessusModal(): void {
    this.showNewProcessusModal = false;
    this.newProcessusError = '';
    this.newTypeSelect = '';
    this.newTypeLibre = '';
  }

  saveNewProcessus(): void {
    this.newProcessus.typeProcessus = this.newTypeSelect === 'autre'
      ? this.newTypeLibre.trim()
      : this.newTypeSelect;
    if (!this.newProcessus.nom?.trim()) { this.newProcessusError = 'Le nom du processus est obligatoire.'; return; }
    if (!this.newProcessus.typeProcessus)  { this.newProcessusError = 'Le type de processus est obligatoire.'; return; }
    if (!this.newProcessus.dateDebut)      { this.newProcessusError = 'La date de début est obligatoire.'; return; }

    this.newProcessusLoading = true;
    this.newProcessusError = '';
    this.processusService.create(this.newProcessus as Processus).subscribe({
      next: () => {
        this.newProcessusLoading = false;
        this.closeNewProcessusModal();
        this.load();
        this.addToast('success', `Processus "${this.newProcessus.nom}" créé avec succès`);
        this.notifSvc.notify({ type: 'success', category: 'processus', icon: '🔄', title: 'Processus créé', message: `Le processus « ${this.newProcessus.nom} » a été créé avec succès.` });
      },
      error: (err) => {
        this.newProcessusLoading = false;
        this.newProcessusError = err?.error?.message || err?.error?.error || 'Erreur lors de la création';
      }
    });
  }

  // ── Modal modifier processus ─────────────────────────────
  openEditProcessusModal(p: Processus): void {
    this.editProcessus = { ...p };
    this.editProcessusError = '';
    if (p.typeProcessus && this.predefinedTypes.includes(p.typeProcessus)) {
      this.editTypeSelect = p.typeProcessus;
      this.editTypeLibre = '';
    } else {
      this.editTypeSelect = p.typeProcessus ? 'autre' : '';
      this.editTypeLibre = p.typeProcessus || '';
    }
    this.showEditProcessusModal = true;
  }

  closeEditProcessusModal(): void {
    this.showEditProcessusModal = false;
    this.editProcessusError = '';
    this.editTypeSelect = '';
    this.editTypeLibre = '';
  }

  saveEditProcessus(): void {
    this.editProcessus.typeProcessus = this.editTypeSelect === 'autre'
      ? this.editTypeLibre.trim()
      : this.editTypeSelect;
    if (!this.editProcessus.nom?.trim())    { this.editProcessusError = 'Le nom est obligatoire.'; return; }
    if (!this.editProcessus.typeProcessus) { this.editProcessusError = 'Le type est obligatoire.'; return; }
    if (!this.editProcessus.dateDebut)     { this.editProcessusError = 'La date de début est obligatoire.'; return; }
    if (!this.editProcessus.id)            { this.editProcessusError = 'Identifiant manquant.'; return; }

    this.editProcessusLoading = true;
    this.editProcessusError = '';
    this.processusService.update(this.editProcessus.id, this.editProcessus as Processus).subscribe({
      next: () => {
        this.editProcessusLoading = false;
        const nom = this.editProcessus.nom;
        this.closeEditProcessusModal();
        this.load();
        this.addToast('success', `Processus "${nom}" mis à jour avec succès`);
        this.notifSvc.notify({ type: 'success', category: 'processus', icon: '✏️', title: 'Processus modifié', message: `Le processus « ${nom} » a été mis à jour.` });
      },
      error: (err) => {
        this.editProcessusLoading = false;
        this.editProcessusError = err?.error?.message || err?.error?.error || 'Erreur lors de la mise à jour';
      }
    });
  }

  calculateEditDuration(): string {
    if (!this.editProcessus.dateDebut || !this.editProcessus.dateFin) return '—';
    const debut = new Date(this.editProcessus.dateDebut);
    const fin   = new Date(this.editProcessus.dateFin);
    const days  = Math.ceil((fin.getTime() - debut.getTime()) / 86400000);
    if (days < 0)   return 'Date de fin invalide';
    if (days === 0)  return 'Même jour';
    if (days === 1)  return '1 jour';
    if (days < 30)   return `${days} jours`;
    if (days < 365)  return `${Math.round(days / 30)} mois (${days} j)`;
    return `${(days / 365).toFixed(1)} an(s) (${days} j)`;
  }

  calculateNewDuration(): string {
    if (!this.newProcessus.dateDebut || !this.newProcessus.dateFin) return '—';
    const debut = new Date(this.newProcessus.dateDebut);
    const fin   = new Date(this.newProcessus.dateFin);
    const days  = Math.ceil((fin.getTime() - debut.getTime()) / 86400000);
    if (days < 0)  return 'Date de fin invalide';
    if (days === 0) return 'Même jour';
    if (days === 1) return '1 jour';
    if (days < 30)  return `${days} jours`;
    if (days < 365) return `${Math.round(days / 30)} mois (${days} j)`;
    return `${(days / 365).toFixed(1)} an(s) (${days} j)`;
  }

  getBpmnDiagram(): BpmnDiagram { return this.bpmnDiagram; }
  resetBpmnDiagram(): void { this.bpmnDiagram = { elements: [], edges: [], viewWidth: 800, viewHeight: 280 }; }
  hasOuiBranch(tache: Tache): boolean { return this.getRegles(tache).some(r => this.getOuiOrdres(r).length > 0); }
  hasNonBranch(tache: Tache): boolean { return this.getRegles(tache).some(r => r.tacheSinonOrdre && r.tacheSinonOrdre > 0); }
  getTacheOui(tache: Tache): Tache | null {
    const regles = this.getRegles(tache);
    if (!regles.length) return null;
    const ordres = this.getOuiOrdres(regles[0]);
    const ordre = ordres[0] || (tache.ordre ? (tache.ordre + 1) : null);
    if (!ordre) return null;
    return this.tachesSorted().find(t => t.ordre === ordre) || null;
  }
  getTacheNon(tache: Tache): Tache | null {
    const regles = this.getRegles(tache);
    if (!regles.length) return null;
    const regle = regles[0];
    if (!regle.tacheSinonOrdre) return null;
    return this.tachesSorted().find(t => t.ordre === regle.tacheSinonOrdre) || null;
  }
  getRegleLabel(tache: Tache): string {
    const regles = this.getRegles(tache);
    if (!regles.length) return 'Pas de condition';
    return regles[0].nom || 'Condition sans nom';
  }
  getAllEdges(): BpmnEdge[] { return this.bpmnDiagram.edges; }
  getTachesWithGateways(): Tache[] { return this.tachesSorted().filter(t => this.getRegles(t).length > 0); }
  countOuiBranches(): number { return this.bpmnDiagram.edges.filter(e => e.branchType === 'oui' && e.routing === 'oui-jump').length; }
  countNonBranches(): number { return this.bpmnDiagram.edges.filter(e => e.branchType === 'non' && e.routing === 'down-loop').length; }
  hasBoucles(): boolean { return this.bpmnDiagram.edges.some(e => e.isLoopBack === true); }
  getElementBpmnById(id: string): BpmnElement | undefined { return this.bpmnDiagram.elements.find(e => e.id === id); }
  getEdgeBpmnById(id: string): BpmnEdge | undefined { return this.bpmnDiagram.edges.find(e => e.id === id); }

}