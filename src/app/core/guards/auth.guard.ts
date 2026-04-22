import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardService implements CanActivate {

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {

    // 1️⃣ Vérifier si l'utilisateur est connecté
    const loggedIn = await this.keycloakService.isLoggedIn();
    if (!loggedIn) {
      await this.keycloakService.login();
      return false;
    }

    // 2️⃣ Récupérer les rôles
    const userRoles = await this.keycloakService.getUserRoles();
    const expectedRoles = route.data['roles'] || [];

    console.log('Roles user:', userRoles);
    console.log('Roles attendus:', expectedRoles);

    // 3️⃣ 🔥 Si aucun rôle requis → accès libre
    if (expectedRoles.length === 0) {
      return true;
    }

    // 4️⃣ 🔥 Vérifier si l'utilisateur a au moins un rôle requis
    const hasAccess = expectedRoles.some((role: string) =>
      userRoles.includes(role)
    );

    if (!hasAccess) {
      alert('Accès refusé ❌');
      this.router.navigate(['/dashboard']);
      return false;
    }

    // 5️⃣ 🔥 Règle spéciale SuperAdmin (après vérification des rôles)
    if (
      userRoles.includes('SuperAdmin') &&
      !expectedRoles.includes('SuperAdmin') &&
      this.router.url !== '/dashboard'
    ) {
      alert('Accès refusé ❌ – SuperAdmin → accès limité');
      this.router.navigate(['/users']);
      return false;
    }

    return true;
  }
}