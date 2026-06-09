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

  private backendUrl = 'http://localhost:8081/auth';

  constructor(private http: HttpClient) {
    this.keycloak = new Keycloak({
      url: 'http://localhost:8080',
      realm: 'projet',
      clientId: 'app-angular'
    });
  }

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

  isLoggedIn(): boolean {
    return !!this.token;
  }

  /**
   * Décode le payload d'un JWT en respectant l'UTF-8.
   * `atob` seul renvoie une chaîne "octet par octet" qui corrompt les
   * caractères accentués (ex: "règles" devient "rÃ¨gles") avant le JSON.parse.
   */
  private decodeJwtPayload(token: string): any {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const json = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json);
  }

  getUsername(): string {
    if (this.keycloak.tokenParsed?.['preferred_username']) {
      return this.keycloak.tokenParsed['preferred_username'];
    }
    const token = this.getToken();
    if (!token) return '';
    try {
      const payload = this.decodeJwtPayload(token);
      return payload?.preferred_username || payload?.sub || '';
    } catch {
      return '';
    }
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
      const payload = this.decodeJwtPayload(token);
      const realmRoles: string[] = payload?.realm_access?.roles || [];
      const clientRoles: string[] =
        payload?.resource_access?.['app-angular']?.roles || [];
      const all = [...new Set([...realmRoles, ...clientRoles])];
      console.debug('[KeycloakService] Rôles détectés:', all);
      return all;
    } catch (err) {
      console.error('Erreur décodage token:', err);
      return [];
    }
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });
  }

  private publicHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

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
          { headers: this.publicHeaders() }
        )
      );
      return true;
    } catch (err: any) {
      console.error('Erreur register:', err?.error || err);
      return false;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.backendUrl}/forgot-password`,
          { email },
          { headers: this.publicHeaders() }
        )
      );
      return true;
    } catch (err: any) {
      console.error('Erreur forgot password:', err?.error || err);
      return false;
    }
  }

  getAllUsersWithRoles(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.backendUrl}/users`,
      { headers: this.authHeaders() }
    );
  }

  updateUser(username: string, data: any): Observable<any> {
    return this.http.put(
      `${this.backendUrl}/users/${username}`,
      data,
      { headers: this.authHeaders() }
    );
  }

  updateUserRoles(username: string, roles: string[]): Observable<any> {
    return this.http.put(
      `${this.backendUrl}/users/${username}/roles`,
      { roles },
      { headers: this.authHeaders() }
    );
  }

  toggleUserStatus(username: string, enabled: boolean): Observable<any> {
    return this.http.patch(
      `${this.backendUrl}/users/${username}/status`,
      { enabled },
      { headers: this.authHeaders() }
    );
  }

  deleteUser(username: string): Observable<any> {
    return this.http.delete(
      `${this.backendUrl}/users/${username}`,
      { headers: this.authHeaders() }
    );
  }
}
