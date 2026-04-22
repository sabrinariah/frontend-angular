import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RegleMetier } from '../../models/regle.model';
import { Categorie } from '../../models/categorie.model';
import { Condition } from '../../models/condition.model';
import { Version } from '../../models/version.model';

@Injectable({
  providedIn: 'root'
})
export class RegleMetierService {

  private base = 'http://localhost:8081/api/regles';

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

  getAllConditions(): Observable<Condition[]> {
    return this.http.get<Condition[]>(`${this.base}/conditions`);
  }

  getConditionsByRegle(regleId: number): Observable<Condition[]> {
    return this.http.get<Condition[]>(`${this.base}/${regleId}/conditions`);
  }

  // ================= VERSIONS =================

  getAllVersions(): Observable<Version[]> {
    return this.http.get<Version[]>(`${this.base}/versions`);
  }

  getVersionsByRegle(regleId: number): Observable<Version[]> {
    return this.http.get<Version[]>(`${this.base}/${regleId}/versions`);
  }

  createVersion(payload: any): Observable<Version> {
    return this.http.post<Version>(`${this.base}/versions`, payload);
  }

  updateVersion(id: number, payload: any): Observable<Version> {
    return this.http.put<Version>(`${this.base}/versions/${id}`, payload);
  }

  deleteVersion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/versions/${id}`);
  }

  // ================= CATEGORIES =================

  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>('http://localhost:8081/api/categories');
  }
}