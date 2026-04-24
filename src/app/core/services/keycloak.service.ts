import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private keycloak!: Keycloak.KeycloakInstance;
  public ready = false;
  public token: string | null = null;

  // ✅ Vérifie que c'est le bon port de ton Spring Boot
  private backendUrl = 'http://localhost:8081/auth';

  constructor(private http: HttpClient) {
    this.keycloak = new Keycloak({
      url: 'http://localhost:8080',
      realm: 'projet',
      clientId: 'app-angular'
    });
  }

  // ✅ INIT — silent-check-sso pour éviter la redirection forcée
  async init(): Promise<boolean> {
    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        checkLoginIframe: false
      });
      this.ready = true;
      this.token = this.keycloak.token || null;
      return authenticated;
    } catch (err) {
      console.error('Erreur init Keycloak:', err);
      this.ready = true;
      return false;
    }
  }

  login() {
    this.keycloak.login({ redirectUri: 'http://localhost:4200/' });
  }

  logout() {
    this.keycloak.logout({ redirectUri: 'http://localhost:4200/login' });
  }

  async isLoggedIn(): Promise<boolean> {
    return !!this.token;
  }

  getUsername(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] || '';
  }

  getToken(): string | null {
    return this.token;
  }

  isUserInRole(role: string): boolean {
    return this.keycloak.hasRealmRole ? this.keycloak.hasRealmRole(role) : false;
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.realm_access?.roles || [];
    } catch (err) {
      console.error('Erreur décodage token:', err);
      return [];
    }
  }

  // Headers avec token (pour routes protégées)
  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });
  }

  // Headers sans token (pour routes publiques)
  private publicHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // ✅ LOGIN direct Keycloak
  async loginWithCredentials(username: string, password: string): Promise<boolean> {
    const url = 'http://localhost:8080/realms/projet/protocol/openid-connect/token';
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'app-angular');
    body.set('username', username);
    body.set('password', password);
    body.set('client_secret', '63728T3LdLgCzHfBoQlbcmuSoADXQ8nP');

    try {
      const res = await firstValueFrom(
        this.http.post<any>(url, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
      if (res?.access_token) {
        this.token = res.access_token;
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login échoué:', err.error || err);
      return false;
    }
  }

  // ✅ REGISTER — route publique, pas de token needed
  async registerUser(data: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roles: string[];
  }): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.backendUrl}/register`,
          data,
          { headers: this.publicHeaders() } // ✅ pas de Bearer token
        )
      );
      return true;
    } catch (err: any) {
      console.error('Erreur register:', err?.error || err);
      return false;
    }
  }

  // ✅ FORGOT PASSWORD — route publique
  async forgotPassword(email: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.backendUrl}/forgot-password`,
          { email },
          { headers: this.publicHeaders() } // ✅ pas de Bearer token
        )
      );
      return true;
    } catch (err: any) {
      console.error('Erreur forgot password:', err?.error || err);
      return false;
    }
  }

  // ✅ GET ALL USERS — route protégée
  getAllUsersWithRoles(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.backendUrl}/users`,
      { headers: this.authHeaders() }
    );
  }

  // ✅ UPDATE USER
  updateUser(username: string, data: any): Observable<any> {
    return this.http.put(
      `${this.backendUrl}/users/${username}`,
      data,
      { headers: this.authHeaders() }
    );
  }

  // ✅ UPDATE ROLES
  updateUserRoles(username: string, roles: string[]): Observable<any> {
    return this.http.put(
      `${this.backendUrl}/users/${username}/roles`,
      { roles },
      { headers: this.authHeaders() }
    );
  }

  // ✅ TOGGLE STATUS
  toggleUserStatus(username: string, enabled: boolean): Observable<any> {
    return this.http.patch(
      `${this.backendUrl}/users/${username}/status`,
      { enabled },
      { headers: this.authHeaders() }
    );
  }

  // ✅ DELETE USER
  deleteUser(username: string): Observable<any> {
    return this.http.delete(
      `${this.backendUrl}/users/${username}`,
      { headers: this.authHeaders() }
    );
  }
}