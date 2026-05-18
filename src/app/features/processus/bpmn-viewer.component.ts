import {
  Component, Input, ElementRef, ViewChild,
  AfterViewInit, OnChanges, SimpleChanges, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

@Component({
  selector: 'app-bpmn-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bpmn-wrapper">
      <div *ngIf="loading" class="bpmn-loading">⏳ Chargement du diagramme...</div>
      <div *ngIf="error" class="bpmn-error">❌ {{ error }}</div>
      <div #bpmnContainer class="bpmn-container"
           [style.display]="(loading || error) ? 'none' : 'block'"></div>
    </div>
  `,
  styles: [`
    .bpmn-wrapper {
      width: 100%;
      height: 500px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fafbff;
      position: relative;
      overflow: hidden;
    }
    .bpmn-container { width: 100%; height: 100%; }
    .bpmn-loading, .bpmn-error {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
      font-size: 14px; color: #6b7280;
    }
    .bpmn-error { color: #ef4444; }
  `]
})
export class BpmnViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() fileUrl: string = '';     // URL d'un fichier .bpmn
  @Input() xmlContent: string = '';  // OU contenu XML directement

  @ViewChild('bpmnContainer', { static: false }) bpmnContainer!: ElementRef;

  private viewer: any;
  loading = false;
  error = '';

  ngAfterViewInit(): void {
    this.initViewer();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fileUrl'] || changes['xmlContent']) && this.viewer) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    if (this.viewer) this.viewer.destroy();
  }

  private initViewer(): void {
    if (!this.viewer && this.bpmnContainer) {
      this.viewer = new BpmnViewer({
        container: this.bpmnContainer.nativeElement
      });
    }
  }

  private async render(): Promise<void> {
    if (!this.viewer) this.initViewer();
    if (!this.viewer) return;

    this.error = '';

    // Cas 1 : contenu XML fourni directement
    if (this.xmlContent && this.xmlContent.trim().length > 0) {
      await this.importXml(this.xmlContent);
      return;
    }

    // Cas 2 : URL d'un fichier .bpmn
    if (this.fileUrl && this.fileUrl.trim().length > 0) {
      this.loading = true;
      try {
        const response = await fetch(this.fileUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        await this.importXml(xml);
      } catch (e: any) {
        this.error = 'Impossible de charger le fichier BPMN : ' + e.message;
      } finally {
        this.loading = false;
      }
      return;
    }

    this.error = 'Aucun fichier BPMN fourni';
  }

  private async importXml(xml: string): Promise<void> {
    try {
      await this.viewer.importXML(xml);
      // Ajuste la vue pour que tout soit visible
      const canvas = this.viewer.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
    } catch (err: any) {
      this.error = 'Erreur lors du parsing BPMN : ' + (err.message || err);
    }
  }
}