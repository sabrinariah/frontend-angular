import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
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
    return this.http.get<Processus[]>(this.apiUrl);
  }

  getById(id: number): Observable<Processus> {
    return this.http.get<Processus>(`${this.apiUrl}/${id}`);
  }

  create(processus: Processus): Observable<Processus> {
    return this.http.post<Processus>(this.apiUrl, processus);
  }

 
  activer(id: number): Observable<Processus> {
    return this.http.patch<Processus>(`${this.apiUrl}/${id}/toggle`, {});
  }

  addTache(processusId: number, tache: Tache): Observable<Tache> {
    return this.http.post<Tache>(`${this.apiUrl}/${processusId}/taches`, tache);
  }

  getTaches(processusId: number): Observable<Tache[]> {
    return this.http.get<Tache[]>(`${this.apiUrl}/${processusId}/taches`);
  }

  // --- DELETE comme les autres méthodes ---
  delete(id: number): Observable<void> {
    if (id == null || id <= 0) {
      return throwError(() => new Error('ID invalide pour suppression'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur HTTP lors de la suppression:', error.status, error.message);

          let message = 'Impossible de supprimer le processus';
          if (error.status === 404) message = 'Processus introuvable';
          else if (error.status === 403) message = 'Non autorisé';

          return throwError(() => new Error(message));
        })
      );
  }
update(id: number, processus: Processus): Observable<Processus> {
  return this.http.put<Processus>(`${this.apiUrl}/${id}`, processus);
}
 // 🔹 Modifier une tâche
updateTache(processusId: number, tacheId: number, tache: any) {
  return this.http.put(
    `http://localhost:8081/api/processus/${processusId}/taches/${tacheId}`,
    tache
  );
}
demarrerProcessus(variables: any): Observable<any> {
  return this.http.post('http://localhost:8081/api/processus/demarrer', {
    variables
  });
}
  // 🔹 Supprimer une tâche
// Exemple
deleteTache(tacheId: number) {
  return this.http.delete(`${this.apiUrl}/taches/${tacheId}`);
}
toggleProcessus(id: number) {
  return this.http.patch(`http://localhost:8081/api/processus/${id}/toggle`, {});
}
// 🔥 ajouter ceci
getCamundaProcesses(): Observable<any> {
  return this.http.get('http://localhost:8081/api/processus/camunda/processes');
}
getVariables(id: string) {
  return this.http.get(`http://localhost:8081/api/processus/camunda/process/${id}/variables`);
}

// ▶️ Démarrer processus Camunda


// ▶️ Compléter tâche Camunda (CORRIGÉ)
completeTask(taskId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/tasks/${taskId}/complete`, {});
}

// ▶️ Récupérer tâches Camunda
getCamundaTasks(): Observable<any> {
  return this.http.get(`${this.apiUrl}/tasks`);
}

}