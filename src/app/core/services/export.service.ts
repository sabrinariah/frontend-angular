import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private apiUrl = 'http://localhost:8081/api/processus';

  constructor(private http: HttpClient) {}

  // ✅ Démarrer le processus
  demarrerExport(variables: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demarrer`, variables);
  }

  getTaches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tasks`);
  }


 completerTache(taskId: string, variables: any): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/tasks/${taskId}/complete`,
    variables,
    { responseType: 'text' } 
  );
}
}