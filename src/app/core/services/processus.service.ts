import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Processus } from '../../models/processus.model';
import { Tache } from '../../models/tache.model';

@Injectable({
  providedIn: 'root'
})
export class ProcessusService {

  private apiUrl = 'http://localhost:8081/api/processus';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Processus[]> {
    return this.http.get<Processus[]>(this.apiUrl)
      .pipe(
        timeout(5000), // ✅ Timeout de 5 secondes
        catchError((error) => this.handleError('Chargement des processus', error))
      );
  }

  getById(id: number): Observable<Processus> {
    if (!id || id <= 0) {
      return throwError(() => new Error('ID invalide'));
    }

    return this.http.get<Processus>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(5000), // ✅ Timeout de 5 secondes
        catchError((error) => this.handleError(`Chargement du processus ${id}`, error))
      );
  }

  create(processus: Processus): Observable<Processus> {
    return this.http.post<Processus>(this.apiUrl, processus)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Création du processus', error))
      );
  }

  activer(id: number): Observable<Processus> {
    return this.http.patch<Processus>(`${this.apiUrl}/${id}/toggle`, {})
      .pipe(
        catchError((error) => this.handleError('Activation du processus', error))
      );
  }

  addTache(processusId: number, tache: Tache): Observable<Tache> {
    return this.http.post<Tache>(`${this.apiUrl}/${processusId}/taches`, tache)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Ajout de tâche', error))
      );
  }

  getTaches(processusId: number): Observable<Tache[]> {
    return this.http.get<Tache[]>(`${this.apiUrl}/${processusId}/taches`)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Chargement des tâches', error))
      );
  }

  delete(id: number): Observable<void> {
    if (id == null || id <= 0) {
      return throwError(() => new Error('ID invalide pour suppression'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Suppression du processus', error))
      );
  }

  update(id: number, processus: Processus): Observable<Processus> {
    return this.http.put<Processus>(`${this.apiUrl}/${id}`, processus)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Mise à jour du processus', error))
      );
  }

  // 🔹 Modifier une tâche
  updateTache(processusId: number, tacheId: number, tache: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${processusId}/taches/${tacheId}`,
      tache
    )
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Modification de tâche', error))
      );
  }

  demarrerProcessus(variables: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demarrer`, { variables })
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Démarrage du processus', error))
      );
  }

  // 🔹 Supprimer une tâche
  deleteTache(tacheId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/taches/${tacheId}`)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Suppression de tâche', error))
      );
  }

  toggleProcessus(id: number): Observable<Processus> {
    return this.http.patch<Processus>(`${this.apiUrl}/${id}/toggle`, {})
      .pipe(
        catchError((error) => this.handleError('Toggle processus', error))
      );
  }

  // 🔥 ajouter ceci
  getCamundaProcesses(): Observable<any> {
    return this.http.get('http://localhost:8081/api/processus/camunda/processes')
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Chargement des processus Camunda', error))
      );
  }

  getVariables(id: string): Observable<any> {
    return this.http.get(`http://localhost:8081/api/processus/camunda/process/${id}/variables`)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Chargement des variables', error))
      );
  }

// ▶️ Démarrer processus Camunda


  // 🔹 Compléter tâche Camunda (CORRIGÉ)
  completeTask(taskId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks/${taskId}/complete`, {})
      .pipe(
        catchError((error) => this.handleError('Complétude de tâche', error))
      );
  }

  // ▶️ Récupérer tâches Camunda
  getCamundaTasks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks`)
      .pipe(
        timeout(5000),
        catchError((error) => this.handleError('Chargement des tâches Camunda', error))
      );
  }

  // 🔸 GESTION D'ERREUR CENTRALISÉE
  private handleError(context: string, error: any): Observable<never> {
    let message = `${context}: Erreur inconnue`;

    if (error.name === 'TimeoutError') {
      message = `${context}: L'API n'a pas répondu (timeout)`;
    } else if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 404:
          message = `${context}: Ressource introuvable`;
          break;
        case 403:
          message = `${context}: Accès refusé`;
          break;
        case 500:
          message = `${context}: Erreur serveur`;
          break;
        case 0:
          message = `${context}: Impossible de joindre le serveur (${error.url || 'URL inconnue'})`;
          break;
        default:
          message = `${context}: Erreur HTTP ${error.status}`;
      }
    } else if (error.message) {
      message = `${context}: ${error.message}`;
    }

    console.error('ProcessusService Error:', message, error);
    return throwError(() => new Error(message));
  }

}