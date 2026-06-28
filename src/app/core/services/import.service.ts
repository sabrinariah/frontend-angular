import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DossierImport } from '../../models/import.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImportService {

  private readonly BASE = `${environment.apiUrl}/import`;

  constructor(private http: HttpClient) {}

  creerDossier(dossier: DossierImport): Observable<DossierImport> {
    return this.http.post<DossierImport>(`${this.BASE}/dossiers`, dossier)
      .pipe(catchError(this.handleError));
  }

  getDossiers(): Observable<DossierImport[]> {
    return this.http.get<DossierImport[]>(`${this.BASE}/dossiers`)
      .pipe(catchError(this.handleError));
  }

  getDossier(id: string): Observable<DossierImport> {
    return this.http.get<DossierImport>(`${this.BASE}/dossiers/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.message || err.message || 'Erreur réseau';
    console.error(`[ImportService] HTTP ${err.status} — ${message}`, err);
    return throwError(() => ({ status: err.status, message }));
  }
}
