import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { TacheService } from '../../core/services/tache.service';
import { RegleMetierService } from '../../core/services/regle.service';
import { Processus, Tache } from '../../models/processus.model';
import { RegleMetier } from '../../models/regle.model';
import { BpmnViewerComponent } from '../processus/bpmn-viewer.component';

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
  subprocessOuiId?: string;
  subprocessSinonId?: string;
  subprocessOuiNom?: string;
  subprocessSinonNom?: string;
  subprocessOuiTaches?: { nom: string; type: 'HUMAINE' | 'SYSTEME'; assignee?: string }[];
  subprocessSinonTaches?: { nom: string; type: 'HUMAINE' | 'SYSTEME'; assignee?: string }[];
  tacheOuiOrdre?: number;
  tacheCibleOrdre: number;
  cibleType: 'suivante' | 'specifique' | 'subprocess';
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
  subprocessId?: string;
  subprocessColor?: string;
  virtualTaches?: { nom: string; type: string; assignee?: string }[];
}

export interface BpmnEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  branchType?: 'oui' | 'non' | 'normal';
  routing?: 'straight' | 'down-loop' | 'oui-jump' | 'oui-fork' | 'subprocess-oui' | 'subprocess-non';
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
  imports: [CommonModule, FormsModule, RouterLink, BpmnViewerComponent],
  templateUrl: './processus-list.html',
  styleUrls: ['./processus-list.css']
})
export class ProcessusListComponent implements OnInit {
  private processusService = inject(ProcessusService);
  private tacheService = inject(TacheService);
  private regleMetierService = inject(RegleMetierService);

  processus: Processus[] = [];
  taskCounts: Record<number, number> = {};
  searchTerm = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';
  selectedProcessus: Processus | null = null;
  taches: Tache[] = [];
  errorMessage = '';
  successMessage = '';
  workflowNodes: WfNode[] = [];

  formTaskOpen: Tache | null = null;
  isNewTask = false;
  editorTab: 'info' | 'champs' | 'regles' | 'donnees' = 'info';
  currentChamps: ChampDynamique[] = [];
  currentRegles: RegleTransition[] = [];
  formValues: Record<string, any> = {};
  formError = '';

  toasts: Toast[] = [];
  tacheToDelete: Tache | null = null;
  deleting = false;

  viewMode: 'svg' | 'bpmn' = 'svg';
  generatedBpmnUrl: string | null = null;
  private originalFileBpmn: string | undefined = undefined;

  reglesMetierDisponibles: RegleMetier[] = [];
  filtreCategorieRegle: string = 'TOUS';

  subprocessColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6'];

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
  private readonly SP_TASK_W = 140;
  private readonly SP_TASK_H = 60;
  private readonly SP_H_GAP = 50;
  private readonly SP_LANE_OFFSET = 150;
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

  filteredProcessus(): Processus[] {
    return this.processus.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.typeProcessus?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus =
        this.filterStatus === 'all' ||
        (this.filterStatus === 'active' && p.actif) ||
        (this.filterStatus === 'inactive' && !p.actif);
      return matchSearch && matchStatus;
    });
  }

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
      next: (upd: any) => { if (upd && typeof upd.actif === 'boolean') p.actif = upd.actif; },
      error: (err) => { p.actif = old; this.addToast('error', 'Erreur', err?.error?.message || err.message); }
    });
  }

  delete(id: number) {
    if (confirm('Supprimer ce processus ?')) {
      this.processusService.delete(id).subscribe(() => this.load());
    }
  }

  openTachesPopup(p: Processus) {
    this.selectedProcessus = p;
    this.originalFileBpmn = p.fileBpmn;
    this.errorMessage = ''; this.successMessage = '';
    this.viewMode = 'svg';
    this.loadTaches();
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
  // CLIC SUR SUBPROCESS — Ouvre la règle parente
  // ============================================================
  onSubprocessClick(el: BpmnElement): void {
    if (!el.subprocessId) return;
    const match = el.subprocessId.match(/^sp_(oui|non)_(\d+)$/);
    if (!match) return;
    const tacheId = parseInt(match[2], 10);
    const tacheParente = this.taches.find(t => t.id === tacheId);
    if (!tacheParente) {
      this.addToast('warning', 'Tâche parente introuvable');
      return;
    }
    this.openTaskForm(tacheParente);
    this.editorTab = 'regles';
    this.addToast('info',
      `📝 Édition du SubProcess "${el.label}"`,
      `via la règle de la tâche "${tacheParente.nom}"`,
      3500
    );
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

    sorted.forEach((t) => {
      const taskId = 'task_' + t.id;
      elements.push({
        type: 'task', id: taskId,
        x, y: LANE_TOP_Y - TASK_H / 2, width: TASK_W, height: TASK_H,
        label: t.nom, sublabel: t.type, status: t.statut, tache: t,
        isCorrection: false, lane: 0
      });
      ordreToTaskId.set(t.ordre ?? 0, taskId);

      edges.push({
        id: `e_${prevId}_${taskId}`, from: prevId, to: taskId,
        branchType: 'normal', routing: 'straight'
      });
      prevId = taskId;
      x += TASK_W + H_GAP;

      const regles = this.getRegles(t);
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
        edges.push({
          id: `e_${prevId}_${gwId}`, from: prevId, to: gwId,
          branchType: 'normal', routing: 'straight'
        });
        prevId = gwId;
        x += GW_SIZE + H_GAP;
      }
    });

    const endId = 'end';
    elements.push({
      type: 'endEvent', id: endId,
      x, y: LANE_TOP_Y - EVT_R, width: EVT_R * 2, height: EVT_R * 2,
      label: 'Fin', lane: 0
    });

    const lastIsGateway = prevId.startsWith('gw_');
    edges.push({
      id: `e_${prevId}_${endId}`, from: prevId, to: endId,
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
    let colorIdx = 0;
    sorted.forEach(t => {
      const regles = this.getRegles(t);
      regles.forEach(regle => {
        const gwId = ordreToGwId.get(t.ordre ?? 0);
        if (!gwId) return;

        const nextInOrder = sorted.find(tt => (tt.ordre ?? 0) > (t.ordre ?? 0));

        if (regle.cibleType === 'subprocess' && regle.subprocessOuiTaches && regle.subprocessOuiTaches.length > 0) {
          const spId = regle.subprocessOuiId || ('sp_oui_' + t.id);
          const spColor = this.subprocessColors[colorIdx % this.subprocessColors.length];
          colorIdx++;

          const oldIdx = edges.findIndex(e => e.from === gwId && e.branchType === 'oui');
          if (oldIdx >= 0) edges.splice(oldIdx, 1);

          const spY = LANE_TOP_Y - this.SP_LANE_OFFSET - this.SP_TASK_H;
          let spX = elements.find(el => el.id === gwId)!.x;

          const spTaskIds: string[] = [];
          regle.subprocessOuiTaches.forEach((vt, vi) => {
            const vtId = `${spId}_task_${vi}`;
            spTaskIds.push(vtId);
            elements.push({
              type: 'subprocess', id: vtId,
              x: spX, y: spY,
              width: this.SP_TASK_W, height: this.SP_TASK_H,
              label: vt.nom, sublabel: vt.type,
              isVirtual: true, subprocessId: spId, subprocessColor: spColor,
              lane: -1
            });
            spX += this.SP_TASK_W + this.SP_H_GAP;
          });

          edges.push({
            id: `e_oui_sp_${gwId}_${spTaskIds[0]}`, from: gwId, to: spTaskIds[0],
            label: 'Oui', branchType: 'oui', routing: 'subprocess-oui', jumpIndex: 0
          });
          for (let vi = 0; vi < spTaskIds.length - 1; vi++) {
            edges.push({
              id: `e_sp_${spTaskIds[vi]}_${spTaskIds[vi + 1]}`,
              from: spTaskIds[vi], to: spTaskIds[vi + 1],
              branchType: 'normal', routing: 'straight'
            });
          }
          const nextMainId = nextInOrder ? ordreToTaskId.get(nextInOrder.ordre ?? 0) || endId : endId;
          edges.push({
            id: `e_sp_return_${spTaskIds[spTaskIds.length - 1]}_${nextMainId}`,
            from: spTaskIds[spTaskIds.length - 1], to: nextMainId,
            branchType: 'oui', routing: 'subprocess-oui', jumpIndex: 1
          });
          return;
        }

        const cibles = this.getOuiOrdres(regle);
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

        if (regle.cibleType === 'subprocess' && regle.subprocessSinonTaches && regle.subprocessSinonTaches.length > 0) {
          const spId = regle.subprocessSinonId || ('sp_non_' + t.id);
          const spColor = '#ef4444';

          const spY = LANE_TOP_Y + TASK_H + this.SP_LANE_OFFSET;
          let spX = elements.find(el => el.id === gwId)!.x;

          const spTaskIds: string[] = [];
          regle.subprocessSinonTaches.forEach((vt, vi) => {
            const vtId = `${spId}_task_${vi}`;
            spTaskIds.push(vtId);
            elements.push({
              type: 'subprocess', id: vtId,
              x: spX, y: spY,
              width: this.SP_TASK_W, height: this.SP_TASK_H,
              label: vt.nom, sublabel: vt.type,
              isVirtual: true, subprocessId: spId, subprocessColor: spColor,
              lane: 1
            });
            spX += this.SP_TASK_W + this.SP_H_GAP;
          });

          edges.push({
            id: `e_non_sp_${gwId}_${spTaskIds[0]}`, from: gwId, to: spTaskIds[0],
            label: 'Non', branchType: 'non', routing: 'subprocess-non'
          });
          for (let vi = 0; vi < spTaskIds.length - 1; vi++) {
            edges.push({
              id: `e_sp_non_${spTaskIds[vi]}_${spTaskIds[vi + 1]}`,
              from: spTaskIds[vi], to: spTaskIds[vi + 1],
              branchType: 'non', routing: 'straight'
            });
          }
          return;
        }

        if (regle.tacheSinonOrdre && regle.tacheSinonOrdre > 0) {
          const cibleId = ordreToTaskId.get(regle.tacheSinonOrdre);
          if (gwId && cibleId) {
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

    const hasBranchesNon = edges.some(e => e.branchType === 'non');
    const hasJumps = edges.some(e => e.routing === 'oui-jump');
    const hasSubprocessOui = edges.some(e => e.routing === 'subprocess-oui');
    const hasSubprocessNon = edges.some(e => e.routing === 'subprocess-non');
    const maxJumpIdx = Math.max(0, ...edges.filter(e => e.routing === 'oui-jump').map(e => e.jumpIndex ?? 0));
    const totalW = Math.max(x + EVT_R * 2 + 80, 900);
    const jumpTopSpace = hasJumps ? (80 + maxJumpIdx * 28) : 0;
    const spOuiSpace = hasSubprocessOui ? this.SP_LANE_OFFSET + this.SP_TASK_H + 30 : 0;
    const spNonSpace = hasSubprocessNon ? this.SP_LANE_OFFSET + this.SP_TASK_H + 30 : 0;
    const loopSpace = hasBranchesNon && !hasSubprocessNon ? this.LANE_BOT_OFFSET + 50 : 0;

    const topExtra = Math.max(jumpTopSpace, spOuiSpace);
    const botExtra = Math.max(loopSpace, spNonSpace);

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
  private generateBpmnXml(): string | null {
    if (!this.selectedProcessus || this.taches.length === 0) return null;
    const sorted = this.tachesSorted();
    const processId = `Process_${this.selectedProcessus.id}`;
    const processName = (this.selectedProcessus.nom || 'Processus').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] || c));

    const TASK_W = 100, TASK_H = 80, GW_SIZE = 50, EVT_R = 18, H_GAP = 60;
    const Y_CENTER = 280;
    const SP_INNER_W = 90, SP_INNER_H = 60, SP_INNER_GAP = 30;
    const SP_PADDING = 20;

    interface LayoutNode {
      kind: 'start' | 'end' | 'task' | 'gateway' | 'subProcess';
      id: string; x: number; y: number; w: number; h: number; label: string;
      tache?: Tache;
      regles?: RegleTransition[];
      spTaches?: { nom: string; type: string; assignee?: string }[];
      spBranche?: 'oui' | 'non';
      gatewayId?: string;
      internalNodes?: InternalNode[];
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

    // ─── TÂCHES + GATEWAYS + SUBPROCESS ───
    sorted.forEach(t => {
      const tid = `Task_${t.id}`;
      nodes.push({
        kind: 'task', id: tid,
        x: curX, y: Y_CENTER - TASK_H/2, w: TASK_W, h: TASK_H,
        label: t.nom, tache: t
      });
      curX += TASK_W + H_GAP;

      const regles = this.getRegles(t);
      if (regles.length > 0) {
        const gwId = `Gateway_${t.id}`;
        const gwX = curX;
        nodes.push({
          kind: 'gateway', id: gwId,
          x: gwX, y: Y_CENTER - GW_SIZE/2, w: GW_SIZE, h: GW_SIZE,
          label: 'SI/SINON', tache: t, regles
        });
        curX += GW_SIZE + H_GAP;

        const regle = regles[0];

        if (regle.cibleType === 'subprocess' && regle.subprocessOuiTaches?.length) {
          const spId = `SubProcess_OUI_${t.id}`;
          const numTaches = regle.subprocessOuiTaches.length;
          const innerWidth = numTaches * (SP_INNER_W + SP_INNER_GAP) - SP_INNER_GAP;
          const spW = innerWidth + SP_PADDING * 2;
          const spH = SP_INNER_H + SP_PADDING * 2 + 20;
          const spX = gwX + GW_SIZE + 20;
          const spY = Y_CENTER - 230;

          const internalNodes: InternalNode[] = [];
          let ix = spX + SP_PADDING;
          const iy = spY + SP_PADDING + 10;

          regle.subprocessOuiTaches.forEach((vt, vi) => {
            internalNodes.push({
              kind: 'task', id: `${spId}_t${vi}`,
              x: ix, y: iy,
              w: SP_INNER_W, h: SP_INNER_H,
              label: vt.nom, type: vt.type, assignee: vt.assignee
            });
            ix += SP_INNER_W + SP_INNER_GAP;
          });

          nodes.push({
            kind: 'subProcess', id: spId,
            x: spX, y: spY, w: spW, h: spH,
            label: regle.subprocessOuiNom || 'SubProcess OUI',
            spTaches: regle.subprocessOuiTaches,
            spBranche: 'oui',
            gatewayId: gwId,
            internalNodes
          });
        }

        if (regle.cibleType === 'subprocess' && regle.subprocessSinonTaches?.length) {
          const spId = `SubProcess_NON_${t.id}`;
          const numTaches = regle.subprocessSinonTaches.length;
          const innerWidth = numTaches * (SP_INNER_W + SP_INNER_GAP) - SP_INNER_GAP;
          const spW = innerWidth + SP_PADDING * 2;
          const spH = SP_INNER_H + SP_PADDING * 2 + 20;
          const spX = gwX + GW_SIZE + 20;
          const spY = Y_CENTER + 100;

          const internalNodes: InternalNode[] = [];
          let ix = spX + SP_PADDING;
          const iy = spY + SP_PADDING + 10;

          regle.subprocessSinonTaches.forEach((vt, vi) => {
            internalNodes.push({
              kind: 'task', id: `${spId}_t${vi}`,
              x: ix, y: iy,
              w: SP_INNER_W, h: SP_INNER_H,
              label: vt.nom, type: vt.type, assignee: vt.assignee
            });
            ix += SP_INNER_W + SP_INNER_GAP;
          });

          nodes.push({
            kind: 'subProcess', id: spId,
            x: spX, y: spY, w: spW, h: spH,
            label: regle.subprocessSinonNom || 'SubProcess NON',
            spTaches: regle.subprocessSinonTaches,
            spBranche: 'non',
            gatewayId: gwId,
            internalNodes
          });
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

    const mainFlow = nodes.filter(n => n.kind !== 'subProcess');

    for (let i = 0; i < mainFlow.length - 1; i++) {
      const cur = mainFlow[i];
      const nxt = mainFlow[i + 1];

      if (cur.kind === 'gateway' && cur.regles?.length) {
        const regle = cur.regles[0];
        const cibles = this.getOuiOrdres(regle);

        if (regle.cibleType === 'subprocess' && regle.subprocessOuiTaches?.length) {
          const spOui = nodes.find(n => n.id === `SubProcess_OUI_${cur.tache?.id}`);
          if (spOui) {
            flows.push({
              id: `Flow_OUI_SP_${cur.id}`, from: cur.id, to: spOui.id,
              name: `✓ ${regle.subprocessOuiNom || 'OUI'}`,
              isCondition: true, condExpr: this.buildCondExpression(regle),
              type: 'oui-sp'
            });
            flows.push({
              id: `Flow_RET_OUI_SP_${cur.id}`, from: spOui.id, to: nxt.id,
              type: 'sp-return'
            });
          }
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

        if (regle.cibleType === 'subprocess' && regle.subprocessSinonTaches?.length) {
          const spNon = nodes.find(n => n.id === `SubProcess_NON_${cur.tache?.id}`);
          if (spNon) {
            flows.push({
              id: `Flow_NON_SP_${cur.id}`, from: cur.id, to: spNon.id,
              name: '✗ SINON', type: 'non-sp'
            });
            flows.push({
              id: `Flow_RET_NON_SP_${cur.id}`, from: spNon.id, to: nxt.id,
              type: 'sp-return'
            });
          }
        } else if (regle.tacheSinonOrdre && regle.tacheSinonOrdre > 0) {
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
            const aa = inn.assignee ? ` camunda:assignee="${esc(inn.assignee)}"` : '';
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
          const t = n.tache!;
          const inF  = flows.filter(f => f.to   === n.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
          const outF = flows.filter(f => f.from === n.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
          const tt = t.type === 'HUMAINE' ? 'bpmn:userTask' : 'bpmn:serviceTask';
          const aa = t.assignee ? ` camunda:assignee="${esc(t.assignee)}"` : '';
          return `    <${tt} id="${n.id}" name="${esc(t.nom)}"${aa}>${inF}${outF}</${tt}>`;
        }
        case 'gateway': {
          const inF  = flows.filter(f => f.to   === n.id).map(f => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
          const outF = flows.filter(f => f.from === n.id).map(f => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
          const defFlow = flows.find(f => f.from === n.id && (f.id.startsWith('Flow_NON_') || f.id.startsWith('Flow_NON_SP_')));
          const defAttr = defFlow ? ` default="${defFlow.id}"` : '';
          return `    <bpmn:exclusiveGateway id="${n.id}" name="${esc(n.label)}" gatewayDirection="Diverging"${defAttr}>${inF}${outF}</bpmn:exclusiveGateway>`;
        }
      }
      return '';
    }).join('\n');

    const flowsXml = flows
      .filter(f => f.type !== 'sp-internal')
      .map(f => {
        if (f.isCondition && f.condExpr) {
          return `    <bpmn:sequenceFlow id="${f.id}"${f.name ? ` name="${esc(f.name)}"` : ''} sourceRef="${f.from}" targetRef="${f.to}"><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${esc(f.condExpr)}</bpmn:conditionExpression></bpmn:sequenceFlow>`;
        }
        return `    <bpmn:sequenceFlow id="${f.id}"${f.name ? ` name="${esc(f.name)}"` : ''} sourceRef="${f.from}" targetRef="${f.to}" />`;
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
      } else if (f.type === 'oui-sp' && toIsSPBelow) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y + fn.h}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
      } else if (f.type === 'non-sp' && toIsSPBelow) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y + fn.h}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
      } else if (f.type === 'non-sp' && toIsSPAbove) {
        wp = `<di:waypoint x="${fcx}" y="${fn.y}" /><di:waypoint x="${fcx}" y="${tn.y + tn.h/2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h/2}" />`;
      } else if (f.type === 'sp-return' && fromIsSPAboveX) {
        wp = `<di:waypoint x="${fn.x + fn.w}" y="${fcy}" /><di:waypoint x="${tcx}" y="${fcy}" /><di:waypoint x="${tcx}" y="${tn.y}" />`;
      } else if (f.type === 'sp-return' && fromIsSPBelowX) {
        wp = `<di:waypoint x="${fn.x + fn.w}" y="${fcy}" /><di:waypoint x="${tcx}" y="${fcy}" /><di:waypoint x="${tcx}" y="${tn.y + tn.h}" />`;
      } else if (f.type === 'main' && f.id.startsWith('Flow_NON_')) {
        const lowY = Math.max(fn.y + fn.h, tn.y + tn.h) + 60;
        wp = `<di:waypoint x="${fcx}" y="${fn.y + fn.h}" /><di:waypoint x="${fcx}" y="${lowY}" /><di:waypoint x="${tcx}" y="${lowY}" /><di:waypoint x="${tcx}" y="${tn.y + tn.h}" />`;
      } else if (f.type === 'main' && f.id.startsWith('Flow_OUI_') && Math.abs(tn.x - (fn.x + fn.w)) > H_GAP * 2) {
        const highY = Math.min(fn.y, tn.y) - 50;
        wp = `<di:waypoint x="${fcx}" y="${fn.y}" /><di:waypoint x="${fcx}" y="${highY}" /><di:waypoint x="${tcx}" y="${highY}" /><di:waypoint x="${tcx}" y="${tn.y}" />`;
      } else {
        wp = `<di:waypoint x="${fn.x + fn.w}" y="${fcy}" /><di:waypoint x="${tn.x}" y="${tcy}" />`;
      }

      const labelXml = f.name ? `<bpmndi:BPMNLabel><dc:Bounds x="${(fcx + tcx)/2 - 30}" y="${Math.min(fcy, tcy) - 20}" width="60" height="14" /></bpmndi:BPMNLabel>` : '';

      return `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">${wp}${labelXml}</bpmndi:BPMNEdge>`;
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

    if (edge.routing === 'subprocess-oui') {
      if (edge.jumpIndex === 0) {
        const fromTopY = from.y;
        const peakY    = Math.min(fromTopY, to.y) - 18;
        const d = `M ${fromCx},${fromTopY} L ${fromCx},${peakY} L ${toCx},${peakY} L ${toCx},${to.y + to.height}`;
        return { d, labelX: (fromCx + toCx) / 2, labelY: peakY - 8 };
      } else {
        const peakY    = Math.min(from.y, to.y) - 18;
        const d = `M ${fromCx},${from.y} L ${fromCx},${peakY} L ${toCx},${peakY} L ${toCx},${to.y}`;
        return { d, labelX: (fromCx + toCx) / 2, labelY: peakY - 8 };
      }
    }

    if (edge.routing === 'subprocess-non') {
      const fromBotY = from.y + from.height;
      const peakY    = Math.max(fromBotY, to.y + to.height) + 20;
      const d = `M ${fromCx},${fromBotY} L ${fromCx},${peakY} L ${toCx},${peakY} L ${toCx},${to.y}`;
      return { d, labelX: (fromCx + toCx) / 2, labelY: fromBotY + 12 };
    }

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
      type: 'HUMAINE', statut: 'EN_ATTENTE',
      ordre: this.taches.length + 1,
      processusId: this.selectedProcessus.id, formData: ''
    };
    this.currentChamps = []; this.currentRegles = []; this.formValues = {};
    this.formError = ''; this.editorTab = 'info';
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
        subprocessOuiTaches: r.subprocessOuiTaches || [],
        subprocessSinonTaches: r.subprocessSinonTaches || []
      };
    });
    this.formValues = { ...this.getValeurs(tache) };
    this.formError = ''; this.editorTab = 'info';
  }

  closeTaskForm() {
    this.formTaskOpen = null;
    this.currentChamps = []; this.currentRegles = [];
    this.formValues = {}; this.formError = '';
  }

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
    if (regle.cibleType === 'subprocess') {
      const n = regle.subprocessOuiTaches?.length || 0;
      return n > 0 ? `SubProcess : ${n} tâche(s) virtuelle(s)` : 'SubProcess vide';
    }
    const ordres = regle.tacheOuiOrdres || [];
    if (ordres.length === 0) {
      const suiv = this.getTacheSuivante();
      return suiv ? `#${suiv.ordre} ${suiv.nom} (automatique)` : 'Fin du processus';
    }
    if (ordres.length === 1) return `#${ordres[0]} ${this.getTacheNameByOrdre(ordres[0])}`;
    return `${ordres.length} tâches en parallèle : ${ordres.map(o => `#${o}`).join(', ')}`;
  }

  addSubprocessOuiTache(regle: RegleTransition): void {
    if (!regle.subprocessOuiTaches) regle.subprocessOuiTaches = [];
    regle.subprocessOuiTaches.push({ nom: 'Nouvelle tâche', type: 'HUMAINE', assignee: '' });
  }

  removeSubprocessOuiTache(regle: RegleTransition, idx: number): void {
    if (regle.subprocessOuiTaches) regle.subprocessOuiTaches.splice(idx, 1);
  }

  addSubprocessSinonTache(regle: RegleTransition): void {
    if (!regle.subprocessSinonTaches) regle.subprocessSinonTaches = [];
    regle.subprocessSinonTaches.push({ nom: 'Nouvelle tâche', type: 'HUMAINE', assignee: '' });
  }

  removeSubprocessSinonTache(regle: RegleTransition, idx: number): void {
    if (regle.subprocessSinonTaches) regle.subprocessSinonTaches.splice(idx, 1);
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
      if (r.cibleType === 'subprocess') {
        if (!r.subprocessOuiTaches || r.subprocessOuiTaches.length === 0) {
          this.formError = `La règle "${r.nom || 'sans nom'}" : ajoutez au moins une tâche dans le SubProcess OUI.`; return;
        }
      }
    }

    if (this.editorTab === 'donnees') {
      for (const c of this.currentChamps) {
        if (c.required) {
          const v = this.formValues[c.id];
          if (v === undefined || v === null || v === '') { this.formError = `Le champ "${c.label}" est obligatoire.`; return; }
        }
      }
    }

    const evaluation = this.getEvaluationResult();
    if (evaluation) this.formTaskOpen.statut = 'TERMINE';

    const payload: Tache = {
      nom: this.formTaskOpen.nom,
      description: this.formTaskOpen.description || '',
      assignee: this.formTaskOpen.assignee || '',
      type: this.formTaskOpen.type,
      statut: this.formTaskOpen.statut,
      ordre: this.formTaskOpen.ordre,
      processusId: this.formTaskOpen.processusId,
      formData: JSON.stringify({ champs: this.currentChamps, regles: this.currentRegles, valeurs: this.formValues })
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
            if (evaluation.regle.cibleType === 'subprocess') {
              this.loadTaches();
              this.addToast('success', `✅ Règle « ${evaluation.regle.nom || 'sans nom'} » VALIDÉE`, `→ SubProcess OUI lancé`, 5000);
              return;
            }
            ordreCible = ouiOrdres.length > 0 ? ouiOrdres[0] : (this.getTacheSuivante()?.ordre ?? 0);
          } else {
            if (evaluation.regle.cibleType === 'subprocess') {
              this.loadTaches();
              this.addToast('info', `↪️ Règle « ${evaluation.regle.nom || 'sans nom'} » non validée`, `→ SubProcess SINON lancé`, 5000);
              return;
            }
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
      subprocessOuiTaches: [],
      subprocessSinonTaches: [],
      actif: true
    });
  }

  removeRegle(i: number) { this.currentRegles.splice(i, 1); }

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
      const resultats = r.regleMetierIds.map(rmId => {
        const rm = this.reglesMetierDisponibles.find(x => x.id === rmId);
        if (!rm?.conditions?.length) return false;
        return rm.conditions.every(c => this.evaluerConditionSimple(c.champ, c.operateur, c.valeur, vals));
      });
      return r.logiqueCombinaison === 'OU' ? resultats.some(ok => ok) : resultats.every(ok => ok);
    }
    return this.evaluerConditionSimple(r.champId || '', r.operateur || '==', r.valeur, vals);
  }

  private evaluerConditionSimple(champ: string, operateur: string, valeur: any, vals: Record<string, any>): boolean {
    if (!champ) return false;
    const v = vals[champ];
    switch (operateur) {
      case '==': return this.norm(v) == this.norm(valeur);
      case '!=': return this.norm(v) != this.norm(valeur);
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

  addToast(type: Toast['type'], message: string, detail?: string, duration = 4000): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message, detail });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }

  getBpmnDiagram(): BpmnDiagram { return this.bpmnDiagram; }
  resetBpmnDiagram(): void { this.bpmnDiagram = { elements: [], edges: [], viewWidth: 800, viewHeight: 280 }; }
  hasOuiBranch(tache: Tache): boolean { return this.getRegles(tache).some(r => this.getOuiOrdres(r).length > 0 || r.cibleType === 'subprocess'); }
  hasNonBranch(tache: Tache): boolean { return this.getRegles(tache).some(r => (r.tacheSinonOrdre && r.tacheSinonOrdre > 0) || (r.cibleType === 'subprocess' && (r.subprocessSinonTaches?.length ?? 0) > 0)); }
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
  countOuiBranches(): number { return this.bpmnDiagram.edges.filter(e => e.branchType === 'oui' && (e.routing === 'oui-jump' || e.routing === 'subprocess-oui')).length; }
  countNonBranches(): number { return this.bpmnDiagram.edges.filter(e => e.branchType === 'non' && (e.routing === 'down-loop' || e.routing === 'subprocess-non')).length; }
  hasBoucles(): boolean { return this.bpmnDiagram.edges.some(e => e.isLoopBack === true); }
  getElementBpmnById(id: string): BpmnElement | undefined { return this.bpmnDiagram.elements.find(e => e.id === id); }
  getEdgeBpmnById(id: string): BpmnEdge | undefined { return this.bpmnDiagram.edges.find(e => e.id === id); }

  getSubprocessColor(el: BpmnElement): string {
    return el.subprocessColor || '#6366f1';
  }
}