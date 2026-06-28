
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Processus } from '../../models/processus.model';
import { environment } from '../../../environments/environment';

import { inject, Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class ProcessusService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/process`;

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

  // ✅ DEPLOY — envoie le BPMN au moteur Camunda via le backend
  deployerProcessus(id: number, bpmnBlob: Blob, fileName = 'processus.bpmn'): Observable<any> {
    const formData = new FormData();
    formData.append('file', bpmnBlob, fileName);
    return this.http.post<any>(`${this.apiUrl}/${id}/deploy`, formData);
  }
}