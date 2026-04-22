import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DemandeImport, TacheImport, VariablesImport } from '../../models/import.model';

@Injectable({ providedIn: 'root' })
export class ImportService {

  private apiUrl = 'http://localhost:8081/api/import';

  constructor(private http: HttpClient) {}

  // ▶️ Démarrer le processus
  demarrerImport(demande: DemandeImport): Observable<any> {
    return this.http.post(`${this.apiUrl}/demarrer`, demande);
  }

  // 📋 Lister les tâches
  getTaches(): Observable<TacheImport[]> {
    return this.http.get<TacheImport[]>(`${this.apiUrl}/taches`);
  }

  // ✅ Compléter une tâche
  completerTache(taskId: string, variables: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/taches/${taskId}/completer`, variables
    );
  }

  // 🔍 Variables d'une instance
  getVariables(processInstanceId: string): Observable<VariablesImport> {
    return this.http.get<VariablesImport>(
      `${this.apiUrl}/instance/${processInstanceId}/variables`
    );
  }

  // 📊 Toutes les instances
  getInstances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instances`);
  }
}