// ============================================================
//  export.models.ts  –  Modèles du Processus Export (BPMN)
// ============================================================

// =============================================
//  Interfaces des formulaires par étape
// =============================================

// Phase 1 — Pré-dédouanement
export interface SaisieDossierExport {
  exportateur: string;
  paysDestination: string;
  typeProduit: string;
  nomDossier?: string;
  dateDepot?: string;
}

export interface ProceduresPrealables {
  licenceExport?: string;
  autoriteCompetente?: string;
  referenceAutorisation?: string;
  observations?: string;
}

export interface DeclarationExport {
  numeroDEF1: string;
  codeSH: string;
  quantite?: number;
  valeurFOB?: number;
  deviseFacture?: string;
  destinationFinale?: string;
}

export interface DomiciliationBancaire {
  banqueDomiciliataire: string;
  numeroCompte?: string;
  referenceContrat?: string;
  montantDevise?: number;
  devise?: string;
}

export interface PreparationDocuments {
  facturePro: boolean;
  listColisage: boolean;
  connaissement: boolean;
  autresDocuments?: string;
}

export interface ComplementInformationExport {
  champsCorrigés?: string;
  commentaire: string;
}

// Phase 2 — Expédition
export interface DemandeInspection {
  organisme: string;
  dateInspection?: string;
  lieuInspection?: string;
  typeTraitement?: string;
}

export interface InspectionPV {
  numeroPV?: string;
  dateInspection?: string;
  inspecteur?: string;
  resultat: string;
  observations?: string;
}

export interface CertificatPhytosanitaire {
  numeroCertificat?: string;
  organisme: string;
  dateDelivrance?: string;
  conformite: boolean;
  observations?: string;
}

export interface EmpotageRapport {
  numeroConteneur?: string;
  dateEmpotage?: string;
  poidsNet?: number;
  poidsBrut?: number;
  scelle?: string;
  lieuEmpotage?: string;
}

export interface CertificatOrigine {
  numeroCertificat?: string;
  organisme: string;
  paysOrigine?: string;
  dateDelivrance?: string;
}

export interface BescBooking {
  numeroBESC?: string;
  compagnieMaritime?: string;
  dateBooking?: string;
  portEmbarquement?: string;
  portDestination?: string;
  dateETD?: string;
}

export interface CorrectionExpedition {
  documentsCorrigés?: string;
  commentaire: string;
}

// Phase 3 — Dédouanement
export interface SoumissionDouane {
  numeroDeclaration?: string;
  bureauDouane?: string;
  dateDepot?: string;
  declarant?: string;
}

export interface ControleDocumentaire {
  documentsVerifies: string[];
  conformite: boolean;
  observations?: string;
  agentDouane?: string;
}

export interface InspectionPhysique {
  agentDouane?: string;
  dateInspection?: string;
  resultScanner?: string;
  anomaliesDetectees: boolean;
  rapport?: string;
}

export interface ComplementControle {
  correctionApportee?: string;
  commentaire: string;
}

export interface PaiementExport {
  referencePaiement?: string;
  montant: number;
  methodePaiement?: string;
  banque?: string;
  datePaiement?: string;
}

export interface RegulariserPaiement {
  motifIrregularite?: string;
  actionCorrectrice?: string;
  nouvelleDatePaiement?: string;
}

// Phase 4 — Embarquement
export interface ComplementEmbarquement {
  conditionManquante?: string;
  mesureCorrectrice: string;
}

export interface BonAEmbarquer {
  numeroBon?: string;
  agentDouane?: string;
  dateDelivrance?: string;
  observations?: string;
}

export interface AutorisationEmbarquement {
  numeroAutorisation?: string;
  autoritePortuaire: string;
  dateAutorisation?: string;
  quai?: string;
}

export interface MiseABord {
  navire?: string;
  numeroVoyage?: string;
  dateEmbarquement?: string;
  heure?: string;
  quai?: string;
}

export interface ConstatEmbarquement {
  numeroConstat?: string;
  dateConstat?: string;
  agentDouane?: string;
  conformite: boolean;
  observations?: string;
}

// =============================================
//  Variables de processus Camunda
// =============================================

export interface ProcessVariables {
  exportEligible?: boolean;
  preClearanceExportConforme?: boolean;
  expeditionExportConforme?: boolean;
  decisionCircuit?: 'VERT' | 'ORANGE' | 'ROUGE';
  controleExportConforme?: boolean;
  totalFrais?: number;
  avisPaiement?: string;
  paiementExportConfirme?: boolean;
  conditionsEmbarquementOK?: boolean;
  [key: string]: any; // Pour les variables dynamiques
}

// =============================================
//  Configuration des étapes (alignée avec BPMN)
// =============================================

export type EtapeId =
  | 'saisie_dossier'
  | 'procedures_prealables'
  | 'declaration_export'
  | 'domiciliation_bancaire'
  | 'preparation_documents'
  | 'complement_information'
  | 'demande_inspection'
  | 'inspection_pv'
  | 'certificat_phytosanitaire'
  | 'empotage_rapport'
  | 'certificat_origine'
  | 'besc_booking'
  | 'correction_expedition'
  | 'soumission_douane'
  | 'controle_documentaire'
  | 'inspection_physique'
  | 'complement_controle'
  | 'paiement_export'
  | 'regulariser_paiement'
  | 'complement_embarquement'
  | 'bon_a_embarquer'
  | 'autorisation_embarquement'
  | 'mise_a_bord'
  | 'constat_embarquement'
  | 'cloture';

export interface EtapeConfig {
  id: EtapeId;
  label: string;
  phase: 1 | 2 | 3 | 4;
  taskId: string;
  groupes: string[];
  isBoucle?: boolean;
}
// export.model.ts
export interface CamundaTask {
  id: string;
  name: string;
  taskDefinitionKey?: string;
  processDefinitionId?: string;
  processInstanceId?: string;

  // ✅ AJOUT IMPORTANT
  assignee?: string;
}
export const ETAPES_CONFIG: EtapeConfig[] = [
  // Phase 1
  { id: 'saisie_dossier',        label: 'Saisie dossier export',          phase: 1, taskId: 'Task_Saisie_Dossier_Export',               groupes: ['EXPORTATEUR', 'TRANSITAIRE'] },
  { id: 'procedures_prealables', label: 'Procédures préalables',           phase: 1, taskId: 'Task_Procedures_Prealables_Export',         groupes: ['EXPORTATEUR', 'ADMIN_TECHNIQUE'] },
  { id: 'declaration_export',    label: 'Déclaration export DE/F1',        phase: 1, taskId: 'Task_Declaration_Export_DE',               groupes: ['EXPORTATEUR', 'TRANSITAIRE'] },
  { id: 'domiciliation_bancaire',label: 'Domiciliation bancaire',          phase: 1, taskId: 'Task_Domiciliation_Export',                groupes: ['BANQUE', 'SERVICE_CHANGE'] },
  { id: 'preparation_documents', label: 'Préparation documents expédition',phase: 1, taskId: 'Task_Preparation_Documents_Expedition',    groupes: ['EXPORTATEUR', 'TRANSITAIRE'] },
  { id: 'complement_information',label: 'Compléter / corriger dossier',    phase: 1, taskId: 'Task_Complement_Information_Export',        groupes: ['EXPORTATEUR', 'TRANSITAIRE'], isBoucle: true },

  // Phase 2
  { id: 'demande_inspection',    label: 'Demande inspection / traitement', phase: 2, taskId: 'Task_Demande_Inspection_Traitement',        groupes: ['EXPORTATEUR', 'ADMIN_TECHNIQUE'] },
  { id: 'inspection_pv',         label: 'Inspection export et PV',         phase: 2, taskId: 'Task_Inspection_PV_Export',                groupes: ['MINADER', 'MINFOF', 'ADMIN_TECHNIQUE'] },
  { id: 'certificat_phytosanitaire', label: 'Certificat phytosanitaire',   phase: 2, taskId: 'Task_Certificat_Phytosanitaire',           groupes: ['MINADER', 'MINEPIA', 'MINSANTE'] },
  { id: 'empotage_rapport',      label: 'Empotage et rapport',             phase: 2, taskId: 'Task_Empotage_Rapport',                    groupes: ['TRANSITAIRE', 'ADMIN_TECHNIQUE', 'PORT'] },
  { id: 'certificat_origine',    label: "Certificat d'origine",            phase: 2, taskId: 'Task_Certificat_Origine',                  groupes: ['CCIMA', 'ONCC', 'MINFOF', 'DOUANE'] },
  { id: 'besc_booking',          label: 'BESC / booking transport',        phase: 2, taskId: 'Task_BESC_Booking',                        groupes: ['CNCC', 'TRANSITAIRE', 'TRANSPORTEUR'] },
  { id: 'correction_expedition', label: 'Corriger documents expédition',   phase: 2, taskId: 'Task_Correction_Expedition',               groupes: ['EXPORTATEUR', 'TRANSITAIRE'], isBoucle: true },

  // Phase 3
  { id: 'soumission_douane',     label: 'Soumission déclaration douane',   phase: 3, taskId: 'Task_Soumission_Douane_Export',            groupes: ['TRANSITAIRE', 'DOUANE'] },
  { id: 'controle_documentaire', label: 'Contrôle documentaire (ORANGE)',  phase: 3, taskId: 'Task_Controle_Doc_Export',                 groupes: ['DOUANE'] },
  { id: 'inspection_physique',   label: 'Inspection physique / scanner',   phase: 3, taskId: 'Task_Inspection_Physique_Export',          groupes: ['DOUANE', 'PORT', 'ADMIN_TECHNIQUE'] },
  { id: 'complement_controle',   label: 'Complément après contrôle',       phase: 3, taskId: 'Task_Complement_Controle_Export',          groupes: ['EXPORTATEUR', 'TRANSITAIRE'], isBoucle: true },
  { id: 'paiement_export',       label: 'Paiement électronique',           phase: 3, taskId: 'Task_Paiement_Export',                    groupes: ['EXPORTATEUR', 'BANQUE'] },
  { id: 'regulariser_paiement',  label: 'Régulariser paiement',            phase: 3, taskId: 'Task_Regulariser_Paiement_Export',         groupes: ['EXPORTATEUR', 'BANQUE'], isBoucle: true },

  // Phase 4
  { id: 'complement_embarquement',label: 'Compléter conditions embarquement',phase: 4, taskId: 'Task_Complement_Embarquement',            groupes: ['EXPORTATEUR', 'TRANSITAIRE'], isBoucle: true },
  { id: 'bon_a_embarquer',       label: 'Bon à embarquer',                 phase: 4, taskId: 'Task_Bon_A_Embarquer',                    groupes: ['DOUANE'] },
  { id: 'autorisation_embarquement', label: 'Autorisation embarquement',   phase: 4, taskId: 'Task_Autorisation_Embarquement',          groupes: ['PORT'] },
  { id: 'mise_a_bord',           label: 'Mise à bord / embarquement',      phase: 4, taskId: 'Task_Mise_A_Bord',                        groupes: ['PORT', 'TRANSPORTEUR', 'TRANSITAIRE'] },
  { id: 'constat_embarquement',  label: "Constat d'embarquement",          phase: 4, taskId: 'Task_Constat_Embarquement',               groupes: ['DOUANE', 'PORT'] },
  { id: 'cloture',               label: 'Marchandise exportée',            phase: 4, taskId: 'EndEvent_Exported',                       groupes: [] },
];