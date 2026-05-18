import { Injectable } from '@angular/core';
import { Tache } from '../../models/processus.model';

interface ChampDynamique {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: { value: any; label: string }[];
}

interface RegleTransition {
  id: string;
  nom: string;
  champId: string;
  operateur: string;
  valeur: any;
  tacheCibleOrdre: number;
  cibleType: 'suivante' | 'specifique';
  actif: boolean;
}

interface BpmnNode {
  id: string;
  type: 'startEvent' | 'task' | 'gateway' | 'endEvent';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tache?: Tache;
}

interface BpmnFlow {
  id: string;
  sourceRef: string;
  targetRef: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class BpmnGeneratorService {

  // ── Dimensions standards BPMN ─────────────────────────────
  private readonly EVT_SIZE = 36;
  private readonly TASK_W = 110;
  private readonly TASK_H = 80;
  private readonly GW_SIZE = 50;
  private readonly H_GAP = 60;
  private readonly Y_CENTER = 180;
  private readonly X_START = 60;

  /**
   * Génère un XML BPMN 2.0 complet à partir des tâches d'un processus.
   * @param processusNom Nom du processus
   * @param processusId  ID du processus
   * @param taches       Liste des tâches (avec leurs règles dans formData)
   */
  generateBpmnXml(processusNom: string, processusId: number, taches: Tache[]): string {
    const sorted = [...taches].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
    const nodes: BpmnNode[] = [];
    const flows: BpmnFlow[] = [];

    // ── Construction de la séquence des nœuds ──
    let x = this.X_START;
    const cy = this.Y_CENTER;

    // START
    const startId = 'StartEvent_1';
    nodes.push({
      id: startId, type: 'startEvent', name: 'Début',
      x, y: cy - this.EVT_SIZE / 2,
      width: this.EVT_SIZE, height: this.EVT_SIZE
    });
    let prevId = startId;
    x += this.EVT_SIZE + this.H_GAP;

    // TASKS + optional GATEWAYS
    sorted.forEach((t, idx) => {
      const taskId = `Task_${t.id ?? idx + 1}`;
      nodes.push({
        id: taskId, type: 'task',
        name: this.sanitizeName(t.nom || `Tâche ${idx + 1}`),
        x, y: cy - this.TASK_H / 2,
        width: this.TASK_W, height: this.TASK_H,
        tache: t
      });
      flows.push({
        id: `Flow_${prevId}_${taskId}`,
        sourceRef: prevId,
        targetRef: taskId
      });
      prevId = taskId;
      x += this.TASK_W + this.H_GAP;

      // Si la tâche a des règles → on ajoute un Gateway exclusif après
      const regles = this.getRegles(t);
      if (regles.length > 0) {
        const gwId = `Gateway_${t.id ?? idx + 1}`;
        nodes.push({
          id: gwId, type: 'gateway', name: 'Décision',
          x, y: cy - this.GW_SIZE / 2,
          width: this.GW_SIZE, height: this.GW_SIZE,
          tache: t
        });
        flows.push({
          id: `Flow_${prevId}_${gwId}`,
          sourceRef: prevId,
          targetRef: gwId
        });
        prevId = gwId;
        x += this.GW_SIZE + this.H_GAP;
      }
    });

    // END
    const endId = 'EndEvent_1';
    nodes.push({
      id: endId, type: 'endEvent', name: 'Fin',
      x, y: cy - this.EVT_SIZE / 2,
      width: this.EVT_SIZE, height: this.EVT_SIZE
    });
    flows.push({
      id: `Flow_${prevId}_${endId}`,
      sourceRef: prevId,
      targetRef: endId
    });

    const totalWidth = x + this.EVT_SIZE + 40;
    const totalHeight = cy + 100;

    // ── Génération du XML ──
    return this.buildXml(processusNom, processusId, nodes, flows, totalWidth, totalHeight);
  }

  // ──────────────────────────────────────────────────────────
  //  XML BUILDER
  // ──────────────────────────────────────────────────────────
  private buildXml(
    processusNom: string,
    processusId: number,
    nodes: BpmnNode[],
    flows: BpmnFlow[],
    totalW: number,
    totalH: number
  ): string {
    const procId = `Process_${processusId}`;
    const safeProcName = this.sanitizeName(processusNom);

    // ── 1) Éléments du process ──
    const processElements: string[] = [];
    nodes.forEach(n => {
      const outgoing = flows.filter(f => f.sourceRef === n.id);
      const incoming = flows.filter(f => f.targetRef === n.id);
      const incTags = incoming.map(f => `      <bpmn:incoming>${f.id}</bpmn:incoming>`).join('\n');
      const outTags = outgoing.map(f => `      <bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('\n');
      const inner = [incTags, outTags].filter(s => s).join('\n');

      if (n.type === 'startEvent') {
        processElements.push(
          `    <bpmn:startEvent id="${n.id}" name="${this.escapeXml(n.name)}">\n${inner}\n    </bpmn:startEvent>`
        );
      } else if (n.type === 'endEvent') {
        processElements.push(
          `    <bpmn:endEvent id="${n.id}" name="${this.escapeXml(n.name)}">\n${inner}\n    </bpmn:endEvent>`
        );
      } else if (n.type === 'gateway') {
        processElements.push(
          `    <bpmn:exclusiveGateway id="${n.id}" name="${this.escapeXml(n.name)}">\n${inner}\n    </bpmn:exclusiveGateway>`
        );
      } else if (n.type === 'task') {
        // Type de tâche selon le type métier
        const isUserTask = n.tache?.type === 'HUMAINE' ;
        const tag = isUserTask ? 'bpmn:userTask' : 'bpmn:serviceTask';
        processElements.push(
          `    <${tag} id="${n.id}" name="${this.escapeXml(n.name)}">\n${inner}\n    </${tag}>`
        );
      }
    });

    // ── 2) Sequence Flows ──
    const flowElements = flows.map(f => {
      const nameAttr = f.name ? ` name="${this.escapeXml(f.name)}"` : '';
      return `    <bpmn:sequenceFlow id="${f.id}"${nameAttr} sourceRef="${f.sourceRef}" targetRef="${f.targetRef}"/>`;
    });

    // ── 3) BPMN DI (Diagram Interchange = coordonnées) ──
    const shapes = nodes.map(n => {
      const isGw = n.type === 'gateway';
      return `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${isGw ? ' isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}"/>
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${n.x}" y="${n.y + n.height + 5}" width="${n.width}" height="20"/>
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;
    });

    const edges = flows.map(f => {
      const from = nodes.find(n => n.id === f.sourceRef);
      const to = nodes.find(n => n.id === f.targetRef);
      if (!from || !to) return '';
      const x1 = from.x + from.width;
      const y1 = from.y + from.height / 2;
      const x2 = to.x;
      const y2 = to.y + to.height / 2;
      return `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
        <di:waypoint x="${x1}" y="${y1}"/>
        <di:waypoint x="${x2}" y="${y2}"/>
      </bpmndi:BPMNEdge>`;
    });

    // ── 4) Assemblage final ──
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_${processusId}"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${procId}" name="${this.escapeXml(safeProcName)}" isExecutable="false">
${processElements.join('\n')}
${flowElements.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${procId}">
${shapes.join('\n')}
${edges.join('\n')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  // ──────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────
  private getRegles(t: Tache): RegleTransition[] {
    try {
      if (!t.formData) return [];
      const parsed = JSON.parse(t.formData);
      return (parsed.regles || []).filter((r: RegleTransition) => r.actif !== false);
    } catch {
      return [];
    }
  }

  private escapeXml(s: string): string {
    if (!s) return '';
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
  }

  private sanitizeName(s: string): string {
    return (s || '').trim();
  }

  /**
   * Permet de télécharger le XML BPMN généré comme fichier .bpmn
   */
  downloadBpmnFile(xml: string, filename: string): void {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.bpmn') ? filename : `${filename}.bpmn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}