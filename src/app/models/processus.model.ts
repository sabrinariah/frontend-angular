// src/app/models/processus.model.ts
export interface Tache {
  id?: number;
  nom: string;
  description?: string;
  assignee?: string;
  type: 'HUMAINE' | 'SYSTEME';
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE';
  ordre: number;
  processusId: number;
  templateId?: string;
  formData?: string;
}

export interface Processus {
  id?: number;
  nom: string;
  typeProcessus?: string;
  dateDebut?: string;
  dateFin?: string;
  actif?: boolean;
  bpmnProcessId?: string;
  fileBpmn?: string;
}
