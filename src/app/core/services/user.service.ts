import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) {}

  // 🔹 récupérer tous les users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }

  // 🔹 récupérer un user
  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${username}`);
  }

  // 🔹 update user
  updateUser(username: string, user: Partial<User>): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/update/${username}`,
      user,
      { responseType: 'text' }
    );
  }

  // 🔹 delete user
  deleteUser(username: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${username}`, {
      responseType: 'text'
    });
  }

  // 🔹 ACTIVER / DÉSACTIVER (CORRIGÉ)
  toggleUserActive(username: string, enabled: boolean): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/status/${username}?enabled=${enabled}`,
      null,
      { responseType: 'text' }
    );
  }

  // 🔹 Keycloak users (si utilisé)
  getKeycloakUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/keycloak`);
  }
  // 🔹 detail user (alias propre)
getUserDetails(username: string): Observable<User> {
  return this.http.get<User>(`${this.apiUrl}/details/${username}`);
}

}