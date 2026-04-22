import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private apiUrl = 'http://localhost:8081/api/versions';

  constructor(private http: HttpClient) {}

  // 🔹 toutes les versions
  getAllVersions(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  // 🔹 versions par règle
  getByRegleId(regleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/regle/${regleId}`);
  }

  // 🔹 dernière version
  getLastVersion(regleId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/regle/${regleId}/last`);
  }
}