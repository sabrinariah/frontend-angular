// ============================================================
//  export.service.ts  –  Aligné sur ProcessusController.java
//  Backend : http://localhost:8081
//  ✅ Tous les appels passent par /api/processus (plus de CORS Camunda)
//  ✅ AJOUT : Méthodes Admin (suspendre/activer/annuler)
// ============================================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ─────────────────────────────────────────────────────────────
//  INTERFACES
// ─────────────────────────────────────────────────────────────

export interface StartProcessResponse {
  processInstanceId: string;
  message: string;
}

export interface CamundaTask {
  id: string;
  name: string;
  assignee?: string;
  created?: string;
  priority?: number;
  processInstanceId: string;
  taskDefinitionKey: string;
}

export interface CamundaVariablesMap {
  [key: string]: any;
}

export interface CompleteTaskResponse {
  message: string;
  taskId: string;
}

export interface HistoricTaskItem {
  id: string;
  name: string;
  taskDefinitionKey: string;
  assignee?: string;
  startTime?: string;
  endTime?: string;
  durationInMillis?: number;
  deleteReason?: string;
}

export interface InstanceStatus {
  id: string;
  processDefinitionKey: string;
  startTime: string;
  endTime?: string;
  state: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | string;
  durationInMillis?: number;
  suspended?: boolean;
}

// ✅ NOUVEAU : Interfaces Admin
export interface DefinitionState {
  key: string;
  version: number;
  suspended: boolean;
  deploymentTime?: string;
}

export interface AdminActionResponse {
  message: string;
  success: boolean;
  timestamp?: string;
}

// ─────────────────────────────────────────────────────────────
//  SERVICE
// ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ExportService {

  private readonly BASE = 'http://localhost:8081/api/processus';

  constructor(private http: HttpClient) {}

  // =========================
  // 🔥 GET TASKS CAMUNDA
  // =========================
  mesTaches() {
    return this.http.get<CamundaTask[]>(`${this.BASE}/tasks`)
      .pipe(catchError(this.handleError));
  }

  // =========================
  // 🔥 CLAIM TASK
  // =========================
  reclamerTache(taskId: string) {
    return this.http.post(`${this.BASE}/tasks/${taskId}/claim`, {
      userId: 'demo'
    });
  }

  // =========================
  // 🔥 COMPLETE TASK
  // =========================
  completerTache(taskId: string, variables: any) {
    return this.http.post(
      `${this.BASE}/tasks/${taskId}/complete`,
      { variables: this.formatVariables(variables) }
    );
  }

  ouvrirTacheCamunda(taskId: string) {
    const url = `http://localhost:8081/camunda/app/tasklist/default/#/task/${taskId}`;
    window.open(url, '_blank');
  }

  private formatVariables(vars: any) {
    const formatted: any = {};
    Object.keys(vars).forEach(key => {
      formatted[key] = { value: vars[key] };
    });
    return formatted;
  }

  // ─────────────────────────────────────────────────────────
  // 1. DÉMARRER LE PROCESSUS
  // ─────────────────────────────────────────────────────────
  demarrerProcessus(variables: Record<string, any>): Observable<StartProcessResponse> {
    return this.http
      .post<StartProcessResponse>(`${this.BASE}/demarrer`, variables)
      .pipe(catchError(this.handleError));
  }

  // ─────────────────────────────────────────────────────────
  // 2. RÉCUPÉRER TOUTES LES TÂCHES
  // ─────────────────────────────────────────────────────────
  getTaches(processInstanceId?: string): Observable<CamundaTask[]> {
    let params = new HttpParams();
    if (processInstanceId) {
      params = params.set('processInstanceId', processInstanceId);
    }
    return this.http
      .get<CamundaTask[]>(`${this.BASE}/tasks`, { params })
      .pipe(catchError(this.handleError));
  }

  // ─────────────────────────────────────────────────────────
  // 3. RÉCUPÉRER UNE TÂCHE PAR CLE
  // ─────────────────────────────────────────────────────────
  getTacheParCle(processInstanceId: string, taskDefinitionKey: string): Observable<CamundaTask | null> {
    const params = new HttpParams()
      .set('processInstanceId', processInstanceId)
      .set('taskDefinitionKey', taskDefinitionKey);
    return this.http
      .get<CamundaTask[]>(`${this.BASE}/tasks`, { params })
      .pipe(
        map(tasks => (tasks.length > 0 ? tasks[0] : null)),
        catchError(this.handleError)
      );
  }

  // ─────────────────────────────────────────────────────────
  // 5. VARIABLES D'UNE INSTANCE
  // ─────────────────────────────────────────────────────────
  getVariables(processInstanceId: string): Observable<CamundaVariablesMap> {
    return this.http
      .get<CamundaVariablesMap>(`${this.BASE}/instance/${processInstanceId}/variables`)
      .pipe(catchError(this.handleError));
  }

  // ─────────────────────────────────────────────────────────
  // 6. HISTORIQUE DES TÂCHES
  // ─────────────────────────────────────────────────────────
  getHistoriqueTaches(processInstanceId: string): Observable<HistoricTaskItem[]> {
    return this.http
      .get<HistoricTaskItem[]>(`${this.BASE}/instance/${processInstanceId}/history`)
      .pipe(catchError(this.handleError));
  }

  // ─────────────────────────────────────────────────────────
  // 7. STATUT DE L'INSTANCE
  // ─────────────────────────────────────────────────────────
  getStatutInstance(processInstanceId: string): Observable<InstanceStatus> {
    return this.http
      .get<InstanceStatus>(`${this.BASE}/instance/${processInstanceId}/status`)
      .pipe(catchError(this.handleError));
  }

  // ═══════════════════════════════════════════════════════════
  // ✅ NOUVEAU — ADMIN : DÉFINITION DU PROCESSUS
  // ═══════════════════════════════════════════════════════════

  /** Récupère l'état (suspendu ou non) de la définition. */
  getEtatDefinition(): Observable<DefinitionState> {
    return this.http
      .get<DefinitionState>(`${this.BASE}/definition/etat`)
      .pipe(catchError(this.handleError));
  }

  /** Suspend la définition → bloque tout nouveau démarrage. */
  suspendreDefinition(includeInstances: boolean = false): Observable<AdminActionResponse> {
    const params = new HttpParams().set('includeInstances', String(includeInstances));
    return this.http
      .put<AdminActionResponse>(`${this.BASE}/definition/suspendre`, {}, { params })
      .pipe(catchError(this.handleError));
  }

  /** Réactive la définition → autorise les nouveaux démarrages. */
  activerDefinition(includeInstances: boolean = false): Observable<AdminActionResponse> {
    const params = new HttpParams().set('includeInstances', String(includeInstances));
    return this.http
      .put<AdminActionResponse>(`${this.BASE}/definition/activer`, {}, { params })
      .pipe(catchError(this.handleError));
  }

  // ═══════════════════════════════════════════════════════════
  // ✅ NOUVEAU — ADMIN : INSTANCES
  // ═══════════════════════════════════════════════════════════

  /** Suspend une instance précise (la gèle). */
  suspendreInstance(processInstanceId: string): Observable<AdminActionResponse> {
    return this.http
      .put<AdminActionResponse>(`${this.BASE}/instance/${processInstanceId}/suspendre`, {})
      .pipe(catchError(this.handleError));
  }

  /** Reprend une instance suspendue. */
  reprendreInstance(processInstanceId: string): Observable<AdminActionResponse> {
    return this.http
      .put<AdminActionResponse>(`${this.BASE}/instance/${processInstanceId}/reprendre`, {})
      .pipe(catchError(this.handleError));
  }

  /** Annule (supprime) une instance avec une raison obligatoire. */
  annulerInstance(processInstanceId: string, raison: string): Observable<AdminActionResponse> {
    const params = new HttpParams().set('raison', raison);
    return this.http
      .delete<AdminActionResponse>(`${this.BASE}/instance/${processInstanceId}`, { params })
      .pipe(catchError(this.handleError));
  }

  // ═══════════════════════════════════════════════════════════
  //  GESTION ERREURS CENTRALISÉE
  // ═══════════════════════════════════════════════════════════
  private handleError(err: HttpErrorResponse): Observable<never> {
    const message =
      err.error?.message ||
      err.error?.error ||
      err.message ||
      'Erreur réseau inconnue';
    console.error(`❌ [ExportService] HTTP ${err.status} — ${message}`, err);
    return throwError(() => ({ status: err.status, message }));
  }

  getHistoriqueProcess(processInstanceId: string) {
    return this.http.get<any>(
      `http://localhost:8081/history/task?processInstanceId=${processInstanceId}&sortBy=startTime&sortOrder=asc`
    );
  }

  getAllInstances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/instances`);
  }

  getHistorique(processInstanceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/instance/${processInstanceId}/history`);
  }

  /**
 * Supprimer COMPLÈTEMENT une instance de Camunda
 * (runtime + historique → disparait totalement)
 */
supprimerInstanceCompletement(
  processInstanceId: string,
  raison: string
): Observable<any> {
  const params = new HttpParams().set('raison', raison);
  return this.http.delete(
    `${this.BASE}/instance/${processInstanceId}/supprimer`,
    { params }
  );
}
}