import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RegleMetier } from '../../models/regle.model';
import { Categorie } from '../../models/categorie.model';
import { Condition } from '../../models/condition.model';
import { Version } from '../../models/version.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegleMetierService {

  private base = `${environment.apiUrl}/regles`;

  constructor(private http: HttpClient) {}

  // ================= REGLES =================
  getAll(): Observable<RegleMetier[]> {
    return this.http.get<RegleMetier[]>(this.base);
  }

  getById(id: number): Observable<RegleMetier> {
    return this.http.get<RegleMetier>(`${this.base}/${id}`);
  }

  create(regle: any): Observable<RegleMetier> {
    return this.http.post<RegleMetier>(this.base, regle);
  }

  update(id: number, regle: any): Observable<RegleMetier> {
    return this.http.put<RegleMetier>(`${this.base}/${id}`, regle);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  toggle(id: number): Observable<RegleMetier> {
    return this.http.put<RegleMetier>(`${this.base}/${id}/toggle`, {});
  }

  // ================= CONDITIONS =================
  getConditionsByRegle(regleId: number): Observable<Condition[]> {
    return this.http.get<Condition[]>(`${this.base}/${regleId}/conditions`);
  }

  // ================= VERSIONS =================
  getVersionsByRegle(regleId: number): Observable<Version[]> {
    return this.http.get<Version[]>(`${this.base}/${regleId}/versions`);
  }

  // ================= CATEGORIES =================
  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${environment.apiUrl}/categories`);
  }

  createCategorie(categorie: Partial<Categorie>): Observable<Categorie> {
    return this.http.post<Categorie>(`${environment.apiUrl}/categories`, categorie);
  }
  // Ajouter dans la section ================= VERSIONS =================
restaurerVersion(versionId: number): Observable<RegleMetier> {
  // Appelle POST /api/regles/restaurer/{id} côté Spring Boot
  return this.http.post<RegleMetier>(`${this.base}/restaurer/${versionId}`, {});
}
}