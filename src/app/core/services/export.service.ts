import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DossierExport } from '../../models/export.models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private readonly BASE = 'http://localhost:8081/api/export';

  constructor(private http: HttpClient) {}

  creerDossier(dossier: DossierExport): Observable<DossierExport> {
    return this.http.post<DossierExport>(`${this.BASE}/dossiers`, dossier)
      .pipe(catchError(this.handleError));
  }

  getDossiers(): Observable<DossierExport[]> {
    return this.http.get<DossierExport[]>(`${this.BASE}/dossiers`)
      .pipe(catchError(this.handleError));
  }

  getDossier(id: string): Observable<DossierExport> {
    return this.http.get<DossierExport>(`${this.BASE}/dossiers/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateDossier(id: string, dossier: DossierExport): Observable<DossierExport> {
    return this.http.put<DossierExport>(`${this.BASE}/dossiers/${id}`, dossier)
      .pipe(catchError(this.handleError));
  }

  deleteDossier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/dossiers/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.message || err.message || 'Erreur réseau';
    console.error(`[ExportService] HTTP ${err.status} — ${message}`, err);
    return throwError(() => ({ status: err.status, message }));
  }
}
