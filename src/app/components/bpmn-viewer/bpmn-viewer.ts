import {
  Component,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import BpmnViewer from 'bpmn-js/lib/Viewer';

const BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             targetNamespace="http://bpmn.io/schema/bpmn"
             id="Definitions_Import">
  <process id="process_import" name="Processus IMPORT" isExecutable="true">
    <startEvent id="start_import" name="Création de la demande d'import">
      <outgoing>flow_start_to_saisie</outgoing>
    </startEvent>
    <userTask id="task_saisie_demande" name="Saisie de la demande d'import">
      <incoming>flow_start_to_saisie</incoming>
      <outgoing>flow_saisie_to_details</outgoing>
    </userTask>
    <userTask id="task_saisie_details" name="Saisie des détails produits">
      <incoming>flow_saisie_to_details</incoming>
      <outgoing>flow_details_to_verif</outgoing>
    </userTask>
    <serviceTask id="task_verif_reglem" name="Vérification réglementaire import">
      <incoming>flow_details_to_verif</incoming>
      <outgoing>flow_verif_to_gw</outgoing>
    </serviceTask>
    <exclusiveGateway id="gw_conforme" name="Import autorisé ?" />
    <serviceTask id="task_calcul_droits" name="Calcul des droits de douane">
      <incoming>flow_gw_to_calcul</incoming>
      <outgoing>flow_calcul_to_inspection</outgoing>
    </serviceTask>
    <userTask id="task_inspection" name="Inspection physique des marchandises">
      <incoming>flow_calcul_to_inspection</incoming>
      <outgoing>flow_inspection_to_gw2</outgoing>
    </userTask>
    <exclusiveGateway id="gw_inspection" name="Marchandise conforme ?" />
    <serviceTask id="task_gen_documents" name="Génération des documents import">
      <incoming>flow_gw2_to_gendoc</incoming>
      <outgoing>flow_gendoc_to_paiement</outgoing>
    </serviceTask>
    <userTask id="task_paiement" name="Paiement des droits de douane">
      <incoming>flow_gendoc_to_paiement</incoming>
      <outgoing>flow_paiement_to_end</outgoing>
    </userTask>
    <endEvent id="end_import" name="Dossier import validé">
      <incoming>flow_paiement_to_end</incoming>
    </endEvent>
    <endEvent id="end_refus_reglem" name="Refusé – Non conforme réglementaire">
      <incoming>flow_gw_to_refus</incoming>
    </endEvent>
    <endEvent id="end_refus_inspection" name="Refusé – Non conforme inspection">
      <incoming>flow_gw2_to_refus</incoming>
    </endEvent>
    <sequenceFlow id="flow_start_to_saisie"       sourceRef="start_import"        targetRef="task_saisie_demande" />
    <sequenceFlow id="flow_saisie_to_details"     sourceRef="task_saisie_demande" targetRef="task_saisie_details" />
    <sequenceFlow id="flow_details_to_verif"      sourceRef="task_saisie_details" targetRef="task_verif_reglem"   />
    <sequenceFlow id="flow_verif_to_gw"           sourceRef="task_verif_reglem"   targetRef="gw_conforme"         />
    <sequenceFlow id="flow_gw_to_calcul"          sourceRef="gw_conforme"         targetRef="task_calcul_droits">
      <conditionExpression xsi:type="tFormalExpression">\${importAutorise == true}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="flow_gw_to_refus"           sourceRef="gw_conforme"         targetRef="end_refus_reglem">
      <conditionExpression xsi:type="tFormalExpression">\${importAutorise == false}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="flow_calcul_to_inspection"  sourceRef="task_calcul_droits"  targetRef="task_inspection"    />
    <sequenceFlow id="flow_inspection_to_gw2"     sourceRef="task_inspection"     targetRef="gw_inspection"      />
    <sequenceFlow id="flow_gw2_to_gendoc"         sourceRef="gw_inspection"       targetRef="task_gen_documents">
      <conditionExpression xsi:type="tFormalExpression">\${conformeMarchandise == 'oui'}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="flow_gw2_to_refus"          sourceRef="gw_inspection"       targetRef="end_refus_inspection">
      <conditionExpression xsi:type="tFormalExpression">\${conformeMarchandise != 'oui'}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="flow_gendoc_to_paiement"    sourceRef="task_gen_documents"  targetRef="task_paiement"  />
    <sequenceFlow id="flow_paiement_to_end"       sourceRef="task_paiement"       targetRef="end_import"     />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Import">
    <bpmndi:BPMNPlane id="BPMNPlane_Import" bpmnElement="process_import">
      <bpmndi:BPMNShape id="Shape_start_import"         bpmnElement="start_import">
        <dc:Bounds x="80" y="262" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="53" y="305" width="90" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_saisie_demande"  bpmnElement="task_saisie_demande">
        <dc:Bounds x="170" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_saisie_details"  bpmnElement="task_saisie_details">
        <dc:Bounds x="350" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_verif_reglem"    bpmnElement="task_verif_reglem">
        <dc:Bounds x="530" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_gw_conforme"          bpmnElement="gw_conforme" isMarkerVisible="true">
        <dc:Bounds x="710" y="255" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="690" y="312" width="90" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_calcul_droits"   bpmnElement="task_calcul_droits">
        <dc:Bounds x="820" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_inspection"      bpmnElement="task_inspection">
        <dc:Bounds x="1000" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_gw_inspection"        bpmnElement="gw_inspection" isMarkerVisible="true">
        <dc:Bounds x="1180" y="255" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="1160" y="312" width="90" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_gen_documents"   bpmnElement="task_gen_documents">
        <dc:Bounds x="1290" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_task_paiement"        bpmnElement="task_paiement">
        <dc:Bounds x="1470" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_end_import"           bpmnElement="end_import">
        <dc:Bounds x="1660" y="262" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="1634" y="305" width="90" height="40" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_end_refus_reglem"     bpmnElement="end_refus_reglem">
        <dc:Bounds x="742" y="390" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="716" y="433" width="90" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_end_refus_inspection" bpmnElement="end_refus_inspection">
        <dc:Bounds x="1212" y="390" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="1186" y="433" width="90" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_flow_start_to_saisie"       bpmnElement="flow_start_to_saisie">
        <di:waypoint x="116" y="280"/><di:waypoint x="170" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_saisie_to_details"     bpmnElement="flow_saisie_to_details">
        <di:waypoint x="290" y="280"/><di:waypoint x="350" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_details_to_verif"      bpmnElement="flow_details_to_verif">
        <di:waypoint x="470" y="280"/><di:waypoint x="530" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_verif_to_gw"           bpmnElement="flow_verif_to_gw">
        <di:waypoint x="650" y="280"/><di:waypoint x="710" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_gw_to_calcul"          bpmnElement="flow_gw_to_calcul">
        <di:waypoint x="760" y="280"/><di:waypoint x="820" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_gw_to_refus"           bpmnElement="flow_gw_to_refus">
        <di:waypoint x="735" y="305"/><di:waypoint x="735" y="408"/><di:waypoint x="742" y="408"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_calcul_to_inspection"  bpmnElement="flow_calcul_to_inspection">
        <di:waypoint x="940" y="280"/><di:waypoint x="1000" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_inspection_to_gw2"     bpmnElement="flow_inspection_to_gw2">
        <di:waypoint x="1120" y="280"/><di:waypoint x="1180" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_gw2_to_gendoc"         bpmnElement="flow_gw2_to_gendoc">
        <di:waypoint x="1230" y="280"/><di:waypoint x="1290" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_gw2_to_refus"          bpmnElement="flow_gw2_to_refus">
        <di:waypoint x="1205" y="305"/><di:waypoint x="1205" y="408"/><di:waypoint x="1212" y="408"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_gendoc_to_paiement"    bpmnElement="flow_gendoc_to_paiement">
        <di:waypoint x="1410" y="280"/><di:waypoint x="1470" y="280"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_flow_paiement_to_end"       bpmnElement="flow_paiement_to_end">
        <di:waypoint x="1590" y="280"/><di:waypoint x="1660" y="280"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

@Component({
  selector: 'app-bpmn-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bpmn-viewer.html',
  styleUrls: ['./bpmn-viewer.css']
})
export class BpmnViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() processDefinitionId?: string;
  @Input() processInstanceId?: string;

  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLDivElement>;

  private viewer: any;
  private viewerReady = false;

  ngAfterViewInit(): void {
    this.viewer = new BpmnViewer({
      container: this.canvasRef.nativeElement
    });
    this.viewerReady = true;

    // Charger immédiatement si l'input était déjà là
    if (this.processDefinitionId) {
      this.loadDiagram();
    } else {
      // ← TEMPORAIRE : charge quand même pour tester le rendu
      this.loadDiagramXml(BPMN_XML);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['processDefinitionId'] && this.viewerReady) {
      this.loadDiagram();
    }
  }

  ngOnDestroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  private async loadDiagram(): Promise<void> {
    // Ici tu brancheras ton vrai service Camunda
    // const xml = await this.camundaService.getProcessXml(this.processDefinitionId!);
    await this.loadDiagramXml(BPMN_XML);
  }

  private async loadDiagramXml(xml: string): Promise<void> {
    if (!this.viewer) return;
    try {
      await this.viewer.importXML(xml);
      const canvas = this.viewer.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
      console.log('✅ Diagramme BPMN chargé');
    } catch (err) {
      console.error('❌ Erreur BPMN:', err);
    }
  }
}