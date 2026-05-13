
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Processus } from '../../models/processus.model';

import { inject, Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class ProcessusService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/process';

  getAll(): Observable<Processus[]> {
    return this.http.get<Processus[]>(this.apiUrl);
  }
  getById(id: number): Observable<Processus> {
    return this.http.get<Processus>(`${this.apiUrl}/${id}`);
  }
  create(p: Processus): Observable<Processus> {
    return this.http.post<Processus>(this.apiUrl, p);
  }
  update(id: number, p: Processus): Observable<Processus> {
    return this.http.put<Processus>(`${this.apiUrl}/${id}`, p);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ✅ TOGGLE — méthode PATCH sur /api/process/{id}/toggle
  toggle(id: number): Observable<Processus> {
    return this.http.patch<Processus>(`${this.apiUrl}/${id}/toggle`, {});
  }
}