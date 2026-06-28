import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tache } from '../../models/processus.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TacheService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/taches`;

  getAll(): Observable<Tache[]> {
    return this.http.get<Tache[]>(this.apiUrl);
  }

  getByProcessus(processusId: number): Observable<Tache[]> {
    return this.http.get<Tache[]>(`${this.apiUrl}/processus/${processusId}`);
  }

  getById(id: number): Observable<Tache> {
    return this.http.get<Tache>(`${this.apiUrl}/${id}`);
  }

  create(tache: Tache): Observable<Tache> {
    return this.http.post<Tache>(this.apiUrl, tache);
  }

  update(id: number, tache: Tache): Observable<Tache> {
    return this.http.put<Tache>(`${this.apiUrl}/${id}`, tache);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}