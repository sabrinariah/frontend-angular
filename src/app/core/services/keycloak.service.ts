import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private keycloak!: Keycloak.KeycloakInstance;
  public ready = false;
  public token: string | null = null;

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
      onLoad: 'check-sso', // ✅ CHANGÉ ICI
      checkLoginIframe: false,
      redirectUri: window.location.origin
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
 // appel sans arguments


login() {
  this.keycloak.login({
    redirectUri: 'http://localhost:4200/'
  });
}
  logout() {
  this.keycloak.logout({
    redirectUri: 'http://localhost:4200/login'
  });
}

async isLoggedIn(): Promise<boolean> {
  return !!this.token; // ✔ vérifie si token existe
}

  getUsername(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] || '';
  }

  // ✅ Vérifie côté backend si l'utilisateur existe réellement dans Keycloak
async isUserValid(): Promise<boolean> {
  const username = this.getUsername();
  if (!username || !this.token) return false;

  try {
    // Appel backend pour vérifier l’existence de l’utilisateur
    const url = `/users/check-user/${username}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
    const exists = await firstValueFrom(this.http.get<boolean>(url, { headers }));
    return exists;
  } catch (err) {
    console.error('Erreur vérification utilisateur:', err);
    return false;
  }
}
  getToken(): string | null {
    return this.token;
  }

  isUserInRole(role: string): boolean {
    return this.keycloak.hasRealmRole ? this.keycloak.hasRealmRole(role) : false;
  }

  // 🔹 Login direct avec username/password (Direct Grant)
  async loginWithCredentials(Username: string, password: string): Promise<boolean> {
  const url = 'http://localhost:8080/realms/projet/protocol/openid-connect/token';
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'app-angular');
 body.set('username', Username); // CORRECT
    body.set('password', password);
    body.set('client_secret', '63728T3LdLgCzHfBoQlbcmuSoADXQ8nP');

    try {
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      const res = await firstValueFrom(this.http.post<any>(url, body.toString(), { headers }));
      if (res && res.access_token) {
        this.token = res.access_token;
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login échoué:', err.error || err);
      return false;
    }
  }

  // 🔹 Récupère tous les utilisateurs avec rôles et indicateur manager
  getAllUsersWithRoles(): Observable<any[]> {
    if (!this.token) throw new Error('Token manquant pour récupérer les utilisateurs');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });

    const urlUsers = 'http://localhost:8080/admin/realms/projet/users';

    return new Observable<any[]>(observer => {
      this.http.get<any[]>(urlUsers, { headers }).subscribe({
        next: users => {
          const usersWithRoles$ = users.map(user =>
            this.http.get<any[]>(`${urlUsers}/${user.id}/role-mappings/realm`, { headers })
              .pipe(
                map(roles => ({
                  ...user,
                  roles: roles.map(r => r.name),
                  isManager: roles.some(r => r.name === 'manager')
                }))
              )
          );

          forkJoin(usersWithRoles$).subscribe({
            next: finalUsers => observer.next(finalUsers),
            error: err => observer.error(err)
          });
        },
        error: err => observer.error(err)
      });
    });
  }

getUserRoles(): string[] {
  const token = this.getToken(); // récupère le token JWT
  if (!token) return [];
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // décoder payload JWT
    return payload?.realm_access?.roles || [];
  } catch (err) {
    console.error('Erreur décodage token:', err);
    return [];
  }
}
}
