// ============================================================
//  export.component.ts  –  Composant principal Processus Export
//  ✅ CORRIGÉ — aligné sur le BPMN processus_export_camunda_7_22
//  ✅ AVEC : Suspendre/Reprendre + Supprimer définitivement instances
// ============================================================
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { PdfService } from '../core/services/pdf.service';

import { ExportService, CamundaTask } from '../core/services/export.service';
import {
  SaisieDossierExport,
  ProceduresPrealables,
  DeclarationExport,
  DomiciliationBancaire,
  PreparationDocuments,
  ComplementInformationExport,
  DemandeInspection,
  InspectionPV,
  CertificatPhytosanitaire,
  EmpotageRapport,
  CertificatOrigine,
  BescBooking,
  CorrectionExpedition,
  SoumissionDouane,
  ControleDocumentaire,
  InspectionPhysique,
  ComplementControle,
  PaiementExport,
  RegulariserPaiement,
  ComplementEmbarquement,
  BonAEmbarquer,
  AutorisationEmbarquement,
  MiseABord,
  ConstatEmbarquement,
  ProcessVariables,
  EtapeId,
  ETAPES_CONFIG,
} from '../models/export.models';

type Circuit = 'VERT' | 'ORANGE' | 'ROUGE';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export.html',
  styleUrls: ['./export.css'],
})
export class ExportComponent implements OnInit, OnDestroy {

  // ── État global ──
  etapeActive: EtapeId = 'saisie_dossier';
  processInstanceId = '';
  tacheCourante: CamundaTask | null = null;
  processVariables: ProcessVariables = {};
  message = '';
  messageType: 'success' | 'error' | 'warning' | 'info' = 'info';
  loading = false;
  processTermine = false;
  processRejete = false;
  circuitDouane: Circuit = 'VERT';

  private pollSub?: Subscription;

  // ── Données formulaires ──
  saisieDossier: SaisieDossierExport = {
    exportateur: '',
    paysDestination: '',
    typeProduit: '',
    nomDossier: '',
    dateDepot: new Date().toISOString().split('T')[0],
  };

  proceduresPrealables: ProceduresPrealables = {
    licenceExport: '',
    autoriteCompetente: '',
    referenceAutorisation: '',
    observations: '',
  };

  declarationExport: DeclarationExport = {
    numeroDEF1: '',
    quantite: 0,
    valeurFOB: 0,
    codeSH: '',
    destinationFinale: '',
    deviseFacture: 'USD',
  };

  domiciliationBancaire: DomiciliationBancaire = {
    banqueDomiciliataire: '',
    numeroCompte: '',
    referenceContrat: '',
    montantDevise: 0,
    devise: 'EUR',
  };

  preparationDocuments: PreparationDocuments = {
    facturePro: false,
    listColisage: false,
    connaissement: false,
    autresDocuments: '',
  };

  complementInformation: ComplementInformationExport = {
    champsCorrigés: '',
    commentaire: '',
  };

  demandeInspection: DemandeInspection = {
    organisme: '',
    dateInspection: '',
    lieuInspection: '',
    typeTraitement: '',
  };

  inspectionPV: InspectionPV = {
    numeroPV: '',
    dateInspection: '',
    resultat: '',
    inspecteur: '',
    observations: '',
  };

  certificatPhytosanitaire: CertificatPhytosanitaire = {
    numeroCertificat: '',
    organisme: '',
    dateDelivrance: '',
    conformite: true,
    observations: '',
  };

  empotageRapport: EmpotageRapport = {
    numeroConteneur: '',
    dateEmpotage: '',
    poidsNet: 0,
    poidsBrut: 0,
    scelle: '',
    lieuEmpotage: '',
  };

  certificatOrigine: CertificatOrigine = {
    numeroCertificat: '',
    organisme: '',
    paysOrigine: '',
    dateDelivrance: '',
  };

  bescBooking: BescBooking = {
    numeroBESC: '',
    compagnieMaritime: '',
    dateBooking: '',
    portEmbarquement: '',
    portDestination: '',
    dateETD: '',
  };

  correctionExpedition: CorrectionExpedition = {
    documentsCorrigés: '',
    commentaire: '',
  };

  soumissionDouane: SoumissionDouane = {
    numeroDeclaration: '',
    bureauDouane: '',
    dateDepot: '',
    declarant: '',
  };

  controleDocumentaire: ControleDocumentaire = {
    documentsVerifies: [],
    conformite: true,
    observations: '',
    agentDouane: '',
  };

  inspectionPhysique: InspectionPhysique = {
    resultScanner: '',
    anomaliesDetectees: false,
    rapport: '',
    agentDouane: '',
    dateInspection: '',
  };

  complementControle: ComplementControle = {
    correctionApportee: '',
    commentaire: '',
  };

  paiementExport: PaiementExport = {
    referencePaiement: '',
    montant: 0,
    methodePaiement: '',
    banque: '',
    datePaiement: '',
  };

  regulariserPaiement: RegulariserPaiement = {
    motifIrregularite: '',
    actionCorrectrice: '',
    nouvelleDatePaiement: '',
  };

  complementEmbarquement: ComplementEmbarquement = {
    conditionManquante: '',
    mesureCorrectrice: '',
  };

  bonAEmbarquer: BonAEmbarquer = {
    numeroBon: '',
    agentDouane: '',
    dateDelivrance: '',
    observations: '',
  };

  autorisationEmbarquement: AutorisationEmbarquement = {
    numeroAutorisation: '',
    autoritePortuaire: '',
    dateAutorisation: '',
    quai: '',
  };

  miseABord: MiseABord = {
    dateEmbarquement: '',
    navire: '',
    numeroVoyage: '',
    quai: '',
    heure: '',
  };

  constatEmbarquement: ConstatEmbarquement = {
    numeroConstat: '',
    dateConstat: '',
    agentDouane: '',
    conformite: true,
    observations: '',
  };

  // ── Système d'onglets ──
  activeTab: 'nouveau' | 'instances' = 'nouveau';

  // ── Gestion instances ──
  instances: any[] = [];
  loadingInstances = false;
  filtreInstance: 'tous' | 'enCours' | 'terminees' | 'rejetees' = 'tous';

  // ── Modal détails ──
  instanceSelectionnee: any = null;
  variablesInstance: any = null;
  historiqueInstance: any[] = [];
  ongletDetail: 'variables' | 'historique' = 'variables';
  readonly etapesConfig = ETAPES_CONFIG;

  definitionSuspendue = false;
  loadingAdmin = false;
  raisonAnnulation = '';
  showConfirmAnnulation = false;

  // ✅ Propriétés pour la suppression d'instance depuis le tableau
  instanceASupprimer: any = null;
  instanceATraiter: any = null;
  raisonSuppression = '';

  constructor(
    private exportService: ExportService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ═══════════════════════════════════════════════════════════
  //  GETTERS
  // ═══════════════════════════════════════════════════════════

  get phaseActive(): 1 | 2 | 3 | 4 {
    return this.etapesConfig.find(e => e.id === this.etapeActive)?.phase ?? 1;
  }

  get etapeLabel(): string {
    return this.etapesConfig.find(e => e.id === this.etapeActive)?.label ?? '';
  }

  get groupesCourants(): string[] {
    return this.etapesConfig.find(e => e.id === this.etapeActive)?.groupes ?? [];
  }

  isEtapeBoucle(): boolean {
    return this.etapesConfig.find(e => e.id === this.etapeActive)?.isBoucle ?? false;
  }

  // ═══════════════════════════════════════════════════════════
  //  PHASE 1 — PRÉ-DÉDOUANEMENT
  // ═══════════════════════════════════════════════════════════

  soumettreEtape1(): void {
    if (this.loading) return;
    this.loading = true;

    const dossierId = this.saisieDossier.nomDossier?.trim()
      || `EXP-${this.saisieDossier.exportateur.substring(0, 3).toUpperCase()}-${Date.now()}`;

    const variablesSaisie = {
      dossierId,
      exportateur: this.saisieDossier.exportateur,
      paysDestination: this.saisieDossier.paysDestination,
      typeProduit: this.saisieDossier.typeProduit,
      nomDossier: this.saisieDossier.nomDossier || dossierId,
      dateDepot: this.saisieDossier.dateDepot,
    };

    this.exportService.demarrerProcessus(variablesSaisie).subscribe({
      next: (res) => {
        this.processInstanceId = res.processInstanceId;
        this.showMessage('Dossier créé — soumission en cours…', 'info');
        setTimeout(() => {
          this.exportService.getTaches(this.processInstanceId).subscribe({
            next: (taches) => {
              const tacheSaisie = taches.find(
                t => t.taskDefinitionKey === 'Task_Saisie_Dossier_Export'
              );
              if (!tacheSaisie) {
                this.loading = false;
                this.startPolling();
                return;
              }
              this.exportService.completerTache(tacheSaisie.id, variablesSaisie).subscribe({
                next: () => {
                  this.loading = false;
                  this.showMessage('Vérification éligibilité en cours…', 'info');
                  this.startPolling();
                },
                error: (err) => this.handleError(err),
              });
            },
            error: (err) => this.handleError(err),
          });
        }, 800);
      },
      error: (err) => this.handleError(err),
    });
  }

  soumettreEtape2(): void {
    this.completerTacheEtPasser({ ...this.proceduresPrealables }, 'declaration_export');
  }

  soumettreEtape3(): void {
    this.completerTacheEtPasser({ ...this.declarationExport }, 'domiciliation_bancaire');
  }

  soumettreEtape4(): void {
    this.completerTacheEtPasser({ ...this.domiciliationBancaire }, 'preparation_documents');
  }

  soumettreEtape5(): void {
    this.completerTacheEtPasser(
      {
        facturePro: this.preparationDocuments.facturePro,
        listColisage: this.preparationDocuments.listColisage,
        connaissement: this.preparationDocuments.connaissement,
        autresDocuments: this.preparationDocuments.autresDocuments,
      },
      null
    );
  }

  soumettreComplementInformation(): void {
    this.completerTacheEtPasser({ ...this.complementInformation }, null);
  }

  // ═══════════════════════════════════════════════════════════
  //  PHASE 2
  // ═══════════════════════════════════════════════════════════

  soumettreDemandeInspection(): void {
    this.completerTacheEtPasser({ ...this.demandeInspection }, 'inspection_pv');
  }

  soumettreInspectionPV(): void {
    this.completerTacheEtPasser({ ...this.inspectionPV }, 'certificat_phytosanitaire');
  }

  soumettreCertificatPhytosanitaire(): void {
    this.completerTacheEtPasser({ ...this.certificatPhytosanitaire }, 'empotage_rapport');
  }

  soumettreEmpotageRapport(): void {
    this.completerTacheEtPasser({ ...this.empotageRapport }, 'certificat_origine');
  }

  soumettreCertificatOrigine(): void {
    this.completerTacheEtPasser({ ...this.certificatOrigine }, 'besc_booking');
  }

  soumettreBescBooking(): void {
    this.completerTacheEtPasser({ ...this.bescBooking }, null);
  }

  soumettreCorrectionExpedition(): void {
    this.completerTacheEtPasser({ ...this.correctionExpedition }, null);
  }

  // ═══════════════════════════════════════════════════════════
  //  PHASE 3
  // ═══════════════════════════════════════════════════════════

  soumettreSoumissionDouane(): void {
    this.completerTacheEtPasser({ ...this.soumissionDouane }, null);
  }

  soumettreControleDocumentaire(): void {
    this.completerTacheEtPasser(
      {
        documentsVerifies: this.controleDocumentaire.documentsVerifies.join(','),
        conformite: this.controleDocumentaire.conformite,
        observations: this.controleDocumentaire.observations,
        agentDouane: this.controleDocumentaire.agentDouane,
        controleExportConforme: this.controleDocumentaire.conformite,
      },
      null
    );
  }

  soumettreInspectionPhysique(): void {
    this.completerTacheEtPasser(
      {
        resultScanner: this.inspectionPhysique.resultScanner,
        anomaliesDetectees: this.inspectionPhysique.anomaliesDetectees,
        rapport: this.inspectionPhysique.rapport,
        agentDouane: this.inspectionPhysique.agentDouane,
        dateInspection: this.inspectionPhysique.dateInspection,
        controleExportConforme: !this.inspectionPhysique.anomaliesDetectees,
      },
      null
    );
  }

  soumettreComplementControle(): void {
    this.completerTacheEtPasser({ ...this.complementControle }, 'soumission_douane');
  }

  soumettrePaiementExport(): void {
    this.completerTacheEtPasser(
      { ...this.paiementExport, paiementExportConfirme: true },
      null
    );
  }

  soumettreRegulariserPaiement(): void {
    this.completerTacheEtPasser({ ...this.regulariserPaiement }, 'paiement_export');
  }

  // ═══════════════════════════════════════════════════════════
  //  PHASE 4
  // ═══════════════════════════════════════════════════════════

  soumettreComplementEmbarquement(): void {
    this.completerTacheEtPasser({ ...this.complementEmbarquement }, null);
  }

  soumettreBonAEmbarquer(): void {
    this.completerTacheEtPasser({ ...this.bonAEmbarquer }, 'autorisation_embarquement');
  }

  soumettreAutorisationEmbarquement(): void {
    this.completerTacheEtPasser({ ...this.autorisationEmbarquement }, 'mise_a_bord');
  }

  soumettreMiseABord(): void {
    this.completerTacheEtPasser({ ...this.miseABord }, 'constat_embarquement');
  }

  soumettreConstatEmbarquement(): void {
    this.completerTacheEtPasser({ ...this.constatEmbarquement }, null);
  }

  // ═══════════════════════════════════════════════════════════
  //  MOTEUR INTERNE
  // ═══════════════════════════════════════════════════════════

  private completerTacheEtPasser(
    variables: Record<string, any>,
    prochaineEtape: EtapeId | null
  ): void {
    if (this.loading) return;
    if (!this.tacheCourante) {
      this.showMessage('⚠ Aucune tâche active trouvée.', 'warning');
      return;
    }
    this.loading = true;

    this.exportService.completerTache(this.tacheCourante.id, variables).subscribe({
      next: () => {
        this.showMessage('Étape validée avec succès.', 'success');
        this.tacheCourante = null;
        this.loading = false;

        if (prochaineEtape) {
          this.etapeActive = prochaineEtape;
          this.chargerTacheCourante();
        } else {
          this.showMessage('Traitement en cours…', 'info');
          this.startPolling();
        }
      },
      error: (err) => this.handleError(err),
    });
  }

  private attendreEtPasser(_etapeCible: EtapeId): void {
    this.showMessage('Vérification éligibilité en cours…', 'info');
    this.startPolling();
  }

  chargerTacheCourante(): void {
    if (!this.processInstanceId) return;

    this.exportService.getTaches(this.processInstanceId).subscribe({
      next: (taches) => {
        if (taches && taches.length > 0) {
          this.tacheCourante = taches[0];
          const config = ETAPES_CONFIG.find(e => e.taskId === taches[0].taskDefinitionKey);
          if (config && config.id !== this.etapeActive) {
            this.etapeActive = config.id;
          }
          this.chargerVariablesProcess();
        } else {
          this.verifierFinProcessus();
        }
      },
      error: (err) => console.error('Erreur chargement tâche :', err),
    });
  }

  private synchroniserEtape(taskDefinitionKey: string): void {
    const config = ETAPES_CONFIG.find(e => e.taskId === taskDefinitionKey);
    if (config && config.id !== this.etapeActive) {
      this.etapeActive = config.id;
    }
    this.chargerVariablesProcess();
  }

  private chargerVariablesProcess(): void {
    if (!this.processInstanceId) return;
    this.exportService.getVariables(this.processInstanceId).subscribe({
      next: (vars) => {
        this.processVariables = {
          exportEligible: vars['exportEligible']?.value,
          preClearanceExportConforme: vars['preClearanceExportConforme']?.value,
          expeditionExportConforme: vars['expeditionExportConforme']?.value,
          decisionCircuit: vars['decisionCircuit']?.value,
          controleExportConforme: vars['controleExportConforme']?.value,
          totalFrais: vars['totalFrais']?.value,
          avisPaiement: vars['avisPaiement']?.value,
          paiementExportConfirme: vars['paiementExportConfirme']?.value,
          conditionsEmbarquementOK: vars['conditionsEmbarquementOK']?.value,
        };
        if (this.processVariables.decisionCircuit) {
          this.circuitDouane = this.processVariables.decisionCircuit as Circuit;
        }
        if (this.processVariables.totalFrais) {
          this.paiementExport.montant = this.processVariables.totalFrais;
        }
        if (this.processVariables.exportEligible === false) {
          this.processRejete = true;
          this.stopPolling();
        }
      },
      error: () => {},
    });
  }

  private verifierFinProcessus(): void {
    if (!this.processInstanceId) return;

    this.exportService.getStatutInstance(this.processInstanceId).subscribe({
      next: (hist) => {
        if (hist.state === 'COMPLETED') {
          this.processTermine = true;
          this.etapeActive = 'cloture';
          this.showMessage(
            "Processus d'export terminé — Marchandise exportée !",
            'success'
          );
          this.stopPolling();
          setTimeout(() => {
            this.telechargerPDF();
          }, 1500);
        }
        this.chargerVariablesProcess();
      },
      error: () => {}
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  POLLING
  // ═══════════════════════════════════════════════════════════

  private startPolling(): void {
    this.stopPolling();
    this.pollSub = interval(2000).pipe(
      takeWhile(() => !this.processTermine && !this.processRejete),
      switchMap(() => this.exportService.getTaches(this.processInstanceId))
    ).subscribe({
      next: (taches) => {
        if (taches && taches.length > 0) {
          const tache = taches[0];
          if (tache.id !== this.tacheCourante?.id) {
            this.tacheCourante = tache;
            this.synchroniserEtape(tache.taskDefinitionKey);
            this.stopPolling();
          }
        } else {
          this.verifierFinProcessus();
        }
      },
      error: () => this.stopPolling(),
    });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPERS UI
  // ═══════════════════════════════════════════════════════════

  showMessage(msg: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; }, 6000);
  }

  private handleError(err: any): void {
    this.loading = false;
    const detail = err?.error?.message || err?.message || 'Erreur inconnue';
    this.showMessage('Erreur : ' + detail, 'error');
    console.error('❌ Erreur HTTP détaillée :', err);
  }

  telechargerPDF(): void {
    if (!this.processInstanceId) {
      return;
    }
    this.pdfService.downloadPdf(this.processInstanceId);
  }

  reinitialiser(): void {
    this.stopPolling();
    this.etapeActive = 'saisie_dossier';
    this.processInstanceId = '';
    this.tacheCourante = null;
    this.processVariables = {};
    this.processTermine = false;
    this.processRejete = false;
    this.message = '';
    this.loading = false;
    this.circuitDouane = 'VERT';
    this.saisieDossier = {
      exportateur: '', paysDestination: '', typeProduit: '',
      nomDossier: '', dateDepot: new Date().toISOString().split('T')[0]
    };
    this.paiementExport = {
      referencePaiement: '', montant: 0, methodePaiement: '', banque: '', datePaiement: ''
    };
  }

  trackById(_: number, item: any): string { return item.id; }

  toggleDocumentVerifie(doc: string, checked: boolean): void {
    if (checked && !this.controleDocumentaire.documentsVerifies.includes(doc)) {
      this.controleDocumentaire.documentsVerifies.push(doc);
    } else if (!checked) {
      this.controleDocumentaire.documentsVerifies =
        this.controleDocumentaire.documentsVerifies.filter(d => d !== doc);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  GESTION DES ONGLETS
  // ═══════════════════════════════════════════════════════════
  changerOnglet(tab: 'nouveau' | 'instances'): void {
    this.activeTab = tab;
    if (tab === 'instances') {
      this.chargerInstances();
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  GESTION DES INSTANCES
  // ═══════════════════════════════════════════════════════════
  chargerInstances(): void {
    this.loadingInstances = true;
    this.exportService.getAllInstances().subscribe({
      next: (data) => {
        this.instances = data;
        this.loadingInstances = false;
      },
      error: (err) => {
        console.error('Erreur chargement instances :', err);
        this.loadingInstances = false;
      }
    });
  }

  voirDetails(inst: any): void {
    this.instanceSelectionnee = inst;
    this.ongletDetail = 'variables';

    this.exportService.getVariables(inst.id).subscribe({
      next: (vars) => this.variablesInstance = vars,
      error: () => this.variablesInstance = {}
    });

    this.exportService.getHistorique(inst.id).subscribe({
      next: (hist) => this.historiqueInstance = hist,
      error: () => this.historiqueInstance = []
    });
  }

  fermerDetails(): void {
    this.instanceSelectionnee = null;
    this.variablesInstance = null;
    this.historiqueInstance = [];
  }

  // ── Stats ──
  get instancesEnCours(): number {
    return this.instances.filter(i => !i.ended).length;
  }
  get instancesTerminees(): number {
    return this.instances.filter(i => i.ended && !i.rejete).length;
  }
  get instancesRejetees(): number {
    return this.instances.filter(i => i.rejete).length;
  }

  get instancesFiltrees(): any[] {
    switch (this.filtreInstance) {
      case 'enCours':   return this.instances.filter(i => !i.ended);
      case 'terminees': return this.instances.filter(i => i.ended && !i.rejete);
      case 'rejetees':  return this.instances.filter(i => i.rejete);
      default:          return this.instances;
    }
  }

  // ── Helpers ──
  getStatutInstance(inst: any): { label: string; class: string; icon: string } {
    if (inst.rejete) return { label: 'Rejetée', class: 'rejected', icon: '❌' };
    if (inst.ended)  return { label: 'Terminée', class: 'ended', icon: '✅' };
    return { label: 'En cours', class: 'active', icon: '⏳' };
  }

  formatDateInstance(dateValue: any): string {
    if (!dateValue) return '—';
    try {
      const d = new Date(dateValue);
      return d.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return String(dateValue);
    }
  }

  formatDuree(ms: number): string {
    if (!ms || ms < 0) return '—';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const heures = Math.floor(min / 60);
    const jours = Math.floor(heures / 24);
    if (jours > 0)  return `${jours}j ${heures % 24}h`;
    if (heures > 0) return `${heures}h ${min % 60}min`;
    if (min > 0)    return `${min}min ${sec % 60}s`;
    return `${sec}s`;
  }

  getVariableEntries(): { key: string; value: any }[] {
    if (!this.variablesInstance) return [];
    return Object.entries(this.variablesInstance).map(([key, val]: [string, any]) => ({
      key,
      value: val?.value !== undefined ? val.value : val
    }));
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN — État de la définition
  // ═══════════════════════════════════════════════════════════

  verifierEtatDefinition(): void {
    this.exportService.getEtatDefinition().subscribe({
      next: (etat) => {
        this.definitionSuspendue = etat.suspended;
      },
      error: (err) => console.error('Erreur état définition :', err)
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN — Activer / Désactiver la définition
  // ═══════════════════════════════════════════════════════════

  toggleDefinition(): void {
    if (this.loadingAdmin) return;
    this.loadingAdmin = true;

    const action$ = this.definitionSuspendue
      ? this.exportService.activerDefinition(true)
      : this.exportService.suspendreDefinition(true);

    action$.subscribe({
      next: () => {
        this.definitionSuspendue = !this.definitionSuspendue;
        this.loadingAdmin = false;
        const msg = this.definitionSuspendue
          ? '⏸ Processus suspendu — aucun nouveau démarrage possible'
          : '▶ Processus activé — démarrages autorisés';
        this.showMessage(msg, this.definitionSuspendue ? 'warning' : 'success');
      },
      error: (err) => {
        this.loadingAdmin = false;
        this.handleError(err);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN — Suspendre / Reprendre l'instance courante
  // ═══════════════════════════════════════════════════════════

  suspendreInstanceCourante(): void {
    if (!this.processInstanceId || this.loadingAdmin) return;
    this.loadingAdmin = true;

    this.exportService.suspendreInstance(this.processInstanceId).subscribe({
      next: () => {
        this.loadingAdmin = false;
        this.stopPolling();
        this.showMessage('⏸ Instance suspendue', 'warning');
      },
      error: (err) => {
        this.loadingAdmin = false;
        this.handleError(err);
      }
    });
  }

  reprendreInstanceCourante(): void {
    if (!this.processInstanceId || this.loadingAdmin) return;
    this.loadingAdmin = true;

    this.exportService.reprendreInstance(this.processInstanceId).subscribe({
      next: () => {
        this.loadingAdmin = false;
        this.startPolling();
        this.showMessage('▶ Instance reprise', 'success');
      },
      error: (err) => {
        this.loadingAdmin = false;
        this.handleError(err);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN — Annuler l'instance courante
  // ═══════════════════════════════════════════════════════════

  ouvrirConfirmationAnnulation(): void {
    this.showConfirmAnnulation = true;
    this.raisonAnnulation = '';
  }

  annulerConfirmation(): void {
    this.showConfirmAnnulation = false;
    this.raisonAnnulation = '';
  }

  confirmerAnnulation(): void {
    if (!this.processInstanceId || !this.raisonAnnulation.trim()) {
      this.showMessage('⚠ Veuillez saisir une raison', 'warning');
      return;
    }
    this.loadingAdmin = true;

    this.exportService.annulerInstance(this.processInstanceId, this.raisonAnnulation).subscribe({
      next: () => {
        this.loadingAdmin = false;
        this.showConfirmAnnulation = false;
        this.processRejete = true;
        this.stopPolling();
        this.showMessage('❌ Instance annulée : ' + this.raisonAnnulation, 'warning');
      },
      error: (err) => {
        this.loadingAdmin = false;
        this.handleError(err);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ✅ NOUVEAU : ACTIONS SUR INSTANCES DEPUIS LE TABLEAU
  // ═══════════════════════════════════════════════════════════

  /**
   * Suspendre ou reprendre une instance depuis le tableau
   */
  toggleSuspensionInstance(inst: any, event: Event): void {
    event.stopPropagation();
    if (this.instanceATraiter) return;
    this.instanceATraiter = inst;

    const action$ = inst.suspended
      ? this.exportService.reprendreInstance(inst.id)
      : this.exportService.suspendreInstance(inst.id);

    action$.subscribe({
      next: () => {
        inst.suspended = !inst.suspended;
        this.instanceATraiter = null;
        this.showMessage(
          inst.suspended
            ? `⏸ Instance ${inst.id.substring(0, 8)}… suspendue`
            : `▶ Instance ${inst.id.substring(0, 8)}… reprise`,
          inst.suspended ? 'warning' : 'success'
        );
      },
      error: (err) => {
        this.instanceATraiter = null;
        this.handleError(err);
      }
    });
  }

  /**
   * Ouvrir la modal de confirmation de suppression
   */
  ouvrirConfirmationSuppression(inst: any, event: Event): void {
    event.stopPropagation();
    this.instanceASupprimer = inst;
    this.raisonSuppression = '';
  }

  /**
   * Annuler la suppression (fermer la modal)
   */
  annulerSuppression(): void {
    this.instanceASupprimer = null;
    this.raisonSuppression = '';
  }

  /**
   * Confirmer la suppression COMPLÈTE de l'instance
   * → disparait totalement de Camunda (runtime + history)
   */
  confirmerSuppression(): void {
    if (!this.instanceASupprimer || !this.raisonSuppression.trim()) {
      this.showMessage('⚠ Veuillez saisir une raison', 'warning');
      return;
    }
    const inst = this.instanceASupprimer;
    this.loadingAdmin = true;

    this.exportService
      .supprimerInstanceCompletement(inst.id, this.raisonSuppression)
      .subscribe({
        next: (res) => {
          this.loadingAdmin = false;
          this.showMessage(
            `🗑️ Instance ${inst.id.substring(0, 8)}… supprimée de Camunda`,
            'success'
          );
          this.instanceASupprimer = null;
          this.raisonSuppression = '';

          // Retirer immédiatement la ligne du tableau
          this.instances = this.instances.filter(i => i.id !== inst.id);

          // Recharger pour synchroniser avec Camunda
          setTimeout(() => this.chargerInstances(), 500);
        },
        error: (err) => {
          this.loadingAdmin = false;
          this.handleError(err);
        }
      });
  }
}