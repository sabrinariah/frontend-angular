import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private keycloak!: Keycloak.KeycloakInstance;
  public ready = false;
  public token: string | null = null;

  // ── État du token obtenu via loginWithCredentials (grant "password") ──
  // keycloak-js ne connaît pas ce token : on gère son rafraîchissement
  // manuellement via le refresh_token renvoyé par Keycloak.
  private refreshTokenValue: string | null = null;
  private tokenExpiresAt = 0;

  private readonly ACCESS_TOKEN_KEY = 'kc_access_token';
  private readonly REFRESH_TOKEN_KEY = 'kc_refresh_token';
  private readonly EXPIRES_AT_KEY = 'kc_expires_at';

  private backendUrl = environment.backendAuthUrl;
  private readonly realmUrl = `${environment.keycloak.url}/realms/${environment.keycloak.realm}`;
  private readonly clientId = environment.keycloak.clientId;
  private readonly clientSecret = environment.keycloak.clientSecret;

  constructor(private http: HttpClient, private router: Router) {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
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

      // 🔄 Filet de sécurité : si le token expire sans qu'aucune requête
      // HTTP n'ait déclenché de rafraîchissement (ex: onglet inactif),
      // on tente de le renouveler immédiatement.
      this.keycloak.onTokenExpired = () => {
        this.updateToken();
      };

      if (authenticated) {
        return true;
      }

      // Pas de session SSO (cas loginWithCredentials) : on retente avec le
      // refresh_token sauvegardé en sessionStorage avant de conclure que
      // l'utilisateur est déconnecté.
      return await this.restoreSession();
    } catch (err) {
      console.error('Erreur init Keycloak:', err);
      this.ready = true;
      return await this.restoreSession();
    }
  }

  /**
   * Restaure la session loginWithCredentials après un rafraîchissement de
   * page en rejouant le refresh_token sauvegardé en sessionStorage.
   */
  private async restoreSession(): Promise<boolean> {
    const refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    this.refreshTokenValue = refreshToken;
    this.token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
    this.tokenExpiresAt = Number(sessionStorage.getItem(this.EXPIRES_AT_KEY)) || 0;

    const refreshed = await this.updateToken(30);
    if (this.token) return true;
    return refreshed;
  }

  /**
   * Mémorise le token d'accès + refresh token + date d'expiration,
   * que la session vienne de Keycloak (SSO) ou de loginWithCredentials.
   */
  private setTokens(res: any): void {
    this.token = res?.access_token || null;
    this.refreshTokenValue = res?.refresh_token || null;
    const expiresIn = typeof res?.expires_in === 'number' ? res.expires_in : 60;
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;

    if (this.token && this.refreshTokenValue) {
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, this.token);
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, this.refreshTokenValue);
      sessionStorage.setItem(this.EXPIRES_AT_KEY, String(this.tokenExpiresAt));
    }
  }

  private clearStoredTokens(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  /**
   * Rafraîchit le token d'accès s'il expire dans moins de `minValidity`
   * secondes. Gère les deux flux possibles :
   *  - session Keycloak (SSO / check-sso) → délégué à keycloak-js
   *  - connexion par identifiants (loginWithCredentials) → refresh manuel
   * Si le refresh échoue (session vraiment expirée), nettoie le token
   * et redirige l'utilisateur vers la page de login.
   */
  async updateToken(minValidity = 30): Promise<boolean> {
    // Flux SSO : keycloak-js gère lui-même son refresh token
    if (this.keycloak.authenticated) {
      try {
        const refreshed = await this.keycloak.updateToken(minValidity);
        this.token = this.keycloak.token || null;
        return refreshed;
      } catch (err) {
        console.error('Session expirée, reconnexion requise:', err);
        this.token = null;
        this.login();
        return false;
      }
    }

    // Flux loginWithCredentials : refresh manuel via refresh_token
    if (this.refreshTokenValue) {
      if (this.tokenExpiresAt - Date.now() > minValidity * 1000) return false;

      const body = new URLSearchParams();
      body.set('grant_type', 'refresh_token');
      body.set('client_id', this.clientId);
      body.set('client_secret', this.clientSecret);
      body.set('refresh_token', this.refreshTokenValue);

      try {
        const res = await firstValueFrom(
          this.http.post<any>(`${this.realmUrl}/protocol/openid-connect/token`, body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
        );
        this.setTokens(res);
        return true;
      } catch (err) {
        console.error('Rafraîchissement échoué, session expirée:', err);
        this.token = null;
        this.refreshTokenValue = null;
        this.clearStoredTokens();
        this.router.navigate(['/login']);
        return false;
      }
    }

    return false;
  }

  login() {
    this.keycloak.login({ redirectUri: window.location.origin + '/' });
  }

  logout() {
    this.clearStoredTokens();
    this.refreshTokenValue = null;

    // Flux loginWithCredentials : pas de session SSO à clôturer côté Keycloak
    if (!this.keycloak.authenticated) {
      this.token = null;
      this.router.navigate(['/login']);
      return;
    }

    this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
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
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.clientId);
    body.set('username', username);
    body.set('password', password);
    body.set('client_secret', this.clientSecret);

    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.realmUrl}/protocol/openid-connect/token`, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
      if (res?.access_token) {
        this.setTokens(res);
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
