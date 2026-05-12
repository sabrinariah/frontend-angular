import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tache } from '../../models/tache.model';

@Injectable({
  providedIn: 'root'
})
export class TacheService {

  private apiUrl = 'http://localhost:8081/api/taches';

  constructor(private http: HttpClient) {}

  // ✅ CREATE TACHE
create(processusId: number, tache: Tache) {
  return this.http.post<Tache>(
    `http://localhost:8081/api/taches/processus/${processusId}`,
    tache
  );
}
  // ✅ GET BY PROCESSUS
  getTachesByProcessus(processusId: number): Observable<Tache[]> {
    return this.http.get<Tache[]>(`${this.apiUrl}/processus/${processusId}`);
  }

  // ✅ DELETE
  deleteTache(processusId: number, tacheId: number) {
    return this.http.delete(
      `${this.apiUrl}/processus/${processusId}/taches/${tacheId}`
    );
  }

  // ✅ UPDATE
  updateTache(processusId: number, tacheId: number, tache: Tache) {
    return this.http.put(
      `${this.apiUrl}/processus/${processusId}/taches/${tacheId}`,
      tache
    );
  }
}